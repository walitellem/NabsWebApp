import fs from 'fs';
const code = fs.readFileSync('src/components/LoginPortal.tsx', 'utf8');
const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('const userCredential = await signInWithEmailAndPassword'));
console.log(lines.slice(start, start + 40).join('\n'));
