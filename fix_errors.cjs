const fs = require('fs');

function addImport(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("import { generateKey }")) {
    let lines = content.split('\n');
    lines.unshift("import { generateKey } from '../utils/keyGenerator';");
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log(`Added import to ${file}`);
  }
}

addImport('src/components/BestSellingDrinks.tsx');
addImport('src/components/EditBookingModal.tsx');
addImport('src/components/StaffManagementModal.tsx');
addImport('src/components/TransferRoomModal.tsx');
addImport('src/components/FutureStayCalendar.tsx');
addImport('src/components/RoomBookingCalendar.tsx');

// Use exact string replacements for idx where they weren't caught
function replaceExact(file, search, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.split(search).join(replacement);
  fs.writeFileSync(file, content, 'utf8');
}

replaceExact('src/components/FutureStayCalendar.tsx', "generateKey(undefined, idx, 'fut-empty')", "generateKey(undefined, i, 'fut-empty')");
replaceExact('src/components/QuickAvailabilityCalendar.tsx', "generateKey(undefined, idx, 'q-empty')", "generateKey(undefined, i, 'q-empty')");
replaceExact('src/components/RoomBookingCalendar.tsx', "generateKey(undefined, idx, 'rb-empty')", "generateKey(undefined, i, 'rb-empty')");

