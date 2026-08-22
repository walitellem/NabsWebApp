import fs from 'fs';
const code = fs.readFileSync('src/components/ReceptionistDashboard.tsx', 'utf8');
const lines = code.split('\n');
const start = lines.findIndex(l => l.includes('unsubRooms = onSnapshot(roomsQ'));
console.log(lines.slice(start, start + 30).join('\n'));
