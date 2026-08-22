const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Regex for key={`prefix-${expr1}-${expr2}-${expr3}`}
  content = content.replace(/key=\{\`([a-zA-Z0-9_\-]+)-\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{([^}]+)\}\`\}/g, (match, prefix, expr1, expr2, expr3) => {
    return `key={generateKey((${expr1}) + '-' + (${expr2}), ${expr3}, '${prefix}')}`;
  });

  // Regex for q-day-single: key={`q-day-single-${selectedRoomId}-${year}-${month}-${day}`}
  content = content.replace(/key=\{\`q-day-single-\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{([^}]+)\}-\$\{([^}]+)\}\`\}/g, (match, room, year, month, day) => {
    return `key={generateKey(${room}, ${year} + '-' + ${month} + '-' + ${day}, 'q-day-single')}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated 2: ${filePath}`);
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
