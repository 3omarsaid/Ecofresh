import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateTxnId, revalidateFinancialImpact } from '@/actions/financials';

export type RelatedEntityType =
  | 'SHIPMENT'
  | 'RAW_BATCH'
  | 'PURCHASE_DEAL'
  | 'PROCESSING_OP'
  | 'PACKAGING_PURCHASE'
  | 'EMPLOYEE_TXN'
  | 'PAYMENT_VOUCHER'
  | 'TREASURY_TRANSFER'
  | 'EXPENSE_VOUCHER'
  | 'ADJUSTMENT';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CHECK'
  | 'CREDIT'
  | 'TRANSFER'
  | 'ADJUSTMENT';

export interface RecordTransactionParams {
  date?: Date | string;
  type: string;
  partyType: string;
  partyId: string;
  partyName: string;
  amountEgp: number;
  amountCurrency?: number | null;
  currency?: string;
  debit?: number;
  credit?: number;
  accountId?: string | null;
  paymentMethod?: PaymentMethod | string;
  relatedEntityType?: RelatedEntityType | string | null;
  relatedEntityId?: string | null;
  refDoc?: string | null;
  description?: string | null;
  createdById?: string | null;
}

export interface FinancialImpactSimulation {
  treasury: {
    accountId: string | null;
    accountName: string | null;
    currentBalance: number;
    movementAmount: number;
    movementType: 'INFLOW' | 'OUTFLOW' | 'NONE';
    newBalance: number;
    currency: string;
    hasOverdraftWarning: boolean;
  };
  party: {
    partyId: string;
    partyName: string;
    partyType: string;
    currentBalance: number;
    movementAmount: number;
    newBalance: number;
    balanceDirectionText: string;
  };
}

export class AccountingService {
  /**
   * Determine whether a transaction is money inflow or outflow for treasury
   */
  static isCashInflow(type: string): boolean {
    return (
      type.includes('تحصيل') ||
      type.includes('وارد') ||
      type.includes('Inflow') ||
      type.includes('تسوية زيادة') ||
      type.includes('فائض')
    );
  }

  static isCashOutflow(type: string): boolean {
    return (
      type.includes('سداد') ||
      type.includes('صرف') ||
      type.includes('منصرف') ||
      type.includes('مصروف') ||
      type.includes('Outflow') ||
      type.includes('تسوية عجز') ||
      type.includes('سلفة')
    );
  }

  /**
   * Auto-determine Debit and Credit amounts based on accounting nature of the party
   */
  static determineDebitCredit(params: {
    partyType: string;
    type: string;
    amountEgp: number;
    debit?: number;
    credit?: number;
  }): { debit: number; credit: number } {
    if (params.debit !== undefined && params.credit !== undefined) {
      return { debit: params.debit, credit: params.credit };
    }

    const { partyType, type, amountEgp } = params;
    const isCustomer = partyType.includes('عميل');
    const isSupplierOrContractor =
      partyType.includes('مورد') ||
      partyType.includes('مقاول') ||
      partyType.includes('شركة نقل') ||
      partyType.includes('سائق');
    const isEmployee = partyType.includes('موظف');

    if (isCustomer) {
      // Customer: Asset (Receivable)
      // Debit (+) increases debt (invoice), Credit (-) decreases debt (collection)
      const isCollection = this.isCashInflow(type);
      if (isCollection) {
        return { debit: 0, credit: amountEgp };
      }
      return { debit: amountEgp, credit: 0 };
    }

    if (isSupplierOrContractor) {
      // Supplier/Contractor/Driver: Liability (Payable)
      // Credit (+) increases payable (purchase), Debit (-) decreases payable (payment)
      const isPayment = this.isCashOutflow(type);
      if (isPayment) {
        return { debit: amountEgp, credit: 0 };
      }
      return { debit: 0, credit: amountEgp };
    }

    if (isEmployee) {
      // Employee: Due (Credit), Payout/Advance (Debit)
      const isOutflow = this.isCashOutflow(type);
      if (isOutflow) {
        return { debit: amountEgp, credit: 0 };
      }
      return { debit: 0, credit: amountEgp };
    }

    // Default Expenses or Adjustments
    if (type.includes('مصروف')) {
      return { debit: amountEgp, credit: 0 };
    }

    return { debit: amountEgp, credit: 0 };
  }

