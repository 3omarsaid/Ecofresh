"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { TreasuryAccountSchema } from '@/lib/validations/treasury';
import { reconcileAllTreasuryAccounts, reconcileTreasuryAccount } from '@/lib/treasury-reconciliation';

export async function createTreasuryAccount(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_FINANCIALS')) {
    return { success: false, error: 'غير مصرح لك بإضافة حسابات مالية' };
  }

  const validated = TreasuryAccountSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const account = await prisma.treasuryAccount.create({
      data: validated.data,
    });
    revalidatePath('/financials/treasury');
    return { success: true, message: `تم تسجيل الحساب ${account.name} بنجاح` };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'كود الحساب مسجل مسبقاً' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حفظ الحساب' };
  }
}

export async function getTreasuryAccounts() {
  try {
    return await prisma.treasuryAccount.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
  } catch (error) {
    console.error('Failed to fetch treasury accounts:', error);
    return [];
  }
}

/**
 * Returns all treasury accounts enriched with live reconciliation status
 */
export async function getTreasuryAccountsWithReconciliation() {
  try {
    const [accounts, reconciliation] = await Promise.all([
      prisma.treasuryAccount.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      reconcileAllTreasuryAccounts(),
    ]);

    const reconMap = new Map(reconciliation.accounts.map((r) => [r.accountId, r]));

    return accounts.map((account) => {
      const recon = reconMap.get(account.id);
      return {
        ...account,
        balance: Number(account.balance),
        reconciliationStatus: recon?.status || 'BALANCED',
        calculatedBalance: recon?.calculatedBalance ?? Number(account.balance),
        difference: recon?.difference ?? 0,
        totalInflows: recon?.totalInflows ?? 0,
        totalOutflows: recon?.totalOutflows ?? 0,
        activeTxnCount: recon?.activeTxnCount ?? 0,
      };
    });
  } catch (error) {
    console.error('Failed to fetch treasury accounts with reconciliation:', error);
    return [];
  }
}
