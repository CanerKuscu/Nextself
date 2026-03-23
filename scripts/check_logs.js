const fs = require('fs');
console.log('--- ROOT TSC LOG 2 ---');
try {
  console.log(fs.readFileSync('root-tsc-2.log', 'utf16le').slice(0, 1500));
} catch(e) { console.log(e.message); }

console.log('--- WEB TSC LOG ---');
try {
  console.log(fs.readFileSync('web/dashboard/web-tsc.log', 'utf16le').slice(0, 1500));
} catch(e) { console.log(e.message); }