  /**
   * Central Transaction Creation with Idempotency Guard & Atomic DB Commit
   */
  static async recordTransaction(
    params: RecordTransactionParams,
    existingTx?: any
  ) {
    if (params.amountEgp <= 0) {
      throw new Error('مبلغ المعاملة المالية يجب أن يكون أكبر من الصفر');
    }

    const txnDate = params.date ? new Date(params.date) : new Date();

    const executeInTx = async (tx: any) => {
      // 1. Idempotency Check: Prevent duplicate ledger entries for the same entity & operation
      if (params.relatedEntityType && params.relatedEntityId) {
        const existing = await tx.financialTransaction.findFirst({
          where: {
            relatedEntityType: params.relatedEntityType,
            relatedEntityId: params.relatedEntityId,
            type: params.type,
            status: { not: 'ملغاة' },
          },
        });

        if (existing) {
          console.warn(
            `[Idempotency Guard] Duplicate transaction prevented for ${params.relatedEntityType}:${params.relatedEntityId} (${params.type}). Returning existing txn: ${existing.txnId}`
          );
          return {
            txnId: existing.txnId,
            isDuplicate: true,
            existingTxn: existing,
          };
        }
      }

      // 2. Determine Debit / Credit
      const { debit, credit } = this.determineDebitCredit({
        partyType: params.partyType,
        type: params.type,
        amountEgp: params.amountEgp,
        debit: params.debit,
        credit: params.credit,
      });

      // 3. Handle Treasury / Cashbox Movement if accountId is provided
      let accountName: string | null = null;
      let newTreasuryBalance: number | null = null;
      let effectiveCurrency = params.currency || 'EGP';

      if (params.accountId) {
        const account = await tx.treasuryAccount.findUnique({
          where: { id: params.accountId },
        });

        if (!account) {
          throw new Error(`الحساب المالي ${params.accountId} غير موجود`);
        }
        if (!account.isActive) {
          throw new Error(`الحساب المالي ${account.name} غير نشط حالياً`);
        }

        accountName = account.name;
        effectiveCurrency = account.currency;
        const currentBal = Number(account.balance);
        const isNonEgp = account.currency !== 'EGP';
        const effectiveAmount =
          isNonEgp && params.amountCurrency
            ? Number(params.amountCurrency)
            : Number(params.amountEgp);

        const isInflow = this.isCashInflow(params.type);
        const isOutflow = this.isCashOutflow(params.type);

        if (isOutflow) {
          // Strict Overdraft Protection with atomic conditional decrement
          if (currentBal < effectiveAmount) {
            throw new Error(
              `رصيد الحساب ${account.name} (${currentBal.toLocaleString()} ${account.currency}) لا يكفي لسداد ${effectiveAmount.toLocaleString()} ${account.currency}`
            );
          }

          const decResult = await tx.treasuryAccount.updateMany({
            where: {
              id: params.accountId,
              balance: { gte: effectiveAmount },
            },
            data: {
              balance: { decrement: effectiveAmount },
            },
          });

          if (decResult.count === 0) {
            throw new Error(
              `تعذر الخصم من الحساب ${account.name} لعدم كفاية الرصيد أو حدوث حركة متزامنة`
            );
          }
        } else if (isInflow) {
          await tx.treasuryAccount.update({
            where: { id: params.accountId },
            data: {
              balance: { increment: effectiveAmount },
            },
          });
        }

        const updatedAccount = await tx.treasuryAccount.findUnique({
          where: { id: params.accountId },
          select: { balance: true },
        });
        newTreasuryBalance = Number(updatedAccount?.balance || 0);
      }

      // 4. Calculate Party Running Balance
      let balanceAfter: number | null = null;
      if (params.partyId) {
        // Fetch current active balance for this party
        const priorTxns = await tx.financialTransaction.findMany({
          where: {
            partyId: params.partyId,
            status: { not: 'ملغاة' },
          },
          select: {
            debit: true,
            credit: true,
            amountEgp: true,
            type: true,
          },
        });

        const isCust = params.partyType.includes('عميل');
        let currentPartyBal = 0;

        for (const t of priorTxns) {
          const d = Number(t.debit);
          const c = Number(t.credit);
          if (isCust) {
            currentPartyBal += d - c;
          } else {
            currentPartyBal += c - d;
          }
        }

        if (isCust) {
          balanceAfter = currentPartyBal + (debit - credit);
        } else {
          balanceAfter = currentPartyBal + (credit - debit);
        }
      }

      // 5. Generate Collision-free Transaction ID
      const txnId = await generateTxnId(tx, txnDate);

      // 6. Persist Financial Transaction
      const transaction = await tx.financialTransaction.create({
        data: {
          txnId,
          date: txnDate,
          type: params.type,
          partyType: params.partyType,
          partyId: params.partyId,
          partyName: params.partyName,
          amountEgp: params.amountEgp,
          amountCurrency: params.amountCurrency || null,
          currency: effectiveCurrency,
          debit,
          credit,
          balanceAfter,
          relatedEntityType: params.relatedEntityType || null,
          relatedEntityId: params.relatedEntityId || null,
          paymentMethod: params.paymentMethod || (params.accountId ? 'CASH' : 'CREDIT'),
          refDoc: params.refDoc || params.relatedEntityId || 'قيد محاسبي مركزي',
          accountId: params.accountId || null,
          accountName,
          description: params.description || `قيد ${params.type} للطرف ${params.partyName}`,
          status: 'معتمد',
          createdById: params.createdById || null,
        },
      });

      // 7. Audit Log
      await tx.auditLog.create({
        data: {
          entityType: 'transaction',
          entityId: txnId,
          action: 'CREATE',
          summary: `تسجيل قيد مالي ${params.type} بقيمة ${params.amountEgp.toLocaleString()} ج.م للطرف ${params.partyName} (رقم القيد: ${txnId})`,
          performedBy: params.createdById || null,
        },
      });

      return {
        txnId,
        transaction,
        newTreasuryBalance,
        partyBalanceAfter: balanceAfter,
        isDuplicate: false,
      };
    };

    if (existingTx) {
      return await executeInTx(existingTx);
    } else {
      const result = await prisma.$transaction(executeInTx);
      await revalidateFinancialImpact(params.partyType, params.partyId);
      return result;
    }
  }

