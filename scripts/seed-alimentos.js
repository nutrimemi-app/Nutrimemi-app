// ============================================================
// SEED: Listas de Intercambio UCV 2018
// Uso: node scripts/seed-alimentos.js
// Requiere: .env.local con SUPABASE_URL y SUPABASE_SERVICE_KEY
// ============================================================

const { createClient } = require('@supabase/supabase-js');

// Lee las variables de entorno del .env.local
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   SUPABASE_URL=https://xxxx.supabase.co');
  console.error('   SUPABASE_SERVICE_KEY=service_role_key_aqui');
  console.error('\nEjecuta así:');
  console.error('   SUPABASE_URL=tu_url SUPABASE_SERVICE_KEY=tu_key node scripts/seed-alimentos.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

// ============================================================
// DATOS: Todas las listas de intercambio
// ============================================================

const lista1 = [
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche baja en grasa', alimento: 'Leche descremada 1%', medida_practica: '1 taza / 8 onzas', gramos_cc: 240, proteinas_g: 8, lipidos_g: 2.4, cho_g: 12, calorias: 102 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche baja en grasa', alimento: 'Yogurt con frutas descremada (sin azúcar)', medida_practica: '1 taza / 8 onzas', gramos_cc: 240, proteinas_g: 8, lipidos_g: 2.4, cho_g: 12, calorias: 102 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche baja en grasa', alimento: 'Leche descremada 1% en polvo', medida_practica: '4 cucharadas', gramos_cc: 32, proteinas_g: 8, lipidos_g: 2.4, cho_g: 12, calorias: 102 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche baja en grasa', alimento: 'Leche evaporada descremada', medida_practica: '½ taza / 4 onzas', gramos_cc: 120, proteinas_g: 8, lipidos_g: 2.4, cho_g: 12, calorias: 102 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche baja en grasa', alimento: 'Yogurt simple descremado (firme)', medida_practica: '¾ taza', gramos_cc: 180, proteinas_g: 8, lipidos_g: 2.4, cho_g: 12, calorias: 102 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche muy baja en grasa', alimento: 'Leche descremada 0.5%', medida_practica: '1 taza / 8 onzas', gramos_cc: 240, proteinas_g: 8, lipidos_g: 1.2, cho_g: 12, calorias: 90 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche semidescremada', alimento: 'Leche semidescremada al 2%', medida_practica: '1 taza / 8 onzas', gramos_cc: 240, proteinas_g: 8, lipidos_g: 4.8, cho_g: 12, calorias: 123 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche semidescremada', alimento: 'Leche acidificada', medida_practica: '1 taza / 8 onzas', gramos_cc: 240, proteinas_g: 8, lipidos_g: 4.8, cho_g: 12, calorias: 123 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche semidescremada', alimento: 'Leche semidescremada en polvo al 2%', medida_practica: '4 cucharadas', gramos_cc: 32, proteinas_g: 8, lipidos_g: 4.8, cho_g: 12, calorias: 123 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche semidescremada', alimento: 'Yogurt líquido semidescremado con frutas', medida_practica: '¾ taza', gramos_cc: 180, proteinas_g: 8, lipidos_g: 4.8, cho_g: 12, calorias: 123 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche entera', alimento: 'Kéfir', medida_practica: '1 taza / 8 onzas', gramos_cc: 240, proteinas_g: 8, lipidos_g: 8, cho_g: 12, calorias: 150 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche entera', alimento: 'Leche entera', medida_practica: '1 taza / 8 onzas', gramos_cc: 240, proteinas_g: 8, lipidos_g: 8, cho_g: 12, calorias: 150 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche entera', alimento: 'Leche de cabra', medida_practica: '1 taza / 8 onzas', gramos_cc: 240, proteinas_g: 8, lipidos_g: 8, cho_g: 12, calorias: 150 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche entera', alimento: 'Suero de leche', medida_practica: '1 taza / 8 onzas', gramos_cc: 240, proteinas_g: 8, lipidos_g: 8, cho_g: 12, calorias: 150 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche entera', alimento: 'Leche entera en polvo', medida_practica: '4 cucharadas', gramos_cc: 32, proteinas_g: 8, lipidos_g: 8, cho_g: 12, calorias: 150 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Leche entera', alimento: 'Leche evaporada', medida_practica: '½ taza / 4 onzas', gramos_cc: 120, proteinas_g: 8, lipidos_g: 8, cho_g: 12, calorias: 150 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Deslactosados', alimento: 'Leche deslactosada', medida_practica: '1 taza / 8 onzas', gramos_cc: 240, proteinas_g: 8, lipidos_g: 2.4, cho_g: 12, calorias: 102 },
  { lista_num: 1, lista_nombre: 'Leche y Sustitutos', subgrupo: 'Deslactosados', alimento: 'Yogurt deslactosado', medida_practica: '¾ taza', gramos_cc: 180, proteinas_g: 8, lipidos_g: 2.4, cho_g: 12, calorias: 102 },
];

const vegetales = ['Acelgas','Ají dulce','Ajo','Ajo porro','Alcachofa','Alfalfa','Auyama','Apio-España o Celery','Berenjena','Berros','Brócoli','Brotes o germinados chinos','Calabacín','Cebolla','Cebollín','Coliflor','Chayota','Chicoria o Escarola','Espárragos','Espinaca','Hinojo','Hongos o Champiñones','Jugo de tomate','Lechuga criolla','Lechuga Romana','Lechuga Americana','Nabo','Palmito','Pepino','Perejil','Pimentón','Pimiento','Quimbombó','Rábanos','Remolacha','Repollitos de Bruselas','Repollo blanco','Repollo morado','Rúgula','Radiquio','Tomate','Vainitas','Zanahoria'];
const lista2 = vegetales.map(v => ({ lista_num: 2, lista_nombre: 'Hortalizas y Vegetales', subgrupo: null, alimento: v, medida_practica: '½ taza cocidos / 1 taza crudos', gramos_cc: null, proteinas_g: 2, lipidos_g: 0, cho_g: 5, calorias: 25 }));

const lista3 = [
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Cambur guineo', medida_practica: '1 unidad pequeña', gramos_cc: 90, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Grapefruit', medida_practica: '½ unidad', gramos_cc: 180, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Toronja', medida_practica: '½ unidad', gramos_cc: 180, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Manzana con piel', medida_practica: '1 unidad pequeña o ½ unidad grande', gramos_cc: 120, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Pera', medida_practica: '1 unidad pequeña o ½ unidad grande', gramos_cc: 120, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Cambur manzano', medida_practica: '1 unidad pequeña', gramos_cc: 90, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Kiwi', medida_practica: '1 unidad pequeña', gramos_cc: 100, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Mamey', medida_practica: '1 unidad pequeña', gramos_cc: 170, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Mango', medida_practica: '1 unidad pequeña', gramos_cc: 90, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Naranja', medida_practica: '1 unidad pequeña', gramos_cc: 190, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Nectarina', medida_practica: '1 unidad pequeña', gramos_cc: 120, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Níspero', medida_practica: '1 unidad pequeña', gramos_cc: 90, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Riñón', medida_practica: '1 unidad pequeña', gramos_cc: 80, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Albaricoque', medida_practica: '1 unidad mediana', gramos_cc: 110, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Fruta de pan', medida_practica: '1 unidad mediana', gramos_cc: 70, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Guayaba rosada', medida_practica: '1 unidad mediana', gramos_cc: 200, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Granadina', medida_practica: '1 unidad mediana', gramos_cc: 100, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Hicaco', medida_practica: '1 unidad mediana', gramos_cc: 120, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Jobo', medida_practica: '1 unidad mediana', gramos_cc: 100, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Mandarina', medida_practica: '1 unidad mediana', gramos_cc: 130, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Melocotón', medida_practica: '1 unidad mediana', gramos_cc: 80, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Tuna', medida_practica: '1 unidad mediana', gramos_cc: 80, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Ciruelas (importadas)', medida_practica: '2 unidades pequeñas', gramos_cc: 150, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Durazno', medida_practica: '2 unidades pequeñas', gramos_cc: 120, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Higo (fresco)', medida_practica: '2 unidades pequeñas', gramos_cc: 100, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Parchita', medida_practica: '2 unidades pequeñas', gramos_cc: 140, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Pomarrosa o Pomagás', medida_practica: '2 unidades pequeñas', gramos_cc: 150, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Ciruela de huesito', medida_practica: '8 unidades', gramos_cc: 90, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Cerezas (semeruco)', medida_practica: '12 unidades', gramos_cc: 160, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Uvas', medida_practica: '15 uds pequeñas / 12 uds medianas / 6 uds grandes', gramos_cc: 90, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Zapote', medida_practica: '¼ unidad', gramos_cc: 60, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Piña', medida_practica: '¾ taza', gramos_cc: 100, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Mora', medida_practica: '¾ taza', gramos_cc: 120, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Ensaladas de frutas naturales', medida_practica: '½ taza', gramos_cc: null, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Guanábana (pulpa)', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Mango (pulpa)', medida_practica: '½ taza', gramos_cc: null, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Fresas', medida_practica: '1 taza', gramos_cc: 180, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Mamón', medida_practica: '1 taza', gramos_cc: 90, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Melón verde', medida_practica: '1 ½ taza', gramos_cc: 200, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Lechosa', medida_practica: '2 tazas (en cubos)', gramos_cc: 200, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Melón rosado', medida_practica: '2 tazas (en cubos)', gramos_cc: 300, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Patilla', medida_practica: '2 tazas (en cubos)', gramos_cc: 300, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas frescas', alimento: 'Tamarindo (pulpa)', medida_practica: '1 cucharada', gramos_cc: 20, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas deshidratadas', alimento: 'Albaricoque (orejones)', medida_practica: '8 unidades pequeñas', gramos_cc: null, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas deshidratadas', alimento: 'Ciruelas pasas', medida_practica: '3 unidades', gramos_cc: null, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas deshidratadas', alimento: 'Dátiles', medida_practica: '3 unidades', gramos_cc: null, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas deshidratadas', alimento: 'Higos', medida_practica: '1 ½ unidades', gramos_cc: null, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas deshidratadas', alimento: 'Manzana', medida_practica: '4 unidades (aros)', gramos_cc: null, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
  { lista_num: 3, lista_nombre: 'Frutas', subgrupo: 'Frutas deshidratadas', alimento: 'Pasitas', medida_practica: '2 cucharadas', gramos_cc: null, proteinas_g: 0, lipidos_g: 0, cho_g: 15, calorias: 60 },
];

const lista4 = [
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Arepa de maíz', medida_practica: '1 unidad pequeña', gramos_cc: 40, proteinas_g: 2, lipidos_g: 1, cho_g: 15, calorias: 80, notas: 'considerar 1g grasa' },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Tortilla de maíz (13cm diámetro)', medida_practica: '1 unidad', gramos_cc: null, proteinas_g: 2, lipidos_g: 1, cho_g: 15, calorias: 80, notas: 'considerar 1g grasa' },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Mazorca', medida_practica: '½ unidad', gramos_cc: 70, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Arroz cocido', medida_practica: '½ taza', gramos_cc: 80, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Cereales cocidos en agua', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Cereales integrales (Special K, All Bran, etc.)', medida_practica: '½ taza', gramos_cc: 20, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Hojuelas de maíz azucaradas', medida_practica: '½ taza', gramos_cc: 20, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Maíz (en granos)', medida_practica: '½ taza', gramos_cc: 120, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Arroz inflado', medida_practica: '¾ taza', gramos_cc: 25, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Hojuelas de maíz', medida_practica: '¾ taza', gramos_cc: 25, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Cotufas (sin grasa)', medida_practica: '3 tazas', gramos_cc: 25, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Granola baja en grasa', medida_practica: '¼ taza', gramos_cc: 20, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Muesli', medida_practica: '¼ taza', gramos_cc: 20, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Pastas', alimento: 'Pasta de trigo (plumas, pastina, macarrones, fideos, etc.)', medida_practica: '½ taza', gramos_cc: 70, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Pastas', alimento: 'Pasta sin gluten (arroz o maíz)', medida_practica: '½ taza', gramos_cc: 70, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Avena (en hojuelas)', medida_practica: '2 cucharadas', gramos_cc: 16, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Chía', medida_practica: '2 cucharadas', gramos_cc: 16, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Germen de trigo (sin miel)', medida_practica: '2 cucharadas', gramos_cc: 16, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Cereales', alimento: 'Harina de arroz, avena, cebada o maicena', medida_practica: '2 cucharadas', gramos_cc: 16, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Apio', medida_practica: '1 trozo pequeño', gramos_cc: 60, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Ñame', medida_practica: '1 trozo pequeño', gramos_cc: 60, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Ocumo', medida_practica: '1 trozo pequeño', gramos_cc: 60, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Yuca', medida_practica: '1 trozo pequeño', gramos_cc: 60, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Topocho', medida_practica: '1 trozo pequeño', gramos_cc: 60, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Apio (puré)', medida_practica: '½ taza', gramos_cc: 110, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Batata (puré)', medida_practica: '½ taza', gramos_cc: 110, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Ñame (puré)', medida_practica: '½ taza', gramos_cc: 110, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Papa ocumo (puré sin grasa ni leche)', medida_practica: '½ taza', gramos_cc: 110, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Papa (puré sin grasa ni leche)', medida_practica: '½ taza', gramos_cc: 110, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Batata (entera)', medida_practica: '1 trozo', gramos_cc: 65, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Papa', medida_practica: '1 unidad pequeña', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Papa amarilla colombiana (mini)', medida_practica: '5 unidades', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Tubérculos y Plátano', alimento: 'Plátano', medida_practica: '¼ unidad', gramos_cc: 50, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Leguminosas', alimento: 'Arvejas', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Leguminosas', alimento: 'Caraotas negras', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Leguminosas', alimento: 'Caraotas blancas', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Leguminosas', alimento: 'Caraotas rojas', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Leguminosas', alimento: 'Frijoles', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Leguminosas', alimento: 'Frijol Bayo', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Leguminosas', alimento: 'Garbanzos', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Leguminosas', alimento: 'Guisantes', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Leguminosas', alimento: 'Habas', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Leguminosas', alimento: 'Lentejas', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Leguminosas', alimento: 'Quinchoncho', medida_practica: '½ taza', gramos_cc: 100, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Leguminosas', alimento: 'Quínoa', medida_practica: '¼ taza', gramos_cc: 40, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Panes', alimento: 'Pan árabe-pita (grande)', medida_practica: '¼ unidad', gramos_cc: 30, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Panes', alimento: 'Pan árabe-pita (mediano)', medida_practica: '½ unidad', gramos_cc: 30, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Panes', alimento: 'Pan bajo en calorías (ligero)', medida_practica: '2 rebanadas', gramos_cc: 36, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Panes', alimento: 'Pan sueco', medida_practica: '2 rebanadas', gramos_cc: 20, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Panes', alimento: 'Pan francés', medida_practica: '¼ unidad', gramos_cc: 30, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Panes', alimento: 'Pan italiano', medida_practica: '¼ unidad', gramos_cc: 30, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Panes', alimento: 'Pan campesino', medida_practica: '¼ unidad', gramos_cc: 30, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Panes', alimento: 'Sándwich blanco', medida_practica: '1 rebanada', gramos_cc: 30, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Panes', alimento: 'Sándwich integral', medida_practica: '1 rebanada', gramos_cc: 30, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Galletas', alimento: 'Galletas de soda', medida_practica: '3 unidades (1 paquete)', gramos_cc: 25, proteinas_g: 2, lipidos_g: 1, cho_g: 15, calorias: 80, notas: 'considerar 1g grasa' },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Galletas', alimento: 'Galletas dulces tipo María', medida_practica: '3 unidades (1 paquete)', gramos_cc: 20, proteinas_g: 2, lipidos_g: 5, cho_g: 15, calorias: 80, notas: 'considerar 5g grasa' },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Galletas', alimento: 'Galletas integrales', medida_practica: '3 unidades (1 paquete)', gramos_cc: 30, proteinas_g: 2, lipidos_g: 5, cho_g: 15, calorias: 80, notas: 'considerar 5g grasa' },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Galletas', alimento: 'Galletas de arroz', medida_practica: '2 uds grandes o 3 pequeñas', gramos_cc: 20, proteinas_g: 2, lipidos_g: 1, cho_g: 15, calorias: 80, notas: 'considerar 1g grasa' },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Galletas', alimento: 'Galletas de maíz', medida_practica: '2 uds grandes o 5 pequeñas', gramos_cc: 20, proteinas_g: 2, lipidos_g: 1, cho_g: 15, calorias: 80, notas: 'considerar 1g grasa' },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Alimentos preparados', alimento: 'Cachapa', medida_practica: '1 unidad pequeña', gramos_cc: 50, proteinas_g: 2, lipidos_g: 1, cho_g: 15, calorias: 80, notas: 'considerar 1g grasa' },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Alimentos preparados', alimento: 'Panqueca 9cm diámetro', medida_practica: '1 unidad pequeña', gramos_cc: 50, proteinas_g: 2, lipidos_g: 1, cho_g: 15, calorias: 80, notas: 'considerar 1g grasa' },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Alimentos preparados', alimento: 'Ponqué 6cm diámetro', medida_practica: '1 unidad pequeña', gramos_cc: 50, proteinas_g: 2, lipidos_g: 5, cho_g: 15, calorias: 80, notas: 'considerar 5g grasa' },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Otros', alimento: 'Casabe', medida_practica: '1 trozo pequeño', gramos_cc: 20, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Otros', alimento: 'Casabitos', medida_practica: '5 unidades', gramos_cc: 20, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Otros', alimento: 'Hallaquita o bollito de maíz', medida_practica: '1 unidad pequeña', gramos_cc: 50, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
  { lista_num: 4, lista_nombre: 'Almidones, Cereales y Panes', subgrupo: 'Otros', alimento: 'Señoritas', medida_practica: '2 unidades', gramos_cc: 20, proteinas_g: 2, lipidos_g: 0, cho_g: 15, calorias: 80 },
];

