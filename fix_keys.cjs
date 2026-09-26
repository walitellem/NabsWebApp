const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Regex for key={`prefix-${expr1}-${expr2}`}
  // Matches: key={`prefix-${item.id || idx}-${idx}`}
  // Group 1: prefix
  // Group 2: expr1 (id)
  // Group 3: expr2 (idx) optional
  content = content.replace(/key=\{\`([a-zA-Z0-9_\-]+)-\$\{([^}]+)\}(?:-\$\{([^}]+)\})?\`\}/g, (match, prefix, expr1, expr2) => {
    let idExpr = expr1;
    let idxExpr = expr2 || 'idx'; // fallback if no second expression
    
    // Sometimes expr1 is idx and expr2 is undefined, we need to handle that but usually we have both
    return `key={generateKey(${idExpr}, ${idxExpr}, '${prefix}')}`;
  });

  // Regex for key={`${expr1}-${expr2}`}
  content = content.replace(/key=\{\`\$\{([^}]+)\}-\$\{([^}]+)\}\`\}/g, (match, expr1, expr2) => {
    return `key={generateKey(${expr1}, ${expr2}, 'item')}`;
  });

  // Check if we need to add import for generateKey
  if (content !== originalContent) {
    if (!content.includes('generateKey')) {
      // Add import to top
      const importStmt = `import { generateKey } from '../utils/keyGenerator';\n`;
      // Find the last import statement or beginning of file
      const lines = content.split('\n');
      let lastImportIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIdx = i;
        }
      }
      if (lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, importStmt);
      } else {
        lines.unshift(importStmt);
      }
      content = lines.join('\n');
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  });
}

walkDir('./src/components');