  /**
   * Safely void/cancel a transaction without hard delete
   */
  static async voidTransaction(txnId: string, cancelReason: string, userId?: string) {
    if (!cancelReason || cancelReason.trim().length < 5) {
      throw new Error('يرجى توضيح سبب الإلغاء بالتفصيل (5 أحرف على الأقل)');
    }

    return await prisma.$transaction(async (tx) => {
      const txn = await tx.financialTransaction.findUnique({
        where: { txnId },
      });

      if (!txn) throw new Error(`القيد المالي ${txnId} غير موجود`);
      if (txn.status === 'ملغاة') throw new Error('القيد ملغى مسبقاً');

      const amountEgp = Number(txn.amountEgp);

      // If transaction affected a treasury, reverse it
      if (txn.accountId) {
        const account = await tx.treasuryAccount.findUnique({
          where: { id: txn.accountId },
        });
        const currentBal = Number(account?.balance || 0);
        const isNonEgp = account && account.currency !== 'EGP';
        const effectiveAmount =
          isNonEgp && txn.amountCurrency
            ? Number(txn.amountCurrency)
            : amountEgp;

        const isInflow = this.isCashInflow(txn.type);

        if (isInflow) {
          // Reversing money in means deducting
          if (currentBal < effectiveAmount) {
            throw new Error(
              `لا يمكن إلغاء التحصيل لأن رصيد الخزينة الحالي (${currentBal.toLocaleString()} ${account?.currency}) أقل من قيمة السند المراد عكسه (${effectiveAmount.toLocaleString()} ${account?.currency})`
            );
          }
          await tx.treasuryAccount.update({
            where: { id: txn.accountId },
            data: { balance: { decrement: effectiveAmount } },
          });
        } else {
          // Reversing money out means adding back
          await tx.treasuryAccount.update({
            where: { id: txn.accountId },
            data: { balance: { increment: effectiveAmount } },
          });
        }
      }

      // Mark transaction as 'ملغاة'
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
          summary: `إلغاء وعكس أثر القيد المالي ${txnId} بقيمة ${amountEgp.toLocaleString()} ج.م — السبب: ${cancelReason}`,
          performedBy: userId || null,
        },
      });

