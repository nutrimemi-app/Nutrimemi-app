const fs = require('fs');

const jsonPath = 'C:\\Users\\HP\\Downloads\\listas_intercambio_completo.json';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const out = [];
let idCounter = 1;

// 1. Leche
if (data.lista1_leche && data.lista1_leche.alimentos) {
  data.lista1_leche.alimentos.forEach(item => {
    const name = item.alimento;
    const portion = item.medida_practica + (item.gramos_cc ? ` (${item.gramos_cc}g)` : '');
    out.push({
      id: `l_${idCounter++}`,
      name: name,
      portion: portion,
      groupKey: 'lacteos'
    });
  });
}

// 2. Vegetales
if (data.lista2_vegetales && data.lista2_vegetales.alimentos) {
  const defaultPortion = data.lista2_vegetales.info.medida_practica;
  data.lista2_vegetales.alimentos.forEach(name => {
    out.push({
      id: `v_${idCounter++}`,
      name: name,
      portion: defaultPortion,
      groupKey: 'vegetales'
    });
  });
}

// 3. Frutas
if (data.lista3_frutas && data.lista3_frutas.alimentos) {
  data.lista3_frutas.alimentos.forEach(item => {
    const name = item.alimento;
    const portion = item.medida_practica + (item.gramos_cc ? ` (${item.gramos_cc}g)` : '');
    out.push({
      id: `f_${idCounter++}`,
      name: name,
      portion: portion,
      groupKey: 'frutas'
    });
  });
}

// 4. Almidones
if (data.lista4_almidones && data.lista4_almidones.alimentos) {
  data.lista4_almidones.alimentos.forEach(item => {
    const name = item.alimento;
    const portion = item.medida_practica + (item.gramos_cc ? ` (${item.gramos_cc}g)` : '');
    out.push({
      id: `c_${idCounter++}`,
      name: name,
      portion: portion,
      groupKey: 'cereales'
    });
  });
}

// 5. Carnes
if (data.lista5_carnes && data.lista5_carnes.alimentos) {
  data.lista5_carnes.alimentos.forEach(item => {
    const name = `${item.alimento} (${item.tipo})`;
    const portion = item.medida_practica + (item.gramos_cc ? ` (${item.gramos_cc}g)` : '');
    out.push({
      id: `p_${idCounter++}`,
      name: name,
      portion: portion,
      groupKey: 'proteinas'
    });
  });
}

// 6. Grasas
if (data.lista6_grasas && data.lista6_grasas.alimentos) {
  data.lista6_grasas.alimentos.forEach(item => {
    const name = item.alimento;
    const portion = item.medida_practica + (item.gramos_cc ? ` (${item.gramos_cc}g)` : '');
    out.push({
      id: `g_${idCounter++}`,
      name: name,
      portion: portion,
      groupKey: 'grasas'
    });
  });
}

// Generar el archivo output
const fileContent = `// Datos iniciales de la base de datos de alimentos importados de listas_intercambio_completo.json
export const DEFAULT_FOODS = ${JSON.stringify(out, null, 2)};

export const loadFoods = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('nutri_foods');
  if (!stored) {
    localStorage.setItem('nutri_foods', JSON.stringify(DEFAULT_FOODS));
    return DEFAULT_FOODS;
  }
  return JSON.parse(stored);
};

export const saveFoods = (foodsList) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nutri_foods', JSON.stringify(foodsList));
  }
};
`;

fs.writeFileSync('C:\\Users\\HP\\Desktop\\nutrimemi\\src\\data\\defaultFoods.js', fileContent);
console.log(`Conversión completada con éxito. Se importaron ${out.length} alimentos.`);