const lista5 = [
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Faisán (sin piel)', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Venado', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Búfalo', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Ganso (sin piel)', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Conejo', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Pollo carne blanca sin piel', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Gallina carne blanca sin piel', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Pavo carne blanca sin piel', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Pescado fresco', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Pescado congelado', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Atún', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Bacalao', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Sardina fresca', medida_practica: '5 unidades', gramos_cc: 35, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Claras de huevo de gallina', medida_practica: '2 unidades', gramos_cc: 50, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Jamón de pierna', medida_practica: '1 lonja gruesa o 2 finas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Pechuga de pavo', medida_practica: '1 lonja gruesa o 2 finas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Pechuga de pollo', medida_practica: '1 lonja gruesa o 2 finas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Almejas', medida_practica: '—', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Langosta', medida_practica: '—', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Camarón', medida_practica: '—', gramos_cc: 30, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Magras', alimento: 'Queso parmesano rallado', medida_practica: '1 cucharada rasa', gramos_cc: 15, proteinas_g: 7, lipidos_g: 3, cho_g: 0, calorias: 55 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Cordero (costilla)', medida_practica: '1 trozo pequeño', gramos_cc: 30, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Ternera (chuleta)', medida_practica: '1 trozo pequeño', gramos_cc: 30, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Pollo carne oscura con piel', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Gallina carne oscura con piel', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Pavo carne oscura con piel', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Carne de res (mayoría de cortes)', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Cerdo (lomo)', medida_practica: '1 trozo pequeño o 2 cdas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Huevo entero de gallina', medida_practica: '1 unidad', gramos_cc: 50, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Queso mozzarella', medida_practica: '1 rebanada gruesa o 2 finas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Queso guayanés', medida_practica: '¼ taza', gramos_cc: 30, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Ricotta', medida_practica: '¼ taza', gramos_cc: 30, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Cuajada', medida_practica: '¼ taza', gramos_cc: 30, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Semigordas', alimento: 'Queso Palmito', medida_practica: '—', gramos_cc: 30, proteinas_g: 7, lipidos_g: 5, cho_g: 0, calorias: 75 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Gordas', alimento: 'Bologna', medida_practica: '1 rebanada', gramos_cc: 30, proteinas_g: 7, lipidos_g: 8, cho_g: 0, calorias: 100 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Gordas', alimento: 'Salami', medida_practica: '5 rebanadas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 8, cho_g: 0, calorias: 100 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Gordas', alimento: 'Salchicha', medida_practica: '1 unidad regular', gramos_cc: 30, proteinas_g: 7, lipidos_g: 8, cho_g: 0, calorias: 100 },
  { lista_num: 5, lista_nombre: 'Carnes o Sustitutos', subgrupo: 'Carnes Gordas', alimento: 'Queso amarillo tipo Gouda', medida_practica: '1 reb gruesa o 2 finas', gramos_cc: 30, proteinas_g: 7, lipidos_g: 8, cho_g: 0, calorias: 100 },
];