      return { txnId, partyId: txn.partyId, partyType: txn.partyType };
    });
  }

  /**
   * Real-time Simulation of Financial Impact for UI Modal Preview
   */
  static async simulateFinancialImpact(params: {
    partyId: string;
    partyType: string;
    amount: number;
    accountId?: string | null;
    movementType?: 'PAYMENT' | 'COLLECTION' | string;
  }): Promise<FinancialImpactSimulation> {
    const { partyId, partyType, amount = 0, accountId, movementType } = params;

    // 1. Party Current Balance
    const activeTxns = await prisma.financialTransaction.findMany({
      where: {
        partyId,
        status: { not: 'ملغاة' },
      },
      select: {
        debit: true,
        credit: true,
        partyName: true,
      },
    });

    const isCustomer = partyType.includes('عميل');
    let currentPartyBal = 0;
    let partyName = partyId;

    for (const t of activeTxns) {
      if (t.partyName) partyName = t.partyName;
      const d = Number(t.debit);
      const c = Number(t.credit);
      if (isCustomer) {
        currentPartyBal += d - c;
      } else {
        currentPartyBal += c - d;
      }
    }

    if (activeTxns.length === 0) {
      // Lookup name
      if (isCustomer) {
        const c = await prisma.customer.findUnique({ where: { id: partyId }, select: { name: true } });
        if (c) partyName = c.name;
      } else {
        const s = await prisma.supplier.findUnique({ where: { id: partyId }, select: { name: true } });
        if (s) partyName = s.name;
        else {
          const k = await prisma.contractor.findUnique({ where: { id: partyId }, select: { name: true } });
          if (k) partyName = k.name;
        }
      }
    }

    // Determine movement direction
    const isPayment =
      movementType === 'PAYMENT' ||
      movementType?.includes('سداد') ||
      movementType?.includes('صرف') ||
      !isCustomer;

    let newPartyBalance = currentPartyBal;
    if (isCustomer) {
      // Customer: collection decreases debt
      newPartyBalance = currentPartyBal - amount;
    } else {
      // Supplier/Contractor: payment decreases payable
      newPartyBalance = currentPartyBal - amount;
    }

    let balanceDirectionText = 'الحساب متوازن وخالص';
    if (isCustomer) {
      if (newPartyBalance > 0) balanceDirectionText = `متبقي عليه: ${newPartyBalance.toLocaleString()} ج.م`;
      else if (newPartyBalance < 0) balanceDirectionText = `له رصيد دائن: ${Math.abs(newPartyBalance).toLocaleString()} ج.م`;
    } else {
      if (newPartyBalance > 0) balanceDirectionText = `متبقي له: ${newPartyBalance.toLocaleString()} ج.م`;
      else if (newPartyBalance < 0) balanceDirectionText = `عليه دفعة مقدمة: ${Math.abs(newPartyBalance).toLocaleString()} ج.م`;
    }

    // 2. Treasury Impact
    let accountName: string | null = null;
    let currentTreasuryBalance = 0;
    let newTreasuryBalance = 0;
    let currency = 'EGP';
    let hasOverdraftWarning = false;
    let treasuryMovementType: 'INFLOW' | 'OUTFLOW' | 'NONE' = 'NONE';

    if (accountId) {
      const acc = await prisma.treasuryAccount.findUnique({
        where: { id: accountId },
        select: { name: true, balance: true, currency: true },
      });
      if (acc) {
        accountName = acc.name;
        currency = acc.currency;
        currentTreasuryBalance = Number(acc.balance);

        if (isCustomer) {
          // Inflow to treasury
          treasuryMovementType = 'INFLOW';
          newTreasuryBalance = currentTreasuryBalance + amount;
        } else {
          // Outflow from treasury
          treasuryMovementType = 'OUTFLOW';
          newTreasuryBalance = currentTreasuryBalance - amount;
          if (newTreasuryBalance < 0) {
            hasOverdraftWarning = true;
          }
        }
      }
    }

    return {
      treasury: {
        accountId: accountId || null,
        accountName,
        currentBalance: currentTreasuryBalance,
        movementAmount: amount,
        movementType: treasuryMovementType,
        newBalance: newTreasuryBalance,
        currency,
        hasOverdraftWarning,
      },
      party: {
        partyId,
        partyName,
        partyType,
        currentBalance: currentPartyBal,
        movementAmount: amount,
        newBalance: newPartyBalance,
        balanceDirectionText,
      },
    };
  }
}
