import { prisma } from '@/lib/prisma';

export interface GeneralLedgerFilter {
  tab?: 'all' | 'ar' | 'ap' | 'contractors';
  startDate?: string;
  endDate?: string;
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getGeneralLedger(filter: GeneralLedgerFilter = {}) {
  try {
    const { tab = 'all', startDate, endDate, type, search, page = 1, pageSize = 25 } = filter;
    const skip = (page - 1) * pageSize;

    let partyTypeFilter: string[] | undefined;
    if (tab === 'ar') {
      partyTypeFilter = ['عميل', 'عملاء'];
    } else if (tab === 'ap') {
      partyTypeFilter = ['مورد خام', 'مورد خامات', 'مورد مستلزمات', 'مورد بضاعة جاهزة', 'مورد'];
    } else if (tab === 'contractors') {
      partyTypeFilter = ['مقاول عمالة', 'مقاول', 'مقاولين'];
    }

    const whereClause: any = {};

    if (partyTypeFilter) {
      whereClause.OR = partyTypeFilter.map((pt) => ({
        partyType: { contains: pt },
      }));
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    if (type && type !== 'ALL') {
      whereClause.type = type;
    }

    if (search) {
      const searchCondition = [
        { txnId: { contains: search, mode: 'insensitive' } },
        { partyName: { contains: search, mode: 'insensitive' } },
        { refDoc: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
      if (whereClause.OR) {
        whereClause.AND = [
          { OR: whereClause.OR },
          { OR: searchCondition }
        ];
        delete whereClause.OR;
      } else {
        whereClause.OR = searchCondition;
      }
    }

    const [transactions, totalCount, aggregateSum] = await Promise.all([
      prisma.financialTransaction.findMany({
        where: whereClause,
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
          account: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.financialTransaction.count({ where: whereClause }),
      prisma.financialTransaction.aggregate({
        where: whereClause,
        _sum: {
          amountEgp: true,
        },
      }),
    ]);

    const totalAmount = Number(aggregateSum._sum.amountEgp || 0);

    return {
      transactions: transactions.map((t) => ({
        ...t,
        accountName: t.account?.name || null,
        amountEgp: Number(t.amountEgp),
        amountCurrency: t.amountCurrency ? Number(t.amountCurrency) : null,
      })),
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      page,
      pageSize,
      totalAmount,
    };
  } catch (error) {
    console.error('Failed to fetch general ledger:', error);
    return { transactions: [], totalCount: 0, totalPages: 0, page: 1, pageSize: 25, totalAmount: 0 };
  }
}

export interface PartyFinancialSummary {
  partyId: string;
  partyName: string;
  partyType: 'customer' | 'supplier' | 'contractor' | 'other';
  partyTypeLabel: string;
  totalDue: number;
  totalPaidOrCollected: number;
  remaining: number;
  balanceDirection: 'party_owes_company' | 'company_owes_party' | 'settled' | 'advance';
  balanceText: string;
  lastMovementDate: Date | null;
  lastMovementType: string | null;
  lastMovementAmount: number | null;
  lastMovementRelative: string | null;
}

export function formatArabicRelativeDate(date: Date | null | undefined): string {
  if (!date) return 'لا توجد حركات مسجلة';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'منذ لحظات';
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return 'أمس';
  if (diffDays === 2) return 'منذ يومين';
  if (diffDays <= 10) return `منذ ${diffDays} أيام`;
  if (diffDays <= 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Single Source of Truth for Party Financial Summary (Customer, Supplier, Contractor)
 * Computed server-side from active FinancialTransactions.
 */
export async function getPartyFinancialSummary(
  partyId: string,
  partyTypeHint?: string
): Promise<PartyFinancialSummary> {
  try {
    // 1. Fetch active transactions for party
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        partyId,
        status: { not: 'ملغاة' },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    let partyName = partyId;
    let partyType: 'customer' | 'supplier' | 'contractor' | 'other' = 'other';
    let partyTypeLabel = partyTypeHint || 'جهة متعاملة';

    // Infer party type if not explicit
    if (partyTypeHint) {
      if (partyTypeHint.includes('عميل')) partyType = 'customer';
      else if (partyTypeHint.includes('مورد')) partyType = 'supplier';
      else if (partyTypeHint.includes('مقاول')) partyType = 'contractor';
    } else if (transactions.length > 0) {
      const pType = transactions[0].partyType;
      partyName = transactions[0].partyName;
      if (pType.includes('عميل')) partyType = 'customer';
      else if (pType.includes('مورد')) partyType = 'supplier';
      else if (pType.includes('مقاول')) partyType = 'contractor';
      partyTypeLabel = pType;
    }

    // If transactions are empty, fetch master data to get actual name
    if (transactions.length === 0 || partyName === partyId) {
      const [customer, supplier, contractor] = await Promise.all([
        prisma.customer.findUnique({ where: { id: partyId }, select: { name: true } }),
        prisma.supplier.findUnique({ where: { id: partyId }, select: { name: true } }),
        prisma.contractor.findUnique({ where: { id: partyId }, select: { name: true } }),
      ]);
      if (customer) {
        partyName = customer.name;
        partyType = 'customer';
        partyTypeLabel = 'عميل تصدير';
      } else if (supplier) {
        partyName = supplier.name;
        partyType = 'supplier';
        partyTypeLabel = 'مورد معتمد';
      } else if (contractor) {
        partyName = contractor.name;
        partyType = 'contractor';
        partyTypeLabel = 'مقاول تشغيل وعمالة';
      }
    }

    let totalDue = 0;
    let totalPaidOrCollected = 0;

    for (const t of transactions) {
      const amt = Number(t.amountEgp);
      if (partyType === 'customer') {
        const isCollection = t.type.includes('تحصيل') || t.type.includes('وارد') || t.type.includes('Inflow');
        if (isCollection) {
          totalPaidOrCollected += amt;
        } else {
          totalDue += amt;
        }
      } else {
        // Supplier or Contractor
        const isPayment = t.type.includes('سداد') || t.type.includes('منصرف') || t.type.includes('Outflow');
        if (isPayment) {
          totalPaidOrCollected += amt;
        } else {
          totalDue += amt;
        }
      }
    }

    const remaining = totalDue - totalPaidOrCollected;

    let balanceDirection: 'party_owes_company' | 'company_owes_party' | 'settled' | 'advance' = 'settled';
    let balanceText = 'الحساب خالص ومسدد';

    if (partyType === 'customer') {
      if (remaining > 0) {
        balanceDirection = 'party_owes_company';
        balanceText = `عليه: ${remaining.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`;
      } else if (remaining < 0) {
        balanceDirection = 'advance';
        balanceText = `له رصيد دائن: ${Math.abs(remaining).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`;
      }
    } else {
      // Supplier / Contractor
      if (remaining > 0) {
        balanceDirection = 'company_owes_party';
        balanceText = `له: ${remaining.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`;
      } else if (remaining < 0) {
        balanceDirection = 'advance';
        balanceText = `عليه (دفعة مقدمة): ${Math.abs(remaining).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`;
      }
    }

    const lastTxn = transactions[0];

    return {
      partyId,
      partyName,
      partyType,
      partyTypeLabel,
      totalDue,
      totalPaidOrCollected,
      remaining,
      balanceDirection,
      balanceText,
      lastMovementDate: lastTxn ? lastTxn.date : null,
      lastMovementType: lastTxn ? lastTxn.type : null,
      lastMovementAmount: lastTxn ? Number(lastTxn.amountEgp) : null,
      lastMovementRelative: lastTxn ? formatArabicRelativeDate(lastTxn.date) : null,
    };
  } catch (error) {
    console.error(`Failed to calculate financial summary for ${partyId}:`, error);
    return {
      partyId,
      partyName: partyId,
      partyType: 'other',
      partyTypeLabel: 'جهة متعاملة',
      totalDue: 0,
      totalPaidOrCollected: 0,
      remaining: 0,
      balanceDirection: 'settled',
      balanceText: 'الحساب خالص ومسدد',
      lastMovementDate: null,
      lastMovementType: null,
      lastMovementAmount: null,
      lastMovementRelative: null,
    };
  }
}

export interface StatementRow {
  txnId: string;
  date: Date;
  type: string;
  partyType?: string;
  partyId?: string;
  partyName?: string;
  refDoc: string | null;
  description: string | null;
  amountEgp: number;
  debit: number;
  credit: number;
  dueAmount: number;
  paidAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  balance: number;
  status: string;
  isCancelled: boolean;
  amountCurrency?: number | null;
  currency?: string | null;
  accountName?: string | null;
  sourceLink?: string | null;
}

export interface PartyStatementFilter {
  partyId: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export async function getPartyStatement(params: string | PartyStatementFilter) {
  try {
    const filter: PartyStatementFilter = typeof params === 'string' ? { partyId: params } : params;
    const { partyId, dateFrom, dateTo, page = 1, pageSize = 50 } = filter;

    // 1. Fetch Party Summary to know type
    const summary = await getPartyFinancialSummary(partyId);
    const isCustomer = summary.partyType === 'customer';

    // 2. Fetch all chronological transactions for opening balance calculation
    // To preserve running balance integrity across dates and pages, we compute opening balance
    // prior to `dateFrom`
    let dateFromFilter: Date | undefined;
    let dateToFilter: Date | undefined;

    if (dateFrom) {
      dateFromFilter = new Date(dateFrom);
      dateFromFilter.setHours(0, 0, 0, 0);
    }
    if (dateTo) {
      dateToFilter = new Date(dateTo);
      dateToFilter.setHours(23, 59, 59, 999);
    }

    // Query active transactions prior to dateFrom for Opening Balance
    let openingBalance = 0;
    if (dateFromFilter) {
      const priorTransactions = await prisma.financialTransaction.findMany({
        where: {
          partyId,
          status: { not: 'ملغاة' },
          date: { lt: dateFromFilter },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      });

      for (const t of priorTransactions) {
        const amt = Number(t.amountEgp);
        if (isCustomer) {
          const isCollection = t.type.includes('تحصيل') || t.type.includes('وارد') || t.type.includes('Inflow');
          if (isCollection) openingBalance -= amt;
          else openingBalance += amt;
        } else {
          const isPayment = t.type.includes('سداد') || t.type.includes('منصرف') || t.type.includes('Outflow');
          if (isPayment) openingBalance -= amt;
          else openingBalance += amt;
        }
      }
    }

    // Query period transactions
    const periodWhere: any = { partyId };
    if (dateFromFilter || dateToFilter) {
      periodWhere.date = {};
      if (dateFromFilter) periodWhere.date.gte = dateFromFilter;
      if (dateToFilter) periodWhere.date.lte = dateToFilter;
    }

    const allPeriodTransactions = await prisma.financialTransaction.findMany({
      where: periodWhere,
      include: { account: true },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    // Compute running balance for all period transactions
    let currentRunning = openingBalance;
    let periodDue = 0;
    let periodPaidOrCollected = 0;

    const allMappedRows: StatementRow[] = allPeriodTransactions.map((txn) => {
      const isCancelled = txn.status === 'ملغاة';
      const amount = Number(txn.amountEgp);

      let dueAmount = 0;
      let paidAmount = 0;
      let debit = 0;
      let credit = 0;

      if (isCustomer) {
        const isCollection = txn.type.includes('تحصيل') || txn.type.includes('وارد') || txn.type.includes('Inflow');
        if (isCollection) {
          paidAmount = amount;
          credit = amount;
        } else {
          dueAmount = amount;
          debit = amount;
        }
      } else {
        const isPayment = txn.type.includes('سداد') || txn.type.includes('منصرف') || txn.type.includes('Outflow');
        if (isPayment) {
          paidAmount = amount;
          credit = amount;
        } else {
          dueAmount = amount;
          debit = amount;
        }
      }

      const balanceBefore = currentRunning;
      if (!isCancelled) {
        if (dueAmount > 0) {
          currentRunning += dueAmount;
          periodDue += dueAmount;
        }
        if (paidAmount > 0) {
          currentRunning -= paidAmount;
          periodPaidOrCollected += paidAmount;
        }
      }
      const balanceAfter = currentRunning;

      // Detect source link
      let sourceLink: string | null = null;
      if (txn.refDoc) {
        if (txn.refDoc.startsWith('SHP-')) sourceLink = `/shipments`;
        else if (txn.refDoc.startsWith('LOT-')) sourceLink = `/raw-purchases`;
        else if (txn.refDoc.startsWith('DEAL-')) sourceLink = `/finished-purchases`;
        else if (txn.refDoc.startsWith('PR-')) sourceLink = `/processing-operations`;
      }

      return {
        txnId: txn.txnId,
        date: txn.date,
        type: txn.type,
        partyType: txn.partyType,
        partyId: txn.partyId,
        partyName: txn.partyName,
        refDoc: txn.refDoc,
        description: txn.description,
        amountEgp: Number(txn.amountEgp),
        debit,
        credit,
        dueAmount,
        paidAmount,
        balanceBefore,
        balanceAfter,
        balance: balanceAfter,
        status: txn.status,
        isCancelled,
        amountCurrency: txn.amountCurrency ? Number(txn.amountCurrency) : null,
        currency: txn.currency,
        accountName: txn.accountName || txn.account?.name || null,
        sourceLink,
      };
    });

    const closingBalance = currentRunning;
    const totalCount = allMappedRows.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const skip = (page - 1) * pageSize;
    const paginatedRows = allMappedRows.slice(skip, skip + pageSize);

    return {
      partyInfo: {
        partyId: summary.partyId,
        partyName: summary.partyName,
        partyType: summary.partyTypeLabel,
      },
      summary,
      openingBalance,
      rows: paginatedRows,
      closingBalance,
      totalDue: periodDue,
      totalPaidOrCollected: periodPaidOrCollected,
      remaining: summary.remaining,
      totalDebit: allMappedRows.reduce((s, r) => s + (r.isCancelled ? 0 : r.debit), 0),
      totalCredit: allMappedRows.reduce((s, r) => s + (r.isCancelled ? 0 : r.credit), 0),
      finalBalance: closingBalance,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    };
  } catch (error) {
    console.error(`Failed to fetch party statement:`, error);
    return {
      partyInfo: null,
      summary: null,
      openingBalance: 0,
      rows: [],
      closingBalance: 0,
      totalDue: 0,
      totalPaidOrCollected: 0,
      remaining: 0,
      totalDebit: 0,
      totalCredit: 0,
      finalBalance: 0,
      pagination: { page: 1, pageSize: 50, totalCount: 0, totalPages: 0 },
    };
  }
}
