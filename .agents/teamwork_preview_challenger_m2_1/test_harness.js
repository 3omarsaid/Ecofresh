const fs = require('fs');
const path = require('path');

// Simple DOM Mock Environment for executing inline scripts safely in Node.js
function createDomEnvironment(htmlContent) {
  const elements = {};
  const eventListeners = {};

  function makeMockElement(id) {
    const classSet = new Set();
    return {
      id: id || '',
      value: '',
      textContent: '',
      innerText: '',
      innerHTML: '',
      style: {},
      classList: {
        add: (...cls) => cls.forEach(c => classSet.add(c)),
        remove: (...cls) => cls.forEach(c => classSet.delete(c)),
        contains: (c) => classSet.has(c),
        has: (c) => classSet.has(c)
      },
      options: [],
      selectedIndex: 0,
      listeners: {},
      disabled: false,
      className: '',
      setAttribute: function(k, v) { this[k] = v; },
      getAttribute: function(k) { return this[k]; },
      addEventListener: function(evt, fn) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(fn);
      },
      dispatchEvent: function(evt) {
        if (this.listeners[evt]) {
          this.listeners[evt].forEach(fn => fn({ target: this, preventDefault: () => {} }));
        }
      },
      focus: function() {},
      blur: function() {}
    };
  }

  // Extract element IDs
  const idRegex = /id=["']([^"']+)["']/g;
  let match;
  while ((match = idRegex.exec(htmlContent)) !== null) {
    const id = match[1];
    if (!elements[id]) {
      elements[id] = makeMockElement(id);
    }
  }

  // Ensure step-1 to step-7 exist
  for (let i = 1; i <= 7; i++) {
    if (!elements[`step-${i}`]) elements[`step-${i}`] = makeMockElement(`step-${i}`);
    if (!elements[`ind-${i}`]) elements[`ind-${i}`] = makeMockElement(`ind-${i}`);
    if (!elements[`text-${i}`]) elements[`text-${i}`] = makeMockElement(`text-${i}`);
  }

  // Parse selects & options roughly
  const selectRegex = /<select[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi;
  while ((match = selectRegex.exec(htmlContent)) !== null) {
    const id = match[1];
    const selectHtml = match[2];
    const optionRegex = /<option[^>]*value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi;
    let optMatch;
    const options = [];
    while ((optMatch = optionRegex.exec(selectHtml)) !== null) {
      options.push({
        value: optMatch[1],
        text: optMatch[2].replace(/<[^>]+>/g, '').trim()
      });
    }
    if (elements[id]) {
      elements[id].options = options;
      if (options.length > 0) elements[id].value = options[0].value;
    }
  }

  // Parse initial input values
  const inputRegex = /<input[^>]*id=["']([^"']+)["'][^>]*value=["']([^"']*)["']/gi;
  while ((match = inputRegex.exec(htmlContent)) !== null) {
    const id = match[1];
    const val = match[2];
    if (elements[id]) {
      elements[id].value = val;
    }
  }

  const documentMock = {
    getElementById: (id) => elements[id] || null,
    querySelectorAll: (selector) => {
      if (selector === '.wizard-step') {
        const steps = [];
        for (let i = 1; i <= 7; i++) {
          if (elements[`step-${i}`]) steps.push(elements[`step-${i}`]);
        }
        return steps;
      }
      return [];
    },
    querySelector: (selector) => null,
    createElement: (tag) => makeMockElement(),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    addEventListener: (evt, fn) => {
      if (!eventListeners[evt]) eventListeners[evt] = [];
      eventListeners[evt].push(fn);
    }
  };

  const windowMock = {
    document: documentMock,
    location: { href: '' },
    showToast: (msg, type) => {
      // console.log(`[TOAST (${type})]: ${msg}`);
    }
  };

  return { elements, documentMock, windowMock };
}

console.log("=== EMPIRICAL TEST SUITE: WIZARD & FINANCIAL CALCULATIONS ===");

// -------------------------------------------------------------
// TEST 1: shipment-wizard.html Execution & Math Verification
// -------------------------------------------------------------
console.log("\n--- TEST 1: shipment-wizard.html Calculations ---");
const wizardHtmlPath = path.join(__dirname, '../../main_prototype/pages/shipment-wizard.html');
const wizardHtml = fs.readFileSync(wizardHtmlPath, 'utf8');

