const fs = require('fs');

const filepath = "src/app/nutri/patient/[id]/page.js";
let content = fs.readFileSync(filepath, "utf8");

// Extract Formula Dietetica
const startDiet = content.indexOf('      {/* Tarjeta Fórmula Dietética Interactiva */}');
const endDiet = content.indexOf('      {/* DATOS DE INGRESO */}');

let dietBlock = content.slice(startDiet, endDiet);

// Remove the block from its current location
content = content.replace(dietBlock, '');

// Insert it right after "Distribución de Comidas" section
const distrRegex = /(      \{\/\* Selector de Distribución de Comidas \*\/\}.*?<\/section>\n\n)/s;
let distrMatch = content.match(distrRegex);

if (distrMatch) {
    let distrBlock = distrMatch[1];
    // Insert dietBlock immediately after distrBlock
    content = content.replace(distrBlock, distrBlock + dietBlock);
}

fs.writeFileSync(filepath, content, "utf8");
console.log("Moved Diet Block successfully.");
