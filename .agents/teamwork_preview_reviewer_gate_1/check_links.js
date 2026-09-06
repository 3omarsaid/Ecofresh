const fs = require('fs');
const path = require('path');

const rootDir = 'e:/web/exporting_erp/main_prototype';

const m1Files = [
  'index.html',
  'pages/dashboard-executive.html',
  'pages/products.html',
  'pages/product-add.html',
  'pages/product-details.html',
  'pages/cartons.html',
  'pages/carton-add.html',
  'pages/customers.html',
  'pages/customer-add.html',
  'pages/customer-details.html',
  'pages/customer-agreements.html',
  'pages/customer-product-add.html',
  'pages/suppliers.html',
  'pages/supplier-add.html',
  'pages/supplier-product-add.html',
  'pages/supplier-details.html',
  'pages/stations.html',
  'pages/station-add.html',
  'pages/station-details.html',
  'pages/contractors.html',
  'pages/contractor-add.html',
  'pages/raw-purchases.html',
  'pages/raw-arrival-add.html'
];

console.log('=== HYPERLINK INTEGRITY & BROKEN LINK CHECK ===');
let brokenLinks = [];
let checkedLinksCount = 0;

m1Files.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  
  const fileDir = path.dirname(filePath);
  const hrefMatches = content.matchAll(/href=["']([^"']+)["']/gi);
  
  for (const match of hrefMatches) {
    const href = match[1];
    if (href.startsWith('#') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('javascript:')) continue;
    
    checkedLinksCount++;
    const targetPath = path.normalize(path.join(fileDir, href));
    if (!fs.existsSync(targetPath)) {
      brokenLinks.push({ source: file, href, targetPath });
    }
  }
});

console.log(`Total local links checked: ${checkedLinksCount}`);
console.log(`Broken links count: ${brokenLinks.length}`);
if (brokenLinks.length > 0) {
  console.log('Broken Links Details:', brokenLinks);
}
