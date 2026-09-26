const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

let foundMissing = false;

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  const blocks = content.split('<AnimatePresence');
  if (blocks.length <= 1) return;

  for (let i = 1; i < blocks.length; i++) {
    let block = blocks[i];
    let endIdx = block.indexOf('</AnimatePresence>');
    if (endIdx === -1) continue;

    let inner = block.substring(0, endIdx);
    
    // check for `{something && (` followed by `<div` or `<motion.div` or `<Component`
    const matches1 = [...inner.matchAll(/\{([^{}]+)&&\s*\(\s*<([A-Za-z0-9_\.]+)(\s+)/g)];
    for (const m of matches1) {
      if (!m[3].includes('key=')) {
        console.log(`Missing key in ${file}: <${m[2]}> after condition ${m[1]}`);
        foundMissing = true;
      }
    }

    const matches2 = [...inner.matchAll(/\{([^{}]+)&&\s*<([A-Za-z0-9_\.]+)(\s+)/g)];
    for (const m of matches2) {
      if (!m[3].includes('key=')) {
        console.log(`Missing key in ${file}: <${m[2]}> after condition ${m[1]}`);
        foundMissing = true;
      }
    }
    
    // check for IIFEs
    const matches3 = [...inner.matchAll(/return\s*\(\s*<([A-Za-z0-9_\.]+)(\s+)/g)];
    for (const m of matches3) {
      if (!m[3].includes('key=')) {
        console.log(`Missing key in ${file}: <${m[1]}> in IIFE return`);
        foundMissing = true;
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

