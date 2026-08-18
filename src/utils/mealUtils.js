export const MEAL_PLANS = {
  '2 comidas': [
    { title: 'Almuerzo', key: 'almuerzo', label: 'ALMUERZO', name: 'Almuerzo' },
    { title: 'Cena', key: 'cena', label: 'CENA', name: 'Cena' },
  ],
  '2 comidas + snack AM': [
    { title: 'Merienda AM', key: 'meriendaAM', label: 'MER. AM', name: 'Merienda AM' },
    { title: 'Almuerzo', key: 'almuerzo', label: 'ALMUERZO', name: 'Almuerzo' },
    { title: 'Cena', key: 'cena', label: 'CENA', name: 'Cena' },
  ],
  '2 comidas + snack PM': [
    { title: 'Almuerzo', key: 'almuerzo', label: 'ALMUERZO', name: 'Almuerzo' },
    { title: 'Merienda PM', key: 'meriendaPM', label: 'MER. PM', name: 'Merienda PM' },
    { title: 'Cena', key: 'cena', label: 'CENA', name: 'Cena' },
  ],
  '3 comidas': [
    { title: 'Desayuno', key: 'desayuno', label: 'DESAYUNO', name: 'Desayuno' },
    { title: 'Almuerzo', key: 'almuerzo', label: 'ALMUERZO', name: 'Almuerzo' },
    { title: 'Cena', key: 'cena', label: 'CENA', name: 'Cena' },
  ],
  '3+1 snacks': [
    { title: 'Desayuno', key: 'desayuno', label: 'DESAYUNO', name: 'Desayuno' },
    { title: 'Almuerzo', key: 'almuerzo', label: 'ALMUERZO', name: 'Almuerzo' },
    { title: 'Merienda PM', key: 'meriendaPM', label: 'MER. PM', name: 'Merienda PM' },
    { title: 'Cena', key: 'cena', label: 'CENA', name: 'Cena' },
  ],
  '3+2 snacks': [
    { title: 'Desayuno', key: 'desayuno', label: 'DESAYUNO', name: 'Desayuno' },
    { title: 'Merienda AM', key: 'meriendaAM', label: 'MER. AM', name: 'Merienda AM' },
    { title: 'Almuerzo', key: 'almuerzo', label: 'ALMUERZO', name: 'Almuerzo' },
    { title: 'Merienda PM', key: 'meriendaPM', label: 'MER. PM', name: 'Merienda PM' },
    { title: 'Cena', key: 'cena', label: 'CENA', name: 'Cena' },
  ],
  '3+3 snacks': [
    { title: 'Desayuno', key: 'desayuno', label: 'DESAYUNO', name: 'Desayuno' },
    { title: 'Merienda AM', key: 'meriendaAM', label: 'MER. AM', name: 'Merienda AM' },
    { title: 'Almuerzo', key: 'almuerzo', label: 'ALMUERZO', name: 'Almuerzo' },
    { title: 'Merienda PM', key: 'meriendaPM', label: 'MER. PM', name: 'Merienda PM' },
    { title: 'Cena', key: 'cena', label: 'CENA', name: 'Cena' },
    { title: 'Snack Nocturno', key: 'snackNoche', label: 'S. NOCHE', name: 'Snack Nocturno' },
  ],
  '2+2 snacks': [
    { title: 'Desayuno', key: 'desayuno', label: 'DESAYUNO', name: 'Desayuno' },
    { title: 'Merienda AM', key: 'meriendaAM', label: 'MER. AM', name: 'Merienda AM' },
    { title: 'Almuerzo', key: 'almuerzo', label: 'ALMUERZO', name: 'Almuerzo' },
    { title: 'Cena', key: 'cena', label: 'CENA', name: 'Cena' },
  ]
};

export const getMealTypes = (mealPlanKey) => {
  if (!mealPlanKey) return MEAL_PLANS['3+2 snacks'];
  
  if (mealPlanKey.startsWith('custom:')) {
    try {
      const customArray = JSON.parse(mealPlanKey.replace('custom:', ''));
      // Aseguramos que tengan title y label y name para retrocompatibilidad
      return customArray.map(m => ({
        ...m,
        title: m.title || m.label || m.name || 'Comida',
        label: m.label || (m.title ? m.title.toUpperCase() : (m.name ? m.name.toUpperCase() : 'COMIDA')),
        name: m.name || m.title || m.label || 'Comida'
      }));
    } catch (e) {
      console.error('Error parsing custom meal plan', e);
      return MEAL_PLANS['3+2 snacks'];
    }
  }
  
  return MEAL_PLANS[mealPlanKey] || MEAL_PLANS['3+2 snacks'];
};