const lista6 = [
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Monoinsaturadas', alimento: 'Aceite de canola', medida_practica: '1 cucharadita', gramos_cc: 5, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Monoinsaturadas', alimento: 'Aceite de oliva', medida_practica: '1 cucharadita', gramos_cc: 5, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Monoinsaturadas', alimento: 'Aceite de maní', medida_practica: '1 cucharadita', gramos_cc: 5, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Monoinsaturadas', alimento: 'Aceitunas negras', medida_practica: '8 unidades grandes', gramos_cc: 30, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Monoinsaturadas', alimento: 'Aceitunas verdes (rellenas)', medida_practica: '10 unidades grandes', gramos_cc: 30, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Monoinsaturadas', alimento: 'Aguacate', medida_practica: '1/8 unidad / 2 cucharadas trituradas', gramos_cc: 30, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Monoinsaturadas', alimento: 'Mantequilla de almendra', medida_practica: '2 cucharaditas', gramos_cc: 10, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Monoinsaturadas', alimento: 'Mantequilla de maní', medida_practica: '2 cucharaditas', gramos_cc: 10, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Monoinsaturadas', alimento: 'Almendras', medida_practica: '6 unidades', gramos_cc: 6, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Monoinsaturadas', alimento: 'Maní en concha', medida_practica: '10 unidades', gramos_cc: 6, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Monoinsaturadas', alimento: 'Nuez lisa', medida_practica: '2 unidades', gramos_cc: null, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Monoinsaturadas', alimento: 'Semillas de ajonjolí', medida_practica: '1 cucharada', gramos_cc: null, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Poliinsaturadas', alimento: 'Aceite de maíz', medida_practica: '1 cucharadita', gramos_cc: 5, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Poliinsaturadas', alimento: 'Aceite de girasol', medida_practica: '1 cucharadita', gramos_cc: 5, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Poliinsaturadas', alimento: 'Aceite de soya', medida_practica: '1 cucharadita', gramos_cc: 5, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Poliinsaturadas', alimento: 'Mayonesa (regular)', medida_practica: '1 cucharadita', gramos_cc: 5, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Poliinsaturadas', alimento: 'Linaza en polvo', medida_practica: '2 cucharadas', gramos_cc: 20, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Poliinsaturadas', alimento: 'Mayonesa (ligera)', medida_practica: '2 cucharaditas', gramos_cc: 10, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Poliinsaturadas', alimento: 'Nueces', medida_practica: '2 unidades', gramos_cc: null, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Saturadas', alimento: 'Aceite de coco', medida_practica: '1 cucharadita', gramos_cc: 5, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Saturadas', alimento: 'Coco endulzado rallado', medida_practica: '2 cucharadas', gramos_cc: null, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Saturadas', alimento: 'Mantequilla', medida_practica: '1 cucharadita', gramos_cc: 5, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Saturadas', alimento: 'Manteca de cerdo', medida_practica: '1 cucharadita', gramos_cc: 5, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Saturadas', alimento: 'Margarina regular', medida_practica: '1 cucharadita', gramos_cc: 5, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Saturadas', alimento: 'Margarina ligera', medida_practica: '2 cucharaditas', gramos_cc: 10, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Saturadas', alimento: 'Queso crema regular', medida_practica: '1 cucharada', gramos_cc: 15, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
  { lista_num: 6, lista_nombre: 'Grasas', subgrupo: 'Grasas Saturadas', alimento: 'Tocineta (cocida)', medida_practica: '2 uds finas tostadas o 1 unidad gruesa', gramos_cc: 9, proteinas_g: 0, lipidos_g: 5, cho_g: 0, calorias: 45 },
];

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

