const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory() && f.name !== 'node_modules' && f.name !== '.next') {
      search(full);
    } else if (f.isFile() && f.name.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf-8');
      if (content.match(/method:\s*['"](POST|PATCH|DELETE)['"]/)) {
        if (!content.includes('X-Requested-With')) {
          console.log('Missing X-Requested-With in:', full);
        }
      }
    }
  }
}

search('app');
search('components');

