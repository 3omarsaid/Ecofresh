import fs from 'fs';
import path from 'path';

function processDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const fullPath = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      processDir(fullPath);
    } else if (ent.name === 'page.tsx') {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('force-dynamic')) {
        fs.writeFileSync(fullPath, `export const dynamic = "force-dynamic";\n${content}`);
        console.log('Added force-dynamic to:', fullPath);
      }
    }
  }
}

const targetDir = path.join(process.cwd(), 'app', '(dashboard)');
processDir(targetDir);
console.log('Completed adding force-dynamic to dashboard pages.');
