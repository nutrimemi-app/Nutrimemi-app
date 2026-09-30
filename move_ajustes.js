const fs = require('fs');
const filepath = "src/app/nutri/patient/[id]/page.js";
let content = fs.readFileSync(filepath, "utf8");

// 1. Move "Caja de Ajustes de Peso" above "Tarjeta Antropometría"
const startAjustes = content.indexOf('        {/* Caja de Ajustes de Peso */}');
const endAjustes = content.indexOf('        {/* Notas del Nutricionista */}');
let ajustesBlock = content.slice(startAjustes, endAjustes);

content = content.replace(ajustesBlock, '');

const insertPos = content.indexOf('      {/* Tarjeta Antropometría (Coral) */}');
content = content.slice(0, insertPos) + ajustesBlock + '\n' + content.slice(insertPos);

fs.writeFileSync(filepath, content, "utf8");
console.log("Moved Caja de Ajustes de Peso successfully");
