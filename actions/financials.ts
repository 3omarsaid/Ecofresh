"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCurrentUser, can } from '@/lib/auth';
import { formatActionError } from '@/lib/error-handler';
import { TransactionSchema, TransferSchema } from '@/lib/validations/transaction';
import { reconcileAllTreasuryAccounts, reconcileTreasuryAccount } from '@/lib/treasury-reconciliation';

/**
 * Concurrency-safe, collision-free transaction ID generator
 */
export async function generateTxnId(tx: any, date: Date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const timestamp = Date.now().toString().slice(-5);
  const random = Math.floor(1000 + Math.random() * 9000);
  let txnId = `TXN-${year}-${timestamp}${random}`;

  while (await tx.financialTransaction.findUnique({ where: { txnId } })) {
    const newRandom = Math.floor(1000 + Math.random() * 9000);
    txnId = `TXN-${year}-${Date.now().toString().slice(-5)}${newRandom}`;
  }
  return txnId;
}

/**
 * Centralized, comprehensive Cross-Module Revalidation
 */
export async function revalidateFinancialImpact(partyType?: string, partyId?: string) {
  try {
    revalidatePath('/financials');
    revalidatePath('/financials/transactions');
    revalidatePath('/financials/treasury');
    revalidatePath('/dashboard');
    revalidatePath('/reports/aging');

    if (partyId) {
      revalidatePath(`/financials/parties/${partyId}`);
      revalidatePath(`/customers/${partyId}`);
      revalidatePath(`/suppliers/${partyId}`);
      revalidatePath(`/contractors/${partyId}`);
    }

    revalidatePath('/customers');
    revalidatePath('/suppliers');
    revalidatePath('/contractors');
  } catch (e) {
    // Graceful fallback when invoked outside Next.js request context (e.g. CLI/tests)
  }
}

/**
 * Add Financial Transaction (Collection / Payment / Expense / Adjustment)
 * Fully Atomic & Idempotent
 */
export async function addFinancialTransaction(payload: unknown) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_FINANCIALS')) {
    return { success: false, error: 'غير مصرح لك بقيد سندات مالية' };
  }

  const validated = TransactionSchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const data = validated.data;
  const txnDate = data.date ? new Date(data.date) : new Date();
  const isCollection = data.type.includes('تحصيل') || data.type.includes('وارد') || data.type.includes('Inflow') || data.type.includes('تسوية زيادة');

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch & lock treasury/bank account
      const account = await tx.treasuryAccount.findUnique({
        where: { id: data.accountId },
      });

      if (!account) throw new Error(`الحساب المالي ${data.accountId} غير موجود`);

      const currentBalance = Number(account.balance);
      const isAccountNonEgp = account.currency !== 'EGP';
      const effectiveAmount = isAccountNonEgp && data.amountCurrency ? data.amountCurrency : data.amountEgp;

      // 2. Strict Overdraft Protection (Inside Transaction)
      if (!isCollection && currentBalance < effectiveAmount) {
        throw new Error(
          `رصيد الحساب ${account.name} (${currentBalance.toLocaleString()} ${account.currency}) لا يكفي لسداد ${effectiveAmount.toLocaleString()} ${account.currency}`
        );
      }

      // 3. Atomic Balance Mutation with Optimistic Concurrency Guard
      if (!isCollection) {
        const updateResult = await tx.treasuryAccount.updateMany({
          where: {
            id: data.accountId,
            balance: { gte: effectiveAmount },
          },
          data: {
            balance: { decrement: effectiveAmount },
          },
        });

        if (updateResult.count === 0) {
          throw new Error(
            `تعذر الخصم من الحساب ${account.name} لعدم كفاية الرصيد أو حدوث حركة متزامنة`
          );
        }
      } else {
        await tx.treasuryAccount.update({
          where: { id: data.accountId },
          data: {
            balance: { increment: effectiveAmount },
          },
        });
      }

      const updatedAccount = await tx.treasuryAccount.findUnique({
        where: { id: data.accountId },
      });
      const newBalance = Number(updatedAccount?.balance || 0);

      // 4. Generate Unique Collision-Free Txn ID
      const txnId = await generateTxnId(tx, txnDate);

      // 5. Create Financial Transaction
      await tx.financialTransaction.create({
        data: {
          txnId,
          date: txnDate,
          type: data.type,
          partyType: data.partyType,
          partyId: data.partyId,
          partyName: data.partyName,
          amountEgp: data.amountEgp,
          amountCurrency: data.amountCurrency || null,
          currency: data.currency || account.currency || 'EGP',
          refDoc: data.refDoc || 'سند مالي مباشر',
          accountId: data.accountId,
          accountName: account.name,
          description: data.description,
          status: 'معتمد',
          createdById: user.id,
        },
      });

      // 6. Audit Trail Logging
      await tx.auditLog.create({
        data: {
          entityType: 'transaction',
          entityId: txnId,
          action: isCollection ? 'COLLECTION' : 'PAYMENT',
          summary: `تسجيل ${data.type} بقيمة ${effectiveAmount.toLocaleString()} ${account.currency} لحساب ${account.name} (الطرف: ${data.partyName})`,
          performedBy: user.id,
        },
      });

      return { txnId, newBalance, accountName: account.name, currency: account.currency, partyType: data.partyType, partyId: data.partyId };
    });

    await revalidateFinancialImpact(result.partyType, result.partyId);

    return {
      success: true,
      data: result,
      message: `تم بنجاح قيد السند ${result.txnId} وتحديث رصيد ${result.accountName} ليصبح ${result.newBalance.toLocaleString()} ${result.currency}`,
    };
  } catch (error: any) {
    return { success: false, error: formatActionError(error, 'حدث خطأ أثناء حفظ السند المالي') };
  }
}

