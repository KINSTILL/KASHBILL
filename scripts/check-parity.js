const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const fr = JSON.parse(readFileSync(join(__dirname, '../messages/fr.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(__dirname, '../messages/en.json'), 'utf8'));

function flat(o, p = '') {
  let out = [];
  for (const k in o) {
    const v = o[k];
    const np = p ? p + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out = out.concat(flat(v, np));
    } else {
      out.push(np);
    }
  }
  return out;
}

const frK = new Set(flat(fr));
const enK = new Set(flat(en));

const missing = [...frK].filter((k) => !enK.has(k));
const extra = [...enK].filter((k) => !frK.has(k));

if (missing.length) console.log('❌ Manquantes dans en.json:', missing);
if (extra.length) console.log('❌ En trop dans en.json:', extra);
if (!missing.length && !extra.length) {
  console.log('✅ Parité FR/EN OK (' + frK.size + ' clés)');
}

process.exit(missing.length || extra.length ? 1 : 0);