const { elements, documentMock, windowMock } = createDomEnvironment(wizardHtml);

// Extract inline script from shipment-wizard.html
const scriptMatch = wizardHtml.match(/<script>([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  console.error("FAIL: Could not find inline script in shipment-wizard.html");
} else {
  const scriptCode = scriptMatch[1];

  // Evaluate script in mock context
  const evalFunc = new Function('document', 'window', 'Math', 'parseFloat', 'parseInt', `
    ${scriptCode}
    return {
      updateUI, nextStep, prevStep, goToStep, calculateAll,
      getCurrentStep: () => currentStep,
      setCurrentStep: (s) => { currentStep = s; }
    };
  `);

  const wizardApi = evalFunc(documentMock, windowMock, Math, parseFloat, parseInt);

  console.log("[1.1] Testing Initial Calculation (Default Values)...");
  wizardApi.calculateAll();

  console.log("  Withdrawn KG:", elements['withdrawn-kg']?.value);
  console.log("  Net Output KG:", elements['net-kg']?.value);
  console.log("  Raw Waste KG (calc):", elements['waste-kg']?.textContent);
  console.log("  Raw Waste % (calc):", elements['waste-percent']?.textContent);
  console.log("  Cartons Needed (calc):", elements['step4-cartons-needed']?.textContent);
  console.log("  Total Cartons Consumed (calc):", elements['step4-total-consumed']?.textContent);
  console.log("  Carton Waste % (calc):", elements['step4-carton-waste-pct']?.textContent);
  console.log("  Carton Total Cost (calc):", elements['step4-total-cost']?.textContent);
  console.log("  Station Total Cost (calc):", elements['step5-station-total']?.textContent);
  console.log("  Contractor Total Cost (calc):", elements['step5-contractor-total']?.textContent);
  console.log("  Ops Total Cost (calc):", elements['step5-ops-total']?.textContent);
  console.log("  Total Shipment Revenue (calc):", elements['step6-revenue']?.textContent);
  console.log("  Total Shipment Cost (calc):", elements['step6-total-cost']?.textContent);
  console.log("  Net Profit (calc):", elements['step6-net-profit']?.textContent);
  console.log("  Profit Margin % (calc):", elements['step6-profit-margin']?.textContent);

  const defaultRev = elements['step6-revenue']?.textContent;
  const defaultCost = elements['step6-total-cost']?.textContent;
  const defaultProfit = elements['step6-net-profit']?.textContent;
  const defaultMargin = elements['step6-profit-margin']?.textContent;

  console.log("\n[1.2] Standard Math Formula Checks:");
  console.log("  Revenue check (277,500 ج.م):", defaultRev === '2,77,500 ج.م' || defaultRev === '277,500 ج.م' ? 'PASS' : `FAIL (${defaultRev})`);
  console.log("  Total Cost check (173,890 ج.م):", defaultCost === '1,73,890 ج.م' || defaultCost === '173,890 ج.م' ? 'PASS' : `FAIL (${defaultCost})`);
  console.log("  Net Profit check (103,610 ج.م):", defaultProfit === '1,03,610 ج.م' || defaultProfit === '103,610 ج.م' ? 'PASS' : `FAIL (${defaultProfit})`);
  console.log("  Margin % check (37.3%):", defaultMargin === '37.3%' ? 'PASS' : `FAIL (${defaultMargin})`);

  console.log("\n[1.3] Testing Formula Nuances / Discrepancies vs Task Specification:");
  console.log("  - Raw Material Cost Formula in Code: withdrawnKg * rawUnitCost (4000 * 35 = 140,000). Task spec mentions: Net Output KG * Supplier Price per KG (3700 * 35 = 129,500).");
  console.log("  - Carton Waste % Formula in Code: (cartonWasteQty / totalConsumed) * 100 (10 / 380 = 2.6%). Task spec mentions: (Wasted Cartons / Required Cartons) * 100 (10 / 370 = 2.7%).");

  console.log("\n[1.4] Testing Step Navigation 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7...");
  console.log("  Initial step:", wizardApi.getCurrentStep());
  for (let s = 1; s < 7; s++) {
    wizardApi.nextStep();
  }
  console.log("  Step after 6 nextStep calls:", wizardApi.getCurrentStep());
  console.log("  Step 7 submit button visible check:", elements['submit-btn']?.classList.contains('flex') ? 'PASS' : 'FAIL');
  console.log("  Step 7 next button hidden check:", elements['next-btn']?.classList.contains('hidden') ? 'PASS' : 'FAIL');

  for (let s = 7; s > 1; s--) {
    wizardApi.prevStep();
  }
  console.log("  Step after 6 prevStep calls:", wizardApi.getCurrentStep());
  console.log("  Step 1 prev button disabled check:", elements['prev-btn']?.disabled ? 'PASS' : 'FAIL');

  console.log("\n[1.5] Testing Edge Cases:");

  // Edge case A: Zero quantities
  console.log("  [Edge A] 0 Quantities (withdrawn=0, net=0)...");
  elements['withdrawn-kg'].value = '0';
  elements['net-kg'].value = '0';
  wizardApi.calculateAll();
  console.log("    Raw Waste KG:", elements['waste-kg']?.textContent);
  console.log("    Raw Waste %:", elements['waste-percent']?.textContent);
  console.log("    Cartons Needed:", elements['step4-cartons-needed']?.textContent);
  console.log("    Carton Waste %:", elements['step4-carton-waste-pct']?.textContent);
  console.log("    Total Revenue:", elements['step6-revenue']?.textContent);
  console.log("    Margin %:", elements['step6-profit-margin']?.textContent);
  console.log("    Cost per KG:", elements['step6-unit-cost']?.textContent);

  // Edge case B: Zero waste (withdrawn = net)
  console.log("  [Edge B] Zero Waste (withdrawn=5000, net=5000, cartonWaste=0)...");
  elements['withdrawn-kg'].value = '5000';
  elements['net-kg'].value = '5000';
  elements['carton-waste-qty'].value = '0';
  wizardApi.calculateAll();
  console.log("    Raw Waste KG:", elements['waste-kg']?.textContent);
  console.log("    Raw Waste %:", elements['waste-percent']?.textContent);
  console.log("    Carton Waste %:", elements['step4-carton-waste-pct']?.textContent);

  // Edge case C: Large Numbers (1,000,000 KG)
  console.log("  [Edge C] Large Numbers (withdrawn=1000000, net=950000, sellingPrice=120)...");
  elements['withdrawn-kg'].value = '1000000';
  elements['net-kg'].value = '950000';
  elements['selling-price'].value = '120';
  wizardApi.calculateAll();
  console.log("    Total Revenue:", elements['step6-revenue']?.textContent);
  console.log("    Total Cost:", elements['step6-total-cost']?.textContent);
  console.log("    Net Profit:", elements['step6-net-profit']?.textContent);
  console.log("    Margin %:", elements['step6-profit-margin']?.textContent);

  // Edge case D: Net > Withdrawn (Negative Waste)
  console.log("  [Edge D] Net > Withdrawn (withdrawn=3000, net=3500)...");
  elements['withdrawn-kg'].value = '3000';
  elements['net-kg'].value = '3500';
  wizardApi.calculateAll();
  console.log("    Waste KG (should be Math.max(0, ...)):", elements['waste-kg']?.textContent);
}

// -------------------------------------------------------------
// TEST 2: interactions.js Conflict Analysis with 7-step wizard
// -------------------------------------------------------------
console.log("\n--- TEST 2: interactions.js Generic Wizard Engine Conflict ---");
const interactionsPath = path.join(__dirname, '../../main_prototype/js/interactions.js');
const interactionsCode = fs.readFileSync(interactionsPath, 'utf8');

const hasHardcoded4Steps = interactionsCode.includes('totalSteps = 4');
const attachesToNextBtn = interactionsCode.includes("btnText.includes('التالي')");
console.log("  interactions.js has totalSteps = 4:", hasHardcoded4Steps);
console.log("  interactions.js attaches global click listener to 'التالي' buttons:", attachesToNextBtn);
if (hasHardcoded4Steps && attachesToNextBtn) {
  console.log("  WARNING / FINDING: interactions.js contains a global 4-step wizard engine that listens to any button with text 'التالي'. On shipment-wizard.html (which has 7 steps), clicking 'التالي' fires interactions.js toast 'الانتقال إلى الخطوة X من 4', creating a visual conflict/mismatch with the 7-step wizard!");
}

// -------------------------------------------------------------
// TEST 3: add-transaction.html Dynamic Calculation Engine Check
// -------------------------------------------------------------
console.log("\n--- TEST 3: add-transaction.html Dynamic Calculation Engine ---");
const addTransPath = path.join(__dirname, '../../main_prototype/pages/add-transaction.html');
const addTransHtml = fs.readFileSync(addTransPath, 'utf8');

const hasTransScript = addTransHtml.includes('<script>') && addTransHtml.match(/<script>([\s\S]*?)<\/script>/g).some(s => !s.includes('cdn.tailwindcss.com') && !s.includes('tailwind.config'));
console.log("  add-transaction.html has custom calculation script tag:", hasTransScript);
console.log("  Live Balance Preview widget elements check:");
console.log("    Hardcoded Current Balance text present:", addTransHtml.includes('300,000.00'));
console.log("    Hardcoded Amount Paid text present:", addTransHtml.includes('100,000.00'));
console.log("    Hardcoded New Balance text present:", addTransHtml.includes('200,000.00'));
if (!hasTransScript) {
  console.log("  FINDING: add-transaction.html lacks a dynamic JavaScript calculation engine. The Live Balance Preview box ('Current Balance - Amount Paid = New Balance') is hardcoded static HTML and does NOT dynamically update when the user changes the Amount input field or Transaction Type!");
}

// -------------------------------------------------------------
// TEST 4: supplies-arrival-add.html Calculation Engine Check
// -------------------------------------------------------------
console.log("\n--- TEST 4: supplies-arrival-add.html Calculations ---");
const suppliesPath = path.join(__dirname, '../../main_prototype/pages/supplies-arrival-add.html');
const suppliesHtml = fs.readFileSync(suppliesPath, 'utf8');

const { elements: sElements, documentMock: sDoc, windowMock: sWin } = createDomEnvironment(suppliesHtml);
const sScriptMatch = suppliesHtml.match(/<script>([\s\S]*?)<\/script>/i);
if (sScriptMatch) {
  const evalSupplies = new Function('document', 'window', 'Math', 'parseFloat', 'parseInt', `
    ${sScriptMatch[1]}
    return { updateWarehouse, updateDefaultPrice, calculateSummary };
  `);
  const sApi = evalSupplies(sDoc, sWin, Math, parseFloat, parseInt);
  console.log("  supplies-arrival-add.html has calculation script: YES");
  
  // Test calculateSummary with values
  sElements['quantity'].value = '500';
  sElements['actual_price'].value = '15.00';
  sElements['transport_cost'].value = '250.00';
  sApi.calculateSummary();
  
  console.log("    500 units @ 15.00 EGP + 250 transport:");
  console.log("    Items Total:", sElements['summary-items-total']?.textContent);
  console.log("    Transport Cost:", sElements['summary-transport']?.textContent);
  console.log("    Grand Total:", sElements['summary-grand-total']?.textContent);
} else {
  console.log("  supplies-arrival-add.html has calculation script: NO");
}

// -------------------------------------------------------------
// TEST 5: raw-arrival-add.html Calculation Engine Check
// -------------------------------------------------------------
console.log("\n--- TEST 5: raw-arrival-add.html Calculations ---");
const rawArrivalPath = path.join(__dirname, '../../main_prototype/pages/raw-arrival-add.html');
const rawArrivalHtml = fs.readFileSync(rawArrivalPath, 'utf8');

const hasRawScript = rawArrivalHtml.includes('<script>') && rawArrivalHtml.match(/<script>([\s\S]*?)<\/script>/g).some(s => !s.includes('cdn.tailwindcss.com') && !s.includes('tailwind.config'));
console.log("  raw-arrival-add.html has custom calculation script tag:", hasRawScript);
if (!hasRawScript) {
  console.log("  FINDING: raw-arrival-add.html contains a 'Live Summary' side card ('-- كجم', '-- ج.م', '0.00'), but lacks inline JavaScript to dynamically update totals as quantity, price, or transport cost inputs change!");
}

console.log("\n=== EMPIRICAL TEST SUITE COMPLETED ===");
