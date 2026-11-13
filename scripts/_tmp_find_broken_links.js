const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const APP = path.join(ROOT, 'app');

// 1. Collecter les routes existantes (pages)
function walk(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name === 'page.tsx' || entry.name === 'route.ts') acc.push(full);
  }
}
const pages = [];
walk(APP, pages);

// Normaliser en patterns de route : /[locale]/(app)/clients/[id] -> /clients/:id
function toRoute(file) {
  let rel = path.relative(APP, file).replace(/\\/g, '/');
  rel = rel.replace(/\/?page\.tsx$/, '').replace(/\/?route\.ts$/, '');
  const segs = rel.split('/').filter(Boolean).filter((s) => !/^\(.*\)$/.test(s)); // enlever groupes (app) etc.
  // enlever [locale] comme segment
  const out = segs.map((s) => (/^\[.*\]$/.test(s) ? ':id' : s));
  if (out[0] === '[locale]') out.shift();
  return '/' + out.join('/');
}
const routes = new Set(pages.map(toRoute));
const routeList = [...routes].sort();

// 2. Trouver tous les href / router.push / window.location vers l'app
const SCAN_DIRS = ['app', 'components'];
const files = [];
function collectJs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (!/node_modules|\.next/.test(full)) collectJs(full); }
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
}
for (const d of SCAN_DIRS) { const p = path.join(ROOT, d); if (fs.existsSync(p)) collectJs(p); }

const hits = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const lines = txt.split(/\r?\n/);
  lines.forEach((line, i) => {
    // href=... / router.push( / window.location.href =
    const patterns = [
      /href=\{?['"`]([^'"`$]+)['"`]/g,
      /router\.push\(\s*[`'"]([^`'"]+)[`'"]/g,
      /window\.location\.href\s*=\s*[`'"]([^`'"]+)[`'"]/g,
    ];
    for (const re of patterns) {
      let m;
      while ((m = re.exec(line)) !== null) {
        let target = m[1];
        // normaliser : enlever /${locale}, /fr, /en
        let norm = target
          .replace(/\$\{locale\}/g, '')
          .replace(/\/\$\{[^}]+\}/g, '/:id')
          .replace(/^\/(fr|en)(?=\/|$)/, '');
        // remplacer templates dynamiques restants
        norm = norm.replace(/\$\{[^}]+\}/g, ':id');
        if (!norm.startsWith('/')) continue;
        if (norm.startsWith('/api')) continue;
        // retirer query
        norm = norm.split('?')[0].split('#')[0];
        hits.push({ file: path.relative(ROOT, f).replace(/\\/g, '/'), line: i + 1, target, norm });
      }
    }
  });
}

// 3. Comparer
function matchesRoute(norm) {
  // normaliser routes existantes : :id
  if (routes.has(norm)) return true;
  if (norm === '' || norm === '/') return routes.has('/');
  const normSegs = norm.split('/').filter(Boolean);
  for (const r of routeList) {
    const rSegs = r.split('/').filter(Boolean);
    if (rSegs.length !== normSegs.length) continue;
    let ok = true;
    for (let i = 0; i < rSegs.length; i++) {
      if (rSegs[i] === ':id') continue;
      if (rSegs[i] !== normSegs[i]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

// Filtrer les routes spéciales gérées par Next (error, not-found, etc.)
const SPECIAL = new Set(['/not-found', '/error', '/loading', '/global-error']);
const broken = hits.filter((h) => !matchesRoute(h.norm) && !SPECIAL.has(h.norm));

console.log('=== Routes existantes (pages) ===');
console.log(routeList.join('\n'));
console.log('\n=== Liens internes potentiellement CASSÉS ===');
if (broken.length === 0) console.log('(aucun)');
for (const b of broken) {
  console.log(`${b.file}:${b.line}  ->  ${b.target}   (normalisé: ${b.norm})`);
}