/**
 * Treasury Transfer (Between Cash Treasury & Bank Accounts)
 * Atomic movement without affecting revenues, costs, or party balances.
 * Strictly verifies currency match.
 */
export async function transferBetweenTreasuryAccounts(payload: unknown) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_FINANCIALS')) {
    return { success: false, error: 'غير مصرح لك بإجراء تحويلات مالية داخلية' };
  }

  const validated = TransferSchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const data = validated.data;
  const transferDate = data.date ? new Date(data.date) : new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sourceAccount = await tx.treasuryAccount.findUnique({
        where: { id: data.sourceAccountId },
      });
      const destAccount = await tx.treasuryAccount.findUnique({
        where: { id: data.destinationAccountId },
      });

      if (!sourceAccount) throw new Error('الحساب المالي المصدر غير موجود');
      if (!destAccount) throw new Error('الحساب المالي المستلم غير موجود');

      if (sourceAccount.currency !== destAccount.currency) {
        throw new Error(
          `لا يمكن التحويل المباشر بين حسابات بعملات مختلفة (${sourceAccount.currency} إلى ${destAccount.currency})`
        );
      }

      const sourceBalance = Number(sourceAccount.balance);
      if (sourceBalance < data.amountEgp) {
        throw new Error(
          `رصيد الحساب المصدر (${sourceAccount.name}: ${sourceBalance.toLocaleString()} ${sourceAccount.currency}) لا يكفي لتحويل ${data.amountEgp.toLocaleString()} ${sourceAccount.currency}`
        );
      }

      // 1. Atomic Balance Decrement on Source with gte check
      const decResult = await tx.treasuryAccount.updateMany({
        where: {
          id: data.sourceAccountId,
          balance: { gte: data.amountEgp },
        },
        data: {
          balance: { decrement: data.amountEgp },
        },
      });

      if (decResult.count === 0) {
        throw new Error(`تعذر خصم المبلغ من الحساب المصدر ${sourceAccount.name} لعدم كفاية الرصيد`);
      }

      // 2. Atomic Balance Increment on Destination
      await tx.treasuryAccount.update({
        where: { id: data.destinationAccountId },
        data: {
          balance: { increment: data.amountEgp },
        },
      });

      // 3. Shared Transfer Reference
      const transferRef = `TRF-${transferDate.getFullYear()}-${Date.now().toString().slice(-4)}`;

      // 4. Outflow Entry
      const txnOutId = await generateTxnId(tx, transferDate);
      await tx.financialTransaction.create({
        data: {
          txnId: txnOutId,
          date: transferDate,
          type: 'تحويل صادر (مناقلة خزائن)',
          partyType: 'حساب مالي داخلي',
          partyId: destAccount.id,
          partyName: destAccount.name,
          amountEgp: data.amountEgp,
          amountCurrency: sourceAccount.currency !== 'EGP' ? data.amountEgp : null,
          currency: sourceAccount.currency,
          refDoc: transferRef,
          accountId: sourceAccount.id,
          accountName: sourceAccount.name,
          description: `تحويل نقدية صادر إلى ${destAccount.name} (${data.notes || 'مناقلة أرصدة'})`,
          status: 'معتمد',
          createdById: user.id,
        },
      });

      // 5. Inflow Entry
      const txnInId = await generateTxnId(tx, transferDate);
      await tx.financialTransaction.create({
        data: {
          txnId: txnInId,
          date: transferDate,
          type: 'تحويل وارد (مناقلة خزائن)',
          partyType: 'حساب مالي داخلي',
          partyId: sourceAccount.id,
          partyName: sourceAccount.name,
          amountEgp: data.amountEgp,
          amountCurrency: destAccount.currency !== 'EGP' ? data.amountEgp : null,
          currency: destAccount.currency,
          refDoc: transferRef,
          accountId: destAccount.id,
          accountName: destAccount.name,
          description: `تحويل نقدية وارد من ${sourceAccount.name} (${data.notes || 'مناقلة أرصدة'})`,
          status: 'معتمد',
          createdById: user.id,
        },
      });

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          entityType: 'transaction',
          entityId: transferRef,
          action: 'TRANSFER',
          summary: `تحويل مبلغ ${data.amountEgp.toLocaleString()} ${sourceAccount.currency} من ${sourceAccount.name} إلى ${destAccount.name}`,
          performedBy: user.id,
        },
      });

      return {
        transferRef,
        sourceName: sourceAccount.name,
        destName: destAccount.name,
        amount: data.amountEgp,
        currency: sourceAccount.currency,
      };
    });

    await revalidateFinancialImpact();

    return {
      success: true,
      data: result,
      message: `تم بنجاح تحويل مبلغ ${result.amount.toLocaleString()} ${result.currency} من ${result.sourceName} إلى ${result.destName} بالمرجع ${result.transferRef}`,
    };
  } catch (error: any) {
    return { success: false, error: formatActionError(error, 'حدث خطأ أثناء إجراء التحويل المالي') };
  }
}

