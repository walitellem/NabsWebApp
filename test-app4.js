import fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('const isManagerRole ='));
console.log(lines.slice(start, start + 30).join('\n'));
