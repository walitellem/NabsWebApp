const fs = require('fs');

function addKey(file, searchStr, keyStr) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(searchStr) && !content.includes(`key="${keyStr}"`)) {
    content = content.replace(searchStr, searchStr + ` key="${keyStr}"`);
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Added ${keyStr} to ${file}`);
  }
}

addKey('src/components/ManagerDashboard.tsx', '<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-hidden backdrop-blur-sm">', 'ap-handover-audit');
addKey('src/components/GettingStartedModal.tsx', '<div className="fixed inset-0 z-50 flex items-center justify-center p-4">', 'ap-getting-started');
addKey('src/components/WalkInActivityLedger.tsx', '<div className="fixed inset-0 z-50 flex items-center justify-center p-4">', 'ap-walkin-ledger-1');
addKey('src/components/StaffManagementModal.tsx', '<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">', 'ap-staff-management-modal');

