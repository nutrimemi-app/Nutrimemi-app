const fs = require('fs');
const filepath = "src/app/nutri/patient/[id]/page.js";
let content = fs.readFileSync(filepath, "utf8");

const startAjustes = content.indexOf('        {/* Caja de Ajustes de Peso */}');
const endNotas = content.indexOf('      {/* Tarjeta Fórmula Dietética Interactiva */}');

let extractBlock = content.slice(startAjustes, endNotas);

content = content.replace(extractBlock, '');

const insertPos = content.indexOf('      {/* DATOS DE INGRESO */}');

content = content.slice(0, insertPos) + extractBlock + '\n' + content.slice(insertPos);

fs.writeFileSync(filepath, content, "utf8");
console.log("Moved block successfully");