async function seed() {
  console.log('🚀 Iniciando seed de alimentos_intercambio...\n');

  const allData = [...lista1, ...lista2, ...lista3, ...lista4, ...lista5, ...lista6];
  
  console.log(`📦 Total de registros a insertar: ${allData.length}`);
  
  // Insertar en lotes de 50 para evitar timeouts
  const batchSize = 50;
  let inserted = 0;
  
  for (let i = 0; i < allData.length; i += batchSize) {
    const batch = allData.slice(i, i + batchSize);
    const { error } = await supabase
      .from('alimentos_intercambio')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, error.message);
      console.error('Detalle:', error);
      process.exit(1);
    }
    
    inserted += batch.length;
    console.log(`✅ Lote ${Math.floor(i/batchSize) + 1}: ${inserted}/${allData.length} registros insertados`);
  }

  // Verificación: contar por lista
  console.log('\n📊 Verificando resultados...\n');
  
  const { data: counts, error: countError } = await supabase
    .from('alimentos_intercambio')
    .select('lista_num, lista_nombre')
    .order('lista_num');

  if (countError) {
    console.error('❌ Error al verificar:', countError.message);
    process.exit(1);
  }

  // Agrupar manualmente
  const grouped = {};
  counts.forEach(row => {
    const key = `${row.lista_num}`;
    if (!grouped[key]) grouped[key] = { lista_num: row.lista_num, lista_nombre: row.lista_nombre, total: 0 };
    grouped[key].total++;
  });

  console.log('lista_num | lista_nombre                        | total');
  console.log('----------|-------------------------------------|------');
  Object.values(grouped).forEach(g => {
    console.log(`    ${g.lista_num}     | ${g.lista_nombre.padEnd(35)} | ${g.total}`);
  });

  const totalFinal = Object.values(grouped).reduce((s, g) => s + g.total, 0);
  console.log(`\n✅ TOTAL FILAS EN TABLA: ${totalFinal}`);
  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n⚠️  IMPORTANT: Para crear la tabla, ejecuta primero el SQL del CREATE TABLE en el Editor SQL de Supabase.');
}

seed().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
