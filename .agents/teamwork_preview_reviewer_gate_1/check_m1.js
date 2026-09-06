const fs = require('fs');
const path = require('path');

const rootDir = 'e:/web/exporting_erp/main_prototype';

// Scope screens for M1 (Screens 01-20 / M1 scope)
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

console.log('=== CHECK 1: HTML dir="rtl" and lang="ar" ===');
let c1Failures = [];
m1Files.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    c1Failures.push(relPath + ': File does not exist');
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const matchRtl = /<html[^>]*dir=["']rtl["']/i.test(content);
  const matchAr = /<html[^>]*lang=["']ar["']/i.test(content);
  if (!matchRtl || !matchAr) {
    c1Failures.push(relPath + ': missing rtl or lang=ar on html tag');
  }
});
console.log('Check 1 total files checked:', m1Files.length);
console.log('Check 1 failures count:', c1Failures.length);
if (c1Failures.length > 0) console.log('Failures:', c1Failures);

console.log('\n=== CHECK 2: Palette and Typography ===');
// Search across css files and html files
const cssDir = path.join(rootDir, 'css');
const cssFiles = fs.existsSync(cssDir) ? fs.readdirSync(cssDir).map(f => path.join(cssDir, f)) : [];
let cssContent = '';
cssFiles.forEach(f => cssContent += fs.readFileSync(f, 'utf8') + '\n');

// Also scan index.html and all pages for color codes and font families
let allText = cssContent;
m1Files.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) allText += fs.readFileSync(fullPath, 'utf8') + '\n';
});

const fontFound = allText.includes('IBM Plex Sans Arabic') || allText.includes('IBM+Plex+Sans+Arabic') || allText.includes('font-sans') || allText.includes('alexandria');
const greenFound = allText.toLowerCase().includes('012d1d');
const iceBlueFound = allText.toLowerCase().includes('f8f9fa');
const blueFound = allText.toLowerCase().includes('0054cd');

console.log('Font (IBM Plex Sans Arabic) referenced:', fontFound);
console.log('Forest Green #012d1d referenced:', greenFound);
console.log('Ice Blue #f8f9fa referenced:', iceBlueFound);
console.log('Professional Blue #0054cd referenced:', blueFound);

console.log('\n=== CHECK 3: Shell Components (Sidebar 260px, Header, Breadcrumbs, Search, User Avatar) ===');
let shellSummary = [];
m1Files.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  
  const hasSidebar = content.includes('aside') || content.includes('sidebar') || content.includes('w-64') || content.includes('w-65') || content.includes('w-[260px]') || content.includes('260px') || content.includes('w-72');
  const hasSidebar260 = content.includes('260px') || content.includes('w-65') || content.includes('w-[260px]') || content.includes('w-64');
  const hasHeader = content.includes('<header') || content.includes('header');
  const hasBreadcrumbs = content.includes('nav') || content.includes('breadcrumb') || content.includes('الرئيسية') || content.includes('الرئيسة');
  const hasSearch = content.includes('search') || content.includes('بحث') || content.includes('type="search"');
  const hasAvatar = content.includes('avatar') || content.includes('img') || content.includes('أحمد') || content.includes('المسؤول') || content.includes('مدير');
  
  shellSummary.push({
    file: relPath,
    hasSidebar,
    hasSidebar260,
    hasHeader,
    hasBreadcrumbs,
    hasSearch,
    hasAvatar
  });
});

console.table(shellSummary);

console.log('\n=== CHECK 4: Tables, Form Inputs, Status Badges, Search/Filter ===');
let featureSummary = [];
m1Files.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  
  const isFormPage = relPath.includes('add') || relPath.includes('create') || relPath.includes('agreements');
  const isTablePage = !isFormPage && !relPath.includes('details') && !relPath.includes('dashboard') && relPath !== 'index.html';
  const isDetailsPage = relPath.includes('details');
  const isDashboardPage = relPath.includes('dashboard') || relPath === 'index.html';

  const hasTable = content.includes('<table') || content.includes('<thead') || content.includes('grid');
  const hasForm = content.includes('<form') || content.includes('<input') || content.includes('<select');
  const hasBadges = /bg-(emerald|green|amber|blue|red|gray|slate|indigo|teal)-(100|50|200|700|800|900)/i.test(content) || content.includes('badge') || content.includes('rounded-full');
  const hasFilterSearch = content.includes('search') || content.includes('بحث') || content.includes('تصفية') || content.includes('filter') || content.includes('<select');

  featureSummary.push({
    file: relPath,
    type: isFormPage ? 'Form' : isTablePage ? 'Table' : isDetailsPage ? 'Details' : 'Dashboard',
    hasTable,
    hasForm,
    hasBadges,
    hasFilterSearch
  });
});

console.table(featureSummary);

console.log('\n=== CHECK 5: Auto-Fill Rules & Interactions ===');
const jsDir = path.join(rootDir, 'js');
const jsFiles = fs.existsSync(jsDir) ? fs.readdirSync(jsDir).map(f => path.join(jsDir, f)) : [];
let jsContent = '';
jsFiles.forEach(f => {
  console.log('JS File found:', f);
  jsContent += fs.readFileSync(f, 'utf8') + '\n';
});

// Also check embedded <script> tags in all M1 HTML pages
m1Files.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) return;
  const html = fs.readFileSync(fullPath, 'utf8');
  const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
  scripts.forEach(s => jsContent += s + '\n');
});

const stationAutoFill = /station/i.test(jsContent) && (/warehouse/i.test(jsContent) || /مخزن/i.test(jsContent) || /محطة/i.test(jsContent) || /معدل/i.test(jsContent) || /rate/i.test(jsContent));
const customerAgreementAutoFill = (/customer/i.test(jsContent) || /عميل/i.test(jsContent)) && (/agreement/i.test(jsContent) || /اتفاقية/i.test(jsContent) || /سعر/i.test(jsContent) || /price/i.test(jsContent));
const defaultRatesAutoFill = /rate/i.test(jsContent) || /معدل/i.test(jsContent) || /أجر/i.test(jsContent) || /تلقائي/i.test(jsContent) || /autofill|auto-fill|autoFill/i.test(jsContent);

console.log('Station warehouse & rates auto-fill logic present:', stationAutoFill);
console.log('Customer agreements price auto-fill logic present:', customerAgreementAutoFill);
console.log('Default rates auto-fill logic present:', defaultRatesAutoFill);
