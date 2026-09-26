import fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('console.log("DEBUG: App.tsx: Auth state changed'));
console.log(lines.slice(start, start + 60).join('\n'));
