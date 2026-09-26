const fs = require('fs');

function addKey(file, searchStr, keyStr) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(searchStr) && !content.includes(`key="${keyStr}"`)) {
    content = content.replace(searchStr, searchStr + ` key="${keyStr}"`);
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Added ${keyStr} to ${file}`);
  }
}

// ManagerDashboard.tsx
addKey('src/components/ManagerDashboard.tsx', '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">', 'md-modal');
addKey('src/components/ManagerDashboard.tsx', '<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">', 'md-modal-2');
addKey('src/components/ManagerDashboard.tsx', '<div className="fixed inset-0 z-50 flex items-center justify-center p-4">', 'md-modal-3');

// ReceptionistDashboard.tsx
addKey('src/components/ReceptionistDashboard.tsx', '<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">', 'rd-modal-1');
addKey('src/components/ReceptionistDashboard.tsx', '<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">', 'rd-modal-2');
addKey('src/components/ReceptionistDashboard.tsx', '<div className="fixed inset-0 z-50 flex items-center justify-center p-4">', 'rd-modal-3');
addKey('src/components/ReceptionistDashboard.tsx', '<EditBookingModal', 'edit-booking-modal');
addKey('src/components/ReceptionistDashboard.tsx', '<TransferRoomModal', 'transfer-room-modal');
addKey('src/components/ReceptionistDashboard.tsx', '<div \n            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm"', 'rd-modal-4');
addKey('src/components/ReceptionistDashboard.tsx', '<div \n            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[70] backdrop-blur-md overflow-y-auto"', 'rd-modal-5');
addKey('src/components/ReceptionistDashboard.tsx', '<div \n            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[75] backdrop-blur-sm overflow-y-auto"', 'rd-modal-6');

