import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillLedgerEntries() {
  console.log('--- Starting Financial Ledger Backfill Migration ---');

  const transactions = await prisma.financialTransaction.findMany({
    include: { account: true },
    orderBy: [
      { date: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  console.log(`Found ${transactions.length} financial transactions to process.`);

  // Map to track running balances per partyId
  const partyRunningBalances = new Map<string, number>();

  let updatedCount = 0;

  for (const txn of transactions) {
    const amount = Number(txn.amountEgp);
    const pType = txn.partyType || '';
    const tType = txn.type || '';
    const refDoc = txn.refDoc || '';
    const isCancelled = txn.status === 'ملغاة';

    let debit = 0;
    let credit = 0;
    let relatedEntityType: string | null = txn.relatedEntityType;
    let relatedEntityId: string | null = txn.relatedEntityId;
    let paymentMethod: string = txn.paymentMethod || 'CASH';

    // Account check for payment method
    if (txn.accountId && txn.account) {
      if (txn.account.type.includes('بنك')) {
        paymentMethod = 'BANK_TRANSFER';
      } else {
        paymentMethod = 'CASH';
      }
    }

    if (pType.includes('عميل')) {
      // Customer: Asset account
      const isInvoice = tType.includes('استحقاق') || tType.includes('مبيعات') || tType.includes('فاتورة') || refDoc.startsWith('SHP-');
      const isCollection = tType.includes('تحصيل') || tType.includes('وارد') || tType.includes('Inflow');

      if (isInvoice) {
        debit = amount;
        credit = 0;
        relatedEntityType = 'SHIPMENT';
        relatedEntityId = refDoc || txn.txnId;
        paymentMethod = 'CREDIT';
      } else if (isCollection) {
        debit = 0;
        credit = amount;
        relatedEntityType = 'PAYMENT_VOUCHER';
        relatedEntityId = txn.txnId;
      } else {
        debit = amount;
        credit = 0;
      }

      let currentBal = partyRunningBalances.get(txn.partyId) || 0;
      if (!isCancelled) {
        currentBal += (debit - credit);
        partyRunningBalances.set(txn.partyId, currentBal);
      }

      await prisma.financialTransaction.update({
        where: { txnId: txn.txnId },
        data: {
          debit,
          credit,
          balanceAfter: currentBal,
          relatedEntityType,
          relatedEntityId,
          paymentMethod
        }
      });
      updatedCount++;

    } else if (pType.includes('مورد')) {
      // Supplier: Liability account
      const isDue = tType.includes('استحقاق') || tType.includes('توريد') || tType.includes('شراء') || refDoc.startsWith('LOT-') || refDoc.startsWith('DEAL-') || refDoc.startsWith('SUP-PUR-');
      const isPayment = tType.includes('سداد') || tType.includes('صرف') || tType.includes('منصرف') || tType.includes('Outflow');

      if (isDue) {
        debit = 0;
        credit = amount;
        paymentMethod = 'CREDIT';
        if (refDoc.startsWith('LOT-')) relatedEntityType = 'RAW_BATCH';
        else if (refDoc.startsWith('DEAL-')) relatedEntityType = 'PURCHASE_DEAL';
        else if (refDoc.startsWith('SUP-PUR-')) relatedEntityType = 'PACKAGING_PURCHASE';
        else relatedEntityType = 'PURCHASE_INVOICE';
        relatedEntityId = refDoc || txn.txnId;
      } else if (isPayment) {
        debit = amount;
        credit = 0;
        relatedEntityType = 'PAYMENT_VOUCHER';
        relatedEntityId = txn.txnId;
      } else {
        debit = 0;
        credit = amount;
      }

      let currentBal = partyRunningBalances.get(txn.partyId) || 0;
      if (!isCancelled) {
        currentBal += (credit - debit);
        partyRunningBalances.set(txn.partyId, currentBal);
      }

      await prisma.financialTransaction.update({
        where: { txnId: txn.txnId },
        data: {
          debit,
          credit,
          balanceAfter: currentBal,
          relatedEntityType,
          relatedEntityId,
          paymentMethod
        }
      });
      updatedCount++;

    } else if (pType.includes('مقاول')) {
      // Contractor: Liability account
      const isDue = tType.includes('استحقاق') || tType.includes('تشغيل') || refDoc.startsWith('PR-');
      const isPayment = tType.includes('سداد') || tType.includes('صرف') || tType.includes('Outflow');

      if (isDue) {
        debit = 0;
        credit = amount;
        paymentMethod = 'CREDIT';
        relatedEntityType = 'PROCESSING_OP';
        relatedEntityId = refDoc || txn.txnId;
      } else if (isPayment) {
        debit = amount;
        credit = 0;
        relatedEntityType = 'PAYMENT_VOUCHER';
        relatedEntityId = txn.txnId;
      } else {
        debit = 0;
        credit = amount;
      }

      let currentBal = partyRunningBalances.get(txn.partyId) || 0;
      if (!isCancelled) {
        currentBal += (credit - debit);
        partyRunningBalances.set(txn.partyId, currentBal);
      }

      await prisma.financialTransaction.update({
        where: { txnId: txn.txnId },
        data: {
          debit,
          credit,
          balanceAfter: currentBal,
          relatedEntityType,
          relatedEntityId,
          paymentMethod
        }
      });
      updatedCount++;

    } else if (pType.includes('موظف')) {
      // Employee: Due / Advance / Salary
      const isDue = tType.includes('راتب') || tType.includes('استحقاق');
      const isOutflow = tType.includes('صرف') || tType.includes('سلفة') || tType.includes('بدل');

      if (isDue) {
        debit = 0;
        credit = amount;
      } else {
        debit = amount;
        credit = 0;
      }
      relatedEntityType = 'EMPLOYEE_TXN';
      relatedEntityId = txn.refDoc || txn.txnId;

      let currentBal = partyRunningBalances.get(txn.partyId) || 0;
      if (!isCancelled) {
        currentBal += (credit - debit);
        partyRunningBalances.set(txn.partyId, currentBal);
      }

      await prisma.financialTransaction.update({
        where: { txnId: txn.txnId },
        data: {
          debit,
          credit,
          balanceAfter: currentBal,
          relatedEntityType,
          relatedEntityId,
          paymentMethod
        }
      });
      updatedCount++;

    } else if (tType.includes('مناقلة') || tType.includes('تحويل')) {
      // Internal transfer
      paymentMethod = 'TRANSFER';
      relatedEntityType = 'TREASURY_TRANSFER';
      relatedEntityId = refDoc || txn.txnId;
      if (tType.includes('وارد')) {
        debit = amount;
        credit = 0;
      } else {
        debit = 0;
        credit = amount;
      }

      await prisma.financialTransaction.update({
        where: { txnId: txn.txnId },
        data: {
          debit,
          credit,
          balanceAfter: null,
          relatedEntityType,
          relatedEntityId,
          paymentMethod
        }
      });
      updatedCount++;

    } else if (tType.includes('تسوية')) {
      relatedEntityType = 'ADJUSTMENT';
      relatedEntityId = refDoc || txn.txnId;
      paymentMethod = 'ADJUSTMENT';
      const isIncrease = tType.includes('فائض') || tType.includes('زيادة');
      debit = isIncrease ? amount : 0;
      credit = isIncrease ? 0 : amount;

      await prisma.financialTransaction.update({
        where: { txnId: txn.txnId },
        data: {
          debit,
          credit,
          balanceAfter: null,
          relatedEntityType,
          relatedEntityId,
          paymentMethod
        }
      });
      updatedCount++;

    } else {
      // Expense or other
      debit = amount;
      credit = 0;
      relatedEntityType = 'EXPENSE_VOUCHER';
      relatedEntityId = txn.txnId;

      await prisma.financialTransaction.update({
        where: { txnId: txn.txnId },
        data: {
          debit,
          credit,
          balanceAfter: null,
          relatedEntityType,
          relatedEntityId,
          paymentMethod
        }
      });
      updatedCount++;
    }
  }

  console.log(`Successfully backfilled ${updatedCount} transactions.`);
  console.log('--- Migration Completed Successfully ---');
}

backfillLedgerEntries()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
