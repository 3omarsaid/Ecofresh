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

console.log('=== DETAILED M1 SCREEN INSPECTION ===');
m1Files.forEach((file, index) => {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`[Screen ${index + 1}] MISSING FILE: ${file}`);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const sizeKb = (content.length / 1024).toFixed(1);
  const titleMatch = content.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'No Title';
  const hasScriptTags = (content.match(/<script[\s\S]*?<\/script>/gi) || []).length;
  const hasExternalJs = content.includes('src="../js/') || content.includes('src="js/');
  
  console.log(`[Screen ${(index+1).toString().padStart(2, '0')}] ${file} | ${sizeKb} KB | Title: "${title}" | External JS: ${hasExternalJs} | Inline Scripts: ${hasScriptTags}`);
});
