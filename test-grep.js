import fs from 'fs';
const code = fs.readFileSync('src/components/ReceptionistDashboard.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(1700, 1720).join('\n'));
