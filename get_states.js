const fs = require('fs');
const code = fs.readFileSync('src/app/nutri/patient/[id]/page.js', 'utf-8');
const setters = new Set([...code.matchAll(/set([A-Z][a-zA-Z0-9]*)\(/g)].map(m => m[1]));
console.log(Array.from(setters));