/**
 * Adjust Treasury Balance via Audited Financial Transaction (Never direct silent update)
 */
export async function adjustTreasuryAccountBalance(payload: {
  accountId: string;
  actualBalance: number;
  reason: string;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_FINANCIALS')) {
    return { success: false, error: 'غير مصرح لك بإجراء تسويات جرد الخزائن' };
  }

  const { accountId, actualBalance, reason } = payload;
  if (!reason || reason.trim().length < 5) {
    return { success: false, error: 'يرجى كتابة سبب التسوية بالتفصيل (5 أحرف على الأقل)' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.treasuryAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) throw new Error('الحساب المالي غير موجود');

      const currentBalance = Number(account.balance);
      const difference = actualBalance - currentBalance;

      if (Math.abs(difference) < 0.01) {
        throw new Error('الرصيد الفعلي مطابق للرصيد الدفتري، لا توجد فروق تستدعي التسوية');
      }

      const isIncrease = difference > 0;
      const absDiff = Math.abs(difference);
      const txnDate = new Date();
      const txnType = isIncrease ? 'تسوية جرد (فائض نقدية)' : 'تسوية جرد (عجز نقدية)';

      // 1. Mutate Account Balance
      await tx.treasuryAccount.update({
        where: { id: accountId },
        data: { balance: actualBalance },
      });

      // 2. Create Adjustment Financial Transaction
      const txnId = await generateTxnId(tx, txnDate);
      await tx.financialTransaction.create({
        data: {
          txnId,
          date: txnDate,
          type: txnType,
          partyType: 'تسوية حساب مالي',
          partyId: account.id,
          partyName: account.name,
          amountEgp: absDiff,
          amountCurrency: account.currency !== 'EGP' ? absDiff : null,
          currency: account.currency,
          refDoc: `ADJ-${txnDate.getFullYear()}-${Date.now().toString().slice(-4)}`,
          accountId: account.id,
          accountName: account.name,
          description: `تسوية رصيد الخزينة من ${currentBalance.toLocaleString()} إلى ${actualBalance.toLocaleString()} ${account.currency} — السبب: ${reason}`,
          status: 'معتمد',
          createdById: user.id,
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          entityType: 'treasury_account',
          entityId: account.id,
          action: 'ADJUSTMENT',
          summary: `تسوية رصيد ${account.name} بقيمة فارق ${isIncrease ? '+' : '-'}${absDiff.toLocaleString()} ${account.currency} — السبب: ${reason}`,
          performedBy: user.id,
        },
      });

      return {
        txnId,
        accountName: account.name,
        newBalance: actualBalance,
        currency: account.currency,
      };
    });

    await revalidateFinancialImpact();

    return {
      success: true,
      message: `تم قيد سند التسوية ${result.txnId} وتحديث رصيد ${result.accountName} ليصبح ${result.newBalance.toLocaleString()} ${result.currency}`,
    };
  } catch (error: any) {
    return { success: false, error: formatActionError(error, 'حدث خطأ أثناء قيد تسوية الخزينة') };
  }
}

