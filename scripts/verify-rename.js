const { readdirSync, statSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const IGNORED_DIRS = new Set(['node_modules', '.next', '.git', 'migrations']);
const IGNORED_FILES = new Set(['rename-app.ts', 'verify-rename.js', 'package-lock.json', 'pnpm-lock.yaml']);

function walk(dir, exts) {
  let results = [];
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results = results.concat(walk(full, exts));
    } else {
      if (IGNORED_FILES.has(entry)) continue;
      const dot = entry.lastIndexOf('.');
      const ext = dot !== -1 ? entry.slice(dot) : '';
      if (exts.includes(ext)) {
        results.push(full);
      }
    }
  }
  return results;
}

// Check 1: (?<!My)CashBill
const files1 = walk('.', ['.ts', '.tsx', '.json', '.md', '.css', '.yml', '.yaml', '.prisma']);
let c1 = 0;
const r1 = /(?<!My)CashBill/g;
for (const f of files1) {
  const txt = readFileSync(f, 'utf8');
  const matches = txt.match(r1);
  if (matches) {
    console.log(`[C1 match] ${f}: ${matches.length}`);
    c1 += matches.length;
  }
}
console.log('Check 1 (CashBill):', c1);

// Check 2: (?<!MY)CASHBILL
const files2 = walk('.', ['.ts', '.tsx', '.json', '.md']);
let c2 = 0;
const r2 = /(?<!MY)CASHBILL/g;
for (const f of files2) {
  const txt = readFileSync(f, 'utf8');
  const matches = txt.match(r2);
  if (matches) {
    console.log(`[C2 match] ${f}: ${matches.length}`);
    c2 += matches.length;
  }
}
console.log('Check 2 (CASHBILL):', c2);

// Check 3: (?<!my)cashbill
const files3 = walk('.', ['.ts', '.tsx', '.json', '.md', '.css']);
let c3 = 0;
const r3 = /(?<!my)cashbill/g;
for (const f of files3) {
  const txt = readFileSync(f, 'utf8');
  const matches = txt.match(r3);
  if (matches) {
    console.log(`[C3 match] ${f}: ${matches.length}`);
    c3 += matches.length;
  }
}
console.log('Check 3 (cashbill):', c3);

// Check 4: CB-\d (not MCB-)
const files4 = walk('.', ['.ts', '.tsx']);
let c4 = 0;
const r4 = /(?<!M)CB-\d/g;
for (const f of files4) {
  const txt = readFileSync(f, 'utf8');
  const matches = txt.match(r4);
  if (matches) {
    console.log(`[C4 match] ${f}: ${matches.length}`);
    c4 += matches.length;
  }
}
console.log('Check 4 (CB-\\d):', c4);

// Check 5: cashbill.cm | cashbill.app (without my)
const files5 = walk('.', ['.ts', '.tsx', '.json']);
let c5 = 0;
const r5 = /(?<!my)cashbill\.(cm|app)/g;
for (const f of files5) {
  const txt = readFileSync(f, 'utf8');
  const matches = txt.match(r5);
  if (matches) {
    console.log(`[C5 match] ${f}: ${matches.length}`);
    c5 += matches.length;
  }
}
console.log('Check 5 (domain):', c5);

// Check 6: standalone cashbill_session (not mycashbill_session)
const files6 = walk('.', ['.ts', '.tsx']);
let c6 = 0;
const r6 = /(?<!my)cashbill_session/g;
for (const f of files6) {
  const txt = readFileSync(f, 'utf8');
  const matches = txt.match(r6);
  if (matches) {
    console.log(`[C6 match] ${f}: ${matches.length}`);
    c6 += matches.length;
  }
}
console.log('Check 6 (session cookie):', c6);

// Section 0.4: Bilingual coverage
console.log('\n--- 0.4 Bilingual checks ---');
const frTxt = readFileSync('messages/fr.json', 'utf8');
const enTxt = readFileSync('messages/en.json', 'utf8');
if (frTxt.includes('"MyCashBill"')) console.log('✅ FR: MyCashBill');
if (enTxt.includes('"MyCashBill"')) console.log('✅ EN: MyCashBill');
if (frTxt.includes('Émis via MyCashBill')) console.log('✅ FR: mention PDF');
if (enTxt.includes('Issued via MyCashBill')) console.log('✅ EN: mention PDF');
if (enTxt.includes('mycashbill.app')) console.log('✅ EN: URL .app');
if (frTxt.includes('mycashbill.app')) console.log('✅ FR: URL .app');
