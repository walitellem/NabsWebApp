const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Let's find every AnimatePresence
  const blocks = content.split('<AnimatePresence');
  if (blocks.length <= 1) return;

  for (let i = 1; i < blocks.length; i++) {
    // inside this block, up to </AnimatePresence>
    let block = blocks[i];
    let endIdx = block.indexOf('</AnimatePresence>');
    if (endIdx === -1) continue;

    let inner = block.substring(0, endIdx);
    
    // We want to find `{something && (` followed by `<div` or `<motion.div` or `<Component`
    // and inject a key if it's not there.
    
    // Replace all instances in this inner block
    inner = inner.replace(/\{([^{}]+)&&\s*\(\s*<([A-Za-z0-9_\.]+)(\s+)/g, (match, cond, tag, spaces) => {
      if (spaces.includes('key=')) return match;
      const r = Math.random().toString(36).substring(7);
      return `{${cond}&& (\n<${tag} key="ap-${tag.replace('.', '-')}-${r}"${spaces}`;
    });

    inner = inner.replace(/\{([^{}]+)&&\s*<([A-Za-z0-9_\.]+)(\s+)/g, (match, cond, tag, spaces) => {
      if (spaces.includes('key=')) return match;
      const r = Math.random().toString(36).substring(7);
      return `{${cond}&& <${tag} key="ap-${tag.replace('.', '-')}-${r}"${spaces}`;
    });
    
    // For IIFE {something && (() => { return <div ... })()}
    inner = inner.replace(/return\s*\(\s*<([A-Za-z0-9_\.]+)(\s+)/g, (match, tag, spaces) => {
      if (spaces.includes('key=')) return match;
      const r = Math.random().toString(36).substring(7);
      return `return (\n<${tag} key="ap-${tag.replace('.', '-')}-${r}"${spaces}`;
    });

    blocks[i] = inner + block.substring(endIdx);
  }

  content = blocks.join('<AnimatePresence');
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed AP keys in ' + file);
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