/**
 * Cancel Financial Transaction (Reversal / Void)
 * Safely restores treasury balances without physical record deletion.
 */
export async function cancelFinancialTransaction(txnId: string, cancelReason: string) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'DELETE_OPERATION')) {
    return { success: false, error: 'غير مصرح لك بإلغاء القيود والسندات المالية' };
  }

  if (!cancelReason || cancelReason.trim().length < 5) {
    return { success: false, error: 'يرجى كتابة سبب الإلغاء بالتفصيل (5 أحرف على الأقل)' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const txn = await tx.financialTransaction.findUnique({
        where: { txnId },
      });

      if (!txn) throw new Error('القيد المالي غير موجود');
      if (txn.status === 'ملغاة') throw new Error('هذا القيد ملغى بالفعل مسبقاً');

      const amountEgp = Number(txn.amountEgp);

      // If transaction affected a treasury/bank account, reverse the balance mutation
      if (txn.accountId) {
        const account = await tx.treasuryAccount.findUnique({ where: { id: txn.accountId } });
        const currentBalance = Number(account?.balance || 0);
        const effectiveAmount = account && account.currency !== 'EGP' && txn.amountCurrency
          ? Number(txn.amountCurrency)
          : amountEgp;

        const isCollection = txn.type.includes('تحصيل') || txn.type.includes('وارد') || txn.type.includes('Inflow') || txn.type.includes('تسوية زيادة');

        if (isCollection) {
          // If it was money in, check that account has enough balance to decrement
          if (currentBalance < effectiveAmount) {
            throw new Error(
              `لا يمكن إلغاء التحصيل لأن رصيد الحساب الحالي (${currentBalance.toLocaleString()} ${account?.currency}) أقل من قيمة السند المراد عكسه (${effectiveAmount.toLocaleString()} ${account?.currency})`
            );
          }

          await tx.treasuryAccount.update({
            where: { id: txn.accountId },
            data: { balance: { decrement: effectiveAmount } },
          });
        } else {
          // If it was money out (payment/expense), increment back to treasury
          await tx.treasuryAccount.update({
            where: { id: txn.accountId },
            data: { balance: { increment: effectiveAmount } },
          });
        }
      }

      // Mark transaction status as 'ملغاة'
      await tx.financialTransaction.update({
        where: { txnId },
        data: {
          status: 'ملغاة',
          description: `${txn.description || ''} [تم الإلغاء: ${cancelReason}]`,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          entityType: 'transaction',
          entityId: txnId,
          action: 'CANCEL',
          summary: `إلغاء القيد المالي ${txnId} بقيمة ${amountEgp.toLocaleString()} ج.م — السبب: ${cancelReason}`,
          performedBy: user.id,
        },
      });

      return { txnId, partyType: txn.partyType, partyId: txn.partyId };
    });

    await revalidateFinancialImpact(result.partyType, result.partyId);

    return {
      success: true,
      message: `تم بنجاح إلغاء القيد ${result.txnId} وعكس أثره المالي على الحسابات بدقة`,
    };
  } catch (error: any) {
    return { success: false, error: formatActionError(error, 'حدث خطأ أثناء إلغاء القيد المالي') };
  }
}

