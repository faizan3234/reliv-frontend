const fs = require('fs');
const file = 'C:/Users/khanf/Downloads/backend-main/voice-service/config.py';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/"RELIV_VAD_END_MS", "1200"/g, '"RELIV_VAD_END_MS", "450"');
fs.writeFileSync(file, code);
console.log('patched');
