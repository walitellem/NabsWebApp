import fs from 'fs';
const code = fs.readFileSync('src/components/ReceptionistDashboard.tsx', 'utf8');
const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('// Secure a quick fallback to ensure skeletons resolve even on slow connections'));
console.log(lines.slice(start - 10, start + 20).join('\n'));
