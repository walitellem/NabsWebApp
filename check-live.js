const { execSync } = require('child_process');
try {
  const curlOutput = execSync('curl -s http://localhost:3000/src/firebase.ts').toString();
  console.log(curlOutput.includes('import.meta.env.VITE_FIREBASE_API_KEY'));
} catch (e) {
  console.log('Error hitting local server:', e.message);
}
