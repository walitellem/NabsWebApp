const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let keys = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      keys = keys.concat(walkDir(fullPath));
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/key\s*=\s*({[^}]+}|"[^"]+"|'[^']+')/g);
      if (matches) {
        matches.forEach(m => {
          if (!m.includes('generateKey') && !m.match(/key\s*=\s*"[^"]+"/)) {
            keys.push({ file: fullPath, match: m });
          }
        });
      }
    }
  });
  return keys;
}

const res = walkDir('./src');
console.log(JSON.stringify(res, null, 2));
