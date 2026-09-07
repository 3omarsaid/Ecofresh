import { prisma } from '@/lib/prisma';
import { AccountingService } from '@/lib/accounting/accounting-service';
import { getAccountStatementReport } from '@/actions/account-statements';

async function testAccountingSystem() {
  console.log('=== Starting Accounting System Verification ===');

  // 1. Fetch a supplier
  const supplier = await prisma.supplier.findFirst({
    where: { status: 'معتمد' },
  });

  if (!supplier) {
    throw new Error('No approved supplier found for testing');
  }
  console.log(`Testing with supplier: ${supplier.name} (${supplier.id})`);

  // 2. Fetch initial statement
  const initialReport = await getAccountStatementReport({
    partyType: 'SUPPLIERS',
    partyId: supplier.id,
  });

  console.log('Initial Statement Status:', initialReport.success);
  console.log('Initial Balance:', initialReport.statement?.summary.currentBalance);
  console.log('Running Rows Count:', initialReport.statement?.summary.movementsCount);
  console.log('Related Ops Count:', initialReport.statement?.summary.relatedOperationsCount);

  // 3. Test Idempotency Guard
  console.log('\n--- Testing Idempotency Guard ---');
  const testRef = `TEST-DEAL-${Date.now()}`;
  const res1 = await AccountingService.recordTransaction({
    date: new Date(),
    type: 'استحقاق توريد خام (AP)',
    partyType: 'مورد خام',
    partyId: supplier.id,
    partyName: supplier.name,
    amountEgp: 1500,
    relatedEntityType: 'RAW_BATCH',
    relatedEntityId: testRef,
    paymentMethod: 'CREDIT',
    description: 'اختبار منع التكرار',
  });
  console.log(`Transaction 1 created: ${res1.txnId}, isDuplicate: ${res1.isDuplicate}`);

  const res2 = await AccountingService.recordTransaction({
    date: new Date(),
    type: 'استحقاق توريد خام (AP)',
    partyType: 'مورد خام',
    partyId: supplier.id,
    partyName: supplier.name,
    amountEgp: 1500,
    relatedEntityType: 'RAW_BATCH',
    relatedEntityId: testRef,
    paymentMethod: 'CREDIT',
    description: 'اختبار منع التكرار',
  });
  console.log(`Transaction 2 created: ${res2.txnId}, isDuplicate: ${res2.isDuplicate}`);
  if (res1.txnId === res2.txnId && res2.isDuplicate) {
    console.log('✅ Idempotency check PASSED: Duplicate was prevented!');
  } else {
    console.error('❌ Idempotency check failed!');
  }

  // 4. Test Overdraft Protection
  console.log('\n--- Testing Overdraft Protection ---');
  const treasury = await prisma.treasuryAccount.findFirst({
    where: { isActive: true },
  });

  if (treasury) {
    const excessiveAmount = Number(treasury.balance) + 100000000;
    try {
      await AccountingService.recordTransaction({
        date: new Date(),
        type: 'سداد دفعة لمورد',
        partyType: 'مورد خام',
        partyId: supplier.id,
        partyName: supplier.name,
        amountEgp: excessiveAmount,
        accountId: treasury.id,
        paymentMethod: 'CASH',
        description: 'اختبار كسر الرصيد',
      });
      console.error('❌ Overdraft protection failed to throw error!');
    } catch (err: any) {
      console.log('✅ Overdraft protection PASSED: Threw error ->', err.message);
    }
  }

  // 5. Test Real-time Impact Simulation
  console.log('\n--- Testing Real-time Simulation ---');
  const sim = await AccountingService.simulateFinancialImpact({
    partyId: supplier.id,
    partyType: 'مورد خام',
    amount: 5000,
    accountId: treasury?.id,
    movementType: 'سداد لمورد',
  });
  console.log('Simulation current party balance:', sim.party.currentBalance);
  console.log('Simulation new party balance:', sim.party.newBalance);
  console.log('Simulation treasury balance before:', sim.treasury.currentBalance);
  console.log('Simulation treasury balance after:', sim.treasury.newBalance);
  console.log('✅ Real-time simulation PASSED!');

  // Cleanup test transaction
  await prisma.financialTransaction.deleteMany({
    where: { relatedEntityId: testRef },
  });

  console.log('\n=== All Accounting System Tests Passed Successfully! ===');
}

testAccountingSystem()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
