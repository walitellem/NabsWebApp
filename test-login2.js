import fs from 'fs';
const code = fs.readFileSync('src/components/LoginPortal.tsx', 'utf8');
const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('// Fallback query by email if no document found by UID'));
console.log(lines.slice(start, start + 60).join('\n'));
