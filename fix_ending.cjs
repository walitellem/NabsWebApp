const fs = require('fs');
let content = fs.readFileSync('src/components/ManagerDashboard.tsx', 'utf8');
content = content.replace(/<\/AnimatePresence>\s*<\/AnimatePresence>\s*<StaffManagementModal/g, '</AnimatePresence>\n      <StaffManagementModal');
fs.writeFileSync('src/components/ManagerDashboard.tsx', content, 'utf8');
