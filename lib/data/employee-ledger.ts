import { prisma } from '@/lib/prisma';
import { formatArabicRelativeDate } from '@/lib/data/ledger';

export interface EmployeeStatementRow {
  id: string;
  date: Date;
  type: string;
  amount: number;
  dueAmount: number;
  paidAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  balance: number;
  treasuryAccountId: string | null;
  treasuryAccountName: string | null;
  financialTransactionId: string | null;
  refDoc: string | null;
  notes: string | null;
  status: string;
  isCancelled: boolean;
}

export interface EmployeeFinancialSummary {
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  stationName: string | null;
  basicSalary: number;
  allowances: number;
  totalMonthlySalary: number;
  totalDue: number;
  totalPaidOrDeducted: number;
  remaining: number;
  balanceDirection: 'company_owes_employee' | 'employee_owes_company' | 'settled';
  balanceText: string;
  lastMovementDate: Date | null;
  lastMovementType: string | null;
  lastMovementAmount: number | null;
  lastMovementRelative: string | null;
}

export async function getEmployeeFinancialSummary(employeeId: string): Promise<EmployeeFinancialSummary> {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        station: true,
        transactions: {
          orderBy: [
            { date: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
    });

    if (!employee) {
      throw new Error(`الموظف ${employeeId} غير موجود`);
    }

    const basicSalary = Number(employee.basicSalary);
    const allowances = Number(employee.allowances);
    const totalMonthlySalary = basicSalary + allowances;

    let totalDue = 0;
    let totalPaidOrDeducted = 0;

    for (const t of employee.transactions) {
      if (t.status === 'ملغاة') continue;
      const amt = Number(t.amount);

      const isDue =
        t.type.includes('استحقاق') ||
        t.type.includes('مكافأة') ||
        t.type.includes('بدل') ||
        (t.type === 'راتب' && !t.treasuryAccountId);

      if (isDue) {
        totalDue += amt;
      } else {
        totalPaidOrDeducted += amt;
      }
    }

    const remaining = totalDue - totalPaidOrDeducted;

    let balanceDirection: 'company_owes_employee' | 'employee_owes_company' | 'settled' = 'settled';
    let balanceText = 'الحساب خالص ومسدد';

    if (remaining > 0) {
      balanceDirection = 'company_owes_employee';
      balanceText = `له مستحقات: ${remaining.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`;
    } else if (remaining < 0) {
      balanceDirection = 'employee_owes_company';
      balanceText = `عليه (سلف/عهدة): ${Math.abs(remaining).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`;
    }

    const lastTxn = employee.transactions[0];

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      position: employee.position,
      department: employee.department,
      stationName: employee.station?.name || null,
      basicSalary,
      allowances,
      totalMonthlySalary,
      totalDue,
      totalPaidOrDeducted,
      remaining,
      balanceDirection,
      balanceText,
      lastMovementDate: lastTxn ? lastTxn.date : null,
      lastMovementType: lastTxn ? lastTxn.type : null,
      lastMovementAmount: lastTxn ? Number(lastTxn.amount) : null,
      lastMovementRelative: lastTxn ? formatArabicRelativeDate(lastTxn.date) : null,
    };
  } catch (error) {
    console.error(`Failed to calculate employee summary for ${employeeId}:`, error);
    return {
      employeeId,
      employeeName: employeeId,
      position: '',
      department: '',
      stationName: null,
      basicSalary: 0,
      allowances: 0,
      totalMonthlySalary: 0,
      totalDue: 0,
      totalPaidOrDeducted: 0,
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

export async function getEmployeeLedger(employeeId: string): Promise<{
  summary: EmployeeFinancialSummary;
  rows: EmployeeStatementRow[];
}> {
  const summary = await getEmployeeFinancialSummary(employeeId);

  const transactions = await prisma.employeeTransaction.findMany({
    where: { employeeId },
    include: {
      treasuryAccount: true,
      financialTransaction: true,
    },
    orderBy: [
      { date: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  let currentRunning = 0;

  const rows: EmployeeStatementRow[] = transactions.map((t) => {
    const isCancelled = t.status === 'ملغاة';
    const amount = Number(t.amount);

    const isDue =
      t.type.includes('استحقاق') ||
      t.type.includes('مكافأة') ||
      t.type.includes('بدل') ||
      (t.type === 'راتب' && !t.treasuryAccountId);

    let dueAmount = 0;
    let paidAmount = 0;

    if (isDue) {
      dueAmount = amount;
    } else {
      paidAmount = amount;
    }

    const balanceBefore = currentRunning;
    if (!isCancelled) {
      if (dueAmount > 0) currentRunning += dueAmount;
      if (paidAmount > 0) currentRunning -= paidAmount;
    }
    const balanceAfter = currentRunning;

    return {
      id: t.id,
      date: t.date,
      type: t.type,
      amount,
      dueAmount,
      paidAmount,
      balanceBefore,
      balanceAfter,
      balance: balanceAfter,
      treasuryAccountId: t.treasuryAccountId,
      treasuryAccountName: t.treasuryAccount?.name || null,
      financialTransactionId: t.financialTransactionId,
      refDoc: t.refDoc,
      notes: t.notes,
      status: t.status,
      isCancelled,
    };
  });

  rows.reverse();

  return {
    summary,
    rows,
  };
}
