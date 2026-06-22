// Datos iniciales de la base de datos de alimentos
export const DEFAULT_FOODS = [
  // CEREALES (Naranja)
  { id: 'c1', name: 'Arroz blanco cocido', portion: '1/3 taza', groupKey: 'cereales' },
  { id: 'c2', name: 'Arroz integral cocido', portion: '1/3 taza', groupKey: 'cereales' },
  { id: 'c3', name: 'Pasta cocida', portion: '1/2 taza', groupKey: 'cereales' },
  { id: 'c4', name: 'Papa horneada o hervida', portion: '1/2 taza', groupKey: 'cereales' },
  { id: 'c5', name: 'Plátano maduro (cocido)', portion: '1/4 unidad', groupKey: 'cereales' },
  { id: 'c6', name: 'Avena en hojuelas', portion: '1/3 taza', groupKey: 'cereales' },
  { id: 'c7', name: 'Pan integral', portion: '1 rebanada', groupKey: 'cereales' },
  { id: 'c8', name: 'Arepa de maíz', portion: '1/2 unidad (delgada)', groupKey: 'cereales' },
  { id: 'c9', name: 'Galletas de agua / soda', portion: '4 a 5 unidades', groupKey: 'cereales' },
  { id: 'c10', name: 'Tortilla de maíz', portion: '1 unidad', groupKey: 'cereales' },

  // PROTEÍNAS (Rojo)
  { id: 'p1', name: 'Pechuga de pollo (cocida)', portion: '30 g (1 onza)', groupKey: 'proteinas' },
  { id: 'p2', name: 'Carne de res magra (cocida)', portion: '30 g (1 onza)', groupKey: 'proteinas' },
  { id: 'p3', name: 'Pescado blanco (cocido)', portion: '30 g (1 onza)', groupKey: 'proteinas' },
  { id: 'p4', name: 'Atún en agua (enlatado)', portion: '1/4 taza', groupKey: 'proteinas' },
  { id: 'p5', name: 'Huevo entero', portion: '1 unidad', groupKey: 'proteinas' },
  { id: 'p6', name: 'Queso blanco bajo en grasa', portion: '30 g (1 rebanada)', groupKey: 'proteinas' },
  { id: 'p7', name: 'Jamón de pavo', portion: '2 rebanadas delgadas', groupKey: 'proteinas' },
  { id: 'p8', name: 'Caraotas/Lentejas (grano)', portion: '1/2 taza', groupKey: 'proteinas' }, // Puede ser mixto, lo dejamos en prote para simplificar

  // VEGETALES (Verde)
  { id: 'v1', name: 'Lechuga completa (cruda)', portion: '1 taza', groupKey: 'vegetales' },
  { id: 'v2', name: 'Espinaca (cruda)', portion: '1 taza', groupKey: 'vegetales' },
  { id: 'v3', name: 'Tomate', portion: '1/2 taza o 1 ud pequeña', groupKey: 'vegetales' },
  { id: 'v4', name: 'Zanahoria (cruda o cocida)', portion: '1/2 taza', groupKey: 'vegetales' },
  { id: 'v5', name: 'Brócoli (cocido)', portion: '1/2 taza', groupKey: 'vegetales' },
  { id: 'v6', name: 'Calabacín / Zucchini (cocido)', portion: '1/2 taza', groupKey: 'vegetales' },
  { id: 'v7', name: 'Cebolla (picada)', portion: '1/2 taza', groupKey: 'vegetales' },

  // FRUTAS (Morado)
  { id: 'f1', name: 'Manzana', portion: '1 unidad pequeña', groupKey: 'frutas' },
  { id: 'f2', name: 'Cambur / Banana', portion: '1/2 unidad grande', groupKey: 'frutas' },
  { id: 'f3', name: 'Mandarina', portion: '1 unidad pequeña', groupKey: 'frutas' },
  { id: 'f4', name: 'Fresas', portion: '1 taza / 10 unidades', groupKey: 'frutas' },
  { id: 'f5', name: 'Lechosa / Papaya (picada)', portion: '1 taza', groupKey: 'frutas' },
  { id: 'f6', name: 'Melón o Patilla', portion: '1 taza (en cubos)', groupKey: 'frutas' },
  { id: 'f7', name: 'Mango', portion: '1/2 taza (picado)', groupKey: 'frutas' },

  // LÁCTEOS (Azul)
  { id: 'l1', name: 'Leche descremada', portion: '1 taza (240ml)', groupKey: 'lacteos' },
  { id: 'l2', name: 'Leche completa', portion: '1 taza (240ml)', groupKey: 'lacteos' },
  { id: 'l3', name: 'Yogurt natural / descremado', portion: '3/4 taza', groupKey: 'lacteos' },
  { id: 'l4', name: 'Yogurt griego (sin azúcar)', portion: '1/2 taza', groupKey: 'lacteos' },

  // GRASAS (Amarillo)
  { id: 'g1', name: 'Aceite de oliva / vegetal', portion: '1 cucharadita (5ml)', groupKey: 'grasas' },
  { id: 'g2', name: 'Aguacate', portion: '30 g (1/8 ud aprox)', groupKey: 'grasas' },
  { id: 'g3', name: 'Almendras / Nueces', portion: '6 unidades', groupKey: 'grasas' },
  { id: 'g4', name: 'Mantequilla de maní (natural)', portion: '1 cucharada', groupKey: 'grasas' }
];

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