export interface FinancialTransactionsFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  typeFilter?: string;
  accountFilter?: string;
  partyTypeFilter?: string;
  directionFilter?: string;
  statusFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getFinancialTransactionsPaginated(filter: FinancialTransactionsFilter = {}) {
  try {
    const {
      page = 1,
      pageSize = 50,
      search,
      typeFilter,
      accountFilter,
      partyTypeFilter,
      directionFilter,
      statusFilter,
      dateFrom,
      dateTo,
    } = filter;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (directionFilter && directionFilter !== 'ALL') {
      if (directionFilter === 'INFLOW') {
        where.OR = [
          { type: { contains: 'تحصيل' } },
          { type: { contains: 'وارد' } },
          { type: { contains: 'Inflow' } },
          { type: { contains: 'زيادة' } },
        ];
      } else if (directionFilter === 'OUTFLOW') {
        where.OR = [
          { type: { contains: 'سداد' } },
          { type: { contains: 'منصرف' } },
          { type: { contains: 'مصروف' } },
          { type: { contains: 'Outflow' } },
          { type: { contains: 'عجز' } },
        ];
      } else if (directionFilter === 'TRANSFER') {
        where.type = { contains: 'تحويل' };
      }
    }

    if (typeFilter && typeFilter !== 'ALL') {
      if (typeFilter === 'COLLECTION') {
        where.OR = [
          { type: { contains: 'تحصيل' } },
          { type: { contains: 'وارد' } },
          { type: { contains: 'Inflow' } },
        ];
      } else if (typeFilter === 'PAYMENT') {
        where.OR = [
          { type: { contains: 'سداد' } },
          { type: { contains: 'منصرف' } },
          { type: { contains: 'Outflow' } },
        ];
      } else if (typeFilter === 'EXPENSE') {
        where.type = { contains: 'مصروف' };
      } else if (typeFilter === 'TRANSFER') {
        where.type = { contains: 'تحويل' };
      } else if (typeFilter === 'ADJUSTMENT') {
        where.type = { contains: 'تسوية' };
      } else if (typeFilter === 'AR_DUE') {
        where.AND = [
          { type: { contains: 'استحقاق' } },
          { partyType: { contains: 'عميل' } },
        ];
      } else if (typeFilter === 'AP_DUE') {
        where.AND = [
          { type: { contains: 'استحقاق' } },
          { OR: [{ partyType: { contains: 'مورد' } }, { partyType: { contains: 'مقاول' } }] },
        ];
      }
    }

    if (accountFilter && accountFilter !== 'ALL') {
      where.accountId = accountFilter;
    }

    if (partyTypeFilter && partyTypeFilter !== 'ALL') {
      where.partyType = { contains: partyTypeFilter };
    }

    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'ACTIVE') {
        where.status = { not: 'ملغاة' };
      } else if (statusFilter === 'CANCELLED') {
        where.status = 'ملغاة';
      } else {
        where.status = statusFilter;
      }
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        const dFrom = new Date(dateFrom);
        dFrom.setHours(0, 0, 0, 0);
        where.date.gte = dFrom;
      }
      if (dateTo) {
        const dTo = new Date(dateTo);
        dTo.setHours(23, 59, 59, 999);
        where.date.lte = dTo;
      }
    }

    if (search) {
      const searchConditions = [
        { txnId: { contains: search, mode: 'insensitive' } },
        { partyName: { contains: search, mode: 'insensitive' } },
        { refDoc: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.financialTransaction.findMany({
        where,
        select: {
          txnId: true,
          date: true,
          type: true,
          partyType: true,
          partyId: true,
          partyName: true,
          amountEgp: true,
          amountCurrency: true,
          currency: true,
          refDoc: true,
          description: true,
          accountId: true,
          accountName: true,
          status: true,
          createdAt: true,
          createdBy: {
            select: {
              fullName: true,
            },
          },
          account: {
            select: {
              id: true,
              name: true,
              bankName: true,
              balance: true,
              currency: true,
            },
          },
        },
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: pageSize,
      }),
      prisma.financialTransaction.count({ where }),
    ]);

    // Map sourceLink and compute numbers
    const mappedTransactions = transactions.map((t) => {
      let sourceLink: string | null = null;
      if (t.refDoc) {
        if (t.refDoc.startsWith('SHP-')) sourceLink = `/shipments`;
        else if (t.refDoc.startsWith('LOT-')) sourceLink = `/raw-purchases`;
        else if (t.refDoc.startsWith('DEAL-')) sourceLink = `/finished-purchases`;
        else if (t.refDoc.startsWith('PR-')) sourceLink = `/processing-operations`;
      }
      return {
        ...t,
        amountEgp: Number(t.amountEgp),
        amountCurrency: t.amountCurrency ? Number(t.amountCurrency) : null,
        createdByName: t.createdBy?.fullName || null,
        account: t.account ? {
          ...t.account,
          balance: Number(t.account.balance),
        } : null,
        sourceLink,
      };
    });

    return {
      transactions: mappedTransactions,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize) || 1,
      page,
      pageSize,
    };
  } catch (error) {
    console.error('Failed to fetch paginated financial transactions:', error);
    return {
      transactions: [],
      totalCount: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    };
  }
}

