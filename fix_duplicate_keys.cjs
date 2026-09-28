const fs = require('fs');
const path = require('path');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // We are looking for `<tag key="ap-..." ... key={...}` or `<tag ... key={...} ... key="ap-..."`
  // Actually, we can just find all `key="ap-[^"]+"` and check if there's another `key=` before the closing `>`
  
  // Since it's hard to parse HTML with regex, let's just remove ALL `key="ap-..."` from tags that have TWO keys.
  // We can just run a loop over all tags `<...>`
  let newContent = content.replace(/<[A-Za-z0-9_\.]+(?:[^>]*?)>/g, (match) => {
    // How many keys?
    let keyCount = (match.match(/key=/g) || []).length;
    if (keyCount > 1) {
      // Remove the ap- one
      return match.replace(/\s*key="ap-[^"]+"/, '');
    }
    return match;
  });

  // Also some tags might span multiple lines, the regex `/<[A-Za-z0-9_\.]+(?:[^>]*?)>/g` 
  // needs to match across newlines!
  newContent = content.replace(/<[A-Za-z0-9_\.]+[^>]*?>/gs, (match) => {
    let keyCount = (match.match(/key=/g) || []).length;
    if (keyCount > 1) {
      return match.replace(/\s*key="ap-[^"]+"/, '');
    }
    return match;
  });

  if (newContent !== original) {
    fs.writeFileSync(file, newContent, 'utf8');
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

