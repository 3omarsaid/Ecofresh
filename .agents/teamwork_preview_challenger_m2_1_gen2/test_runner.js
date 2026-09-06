const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log("=== STARTING EMPIRICAL VERIFICATION TESTS ===");
let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedCount++;
  }
}

// -------------------------------------------------------------
// TASK 1: Verify main_prototype/js/interactions.js
// -------------------------------------------------------------
console.log("\n--- Testing Task 1: interactions.js Toast & Wizard Exclusion ---");

const interactionsJsCode = fs.readFileSync(path.join(__dirname, '../../main_prototype/js/interactions.js'), 'utf8');

// Test 1.1: Standard page with form and "التالي" button should trigger toast
{
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
    <body>
      <form>
        <button id="next-btn">التالي</button>
      </form>
    </body>
    </html>
  `, { url: "http://localhost/pages/add-transaction.html", runScripts: "dangerously" });

  const { window } = dom;
  let toastMessages = [];
  window.showToast = (msg, type) => { toastMessages.push({ msg, type }); };

  // Execute interactions.js in dom context
  window.eval(interactionsJsCode);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

  const nextBtn = window.document.getElementById('next-btn');
  nextBtn.click();

  assert(toastMessages.length > 0, "Standard page triggers step toast on 'التالي' button click");
  assert(toastMessages.some(t => t.msg.includes("الخطوة 2 من 4")), "Toast message contains step transition text 'الخطوة 2 من 4'");
}

// Test 1.2: shipment-wizard.html page MUST NOT trigger generic 4-step wizard toasts
{
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
    <body>
      <div id="shipment-wizard-container">
        <form data-custom-wizard="true">
          <button id="shipment-next-btn">التالي</button>
        </form>
      </div>
    </body>
    </html>
  `, { url: "http://localhost/pages/shipment-wizard.html", runScripts: "dangerously" });

  const { window } = dom;
  let toastMessages = [];
  window.showToast = (msg, type) => { toastMessages.push({ msg, type }); };

  window.eval(interactionsJsCode);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

  const nextBtn = window.document.getElementById('shipment-next-btn');
  nextBtn.click();

  const wizardToasts = toastMessages.filter(t => t.msg.includes("الخطوة"));
  assert(wizardToasts.length === 0, "shipment-wizard.html DOES NOT trigger generic 4-step wizard toasts ('الخطوة X من 4')");
}

