const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function verify() {
  const targetPath = process.argv[2] || '/stations';
  console.log(`Fetching http://localhost:3000${targetPath} ...`);
  const page = await fetchUrl(`http://localhost:3000${targetPath}`);
  console.log(`Page status: ${page.statusCode}`);

  // Find all _next/static script and link tags
  const assetRegex = /(?:href|src)="(\/_next\/static\/[^"]+)"/g;
  let match;
  const assets = new Set();
  while ((match = assetRegex.exec(page.data)) !== null) {
    assets.add(match[1]);
  }

  console.log(`Found ${assets.size} static assets referenced in page HTML.`);
  let allOk = true;

  for (const assetPath of assets) {
    const assetUrl = `http://localhost:3000${assetPath}`;
    const res = await fetchUrl(assetUrl);
    if (res.statusCode === 200) {
      console.log(`  ✅ 200 OK: ${assetPath}`);
    } else {
      console.error(`  ❌ ${res.statusCode} FAIL: ${assetPath}`);
      allOk = false;
    }
  }

  if (allOk) {
    console.log('\n🎉 ALL CSS AND JS ASSETS LOADED SUCCESSFULLY WITH 200 OK!');
    process.exit(0);
  } else {
    console.error('\n⚠️ SOME ASSETS RETURNED NON-200 CODES');
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
