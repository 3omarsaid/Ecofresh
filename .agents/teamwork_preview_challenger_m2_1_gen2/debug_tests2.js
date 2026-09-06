const fs = require('fs');
const path = require('path');
const { JSDOM, ResourceLoader } = require('jsdom');

class CustomResourceLoader extends ResourceLoader {
  fetch(url, options) {
    if (url.startsWith('https://cdn.tailwindcss.com') || url.includes('fonts.googleapis.com')) {
      // Mock Tailwind CDN script to prevent ReferenceError: tailwind is not defined
      if (url.includes('tailwind')) {
        return Promise.resolve(Buffer.from('window.tailwind = { config: {} };'));
      }
      return Promise.resolve(Buffer.from(''));
    }
    return super.fetch(url, options);
  }
}

function loadPage(filePath) {
  const absolutePath = path.resolve(filePath);
  const fileUrl = 'file:///' + absolutePath.replace(/\\/g, '/');
  const html = fs.readFileSync(absolutePath, 'utf8');

  const resourceLoader = new CustomResourceLoader();
  const dom = new JSDOM(html, {
    url: fileUrl,
    runScripts: "dangerously",
    resources: resourceLoader
  });
  return dom;
}

console.log("--- Testing Task 1 via JSDOM file loader ---");
{
  const dom = loadPage(path.join(__dirname, '../../main_prototype/pages/add-transaction.html'));
  const { window } = dom;
  let toasts = [];
  window.showToast = (msg, type) => { toasts.push({ msg, type }); };

  // Check if interactions.js loaded
  console.log("Window showToast attached?", typeof window.showToast);
}

console.log("\n--- Testing Task 2 via JSDOM file loader ---");
{
  const dom = loadPage(path.join(__dirname, '../../main_prototype/pages/add-transaction.html'));
  const { window } = dom;
  const { document } = window;

  const txTypeSelect = document.getElementById('tx-type');
  const previewOperatorIcon = document.getElementById('preview-operator-icon');
  const previewNewBal = document.getElementById('preview-new-balance');

  console.log("Initial operator:", previewOperatorIcon?.textContent);
  console.log("Initial new bal:", previewNewBal?.textContent);

  txTypeSelect.value = 'collection';
  txTypeSelect.dispatchEvent(new window.Event('change'));

  console.log("After collection operator:", previewOperatorIcon?.textContent);
  console.log("After collection new bal:", previewNewBal?.textContent);
}

console.log("\n--- Testing Task 3 via JSDOM file loader ---");
{
  const dom = loadPage(path.join(__dirname, '../../main_prototype/pages/raw-arrival-add.html'));
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

console.log("\n--- Testing Task 4 via JSDOM file loader ---");
{
  const dom = loadPage(path.join(__dirname, '../../main_prototype/pages/shipment-wizard.html'));
  const { window } = dom;
  console.log("Task 4 calculateAll defined?", typeof window.calculateAll);
}
