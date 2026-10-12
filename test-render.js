import fs from 'fs';
const code = fs.readFileSync('src/components/ReceptionistDashboard.tsx', 'utf8');
const lines = code.split('\n');

// let's find the render method or return statement
const returnIndex = lines.findIndex(l => l.includes('return ('));
console.log(lines.slice(returnIndex, returnIndex + 50).join('\n'));