// Test 1.3: Custom wizard element with data-custom-wizard on non-wizard page
{
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
    <body>
      <form data-custom-wizard="true">
        <button id="custom-next-btn">التالي</button>
      </form>
    </body>
    </html>
  `, { url: "http://localhost/pages/other-page.html", runScripts: "dangerously" });

  const { window } = dom;
  let toastMessages = [];
  window.showToast = (msg, type) => { toastMessages.push({ msg, type }); };

  window.eval(interactionsJsCode);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

  const nextBtn = window.document.getElementById('custom-next-btn');
  nextBtn.click();

  const wizardToasts = toastMessages.filter(t => t.msg.includes("الخطوة"));
  assert(wizardToasts.length === 0, "Custom wizard container [data-custom-wizard] ignores generic wizard toasts");
}


// -------------------------------------------------------------
// TASK 2: Verify main_prototype/pages/add-transaction.html
// -------------------------------------------------------------
console.log("\n--- Testing Task 2: add-transaction.html Live Balance Preview ---");

const addTxHtml = fs.readFileSync(path.join(__dirname, '../../main_prototype/pages/add-transaction.html'), 'utf8');

{
  const dom = new JSDOM(addTxHtml, { url: "http://localhost/pages/add-transaction.html", runScripts: "dangerously", resources: "usable" });
  const { window } = dom;
  const { document } = window;

  document.dispatchEvent(new window.Event('DOMContentLoaded'));

  const txTypeSelect = document.getElementById('tx-type');
  const partyTypeSelect = document.getElementById('party-type');
  const partyNameSelect = document.getElementById('party-name');
  const currentBalInput = document.getElementById('current-balance');
  const txAmountInput = document.getElementById('tx-amount');

  const previewCurrentBal = document.getElementById('preview-current-balance');
  const previewOperatorIcon = document.getElementById('preview-operator-icon');
  const previewTxAmount = document.getElementById('preview-tx-amount');
  const previewNewBal = document.getElementById('preview-new-balance');

  // Test 2.1: Default initial state (Supplier: khair, Payment, Bal: 300,000, Amount: 100,000)
  assert(previewCurrentBal.textContent.trim().includes('300,000.00'), "Default current balance preview is 300,000.00");
  assert(previewOperatorIcon.textContent.trim() === 'remove', "Default payment operator icon is 'remove' (-)");
  assert(previewTxAmount.textContent.trim().includes('100,000.00'), "Default transaction amount preview is 100,000.00");
  assert(previewNewBal.textContent.trim().includes('200,000.00'), "Default new balance is 200,000.00 (300,000 - 100,000)");

  // Test 2.2: Change tx-type to 'collection' (تحصيل)
  txTypeSelect.value = 'collection';
  txTypeSelect.dispatchEvent(new window.Event('change'));

  assert(previewOperatorIcon.textContent.trim() === 'add', "Collection tx type updates operator icon to 'add' (+)");
  assert(previewNewBal.textContent.trim().includes('400,000.00'), "Collection updates new balance to 400,000.00 (300,000 + 100,000)");

  // Test 2.3: Change party-type to 'customer'
  partyTypeSelect.value = 'customer';
  partyTypeSelect.dispatchEvent(new window.Event('change'));

  assert(partyNameSelect.options[0].value === 'sama', "Changing party type to customer loads customer options ('sama' first)");
  assert(currentBalInput.value === '450000', "Selecting customer 'sama' updates current balance input to 450,000");
  assert(previewNewBal.textContent.trim().includes('550,000.00'), "Live preview calculates 450,000 + 100,000 = 550,000.00");

  // Test 2.4: Change party-name to 'khalij'
  partyNameSelect.value = 'khalij';
  partyNameSelect.dispatchEvent(new window.Event('change'));

  assert(currentBalInput.value === '280000', "Selecting customer 'khalij' updates current balance input to 280,000");
  assert(previewNewBal.textContent.trim().includes('380,000.00'), "Live preview calculates 280,000 + 100,000 = 380,000.00");

  // Test 2.5: Change tx-amount to 50000 and tx-type to 'payment'
  txTypeSelect.value = 'payment';
  txTypeSelect.dispatchEvent(new window.Event('change'));
  txAmountInput.value = '50000';
  txAmountInput.dispatchEvent(new window.Event('input'));

  assert(previewOperatorIcon.textContent.trim() === 'remove', "Payment operator icon is 'remove'");
  assert(previewNewBal.textContent.trim().includes('230,000.00'), "Live preview calculates 280,000 - 50,000 = 230,000.00");

  // Test 2.6: Manual edits to current balance input
  currentBalInput.value = '1000000';
  currentBalInput.dispatchEvent(new window.Event('input'));

  assert(previewNewBal.textContent.trim().includes('950,000.00'), "Live preview updates on manual current balance edit: 1,000,000 - 50,000 = 950,000.00");
}


// -------------------------------------------------------------
// TASK 3: Verify main_prototype/pages/raw-arrival-add.html
// -------------------------------------------------------------
console.log("\n--- Testing Task 3: raw-arrival-add.html Live Summary & Lot Preview ---");

const rawArrivalHtml = fs.readFileSync(path.join(__dirname, '../../main_prototype/pages/raw-arrival-add.html'), 'utf8');

{
  const dom = new JSDOM(rawArrivalHtml, { url: "http://localhost/pages/raw-arrival-add.html", runScripts: "dangerously", resources: "usable" });
  const { window } = dom;
  const { document } = window;

  document.dispatchEvent(new window.Event('DOMContentLoaded'));

  const rawDate = document.getElementById('raw-date');
  const rawQty = document.getElementById('raw-qty');
  const rawUnit = document.getElementById('raw-unit');
  const rawUnitPrice = document.getElementById('raw-unit-price');
  const rawTransportFee = document.getElementById('raw-transport-fee');

  const summaryTotalQty = document.getElementById('summary-total-qty');
  const summaryRawPrice = document.getElementById('summary-raw-price');
  const summaryTransportFee = document.getElementById('summary-transport-fee');
  const summaryTotalAmount = document.getElementById('summary-total-amount');
  const summaryLotPreview = document.getElementById('summary-lot-preview');

  // Test 3.1: Initial values (Qty: 5000 kg, Unit price: 15.50, Transport: 2500, Date: 2023-10-27)
  assert(summaryTotalQty.textContent.trim() === '5,000 كجم', "Initial total quantity display is '5,000 كجم'");
  assert(summaryRawPrice.textContent.trim() === '77,500.00 ج.م', "Initial raw price is 5000 * 15.50 = 77,500.00 ج.م");
  assert(summaryTransportFee.textContent.trim() === '2,500.00 ج.م', "Initial transport fee is 2,500.00 ج.م");
  assert(summaryTotalAmount.textContent.trim() === '80,000.00', "Initial total purchase amount is 77,500 + 2,500 = 80,000.00");
  assert(summaryLotPreview.textContent.trim() === 'LOT-RAW-231027-001', "Initial lot preview badge is 'LOT-RAW-231027-001'");

  // Test 3.2: Update Qty to 10000, Unit price to 20.00, Transport fee to 3000
  rawQty.value = '10000';
  rawQty.dispatchEvent(new window.Event('input'));
  rawUnitPrice.value = '20.00';
  rawUnitPrice.dispatchEvent(new window.Event('input'));
  rawTransportFee.value = '3000';
  rawTransportFee.dispatchEvent(new window.Event('input'));

  assert(summaryTotalQty.textContent.trim() === '10,000 كجم', "Updated total quantity is '10,000 كجم'");
  assert(summaryRawPrice.textContent.trim() === '200,000.00 ج.م', "Updated raw price is 10000 * 20.00 = 200,000.00 ج.م");
  assert(summaryTransportFee.textContent.trim() === '3,000.00 ج.م', "Updated transport fee is 3,000.00 ج.م");
  assert(summaryTotalAmount.textContent.trim() === '203,000.00', "Updated total purchase amount is 200,000 + 3,000 = 203,000.00");

  // Test 3.3: Change Unit to 'طن' (tons) with Qty 10
  rawQty.value = '10';
  rawQty.dispatchEvent(new window.Event('input'));
  rawUnit.value = 'طن';
  rawUnit.dispatchEvent(new window.Event('change'));

  assert(summaryTotalQty.textContent.trim() === '10,000 كجم', "10 tons correctly converts to 10,000 كجم in total quantity");
  assert(summaryRawPrice.textContent.trim() === '200,000.00 ج.م', "10,000 kg * 20.00 = 200,000.00 ج.م");
  assert(summaryTotalAmount.textContent.trim() === '203,000.00', "Total amount stays 203,000.00");

  // Test 3.4: Change Date to '2026-08-11'
  rawDate.value = '2026-08-11';
  rawDate.dispatchEvent(new window.Event('change'));

  assert(summaryLotPreview.textContent.trim() === 'LOT-RAW-260811-001', "Lot preview badge updates to LOT-RAW-260811-001 for date 2026-08-11");
}


// -------------------------------------------------------------
// TASK 4: Verify main_prototype/pages/shipment-wizard.html
// -------------------------------------------------------------
console.log("\n--- Testing Task 4: shipment-wizard.html Formulas & Calculations ---");

const shipmentWizardHtml = fs.readFileSync(path.join(__dirname, '../../main_prototype/pages/shipment-wizard.html'), 'utf8');

{
  const dom = new JSDOM(shipmentWizardHtml, { url: "http://localhost/pages/shipment-wizard.html", runScripts: "dangerously", resources: "usable" });
  const { window } = dom;
  const { document } = window;

  document.dispatchEvent(new window.Event('DOMContentLoaded'));

  // Test 4.1: Code inspection for Raw Material Cost formula and Packaging Waste % formula
  const rawCostFormulaMatch = shipmentWizardHtml.includes('const rawTotalCost = netKg * rawUnitCost;');
  assert(rawCostFormulaMatch, "Raw Material Cost formula in script is strictly 'const rawTotalCost = netKg * rawUnitCost;'");

  const cartonWastePctFormulaMatch = shipmentWizardHtml.includes('const cartonWastePct = cartonsNeeded > 0 ? (cartonWasteQty / cartonsNeeded) * 100 : 0;');
  assert(cartonWastePctFormulaMatch, "Packaging Waste % formula in script is strictly '(cartonWasteQty / cartonsNeeded) * 100'");

  // Test 4.2: Dynamic runtime test of calculateAll()
  // Set test inputs:
  const withdrawnKg = document.getElementById('withdrawn-kg');
  const netKg = document.getElementById('net-kg');
  const rawCostKg = document.getElementById('raw-cost-kg');
  const cartonCapacity = document.getElementById('carton-capacity');
  const cartonUnitPrice = document.getElementById('carton-unit-price');
  const cartonWasteQty = document.getElementById('carton-waste-qty');

  withdrawnKg.value = '11000';
  netKg.value = '10000';
  rawCostKg.value = '35';
  cartonCapacity.value = '10';
  cartonUnitPrice.value = '15';
  cartonWasteQty.value = '50';

  // Trigger calculation
  window.calculateAll();

  // Expectations:
  // rawTotalCost = 10,000 netKg * 35 EGP = 350,000 EGP
  // cartonsNeeded = 10,000 / 10 = 1,000
  // cartonsTotalConsumed = 1,000 + 50 = 1,050
  // cartonWastePct = (50 / 1,000) * 100 = 5.0%
  // cartonTotalCost = 1,050 * 15 = 15,750 EGP

  const step4WastePct = document.getElementById('step4-carton-waste-pct').textContent.trim();
  assert(step4WastePct === '5.0%', `Step 4 Carton Waste % calculated dynamically as 5.0% (actual: ${step4WastePct})`);

  const breakdownRawVal = document.getElementById('breakdown-raw-val').textContent.trim();
  assert(breakdownRawVal.includes('350,000'), `Raw Material Total Cost calculated using netKg (10,000 * 35 = 350,000 j.m, actual: ${breakdownRawVal})`);

  const breakdownRawDesc = document.getElementById('breakdown-raw-desc').textContent.trim();
  assert(breakdownRawDesc.includes('10,000'), `Raw Material Cost description displays netKg 10,000 (actual: ${breakdownRawDesc})`);
}

console.log(`\n=== VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED ===`);
process.exit(failedCount > 0 ? 1 : 0);
