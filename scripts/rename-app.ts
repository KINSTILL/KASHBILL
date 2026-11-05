import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'migrations', // prisma/migrations
]);

const IGNORED_FILES = new Set([
  '.env.production',
  '.env.local',
  'rename-app.ts',
]);

const ALLOWED_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.css',
  '.yml',
  '.yaml',
  '.prisma',
  '.example',
]);

function walk(dir: string, fileList: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else {
      if (IGNORED_FILES.has(entry)) continue;
      const dotIndex = entry.lastIndexOf('.');
      const ext = dotIndex !== -1 ? entry.slice(dotIndex) : '';
      if (ALLOWED_EXTS.has(ext) || entry === 'Caddyfile' || entry === '.gitignore') {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function processFile(path: string): boolean {
  const content = readFileSync(path, 'utf8');

  let updated = content;

  // 1. URLs & Domains
  updated = updated.replace(/https?:\/\/cashbill\.cm/g, 'https://mycashbill.app');
  updated = updated.replace(/cashbill\.cm/g, 'mycashbill.app');
  updated = updated.replace(/https?:\/\/cashbill\.app/g, 'https://mycashbill.app');

  // 2. Cookie session
  updated = updated.replace(/cashbill_session/g, 'mycashbill_session');

  // 3. Document prefixes & constants
  updated = updated.replace(/DOCUMENT_NUMBER_PREFIX = 'CB'/g, "DOCUMENT_NUMBER_PREFIX = 'MCB'");
  updated = updated.replace(/DOCUMENT_NUMBER_PREFIX = "CB"/g, 'DOCUMENT_NUMBER_PREFIX = "MCB"');
  updated = updated.replace(/(?<!M)CB-(\d{4})/g, 'MCB-$1');
  updated = updated.replace(/(?<!M)CB-\$\{/g, 'MCB-${');
  updated = updated.replace(/\^CB-\\d/g, '^MCB-\\d');
  updated = updated.replace(/CB-2026/g, 'MCB-2026');

  // 4. Exact words with negative lookbehinds
  updated = updated.replace(/(?<!My)CashBill/g, 'MyCashBill');
  updated = updated.replace(/(?<!MY)CASHBILL/g, 'MYCASHBILL');
  updated = updated.replace(/(?<!my)cashbill/g, 'mycashbill');

  if (updated !== content) {
    writeFileSync(path, updated, 'utf8');
    return true;
  }
  return false;
}

function main() {
  const files = walk(process.cwd());
  const modified: string[] = [];

  for (const file of files) {
    if (processFile(file)) {
      modified.push(file);
    }
  }

  console.log(`✅ ${modified.length} fichier(s) modifié(s) :`);
  for (const f of modified) {
    console.log(`  ✏️  ${f.replace(process.cwd(), '')}`);
  }
}

main();
