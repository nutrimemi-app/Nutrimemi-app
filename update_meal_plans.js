const fs = require('fs');
const files = [
  'src/app/nutri/patient/[id]/menu-card/page.js',
  'src/app/nutri/patient/[id]/page.js',
  'src/app/nutri/patient/[id]/report/page.js',
  'src/app/paciente/[id]/dashboard/page.js',
  'src/app/patient/menu/page.js'
];

const newMealPlans = `MEAL_PLANS = {
  '2 comidas': [
    { title: 'Almuerzo', key: 'almuerzo' },
    { title: 'Cena', key: 'cena' },
  ],
  '2 comidas + snack AM': [
    { title: 'Merienda AM', key: 'meriendaAM' },
    { title: 'Almuerzo', key: 'almuerzo' },
    { title: 'Cena', key: 'cena' },
  ],
  '2 comidas + snack PM': [
    { title: 'Almuerzo', key: 'almuerzo' },
    { title: 'Merienda PM', key: 'meriendaPM' },
    { title: 'Cena', key: 'cena' },
  ],
  '3 comidas': [
    { title: 'Desayuno', key: 'desayuno' },
    { title: 'Almuerzo', key: 'almuerzo' },
    { title: 'Cena', key: 'cena' },
  ],
  '3+1 snacks': [
    { title: 'Desayuno', key: 'desayuno' },
    { title: 'Almuerzo', key: 'almuerzo' },
    { title: 'Merienda PM', key: 'meriendaPM' },
    { title: 'Cena', key: 'cena' },
  ],
  '3+2 snacks': [
    { title: 'Desayuno', key: 'desayuno' },
    { title: 'Merienda AM', key: 'meriendaAM' },
    { title: 'Almuerzo', key: 'almuerzo' },
    { title: 'Merienda PM', key: 'meriendaPM' },
    { title: 'Cena', key: 'cena' },
  ],
  '3+3 snacks': [
    { title: 'Desayuno', key: 'desayuno' },
    { title: 'Merienda AM', key: 'meriendaAM' },
    { title: 'Almuerzo', key: 'almuerzo' },
    { title: 'Merienda PM', key: 'meriendaPM' },
    { title: 'Cena', key: 'cena' },
    { title: 'Snack Nocturno', key: 'snackNoche' },
  ],
  '2+2 snacks': [
    { title: 'Desayuno', key: 'desayuno' },
    { title: 'Merienda AM', key: 'meriendaAM' },
    { title: 'Almuerzo', key: 'almuerzo' },
    { title: 'Cena', key: 'cena' },
  ]
};`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/MEAL_PLANS\s*=\s*\{[\s\S]*?2\+2 snacks'[^}]+\]\,\s*\};/m, newMealPlans);
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}
