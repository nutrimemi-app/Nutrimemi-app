const fs = require('fs');
const file = 'src/app/nutri/patient/[id]/page.js';
let code = fs.readFileSync(file, 'utf-8');

const setters = new Set([...code.matchAll(/set([A-Z][a-zA-Z0-9]*)\(/g)].map(m => m[1]));

const existingDeclarations = new Set([...code.matchAll(/const \[[a-zA-Z0-9]+, set([A-Z][a-zA-Z0-9]*)] = useState/g)].map(m => m[1]));

const toAdd = Array.from(setters).filter(s => !existingDeclarations.has(s) && s !== 'Patient');

let declarations = '';
toAdd.forEach(s => {
  const camelCase = s.charAt(0).toLowerCase() + s.slice(1);
  let defaultVal = "''";
  if (s.includes('Modal') || s.includes('Show')) defaultVal = 'false';
  if (s.includes('Photos') && s.includes('Comp')) defaultVal = '[]';
  if (s === 'SavedR24h') defaultVal = 'null';
  if (s === 'LocalPctProt') defaultVal = "'20'";
  if (s === 'LocalPctCho') defaultVal = "'50'";
  if (s === 'LocalPctLip') defaultVal = "'30'";
  declarations += `  const [${camelCase}, set${s}] = useState(${defaultVal});\n`;
});

code = code.replace("  const [gender, setGender] = useState('female');", "  const [gender, setGender] = useState('female');\n" + declarations);
fs.writeFileSync(file, code);

console.log("Added declarations:\n", declarations);
