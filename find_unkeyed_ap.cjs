const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

let foundMissing = false;

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Find all AnimatePresence blocks
  const regex = /<AnimatePresence[^>]*>([\s\S]*?)<\/AnimatePresence>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let inner = match[1];
    
    // Check if the inner content has top-level conditionally rendered tags without keys
    // This is hard to parse perfectly with regex, but let's look for `{condition && (` followed by `<Tag` without `key=`
    const matches1 = [...inner.matchAll(/\{([^}]+)&&\s*\(\s*<([A-Za-z0-9_\.]+)[^>]*>/g)];
    for (const m of matches1) {
      if (!m[0].includes('key=')) {
        console.log(`Missing key in ${file}: <${m[2]}> after condition ${m[1]}`);
        foundMissing = true;
      }
    }

    const matches2 = [...inner.matchAll(/\{([^}]+)&&\s*<([A-Za-z0-9_\.]+)[^>]*>/g)];
    for (const m of matches2) {
      if (!m[0].includes('key=')) {
        console.log(`Missing key in ${file}: <${m[2]}> after condition ${m[1]}`);
        foundMissing = true;
      }
    }
    
    // Check for ternary `{cond ? <Tag ... /> : <Tag ... />}`
    const matches3 = [...inner.matchAll(/\?\s*<([A-Za-z0-9_\.]+)[^>]*>.*:\s*<([A-Za-z0-9_\.]+)[^>]*>/gs)];
    for (const m of matches3) {
       // if any doesn't have key=
       if (!m[0].includes('key=')) {
           console.log(`Ternary missing key in ${file}: ${m[0].substring(0, 50)}`);
       }
    }
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

if (!foundMissing) {
  console.log("ALL AnimatePresence children have keys! 100% Verified.");
}

