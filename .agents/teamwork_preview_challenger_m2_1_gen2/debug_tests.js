const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Polyfill innerText for JSDOM if needed
function createDOM(html, options = {}) {
  const dom = new JSDOM(html, {
    url: options.url || "http://localhost/",
    runScripts: "dangerously",
    resources: "usable",
    ...options
  });
  const { window } = dom;
  if (!window.HTMLElement.prototype.innerText) {
    Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
      get() { return this.textContent; },
      set(v) { this.textContent = v; },
      configurable: true
    });
  }
  return dom;
}

console.log("--- Debugging Task 1 ---");
{
  const dom = createDOM(`
    <!DOCTYPE html>
    <html>
    <body>
      <form>
        <button id="next-btn">التالي</button>
      </form>
    </body>
    </html>
  `, { url: "http://localhost/pages/add-transaction.html" });
  const { window } = dom;
  let toastMessages = [];
  window.showToast = (msg, type) => { toastMessages.push({ msg, type }); };

  const interactionsJsCode = fs.readFileSync(path.join(__dirname, '../../main_prototype/js/interactions.js'), 'utf8');
  window.eval(interactionsJsCode);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

  const nextBtn = window.document.getElementById('next-btn');
  console.log("Before click, btn textContent:", nextBtn.textContent, "innerText:", nextBtn.innerText);
  nextBtn.click();
  console.log("Toast messages after click:", toastMessages);
}

console.log("\n--- Debugging Task 2 ---");
{
  const addTxHtml = fs.readFileSync(path.join(__dirname, '../../main_prototype/pages/add-transaction.html'), 'utf8');
  const dom = createDOM(addTxHtml, { url: "http://localhost/pages/add-transaction.html" });
  const { window } = dom;
  const { document } = window;

  // Polyfill innerText in case script uses innerText
  const txTypeSelect = document.getElementById('tx-type');
  const previewOperatorIcon = document.getElementById('preview-operator-icon');
  const previewNewBal = document.getElementById('preview-new-balance');

  console.log("Task 2 Initial previewOperatorIcon:", previewOperatorIcon?.textContent);
  console.log("Task 2 Initial previewNewBal:", previewNewBal?.textContent);

  txTypeSelect.value = 'collection';
  txTypeSelect.dispatchEvent(new window.Event('change'));

  console.log("After setting collection previewOperatorIcon:", previewOperatorIcon?.textContent);
  console.log("After setting collection previewNewBal:", previewNewBal?.textContent);
}

console.log("\n--- Debugging Task 3 ---");
{
  const rawArrivalHtml = fs.readFileSync(path.join(__dirname, '../../main_prototype/pages/raw-arrival-add.html'), 'utf8');
  const dom = createDOM(rawArrivalHtml, { url: "http://localhost/pages/raw-arrival-add.html" });
  const { window } = dom;
  const { document } = window;

  const summaryTotalQty = document.getElementById('summary-total-qty');
  const summaryRawPrice = document.getElementById('summary-raw-price');
  const summaryTotalAmount = document.getElementById('summary-total-amount');
  const summaryLotPreview = document.getElementById('summary-lot-preview');

  console.log("Task 3 Initial Qty:", summaryTotalQty?.textContent);
  console.log("Task 3 Initial Raw Price:", summaryRawPrice?.textContent);
  console.log("Task 3 Initial Total Amount:", summaryTotalAmount?.textContent);
  console.log("Task 3 Initial Lot Preview:", summaryLotPreview?.textContent);
}

console.log("\n--- Debugging Task 4 ---");
{
  const shipmentWizardHtml = fs.readFileSync(path.join(__dirname, '../../main_prototype/pages/shipment-wizard.html'), 'utf8');
  const dom = createDOM(shipmentWizardHtml, { url: "http://localhost/pages/shipment-wizard.html" });
  const { window } = dom;
  console.log("Task 4 window.calculateAll defined?", typeof window.calculateAll);
}