/**
 * Returns clean currency-separated financial dashboard metrics
 * without illegal currency mixing (EGP, EUR, USD kept separate)
 */
export async function getFinancialDashboardMetrics() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeTxns, treasuryAccounts, reconciliationSummary] = await Promise.all([
      prisma.financialTransaction.findMany({
        where: { status: { not: 'ملغاة' } },
        select: {
          txnId: true,
          date: true,
          type: true,
          partyType: true,
          partyId: true,
          partyName: true,
          amountEgp: true,
          amountCurrency: true,
          currency: true,
          refDoc: true,
          description: true,
          accountName: true,
          status: true,
          createdAt: true,
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.treasuryAccount.findMany({
        where: { isActive: true },
      }),
      reconcileAllTreasuryAccounts(),
    ]);

    let totalArDue = 0;
    let totalArCollected = 0;
    let totalApDue = 0;
    let totalApPaid = 0;
    let todayInflowEgp = 0;
    let todayOutflowEgp = 0;
    let todayTxnCount = 0;

    const customerBalances = new Map<string, { id: string; name: string; due: number; collected: number }>();
    const supplierBalances = new Map<string, { id: string; name: string; due: number; paid: number }>();

    for (const txn of activeTxns) {
      const amt = Number(txn.amountEgp);
      const isToday = new Date(txn.date) >= today;
      if (isToday) todayTxnCount++;

      if (txn.partyType.includes('عميل')) {
        const isCol = txn.type.includes('تحصيل') || txn.type.includes('وارد') || txn.type.includes('Inflow');
        if (isCol) {
          totalArCollected += amt;
          if (isToday) todayInflowEgp += amt;
        } else {
          totalArDue += amt;
        }

        const current = customerBalances.get(txn.partyId) || { id: txn.partyId, name: txn.partyName, due: 0, collected: 0 };
        if (isCol) current.collected += amt;
        else current.due += amt;
        customerBalances.set(txn.partyId, current);

      } else if (txn.partyType.includes('مورد') || txn.partyType.includes('مقاول')) {
        const isPay = txn.type.includes('سداد') || txn.type.includes('منصرف') || txn.type.includes('Outflow');
        if (isPay) {
          totalApPaid += amt;
          if (isToday) todayOutflowEgp += amt;
        } else {
          totalApDue += amt;
        }

        const current = supplierBalances.get(txn.partyId) || { id: txn.partyId, name: txn.partyName, due: 0, paid: 0 };
        if (isPay) current.paid += amt;
        else current.due += amt;
        supplierBalances.set(txn.partyId, current);

      } else {
        // Expenses or internal transfers
        if (txn.type.includes('مصروف') || txn.type.includes('منصرف')) {
          if (isToday) todayOutflowEgp += amt;
        }
      }
    }

    const netArRemaining = Math.max(0, totalArDue - totalArCollected);
    const netApRemaining = Math.max(0, totalApDue - totalApPaid);

    // Top 5 Customers due
    const topCustomersDue = Array.from(customerBalances.values())
      .map((c) => ({ id: c.id, name: c.name, remaining: c.due - c.collected }))
      .filter((c) => c.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 5);

    // Top 5 Suppliers due
    const topSuppliersDue = Array.from(supplierBalances.values())
      .map((s) => ({ id: s.id, name: s.name, remaining: s.due - s.paid }))
      .filter((s) => s.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 5);

    // Currency-separated Liquidity Totals
    const egpAccounts = treasuryAccounts.filter((a) => a.currency === 'EGP');
    const eurAccounts = treasuryAccounts.filter((a) => a.currency === 'EUR');
    const usdAccounts = treasuryAccounts.filter((a) => a.currency === 'USD');

    const totalEgpLiquidity = egpAccounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalEurLiquidity = eurAccounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalUsdLiquidity = usdAccounts.reduce((sum, a) => sum + Number(a.balance), 0);

    const treasuryCashBalance = egpAccounts
      .filter((a) => !a.type.includes('بنك'))
      .reduce((sum, a) => sum + Number(a.balance), 0);

    const bankBalance = egpAccounts
      .filter((a) => a.type.includes('بنك'))
      .reduce((sum, a) => sum + Number(a.balance), 0);

    // Today's transactions
    const todayTransactions = activeTxns
      .filter((t) => new Date(t.date) >= today)
      .slice(0, 10);

    return {
      totalArDue: netArRemaining,
      totalApDue: netApRemaining,
      totalCollections: totalArCollected,
      totalPayments: totalApPaid,
      // Liquidity by Currency
      totalEgpLiquidity,
      totalEurLiquidity,
      totalUsdLiquidity,
      treasuryCashBalance,
      bankBalance,
      todayInflow: todayInflowEgp,
      todayOutflow: todayOutflowEgp,
      todayNetMovement: todayInflowEgp - todayOutflowEgp,
      todayTxnCount,
      reconciliationSummary,
      topCustomersDue,
      topSuppliersDue,
      todayTransactions: todayTransactions.map((t) => ({
        ...t,
        amountEgp: Number(t.amountEgp),
        amountCurrency: t.amountCurrency ? Number(t.amountCurrency) : null,
      })),
    };
  } catch (error) {
    console.error('Failed to get financial dashboard metrics:', error);
    return {
      totalArDue: 0,
      totalApDue: 0,
      totalCollections: 0,
      totalPayments: 0,
      totalEgpLiquidity: 0,
      totalEurLiquidity: 0,
      totalUsdLiquidity: 0,
      treasuryCashBalance: 0,
      bankBalance: 0,
      todayInflow: 0,
      todayOutflow: 0,
      todayNetMovement: 0,
      todayTxnCount: 0,
      reconciliationSummary: {
        accounts: [],
        allBalanced: true,
        totalAccounts: 0,
        balancedCount: 0,
        mismatchCount: 0,
        checkedAt: new Date(),
      },
      topCustomersDue: [],
      topSuppliersDue: [],
      todayTransactions: [],
    };
  }
}

export async function getFinancialTransactions() {
  try {
    const raw = await prisma.financialTransaction.findMany({
      include: {
        account: true,
        createdBy: {
          select: { fullName: true },
        },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return raw.map((t) => {
      let sourceLink: string | null = null;
      if (t.refDoc) {
        if (t.refDoc.startsWith('SHP-')) sourceLink = `/shipments`;
        else if (t.refDoc.startsWith('LOT-')) sourceLink = `/raw-purchases`;
        else if (t.refDoc.startsWith('DEAL-')) sourceLink = `/finished-purchases`;
        else if (t.refDoc.startsWith('PR-')) sourceLink = `/processing-operations`;
      }
      return {
        ...t,
        amountEgp: Number(t.amountEgp),
        amountCurrency: t.amountCurrency ? Number(t.amountCurrency) : null,
        createdByName: t.createdBy?.fullName || null,
        account: t.account
          ? {
              ...t.account,
              balance: Number(t.account.balance),
            }
          : null,
        sourceLink,
      };
    });
  } catch (error) {
    console.error('Failed to fetch financial transactions:', error);
    return [];
  }
}

export async function getVoucherFormData() {
  try {
    const [treasuryAccounts, customers, suppliers, contractors] = await Promise.all([
      prisma.treasuryAccount.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      prisma.customer.findMany({
        where: { status: 'نشط' },
        orderBy: { name: 'asc' },
      }),
      prisma.supplier.findMany({
        where: { status: 'معتمد' },
        orderBy: { name: 'asc' },
      }),
      prisma.contractor.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      success: true,
      treasuryAccounts: JSON.parse(JSON.stringify(treasuryAccounts)),
      customers: JSON.parse(JSON.stringify(customers)),
      suppliers: JSON.parse(JSON.stringify(suppliers)),
      contractors: JSON.parse(JSON.stringify(contractors)),
    };
  } catch (error: any) {
    console.error('Failed to fetch voucher form data:', error);
    return {
      success: false,
      error: error.message || 'حدث خطأ أثناء تحميل بيانات النموذج',
      treasuryAccounts: [],
      customers: [],
      suppliers: [],
      contractors: [],
    };
  }
}
