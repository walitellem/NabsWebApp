const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // We want to remove `key="ap-[a-zA-Z0-9\-]+"` from tags that have TWO keys.
  content = content.replace(/<[A-Za-z0-9_\.]+(?:[^>]*?)>/gs, (match) => {
    let keyCount = (match.match(/key=/g) || []).length;
    if (keyCount > 1) {
      return match.replace(/\s*key="ap-[^"]+"/, '');
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed duplicate keys in ' + file);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) processFile(p);
  });
}

walk('src');
