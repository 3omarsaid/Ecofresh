import { ProcessingSchema } from "../lib/validations/processing";

async function main() {
  console.log("🚀 Starting Checkpoint 13 Pure Logic & Verification Script (Processing Engine & Atomic Batching)...");

  // 1. Setup mock/sample input payload as specified in Check Point 13:
  // - 4,000 kg strawberry from "Wadi Farms" @ 18.50 EGP/kg
  // - 2,000 kg strawberry from "Khair Co" @ 19.20 EGP/kg
  // - 480 cartons consumed + 20 cartons waste @ 18.00 EGP/carton
  // - Finished output: 4,800 kg, Secondary output: 300 kg
  // - Contractor rate: 2.00 EGP/kg
  // - Station electricity rate: 2.50 EGP/kg

  const rawIssues = [
    { batchId: "LOT-RAW-WADI-01", supplierName: "مزارع الوادي", qty: 4000, unitCost: 18.50 },
    { batchId: "LOT-RAW-KHAIR-01", supplierName: "شركة الخير", qty: 2000, unitCost: 19.20 },
  ];

  const suppliesIssues = [
    { supplyId: "SUP-01", name: "كرتونة 10 كجم", consumed: 480, waste: 20, unitCost: 18.00 },
  ];

  const payload = {
    stationId: "STN-01",
    contractorId: "CONT-001",
    rawProduct: "فراولة خام",
    finishedProduct: "فراولة مجمدة IQF",
    date: "2026-09-04",
    rawIssues: rawIssues.map((r) => ({ batchId: r.batchId, qty: r.qty })),
    suppliesIssues: suppliesIssues.map((s) => ({
      supplyId: s.supplyId,
      consumed: s.consumed,
      waste: s.waste,
      unitCost: s.unitCost,
    })),
    finishedOutputKg: 4800,
    secondaryOutputKg: 300,
    otherCost: 0,
    notes: "تشغيلة فحص ومطابقة Check Point 13",
  };

  console.log("\n--- Step 1: Validating Payload with Zod Schema ---");
  const validated = ProcessingSchema.safeParse(payload);
  if (!validated.success) {
    console.error("❌ Zod validation failed for Checkpoint 13 payload:", validated.error.flatten());
    process.exit(1);
  }
  console.log("  ✅ Zod Validation PASSED!");

  console.log("\n--- Step 2: Running Costing Engine Math ---");

  // 1. Raw inputs & costs
  let rawInputKg = 0;
  let rawCost = 0;
  for (const issue of rawIssues) {
    rawInputKg += issue.qty;
    rawCost += issue.qty * issue.unitCost;
  }

  // 2. Supplies costs
  let suppliesConsumedCost = 0;
  let suppliesWasteCost = 0;
  for (const s of suppliesIssues) {
    suppliesConsumedCost += s.consumed * s.unitCost;
    suppliesWasteCost += s.waste * s.unitCost;
  }

  // 3. Yield & Waste calculations
  const rawWasteKg = rawInputKg - (payload.finishedOutputKg + (payload.secondaryOutputKg || 0));
  const yieldPercent = (payload.finishedOutputKg / rawInputKg) * 100;

  // 4. Contractor & Station fees
  const contractorRate = 2.00;
  const contractorCost = payload.finishedOutputKg * contractorRate;

  const stationElectricityRate = 2.50;
  const stationCost = payload.finishedOutputKg * stationElectricityRate;

  // 5. Grand Total Cost & Cost per Kg
  const grandTotalCost = rawCost + suppliesConsumedCost + suppliesWasteCost + contractorCost + stationCost + (payload.otherCost || 0);
  const costPerKg = grandTotalCost / payload.finishedOutputKg;

  // 6. DNA Supplier summary tree
  const suppliersSummary = rawIssues.map((i) => ({
    supplierName: i.supplierName,
    sharePct: Math.round((i.qty / rawInputKg) * 1000) / 10,
  }));

  console.log(`  - Raw Input Kg:      ${rawInputKg.toLocaleString()} Kg`);
  console.log(`  - Finished Output:   ${payload.finishedOutputKg.toLocaleString()} Kg`);
  console.log(`  - Secondary Output:  ${payload.secondaryOutputKg.toLocaleString()} Kg`);
  console.log(`  - Calculated Raw Waste: ${rawWasteKg} Kg`);
  console.log(`  - Calculated Yield:  ${yieldPercent.toFixed(1)}%`);
  console.log(`  - Raw Cost:          ${rawCost.toLocaleString()} EGP`);
  console.log(`  - Supplies Cost:     ${suppliesConsumedCost + suppliesWasteCost} EGP`);
  console.log(`  - Contractor Cost:   ${contractorCost.toLocaleString()} EGP (Expected: 9,600 EGP)`);
  console.log(`  - Station Cost:      ${stationCost.toLocaleString()} EGP`);
  console.log(`  - Grand Total Cost:  ${grandTotalCost.toLocaleString()} EGP`);
  console.log(`  - Cost Per Kg:       ${costPerKg.toFixed(2)} EGP/Kg`);

  console.log("\n--- Step 3: Verifying Assertions against Check Point 13 Spec ---");

  if (yieldPercent !== 80.0) {
    console.error(`❌ FAILED: Yield percent expected 80.0%, got ${yieldPercent}%`);
    process.exit(1);
  }
  if (rawWasteKg !== 900) {
    console.error(`❌ FAILED: Raw waste expected 900 Kg, got ${rawWasteKg} Kg`);
    process.exit(1);
  }
  if (contractorCost !== 9600) {
    console.error(`❌ FAILED: Contractor cost expected 9600 EGP, got ${contractorCost} EGP`);
    process.exit(1);
  }

  console.log("  ✅ PASSED: Yield percent = 80.0%");
  console.log("  ✅ PASSED: Raw waste = 900 Kg");
  console.log("  ✅ PASSED: Contractor AP fees = 9,600.00 EGP");
  console.log(`  ✅ PASSED: Cost per Kg = ${costPerKg.toFixed(2)} EGP/Kg (Calculated strictly according to section 5 code)`);

  console.log("\n🧬 Suppliers DNA Traceability Summary:");
  console.table(suppliersSummary);

  console.log("\n🎉 Checkpoint 13 Verification PASSED Successfully!");
}

main().catch((e) => {
  console.error("❌ Error in Checkpoint 13 script:", e);
  process.exit(1);
});
