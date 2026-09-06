const http = require('http');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT_DIR = path.resolve(__dirname, '../../');
const PORT = 8999;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  if (reqPath === '/main_prototype/pages/generic-wizard-test.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8"/>
        <script src="../js/interactions.js" defer></script>
      </head>
      <body>
        <form>
          <button id="test-next-btn" type="button">التالي</button>
        </form>
      </body>
      </html>
    `);
    return;
  }

  let filePath = path.join(ROOT_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain; charset=utf-8' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}`);

  try {
    await runEmpiricalTests();
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    server.close();
  }
});

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

async function loadJSDOM(urlPath) {
  const dom = await JSDOM.fromURL(`http://localhost:${PORT}${urlPath}`, {
    runScripts: "dangerously",
    resources: "usable",
    beforeParse(window) {
      window.tailwind = { config: {} };
      if (!window.HTMLElement.prototype.innerText) {
        Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
          get() { return this.textContent; },
          set(v) { this.textContent = v; },
          configurable: true
        });
      }
    }
  });

  await new Promise(resolve => {
    if (dom.window.document.readyState === 'complete') {
      setTimeout(resolve, 100);
    } else {
      dom.window.addEventListener('load', () => setTimeout(resolve, 100));
    }
  });
  return dom;
}

async function runEmpiricalTests() {
  console.log("\n=== STARTING EMPIRICAL VERIFICATION TESTS ===");

  // -------------------------------------------------------------
  // TASK 1: Verify main_prototype/js/interactions.js
  // -------------------------------------------------------------
  console.log("\n--- Testing Task 1: interactions.js Toast & Wizard Exclusion ---");

  // Test 1.1: Standard generic page with 4-step wizard form and "التالي" button
  {
    const dom = await loadJSDOM('/main_prototype/pages/generic-wizard-test.html');
    const { window } = dom;
    let toastMessages = [];
    const origShowToast = window.showToast;
    window.showToast = (msg, type) => {
      toastMessages.push({ msg, type });
      if (origShowToast) origShowToast(msg, type);
    };

    const nextBtn = window.document.getElementById('test-next-btn');
    nextBtn.click();

    const wizardToasts = toastMessages.filter(t => t.msg.includes("الخطوة"));
    assert(wizardToasts.length > 0, `Generic wizard page triggers step toast on 'التالي' button click (toast: ${toastMessages[0]?.msg})`);
    assert(wizardToasts.some(t => t.msg.includes("الخطوة 2 من 4")), `Toast message contains step transition text 'الخطوة 2 من 4' (toast: ${toastMessages[0]?.msg})`);
  }

  // Test 1.2: shipment-wizard.html page MUST NOT trigger generic 4-step wizard toasts
  {
    const dom = await loadJSDOM('/main_prototype/pages/shipment-wizard.html');
    const { window } = dom;
    let toastMessages = [];
    const origShowToast = window.showToast;
    window.showToast = (msg, type) => {
      toastMessages.push({ msg, type });
      if (origShowToast) origShowToast(msg, type);
    };

    const buttons = Array.from(window.document.querySelectorAll('button'));
    const nextBtns = buttons.filter(b => b.textContent.includes('التالي'));
    
    assert(nextBtns.length > 0, "Found 'التالي' buttons on shipment-wizard.html");

    nextBtns.forEach(btn => btn.click());

    const genericWizardToasts = toastMessages.filter(t => t.msg.includes("من 4"));
    assert(genericWizardToasts.length === 0, "shipment-wizard.html DOES NOT trigger generic 4-step wizard toasts ('الخطوة X من 4')");
  }


  // -------------------------------------------------------------
  // TASK 2: Verify main_prototype/pages/add-transaction.html
  // -------------------------------------------------------------
  console.log("\n--- Testing Task 2: add-transaction.html Live Balance Preview ---");
  {
    const dom = await loadJSDOM('/main_prototype/pages/add-transaction.html');
    const { window } = dom;
    const { document } = window;

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
    assert(previewCurrentBal.textContent.trim().includes('300,000.00'), `Default current balance preview is 300,000.00 (actual: ${previewCurrentBal.textContent.trim()})`);
    assert(previewOperatorIcon.textContent.trim() === 'remove', `Default payment operator icon is 'remove' (-) (actual: ${previewOperatorIcon.textContent.trim()})`);
    assert(previewTxAmount.textContent.trim().includes('100,000.00'), `Default transaction amount preview is 100,000.00 (actual: ${previewTxAmount.textContent.trim()})`);
    assert(previewNewBal.textContent.trim().includes('200,000.00'), `Default new balance is 200,000.00 (300,000 - 100,000) (actual: ${previewNewBal.textContent.trim()})`);

    // Test 2.2: Change tx-type to 'collection' (تحصيل)
    txTypeSelect.value = 'collection';
    txTypeSelect.dispatchEvent(new window.Event('change'));

    assert(previewOperatorIcon.textContent.trim() === 'add', `Collection tx type updates operator icon to 'add' (+) (actual: ${previewOperatorIcon.textContent.trim()})`);
    assert(previewNewBal.textContent.trim().includes('400,000.00'), `Collection updates new balance to 400,000.00 (300,000 + 100,000) (actual: ${previewNewBal.textContent.trim()})`);

    // Test 2.3: Change party-type to 'customer'
    partyTypeSelect.value = 'customer';
    partyTypeSelect.dispatchEvent(new window.Event('change'));

    assert(partyNameSelect.options[0].value === 'sama', `Changing party type to customer loads customer options ('sama' first, actual: ${partyNameSelect.options[0]?.value})`);
    assert(currentBalInput.value === '450000', `Selecting customer 'sama' updates current balance input to 450,000 (actual: ${currentBalInput.value})`);
    assert(previewNewBal.textContent.trim().includes('550,000.00'), `Live preview calculates 450,000 + 100,000 = 550,000.00 (actual: ${previewNewBal.textContent.trim()})`);

    // Test 2.4: Change party-name to 'khalij'
    partyNameSelect.value = 'khalij';
    partyNameSelect.dispatchEvent(new window.Event('change'));

    assert(currentBalInput.value === '280000', `Selecting customer 'khalij' updates current balance input to 280,000 (actual: ${currentBalInput.value})`);
    assert(previewNewBal.textContent.trim().includes('380,000.00'), `Live preview calculates 280,000 + 100,000 = 380,000.00 (actual: ${previewNewBal.textContent.trim()})`);

    // Test 2.5: Change tx-amount to 50000 and tx-type to 'payment'
    txTypeSelect.value = 'payment';
    txTypeSelect.dispatchEvent(new window.Event('change'));
    txAmountInput.value = '50000';
    txAmountInput.dispatchEvent(new window.Event('input'));

    assert(previewOperatorIcon.textContent.trim() === 'remove', `Payment operator icon is 'remove' (actual: ${previewOperatorIcon.textContent.trim()})`);
    assert(previewNewBal.textContent.trim().includes('230,000.00'), `Live preview calculates 280,000 - 50,000 = 230,000.00 (actual: ${previewNewBal.textContent.trim()})`);

    // Test 2.6: Manual edits to current balance input
    currentBalInput.value = '1000000';
    currentBalInput.dispatchEvent(new window.Event('input'));

    assert(previewNewBal.textContent.trim().includes('950,000.00'), `Live preview updates on manual current balance edit: 1,000,000 - 50,000 = 950,000.00 (actual: ${previewNewBal.textContent.trim()})`);
  }


  // -------------------------------------------------------------
  // TASK 3: Verify main_prototype/pages/raw-arrival-add.html
  // -------------------------------------------------------------
  console.log("\n--- Testing Task 3: raw-arrival-add.html Live Summary & Lot Preview ---");
  {
    const dom = await loadJSDOM('/main_prototype/pages/raw-arrival-add.html');
    const { window } = dom;
    const { document } = window;

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
    assert(summaryTotalQty.textContent.trim() === '5,000 كجم', `Initial total quantity display is '5,000 كجم' (actual: ${summaryTotalQty.textContent.trim()})`);
    assert(summaryRawPrice.textContent.trim() === '77,500.00 ج.م', `Initial raw price is 5000 * 15.50 = 77,500.00 ج.م (actual: ${summaryRawPrice.textContent.trim()})`);
    assert(summaryTransportFee.textContent.trim() === '2,500.00 ج.م', `Initial transport fee is 2,500.00 ج.م (actual: ${summaryTransportFee.textContent.trim()})`);
    assert(summaryTotalAmount.textContent.trim() === '80,000.00', `Initial total purchase amount is 77,500 + 2,500 = 80,000.00 (actual: ${summaryTotalAmount.textContent.trim()})`);
    assert(summaryLotPreview.textContent.trim() === 'LOT-RAW-231027-001', `Initial lot preview badge is 'LOT-RAW-231027-001' (actual: ${summaryLotPreview.textContent.trim()})`);

    // Test 3.2: Update Qty to 10000, Unit price to 20.00, Transport fee to 3000
    rawQty.value = '10000';
    rawQty.dispatchEvent(new window.Event('input'));
    rawUnitPrice.value = '20.00';
    rawUnitPrice.dispatchEvent(new window.Event('input'));
    rawTransportFee.value = '3000';
    rawTransportFee.dispatchEvent(new window.Event('input'));

    assert(summaryTotalQty.textContent.trim() === '10,000 كجم', `Updated total quantity is '10,000 كجم' (actual: ${summaryTotalQty.textContent.trim()})`);
    assert(summaryRawPrice.textContent.trim() === '200,000.00 ج.م', `Updated raw price is 10000 * 20.00 = 200,000.00 ج.م (actual: ${summaryRawPrice.textContent.trim()})`);
    assert(summaryTransportFee.textContent.trim() === '3,000.00 ج.م', `Updated transport fee is 3,000.00 ج.م (actual: ${summaryTransportFee.textContent.trim()})`);
    assert(summaryTotalAmount.textContent.trim() === '203,000.00', `Updated total purchase amount is 200,000 + 3,000 = 203,000.00 (actual: ${summaryTotalAmount.textContent.trim()})`);

    // Test 3.3: Change Unit to 'طن' (tons) with Qty 10
    rawQty.value = '10';
    rawQty.dispatchEvent(new window.Event('input'));
    rawUnit.value = 'طن';
    rawUnit.dispatchEvent(new window.Event('change'));

    assert(summaryTotalQty.textContent.trim() === '10,000 كجم', `10 tons correctly converts to 10,000 كجم in total quantity (actual: ${summaryTotalQty.textContent.trim()})`);
    assert(summaryRawPrice.textContent.trim() === '200,000.00 ج.م', `10,000 kg * 20.00 = 200,000.00 ج.م (actual: ${summaryRawPrice.textContent.trim()})`);
    assert(summaryTotalAmount.textContent.trim() === '203,000.00', `Total amount stays 203,000.00 (actual: ${summaryTotalAmount.textContent.trim()})`);

    // Test 3.4: Change Date to '2026-08-11'
    rawDate.value = '2026-08-11';
    rawDate.dispatchEvent(new window.Event('change'));

    assert(summaryLotPreview.textContent.trim() === 'LOT-RAW-260811-001', `Lot preview badge updates to LOT-RAW-260811-001 for date 2026-08-11 (actual: ${summaryLotPreview.textContent.trim()})`);
  }


  // -------------------------------------------------------------
  // TASK 4: Verify main_prototype/pages/shipment-wizard.html
  // -------------------------------------------------------------
  console.log("\n--- Testing Task 4: shipment-wizard.html Formulas & Calculations ---");
  {
    const dom = await loadJSDOM('/main_prototype/pages/shipment-wizard.html');
    const { window } = dom;
    const { document } = window;

    // Test 4.1: Code inspection for Raw Material Cost formula and Packaging Waste % formula
    const shipmentWizardHtml = fs.readFileSync(path.join(ROOT_DIR, 'main_prototype/pages/shipment-wizard.html'), 'utf8');

    const rawCostFormulaMatch = shipmentWizardHtml.includes('const rawTotalCost = netKg * rawUnitCost;');
    assert(rawCostFormulaMatch, "Raw Material Cost formula in script is strictly 'const rawTotalCost = netKg * rawUnitCost;'");

    const cartonWastePctFormulaMatch = shipmentWizardHtml.includes('const cartonWastePct = cartonsNeeded > 0 ? (cartonWasteQty / cartonsNeeded) * 100 : 0;');
    assert(cartonWastePctFormulaMatch, "Packaging Waste % formula in script is strictly '(cartonWasteQty / cartonsNeeded) * 100'");

    // Test 4.2: Dynamic runtime test of calculateAll()
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

    // Call calculateAll in window context
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
}
