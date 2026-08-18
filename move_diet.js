const fs = require('fs');

const filepath = "src/app/nutri/patient/[id]/page.js";
let content = fs.readFileSync(filepath, "utf8");

const startDiet = content.indexOf('      {/* Tarjeta Fórmula Dietética Interactiva */}');
const nextSection = content.indexOf('      {/* LADO IZQUIERDO: MACROS Y GRUPOS */}');
// We need to capture the whole section of Formula Dietética. Wait, LADO IZQUIERDO is INSIDE the section!
// The end of the section is just before:
const endDiet = content.indexOf('      {/* DATOS DE INGRESO */}');

let dietBlock = content.slice(startDiet, endDiet);

// Remove the block from its current location
content = content.replace(dietBlock, '');

// Now we need to insert it right after the Distribución de Comidas block
// Which ends before:
const ajustPeso = content.indexOf('        {/* Caja de Ajustes de Peso */}');

content = content.slice(0, ajustPeso) + dietBlock + '\n' + content.slice(ajustPeso);

fs.writeFileSync(filepath, content, "utf8");
console.log("Moved Diet Block");
