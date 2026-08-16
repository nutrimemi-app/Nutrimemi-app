const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'nutri', 'patient', '[id]', 'report', 'page.js');
console.log("Target file path:", filePath);

let content = fs.readFileSync(filePath, 'utf8');

const targetPattern = /                  \}\)\}\r?\n\s*<\/div>\r?\n\s*\{\/\* PLAN DE MENÚ D/i;

if (targetPattern.test(content)) {
  console.log("Found match! Replacing...");
  content = content.replace(targetPattern, (match) => {
    return '                  })}\r\n                </div>\r\n             </div>\r\n           )}\r\n                      {/* PLAN DE MENÚ D';
  });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Success! Report file fixed.");
} else {
  const targetPatternLF = /                  \}\)\}\n\s*<\/div>\n\s*\{\/\* PLAN DE MENÚ D/i;
  if (targetPatternLF.test(content)) {
    console.log("Found match with LF! Replacing...");
    content = content.replace(targetPatternLF, (match) => {
      return '                  })}\n                </div>\n             </div>\n           )}\n                      {/* PLAN DE MENÚ D';
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Success! Report file fixed.");
  } else {
    console.log("Error: Target pattern not found in file!");
  }
}
