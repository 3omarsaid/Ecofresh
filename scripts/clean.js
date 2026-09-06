/**
 * Clean script:
 * Cross-platform directory cleaner removing .next and node_modules/.cache
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const targets = [
  path.join(projectRoot, '.next'),
  path.join(projectRoot, 'node_modules', '.cache')
];

for (const dir of targets) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`[clean] Successfully removed: ${path.relative(projectRoot, dir)}`);
    } catch (err) {
      console.error(`[clean] Error removing ${dir}:`, err.message);
    }
  } else {
    console.log(`[clean] Already clean: ${path.relative(projectRoot, dir)}`);
  }
}
