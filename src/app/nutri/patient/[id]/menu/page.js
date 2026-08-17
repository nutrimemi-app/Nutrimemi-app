'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Activity, Search, Clock, SaveAll, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useUI } from '@/context/UIContext';
import { loadFoods } from '@/data/defaultFoods';
import { calculateClinicalData, DISTRIBUTION_TEMPLATES } from '@/utils/calculationUtils';
import { supabase } from '@/lib/supabaseClient';
import { getPatientById, updatePatient } from '@/lib/patients';

const EXCHANGE_VALUES = {
  lacteos: {
    variantes: {
      bajaGrasa1: { label: 'Baja en grasa (1%)', prot: 8, fat: 2.4, cho: 12, kcal: 102 },
      entera: { label: 'Entera', prot: 8, fat: 8, cho: 12, kcal: 150 }
    }
  },
  vegetales: { prot: 0, fat: 0, cho: 5, kcal: 25 },
  frutas: { prot: 0, fat: 0, cho: 15, kcal: 60 },
  cereales: { prot: 0, fat: 0, cho: 15, kcal: 70 },
  proteinas: {
    variantes: {
      magra: { label: 'Magra', prot: 7, fat: 3, cho: 0, kcal: 55 },
      semigorda: { label: 'Semi gorda', prot: 7, fat: 5, cho: 0, kcal: 75 },
      gorda: { label: 'Gorda', prot: 7, fat: 8, cho: 0, kcal: 100 }
    }
  },
  grasas: { prot: 0, fat: 5, cho: 0, kcal: 45 }
};

const PRESET_RECIPES = [
  { name: '🍳 Huevo revuelto con pan', portions: { cereales: 1, proteinas: 1, vegetales: 0, frutas: 0, lacteos: 0, grasas: 1 } },
  { name: '🥪 Sándwich de pavo y queso', portions: { cereales: 2, proteinas: 2, vegetales: 0, frutas: 0, lacteos: 0, grasas: 1 } },
  { name: '🌮 Tacos de Pollo', portions: { cereales: 2, proteinas: 2, vegetales: 1, frutas: 0, lacteos: 0, grasas: 1 } },
  { name: '🍽️ Almuerzo Clásico (Pollo/Arroz/Granos)', portions: { cereales: 3, proteinas: 4, vegetales: 2, frutas: 0, lacteos: 0, grasas: 1 } },
  { name: '🥣 Yogurt con fresas/frutas', portions: { cereales: 0, proteinas: 0, vegetales: 0, frutas: 1, lacteos: 1, grasas: 0 } },
  { name: '🍧 Bowl de Avena con Fruta y Frutos secos', portions: { cereales: 1, proteinas: 0, vegetales: 0, frutas: 1, lacteos: 1, grasas: 1 } }
];

const suggestRecipesForPortions = (portions) => {
  const c = parseFloat(portions?.cereales) || 0;
  const p = parseFloat(portions?.proteinas) || 0;
  const v = parseFloat(portions?.vegetales) || 0;
  const f = parseFloat(portions?.frutas) || 0;
  const l = parseFloat(portions?.lacteos) || 0;
  const g = parseFloat(portions?.grasas) || 0;

  if (c === 0 && p === 0 && v === 0 && f === 0 && l === 0 && g === 0) {
    return "Establece las porciones objetivo en el Paso 1 para ver sugerencias de recetas.";
  }

  // Pre-defined matches
  if (c === 1 && p === 1 && g === 1 && l === 0 && f === 0) {
    return "🍳 Huevo revuelto (1 porción de Proteína) con 1 rebanada de pan tostado (1 Cereal) preparado con 1 cdta. de aceite de oliva (1 Grasa).";
  }
  if (c === 2 && p === 2 && g === 1 && l === 0) {
    return "🥪 Sándwich de pavo y queso: 2 rebanadas de pan integral (2 Cereales), 60g de jamón de pavo / queso paisa (2 Proteínas) y 1 cdta. de mayonesa u oliva (1 Grasa). Agrega vegetales libres (ensalada, tomate) al gusto.";
  }
  if (c === 2 && p === 2 && v === 1 && g === 1) {
    return "🌮 Tacos de Pollo: 2 tortillas de maíz (2 Cereales), 60g de pechuga de pollo deshebrada (2 Proteínas), 1/2 taza de pico de gallo o ensalada (1 Vegetal) y 30g de aguacate (1 Grasa).";
  }
  if (c === 3 && p === 4 && v === 2 && g === 1) {
    return "🍽️ Almuerzo Clásico: 1 taza de arroz cocido (2 Cereales) + 1/2 taza de caraotas/lentejas (1 Cereal), 120g de filete de pollo a la plancha (4 Proteínas), ensalada mixta de lechuga, cebolla y pepino (2 Vegetales), aderezada con 1 cdta. de aceite de oliva (1 Grasa).";
  }
  if (f === 1 && l === 1 && c === 0) {
    return "🥣 Copa de yogurt griego descremado (1 Lácteo) con 1 taza de fresas o durazno picado (1 Fruta).";
  }
  if (f === 1 && l === 1 && c === 1 && g === 1) {
    return "🍧 Bowl de Avena con Frutas: 1/2 taza de yogurt griego (1 Lácteo), 1/3 taza de avena (1 Cereal), con 1/2 banana picada (1 Fruta) y 10 unidades de frutos secos (1 Grasa).";
  }

  // Generative recommendation if not matched exactly
  const parts = [];
  if (c > 0) parts.push(`${c === 1 ? '1 porción' : `${c} porciones`} de Cereales (ej. ${c * 0.5 === 0.5 ? '1/2 taza' : `${c * 0.5} tazas`} de arroz, avena, pasta o tortillas)`);
  if (p > 0) parts.push(`${p === 1 ? '1 porción' : `${p} porciones`} de Proteínas (ej. ${p * 30}g de pollo, carne, pescado, o claras de huevo)`);
  if (v > 0) parts.push(`${v === 1 ? '1 porción' : `${v} porciones`} de Vegetales (ej. ${v} taza de ensalada fresca o de verdura)`);
  if (f > 0) parts.push(`${f === 1 ? '1 porción' : `${f} porciones`} de Frutas (ej. ${f} unidad o ${f} taza de frutas)`);
  if (l > 0) parts.push(`${l === 1 ? '1 porción' : `${l} porciones`} de Lácteos (ej. ${l} taza de leche o yogurt)`);
  if (g > 0) parts.push(`${g === 1 ? '1 porción' : `${g} porciones`} de Grasas (ej. ${g * 15 === 15 ? '30g de aguacate' : `${g * 2} cucharaditas de aceite`} o semillas)`);

  return `🍽️ Idea de plato sugerido: Arma el plato combinando: ${parts.join(', ')}.`;
};

export default function ManageMenu() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const [patient, setPatient] = useState(null);
  const [foodDB, setFoodDB] = useState([]);
  const [step, setStep] = useState(1);
  const [activeDay, setActiveDay] = useState('day1');
  const [formulas, setFormulas] = useState({ kcal: '', prot: '', cho: '', fat: '' });
  const [mealCalculators, setMealCalculators] = useState({});
  const [mealPlanKey, setMealPlanKey] = useState('3+2 snacks');
  const [lacteosTipo, setLacteosTipo] = useState('bajaGrasa1');
  const [proteinasTipo, setProteinasTipo] = useState('magra');

  const getExchangeGroup = (group) => {
    if (group === 'lacteos') return EXCHANGE_VALUES.lacteos.variantes[lacteosTipo];
    if (group === 'proteinas') return EXCHANGE_VALUES.proteinas.variantes[proteinasTipo];
    return EXCHANGE_VALUES[group];
  };
  
  const initialMenuStructure = {
    desayuno: { time: '08:00', selectedFoods: [], portions: {} },
    meriendaAM: { time: '10:30', selectedFoods: [], portions: {} },
    almuerzo: { time: '13:00', selectedFoods: [], portions: {} },
    meriendaPM: { time: '16:30', selectedFoods: [], portions: {} },
    cena: { time: '19:30', selectedFoods: [], portions: {} },
    snackNoche: { time: '21:00', selectedFoods: [], portions: {} }
  };

  const [menus, setMenus] = useState({
    day1: { ...initialMenuStructure },
    day2: { ...initialMenuStructure }
  });
  
  const [searchTerms, setSearchTerms] = useState({});
  const [expandedSuggestions, setExpandedSuggestions] = useState({});
  const [customRecipes, setCustomRecipes] = useState([]);
  const [recipeNames, setRecipeNames] = useState({});
  
  const [quickFoodName, setQuickFoodName] = useState('');
  const [quickFoodGroup, setQuickFoodGroup] = useState('cereales');
  const [quickFoodPortion, setQuickFoodPortion] = useState('1 ración');

  useEffect(() => {
    const defaultFoods = loadFoods();
    const customFoods = JSON.parse(localStorage.getItem('nutri_custom_foods') || '[]');
    setFoodDB([...defaultFoods, ...customFoods]);
    
    const fetchRecipes = async () => {
      const { data, error } = await supabase.from('custom_recipes').select('*');
      if (data && !error) {
        setCustomRecipes(data);
      } else {
        console.error('Error cargando recetas:', error);
        const savedRecipes = JSON.parse(localStorage.getItem('nutri_custom_dishes') || '[]');
        setCustomRecipes(savedRecipes);
      }
    };
    fetchRecipes();

    const loadPatient = async () => {
      const found = await getPatientById(params.id);
      if (found) {
        setPatient(found);
        if (found.details?.mealPlan) {
          setMealPlanKey(found.details.mealPlan);
        }
        
        if (found.menus) {
          setMenus(found.menus);
        } else if (found.menu) {
          setMenus({
            day1: found.menu,
            day2: {
              desayuno: { time: '08:00', selectedFoods: [], portions: {} },
              meriendaAM: { time: '10:30', selectedFoods: [], portions: {} },
              almuerzo: { time: '13:00', selectedFoods: [], portions: {} },
              meriendaPM: { time: '16:30', selectedFoods: [], portions: {} },
              cena: { time: '19:30', selectedFoods: [], portions: {} },
              snackNoche: { time: '21:00', selectedFoods: [], portions: {} }
            }
          });
        }
        
        if (found.dietForm) {
          const rct = found.dietForm.rct || '1700';
          
          const tempClin = calculateClinicalData({
            weight: found.details?.weight,
            height: found.details?.height,
            sex: found.details?.gender || 'female',
            manualPi: found.details?.manualPi,
            manualPa: found.details?.manualPa,
            manualPc: found.details?.manualPc
          });
          
          const getSuggestedPct = (key) => {
            const prof = tempClin?.profile ? tempClin.profile.toUpperCase() : 'NORMOPESO';
            if (prof === 'BAJO PESO') {
              return key === 'pctProt' ? 18 : 50;
            } else if (prof === 'SOBREPESO' || prof.startsWith('OBESIDAD')) {
              return key === 'pctProt' ? 20 : 55;
            } else {
              return key === 'pctProt' ? 15 : 55;
            }
          };
          const sugProt = getSuggestedPct('pctProt');
          const sugCho = getSuggestedPct('pctCho');

          const pctProt = (found.dietForm.pctProt !== undefined && found.dietForm.pctProt !== null && found.dietForm.pctProt !== '') ? parseFloat(found.dietForm.pctProt) : sugProt;
          const pctCho = (found.dietForm.pctCho !== undefined && found.dietForm.pctCho !== null && found.dietForm.pctCho !== '') ? parseFloat(found.dietForm.pctCho) : sugCho;
          const pctLip = Math.max(0, 100 - pctProt - pctCho);
          setFormulas({
            kcal: rct.toString(),
            prot: ((parseFloat(rct) * pctProt) / 100 / 4).toFixed(1).toString(),
            cho: ((parseFloat(rct) * pctCho) / 100 / 4).toFixed(1).toString(),
            fat: ((parseFloat(rct) * pctLip) / 100 / 9).toFixed(1).toString()
          });
        } else if (found.formulas) {
          setFormulas(found.formulas);
        }
      }
    };
    loadPatient();
  }, [params.id]);

  const menu = menus[activeDay];

  const previousControl = patient?.history && patient.history.length > 0
    ? patient.history[patient.history.length - 1]
    : null;

  const clinical = patient ? calculateClinicalData({
    weight: patient.details?.weight,
    height: patient.details?.height,
    sex: patient.details?.gender || 'female',
    manualPi: patient.details?.manualPi,
    manualPa: patient.details?.manualPa,
    manualPc: patient.details?.manualPc
  }) : null;

  const evalFormula = (str) => {
    if (!str) return 0;
    try { return eval(str.replace(/[^0-9+*/().-]/g, '')) || 0; } catch { return 0; }
  };

  const applyTemplate = (key) => {
    const t = DISTRIBUTION_TEMPLATES[key];
    const rct = evalFormula(formulas.kcal) || 1700;
    setFormulas({
      kcal: rct.toString(),
      prot: `(${rct} * ${t.prot / 100}) / 4`,
      cho: `(${rct} * ${t.cho / 100}) / 4`,
      fat: `(${rct} * ${t.fat / 100}) / 9`
    });
  };

  const updatePortion = (mealKey, groupKey, value) => {
    setMenus(prev => ({
      ...prev,
      [activeDay]: {
        ...prev[activeDay],
        [mealKey]: {
          ...prev[activeDay][mealKey],
          portions: { ...prev[activeDay][mealKey].portions, [groupKey]: value }
        }
      }
    }));
  };

  const autoFillPortions = (mealKey, targets) => {
    let { kcal, prot, cho, fat } = targets;
    const newPortions = { cereales: 0, proteinas: 0, vegetales: 0, frutas: 0, lacteos: 0, grasas: 0 };
    if (prot > 0) newPortions.proteinas = Math.floor(prot / getExchangeGroup('proteinas').prot);
    if (cho > 0) {
      newPortions.cereales = Math.floor((cho * 0.7) / getExchangeGroup('cereales').cho);
      newPortions.frutas = Math.floor((cho * 0.3) / getExchangeGroup('frutas').cho);
    }
    if (fat > 0) newPortions.grasas = Math.floor(fat / getExchangeGroup('grasas').fat);
    newPortions.vegetales = 1;

    Object.entries(newPortions).forEach(([group, val]) => {
      updatePortion(mealKey, group, val.toString());
    });
    setMealCalculators({...mealCalculators, [mealKey]: null});
  };

  const getSuggestedPortions = () => {
    const targetProt = evalFormula(formulas.prot) || 0;
    const targetCho = evalFormula(formulas.cho) || 0;
    const targetFat = evalFormula(formulas.fat) || 0;

    const exLacteos = getExchangeGroup('lacteos');
    const exVeg = getExchangeGroup('vegetales');
    const exFrutas = getExchangeGroup('frutas');
    const exCer = getExchangeGroup('cereales');
    const exProt = getExchangeGroup('proteinas');
    const exGrasas = getExchangeGroup('grasas');

    const lacteosPortions = 1;
    const vegPortions = 2;

    const remainingProt = targetProt - (lacteosPortions * exLacteos.prot + vegPortions * exVeg.prot);
    const protPortions = Math.max(0, Math.floor(remainingProt / exProt.prot));

    const remainingCho = targetCho - (lacteosPortions * exLacteos.cho + vegPortions * exVeg.cho);
    const frutasPortions = Math.max(0, Math.floor((remainingCho * 0.3) / exFrutas.cho));
    const cerealesPortions = Math.max(0, Math.floor((remainingCho * 0.7) / exCer.cho));

    const remainingFat = targetFat - (lacteosPortions * exLacteos.fat + vegPortions * exVeg.fat + protPortions * exProt.fat);
    const grasasPortions = Math.max(0, Math.floor(remainingFat / exGrasas.fat));

    return {
      lacteos: lacteosPortions,
      vegetales: vegPortions,
      proteinas: protPortions,
      frutas: frutasPortions,
      cereales: cerealesPortions,
      grasas: grasasPortions
    };
  };

  const autoDistributeAll = () => {
    const suggested = getSuggestedPortions();
    const mainMeals = ['desayuno', 'almuerzo', 'cena'].filter(k => mealTypes.some(m => m.key === k));
    const snackMeals = ['meriendaAM', 'meriendaPM', 'snackNoche'].filter(k => mealTypes.some(m => m.key === k));

    const newPortions = {};
    mealTypes.forEach(m => {
       newPortions[m.key] = { cereales: 0, proteinas: 0, vegetales: 0, frutas: 0, lacteos: 0, grasas: 0 };
    });

    const hasSnacks = snackMeals.length > 0;
    const hasMains = mainMeals.length > 0;

    if (hasMains) {
       const p_main = Math.floor(suggested.proteinas / mainMeals.length);
       const g_main = Math.floor(suggested.grasas / mainMeals.length);
       const v_main = Math.max(1, Math.floor(suggested.vegetales / Math.max(1, mainMeals.filter(m => m === 'almuerzo' || m === 'cena').length)));
       
       const cerealesRatio = hasSnacks ? 0.6 : 1.0;
       const c_main = Math.max(0, Math.floor((suggested.cereales * cerealesRatio) / mainMeals.length));

       mainMeals.forEach(m => {
          newPortions[m].proteinas = p_main;
          newPortions[m].grasas = g_main;
          newPortions[m].cereales = c_main;
          if (m === 'almuerzo' || m === 'cena') newPortions[m].vegetales = v_main;
       });

       if (!hasSnacks) {
          const f_main = Math.floor(suggested.frutas / mainMeals.length);
          const l_main = Math.floor(suggested.lacteos / mainMeals.length) || (suggested.lacteos > 0 ? 1 : 0);
          mainMeals.forEach((m, idx) => {
             newPortions[m].frutas = f_main;
             if (idx === 0) newPortions[m].lacteos = l_main; 
          });
       }
    }

    if (hasSnacks) {
       const f_snack = Math.floor(suggested.frutas / snackMeals.length) || (suggested.frutas > 0 ? 1 : 0);
       const c_snack = Math.floor((suggested.cereales * (hasMains ? 0.4 : 1.0)) / snackMeals.length);

       snackMeals.forEach(m => {
          newPortions[m].frutas = f_snack;
          newPortions[m].cereales = c_snack;
       });
       if (snackMeals.length > 0) newPortions[snackMeals[0]].lacteos = suggested.lacteos > 0 ? 1 : 0;
       
       if (!hasMains) {
           const p_snack = Math.floor(suggested.proteinas / snackMeals.length);
           const g_snack = Math.floor(suggested.grasas / snackMeals.length);
           snackMeals.forEach(m => {
              newPortions[m].proteinas = p_snack;
              newPortions[m].grasas = g_snack;
           });
       }
    }

    setMenus(prev => ({
      ...prev,
      [activeDay]: {
         ...prev[activeDay],
         ...Object.fromEntries(Object.entries(newPortions).map(([k, v]) => [k, { ...prev[activeDay][k], portions: v }]))
      }
    }));
    showToast('Porciones distribuidas automáticamente', 'success');
  };

  const autoFillMealWithFoods = (mealKey) => {
    const mealData = menu[mealKey];
    const portions = mealData.portions || {};
    
    const isBreakfastOrDinner = mealKey === 'desayuno' || mealKey === 'cena';
    const isLunch = mealKey === 'almuerzo';
    
    const mapping = {
      cereales: isBreakfastOrDinner ? 'c_106' : (isLunch ? 'c_109' : 'c_155'),
      proteinas: isBreakfastOrDinner ? 'p_186' : (isLunch ? 'p_172' : 'p_180'),
      vegetales: 'v_55',
      frutas: isBreakfastOrDinner ? 'f_76' : (isLunch ? 'f_98' : 'f_60'),
      lacteos: isBreakfastOrDinner ? 'l_5' : 'l_2',
      grasas: isBreakfastOrDinner ? 'g_198' : 'g_195',
    };

    let updatedFoods = [...(mealData.selectedFoods || [])];
    let addedCount = 0;
    
    Object.entries(portions).forEach(([groupKey, portionVal]) => {
      const pVal = parseFloat(portionVal) || 0;
      if (pVal > 0) {
        const recommendedId = mapping[groupKey];
        const foodItem = foodDB.find(f => f.id === recommendedId) || foodDB.find(f => f.groupKey === groupKey);
        if (foodItem) {
          const existingIdx = updatedFoods.findIndex(f => f.id === foodItem.id);
          if (existingIdx !== -1) {
            updatedFoods[existingIdx] = { ...updatedFoods[existingIdx], qty: pVal };
          } else {
            updatedFoods.push({ ...foodItem, instanceId: Date.now() + Math.random(), qty: pVal });
          }
          addedCount++;
        }
      }
    });

    if (addedCount === 0) {
      return showToast('Primero define alguna ración/porción en el Paso 1 para esta comida.', 'info');
    }

    setMenus(prev => ({
      ...prev,
      [activeDay]: {
        ...prev[activeDay],
        [mealKey]: { ...mealData, selectedFoods: updatedFoods }
      }
    }));
    showToast(`Alimentos autocompletados para ${mealKey === 'desayuno' ? 'el Desayuno' : mealKey === 'almuerzo' ? 'el Almuerzo' : mealKey === 'cena' ? 'la Cena' : 'la Merienda'}`, 'success');
  };

  const getPlannedTotals = () => {
    let kcal = 0, prot = 0, cho = 0, fat = 0;
    mealTypes.forEach(mealDef => {
      const m = menu[mealDef.key];
      if (!m) return;
      Object.entries(m.portions || {}).forEach(([group, amount]) => {
        const a = parseFloat(amount) || 0;
        const exchange = getExchangeGroup(group);
        if (exchange) {
          kcal += a * exchange.kcal;
          prot += a * exchange.prot;
          cho += a * exchange.cho;
          fat += a * exchange.fat;
        }
      });
    });
    return { kcal, prot, cho, fat };
  };

  const getLiveRemaining = () => {
    const targetKcal = evalFormula(formulas.kcal) || 0;
    const targetProt = evalFormula(formulas.prot) || 0;
    const targetCho = evalFormula(formulas.cho) || 0;
    const targetFat = evalFormula(formulas.fat) || 0;

    let consumedProt = 0;
    let consumedCho = 0;
    let consumedFat = 0;
    let choBeforeCereales = 0;

    mealTypes.forEach(mealDef => {
      const m = menu[mealDef.key];
      if (!m) return;
      Object.entries(m.portions || {}).forEach(([group, amount]) => {
        const a = parseFloat(amount) || 0;
        const exchange = getExchangeGroup(group);
        if (exchange) {
           consumedProt += a * exchange.prot;
           consumedCho += a * exchange.cho;
           consumedFat += a * exchange.fat;
           
           if (['lacteos', 'vegetales', 'frutas'].includes(group)) {
              choBeforeCereales += a * exchange.cho;
           }
        }
      });
    });

    const choRestanteAntesDeCereales = targetCho - choBeforeCereales;
    const suggestedCereales = Math.max(0, Math.floor(choRestanteAntesDeCereales / 15));

    return {
      target: { prot: targetProt, cho: targetCho, fat: targetFat, kcal: targetKcal },
      consumed: { prot: consumedProt, cho: consumedCho, fat: consumedFat },
      remaining: {
        prot: targetProt - consumedProt,
        cho: targetCho - consumedCho,
        fat: targetFat - consumedFat
      },
      suggestedCereales
    };
  };

  const totals = getPlannedTotals();
  const liveCalc = getLiveRemaining();

  const handleSave = async () => {
    if (!patient) return showToast('Paciente no cargado correctamente.', 'error');
    
    const rctVal = evalFormula(formulas.kcal) || 1700;
    const protGrams = evalFormula(formulas.prot) || 0;
    const choGrams = evalFormula(formulas.cho) || 0;
    const fatGrams = evalFormula(formulas.fat) || 0;

    const calculatedPctProt = Math.min(100, Math.round((protGrams * 4 * 100) / rctVal)) || 20;
    const calculatedPctCho = Math.min(100, Math.round((choGrams * 4 * 100) / rctVal)) || 50;

    const updatedDietForm = {
      ...patient.dietForm,
      rct: rctVal.toString(),
      pctProt: calculatedPctProt,
      pctCho: calculatedPctCho
    };

    const finalFormulas = {
      kcal: rctVal.toString(),
      prot: protGrams.toFixed(1),
      cho: choGrams.toFixed(1),
      fat: fatGrams.toFixed(1)
    };

    const updatedDetails = {
      ...patient.details,
      mealPlan: mealPlanKey
    };

    try {
      await updatePatient(patient.id, {
        details: updatedDetails,
        menus: menus,
        menu: menus.day1, // Compatibilidad con vistas simples heredadas
        formulas: finalFormulas,
        dietForm: updatedDietForm
      });
      showToast('Plan nutricional guardado con éxito', 'success');
      router.back();
    } catch (err) {
      showToast('Error al guardar plan nutricional', 'error');
    }
  };

  const handleItemPortionChange = (mealKey, instanceId, newValue) => {
    setMenus(prev => {
      const activeMenu = prev[activeDay];
      const meal = activeMenu[mealKey];
      const updatedFoods = meal.selectedFoods.map(f => 
        f.instanceId === instanceId ? { ...f, portion: newValue } : f
      );
      return {
        ...prev,
        [activeDay]: {
          ...activeMenu,
          [mealKey]: { ...meal, selectedFoods: updatedFoods }
        }
      };
    });
  };

  const getUsedPortionsInMeal = (mealKey) => {
    const meal = menu[mealKey];
    const used = { cereales: 0, proteinas: 0, vegetales: 0, frutas: 0, lacteos: 0, grasas: 0 };
    meal.selectedFoods?.forEach(f => {
      if (used[f.groupKey] !== undefined) {
         const num = (parseFloat(f.portion.split(' ')[0]) || 1) * (f.qty || 1);
         used[f.groupKey] += num;
      }
    });
    return used;
  };

  const MEAL_PLANS = {
    '2 comidas': [
      { title: 'Almuerzo', key: 'almuerzo' },
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
    ],
  };

  const mealTypes = MEAL_PLANS[mealPlanKey] || MEAL_PLANS['3+2 snacks'];

  const foodGroups = [
    { name: 'Cereales', color: '#FFA500', key: 'cereales' },
    { name: 'Proteínas', color: '#FF0000', key: 'proteinas' },
    { name: 'Vegetales', color: '#228B22', key: 'vegetales' },
    { name: 'Frutas', color: '#BA55D3', key: 'frutas' },
    { name: 'Lácteos', color: '#1E90FF', key: 'lacteos' },
    { name: 'Grasas', color: '#FFD700', key: 'grasas' }
  ];

  if (!patient) return <div style={{ padding: '20px' }}>Cargando datos del paciente...</div>;

  return (
    <div style={{ padding: '20px', paddingBottom: '220px' }} className="fade-in">
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <button onClick={() => step === 2 ? setStep(1) : router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900' }}>{step === 1 ? 'Paso 1: Definir Porciones' : 'Paso 2: Crear Menú Ejemplo'}</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', paddingLeft: '40px', alignItems: 'center' }}>
          <button 
            onClick={() => setStep(1)}
            style={{ 
              border: 'none',
              cursor: 'pointer',
              padding: '6px 14px',
              background: step === 1 ? 'var(--primary)' : '#eee',
              color: step === 1 ? 'white' : '#888',
              borderRadius: '20px',
              fontSize: '0.65rem',
              fontWeight: '900',
              transition: 'all 0.2s'
            }}
          >
            1. CALCULO
          </button>
          <button 
            onClick={() => setStep(2)}
            style={{ 
              border: 'none',
              cursor: 'pointer',
              padding: '6px 14px',
              background: step === 2 ? 'var(--primary)' : '#eee',
              color: step === 2 ? 'white' : '#888',
              borderRadius: '20px',
              fontSize: '0.65rem',
              fontWeight: '900',
              transition: 'all 0.2s'
            }}
          >
            2. MENU
          </button>
          <div style={{ height: '14px', width: '2px', background: '#ccc', margin: '0 4px' }} />
          <button onClick={() => setActiveDay('day1')} style={{ padding: '6.5px 12px', background: activeDay === 'day1' ? '#1D512D' : 'rgba(0,0,0,0.05)', color: activeDay === 'day1' ? 'white' : '#888', border: 'none', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '950', cursor: 'pointer', transition: 'all 0.2s' }}>☀️ DÍA 1</button>
          <button onClick={() => setActiveDay('day2')} style={{ padding: '6.5px 12px', background: activeDay === 'day2' ? '#1D512D' : 'rgba(0,0,0,0.05)', color: activeDay === 'day2' ? 'white' : '#888', border: 'none', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '950', cursor: 'pointer', transition: 'all 0.2s' }}>🌙 DÍA 2</button>
        </div>
      </header>

      {step === 1 && (
        <div className="fade-in">
          {/* Banner Informativo de Control / Comparativa */}
          {previousControl && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(29, 81, 45, 0.08), rgba(255, 235, 59, 0.1))',
              border: '1px solid rgba(29, 81, 45, 0.2)',
              borderRadius: '16px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Info size={20} color="var(--primary)" />
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--primary)' }}>
                  CONSULTA DE CONTROL EN CURSO
                </p>
                <p style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '2px' }}>
                  Ajusta la fórmula y raciones basándote en la comparativa con el plan anterior del <strong>{previousControl.date}</strong> (en verde).
                </p>
              </div>
            </div>
          )}

          {/* Molécula Calórica Paso 1 */}
          <section className="glass-panel" style={{ padding: '24px', background: 'white', marginBottom: '24px', border: '1px solid rgba(0,0,0,0.1)' }}>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontWeight: '900', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Activity size={18} /> Requerimientos del Día
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select 
                  value={mealPlanKey}
                  onChange={(e) => setMealPlanKey(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontWeight: '900', color: 'var(--primary)', cursor: 'pointer', background: 'white' }}
                >
                  {Object.keys(MEAL_PLANS).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
                </select>
                <button 
                  onClick={autoDistributeAll}
                  style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '900', cursor: 'pointer' }}
                >
                  ⚡ Auto-Distribuir Porciones
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 80px), 1fr))', gap: '12px' }}>
              {[
                { label: 'CALORÍAS', key: 'kcal', prevKey: 'rct' },
                { label: 'PROT (g)', key: 'prot', prevKey: 'prot' },
                { label: 'CHO (g)', key: 'cho', prevKey: 'cho' },
                { label: 'GRASA (g)', key: 'fat', prevKey: 'lip' }
              ].map(m => {
                const prevVal = previousControl?.formulas?.[m.key] || previousControl?.dietForm?.[m.prevKey];
                return (
                  <div key={m.key} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.55rem', fontWeight: '900', opacity: 0.5, marginBottom: '4px' }}>{m.label}</p>
                    <input type="text" value={formulas[m.key]} onChange={e => setFormulas({...formulas, [m.key]: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center', fontSize: '0.8rem', fontWeight: '900' }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: '900', marginTop: '6px', marginBottom: '2px' }}>
                      {totals[m.key].toFixed(0)} <span style={{ opacity: 0.3, fontSize: '0.6rem' }}>/ {evalFormula(formulas[m.key]).toFixed(0)}</span>
                    </p>
                    {previousControl && (
                      <p style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                        Ant: {prevVal ? parseFloat(prevVal).toFixed(0) : '0'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Calculadora en Vivo */}
          <section className="glass-panel" style={{ padding: '20px', background: 'white', marginBottom: '24px', border: '1.5px solid var(--primary)', borderRadius: '16px', position: 'sticky', top: '10px', zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                   <h4 style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '900', marginBottom: '4px' }}>📊 CALCULADORA DE RESTANTE EN VIVO</h4>
                   <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Prioridad: Lácteos → Veg → Frutas → Cereales → Carnes → Grasas</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                   <select value={lacteosTipo} onChange={e => setLacteosTipo(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontWeight: '800' }}>
                     <option value="bajaGrasa1">Lácteos: Baja en Grasa (1%)</option>
                     <option value="entera">Lácteos: Entera</option>
                   </select>
                   <select value={proteinasTipo} onChange={e => setProteinasTipo(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontWeight: '800' }}>
                     <option value="magra">Carnes: Magra</option>
                     <option value="semigorda">Carnes: Semi Gorda</option>
                     <option value="gorda">Carnes: Gorda</option>
                   </select>
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {['cho', 'prot', 'fat'].map(macro => {
                   const isNegative = liveCalc.remaining[macro] < 0;
                   return (
                     <div key={macro} style={{ textAlign: 'center', background: '#f8f9fa', padding: '12px', borderRadius: '12px', border: isNegative ? '1.5px solid #EF5350' : '1px solid #eee' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.5, marginBottom: '6px', textTransform: 'uppercase' }}>{macro === 'cho' ? 'Carbohidratos' : macro === 'prot' ? 'Proteínas' : 'Grasas'}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                           <span style={{ opacity: 0.6 }}>Objetivo:</span>
                           <strong>{liveCalc.target[macro].toFixed(0)}g</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' }}>
                           <span style={{ opacity: 0.6 }}>Consumido:</span>
                           <strong>{liveCalc.consumed[macro].toFixed(1)}g</strong>
                        </div>
                        <div style={{ paddingTop: '8px', borderTop: '1px solid #ddd', color: isNegative ? '#EF5350' : 'var(--primary)' }}>
                           <span style={{ fontSize: '0.9rem', fontWeight: '900' }}>{liveCalc.remaining[macro] > 0 ? '+' : ''}{liveCalc.remaining[macro].toFixed(1)}g</span>
                           {isNegative && <p style={{ fontSize: '0.6rem', marginTop: '2px' }}>Te pasaste por {Math.abs(liveCalc.remaining[macro]).toFixed(1)}g</p>}
                        </div>
                     </div>
                   );
                })}
                <div style={{ textAlign: 'center', background: 'var(--card-green-light)', padding: '12px', borderRadius: '12px', border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                   <p style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '8px' }}>SUGERIDO CEREALES</p>
                   <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)' }}>{liveCalc.suggestedCereales}</p>
                   <p style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '4px' }}>raciones (según CHO libre)</p>
                </div>
             </div>
          </section>

          {/* Grid de Porciones por Comida */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mealTypes.map(meal => (
              <div key={meal.key} className="glass-panel" style={{ padding: '16px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--primary)' }}>{meal.title}</h3>
                  <button onClick={() => setMealCalculators({...mealCalculators, [meal.key]: mealCalculators[meal.key] ? null : { kcal: '', prot: '', cho: '', fat: '' }})} style={{ background: 'var(--card-green-light)', border: 'none', color: 'var(--primary)', fontSize: '0.65rem', padding: '4px 10px', borderRadius: '6px', fontWeight: '900' }}>+ Fórmula Local</button>
                </div>
                
                {mealCalculators[meal.key] && (
                  <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {['kcal', 'prot', 'cho', 'fat'].map(f => (
                      <input key={f} type="text" placeholder={f.toUpperCase()} value={mealCalculators[meal.key][f]} onChange={e => setMealCalculators({...mealCalculators, [meal.key]: {...mealCalculators[meal.key], [f]: e.target.value}})} style={{ width: '100%', padding: '4px', fontSize: '0.65rem', borderRadius: '4px', border: '1px solid #ddd' }} />
                    ))}
                    <button onClick={() => autoFillPortions(meal.key, { kcal: evalFormula(mealCalculators[meal.key].kcal), prot: evalFormula(mealCalculators[meal.key].prot), cho: evalFormula(mealCalculators[meal.key].cho), fat: evalFormula(mealCalculators[meal.key].fat) })} style={{ gridColumn: 'span 4', background: 'var(--primary)', color: 'white', border: 'none', padding: '6px', fontSize: '0.7rem', fontWeight: '900', borderRadius: '4px' }}>Distribuir Porciones</button>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 65px), 1fr))', gap: '6px' }}>
                  {foodGroups.map(group => {
                    const prevPortion = previousControl?.menus?.[meal.key]?.portions?.[group.key] || previousControl?.menu?.[meal.key]?.portions?.[group.key];
                    return (
                      <div key={group.key} style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.5rem', fontWeight: '900', opacity: 0.4, marginBottom: '2px' }}>{group.name.substring(0,3).toUpperCase()}</p>
                        <input type="number" step="0.5" value={menu[meal.key].portions?.[group.key] || ''} onChange={e => updatePortion(meal.key, group.key, e.target.value)} style={{ width: '100%', textAlign: 'center', fontSize: '0.9rem', fontWeight: '900', border: '1px solid #eee', borderRadius: '6px', padding: '4px' }} placeholder="0" />
                        {previousControl && prevPortion && parseFloat(prevPortion) > 0 && (
                          <p style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: '800', marginTop: '2.5px' }}>
                            Ant: {prevPortion}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '24px', background: 'white', borderTop: '1px solid #eee', zIndex: 100 }}>
             <button onClick={() => setStep(2)} className="btn-primary" style={{ width: '100%', padding: '18px', borderRadius: '16px', fontWeight: '900', fontSize: '1.1rem' }}>
               Continuar a Creación de Menú →
             </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in">
          <section className="glass-panel" style={{ padding: '20px', background: 'var(--card-yellow-light)', marginBottom: '24px', border: '1.5px dashed var(--accent)', borderRadius: '16px' }}>
             <h4 style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '900', marginBottom: '10px' }}>📊 SEGUIMIENTO DE RACIONES</h4>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {foodGroups.map(g => {
                   let defined = 0;
                   let used = 0;
                   Object.keys(menu).forEach(mKey => {
                      defined += parseFloat(menu[mKey].portions?.[g.key]) || 0;
                      menu[mKey].selectedFoods?.forEach(f => {
                         if (f.groupKey === g.key) {
                           const portionValue = parseFloat(f.portion.split(' ')[0]) || 1;
                           used += portionValue * (f.qty || 1);
                         }
                      });
                   });
                   const isOver = used > defined;
                   return (
                     <div key={g.key} style={{ textAlign: 'center', background: 'white', padding: '8px', borderRadius: '8px', border: isOver ? '1.5px solid #ff4444' : '1px solid #eee' }}>
                        <p style={{ fontSize: '0.6rem', fontWeight: '900', color: g.color }}>{g.name.toUpperCase()}</p>
                        <p style={{ fontSize: '0.85rem', fontWeight: '900', color: isOver ? '#ff4444' : '#333' }}>
                           {used.toFixed(1).replace('.0', '')} <span style={{ opacity: 0.3, fontSize: '0.6rem' }}>/ {defined}</span>
                        </p>
                        {isOver && <div style={{ width: '6px', height: '6px', background: '#ff4444', borderRadius: '50%', margin: '4px auto 0' }} />}
                     </div>
                   );
                })}
             </div>
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {mealTypes.map(meal => {
              const mealData = menu[meal.key];
              return (
                <div key={meal.key} className="glass-panel" style={{ padding: '20px', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: '900', color: 'var(--primary)' }}>{meal.title}</h3>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {foodGroups.map(g => mealData.portions?.[g.key] > 0 && (
                        <div key={g.key} style={{ fontSize: '0.6rem', fontWeight: '900', padding: '2px 6px', background: `${g.color}15`, color: g.color, borderRadius: '4px' }}>
                          {g.name}: {mealData.portions[g.key]}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Fila de sugerencias y autocompletados mágicos */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setExpandedSuggestions(prev => ({ ...prev, [meal.key]: !prev[meal.key] }))}
                        style={{
                          background: 'rgba(29, 81, 45, 0.08)',
                          color: 'var(--primary)',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          fontWeight: '900',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          outline: 'none'
                        }}
                      >
                        <span>✨ {expandedSuggestions[meal.key] ? 'Ocultar sugerencia' : 'Sugerir combinación de plato'}</span>
                      </button>

                      <button 
                        onClick={() => autoFillMealWithFoods(meal.key)}
                        style={{
                          background: 'rgba(253, 158, 20, 0.1)',
                          color: 'var(--accent)',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          fontWeight: '900',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          outline: 'none'
                        }}
                      >
                        <span>⚡ Autocompletar con alimentos sugeridos</span>
                      </button>
                    </div>

                    {expandedSuggestions[meal.key] && (
                      <div className="fade-in" style={{
                        marginTop: '8px',
                        background: '#f9f8ee',
                        borderLeft: '4px solid var(--primary)',
                        padding: '12px 14px',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                        lineHeight: '1.4',
                        fontWeight: '700'
                      }}>
                        {suggestRecipesForPortions(mealData.portions)}
                      </div>
                    )}
                  </div>

                  {/* Recetas Frecuentes Movido al Paso 2 */}
                  <div style={{ marginBottom: '16px', background: '#f9f9f9', padding: '12px', borderRadius: '12px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.6 }}>🍱 Recetas Frecuentes:</span>
                      <select
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const r = [...PRESET_RECIPES, ...customRecipes].find(item => item.name === e.target.value);
                          if (r) {
                            Object.entries(r.portions).forEach(([gk, val]) => {
                              updatePortion(meal.key, gk, val.toString());
                            });
                            showToast('Porciones precargadas para ' + r.name, 'success');
                            e.target.value = '';
                          }
                        }}
                        style={{ flex: 1, padding: '4px 8px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #ccc', background: 'white' }}
                      >
                        <option value="">-- Cargar Sugerencia/Receta --</option>
                        <optgroup label="Sugerencias del Sistema">
                          {PRESET_RECIPES.map(p => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                          ))}
                        </optgroup>
                        {customRecipes.length > 0 && (
                          <optgroup label="Tus Recetas Personalizadas">
                            {customRecipes.map(c => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Guardar actual como: Ej. Tortilla Fit de Claras" 
                        value={recipeNames[meal.key] || ''}
                        onChange={(e) => setRecipeNames({...recipeNames, [meal.key]: e.target.value})}
                        style={{ flex: 1, padding: '4px 8px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #eee' }} 
                      />
                      <button 
                        onClick={async () => {
                          const name = recipeNames[meal.key];
                          if (!name) return showToast('Escribe un nombre para guardar la receta', 'warning');
                          
                          const currentMealPortions = menu[meal.key].portions || {};
                          const recipePortions = {
                            cereales: parseFloat(currentMealPortions.cereales) || 0,
                            proteinas: parseFloat(currentMealPortions.proteinas) || 0,
                            vegetales: parseFloat(currentMealPortions.vegetales) || 0,
                            frutas: parseFloat(currentMealPortions.frutas) || 0,
                            lacteos: parseFloat(currentMealPortions.lacteos) || 0,
                            grasas: parseFloat(currentMealPortions.grasas) || 0
                          };
                          
                          const newRecipe = { name, portions: recipePortions };
                          
                          const { error } = await supabase.from('custom_recipes').insert([newRecipe]);
                          
                          if (error) {
                            showToast('Error al guardar en la nube', 'error');
                            console.error(error);
                            return;
                          }

                          const updatedRecipes = [...customRecipes, newRecipe];
                          setCustomRecipes(updatedRecipes);
                          setRecipeNames({...recipeNames, [meal.key]: ''});
                          showToast(`Receta "${name}" guardada con éxito en la nube`, 'success');
                        }}
                        style={{ background: '#1D512D', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.7rem', fontWeight: '800', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Guardar
                      </button>
                    </div>
                  </div>

                  {/* Buscador de Alimentos para el Menú */}
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#f9f9f9', borderRadius: '12px', padding: '0 12px', border: '1px solid #eee' }}>
                      <Search size={16} opacity={0.3} />
                      <input type="text" placeholder={`¿Qué comerá en el ${meal.title}?`} value={searchTerms[meal.key] || ''} onChange={e => setSearchTerms({...searchTerms, [meal.key]: e.target.value})} style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', fontSize: '0.85rem', background: 'none' }} />
                    </div>

                    <div style={{ marginTop: '8px', padding: '10px', background: '#fcfcfc', border: '1px solid #eee', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: '850', opacity: 0.7 }}>➕ Crear alimento custom:</span>
                      <input 
                        type="text" 
                        placeholder="Nombre, arepa..." 
                        value={quickFoodName} 
                        onChange={(e) => setQuickFoodName(e.target.value)} 
                        style={{ padding: '4.5px 8px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #ddd', flex: 1, minWidth: '120px' }} 
                      />
                      <select 
                        value={quickFoodGroup} 
                        onChange={(e) => setQuickFoodGroup(e.target.value)} 
                        style={{ padding: '4.5px 8px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #ddd', background: 'white' }}
                      >
                        <option value="cereales">Cereales</option>
                        <option value="proteinas">Proteína</option>
                        <option value="vegetales">Veg</option>
                        <option value="frutas">Fruta</option>
                        <option value="lacteos">Lácteo</option>
                        <option value="grasas">Grasa</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Porción..." 
                        value={quickFoodPortion} 
                        onChange={(e) => setQuickFoodPortion(e.target.value)} 
                        style={{ padding: '4.5px 8px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #ddd', width: '80px' }} 
                      />
                      <button
                        onClick={() => {
                          if (!quickFoodName) return showToast('Escribe el nombre del alimento', 'warning');
                          
                          const newFood = {
                            id: `custom-${Date.now()}`,
                            name: quickFoodName,
                            groupKey: quickFoodGroup,
                            portion: quickFoodPortion
                          };
                          
                          setFoodDB(prev => [...prev, newFood]);
                          
                          const savedCustom = JSON.parse(localStorage.getItem('nutri_custom_foods') || '[]');
                          localStorage.setItem('nutri_custom_foods', JSON.stringify([...savedCustom, newFood]));
                          
                          const targetQty = parseFloat(mealData.portions?.[quickFoodGroup]) || 1;
                          const updatedFoods = [...(mealData.selectedFoods || []), { ...newFood, instanceId: Date.now(), qty: targetQty }];
                          
                          setMenus({
                            ...menus,
                            [activeDay]: {
                              ...menus[activeDay],
                              [meal.key]: { ...mealData, selectedFoods: updatedFoods }
                            }
                          });
                          
                          setQuickFoodName('');
                          showToast(`"${quickFoodName}" guardado e inyectado`, 'success');
                        }}
                        style={{ padding: '6px 12px', background: '#1D512D', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '850', cursor: 'pointer' }}
                      >
                        Crear e Insertar
                      </button>
                    </div>
                    
                    {searchTerms[meal.key] && (
                       <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', marginTop: '4px' }}>
                         {foodDB.filter(f => f.name.toLowerCase().includes(searchTerms[meal.key].toLowerCase())).map(food => (
                            <div key={food.id} onClick={() => {
                              const existingIdx = mealData.selectedFoods?.findIndex(f => f.id === food.id);
                              let updatedFoods;
                              if (existingIdx !== undefined && existingIdx !== -1) {
                                // Incrementar cantidad
                                updatedFoods = [...mealData.selectedFoods];
                                updatedFoods[existingIdx] = { ...updatedFoods[existingIdx], qty: (updatedFoods[existingIdx].qty || 1) + 1 };
                              } else {
                                // Agregar nuevo autorellenando la porción en base a las raciones objetivo
                                const targetQty = parseFloat(mealData.portions?.[food.groupKey]) || 1;
                              updatedFoods = [...(mealData.selectedFoods || []), { ...food, instanceId: Date.now(), qty: targetQty }];
                            }
                            setMenus({
                              ...menus,
                              [activeDay]: {
                                ...menus[activeDay],
                                [meal.key]: { ...mealData, selectedFoods: updatedFoods }
                              }
                            });
                            setSearchTerms({...searchTerms, [meal.key]: ''});
                            showToast(`${food.name} agregado`, 'success');
                          }} style={{ padding: '12px 16px', borderBottom: '1px solid #f9f9f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', color: foodGroups.find(g => g.key === food.groupKey)?.color }}>{food.name}</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{food.portion}</span>
                          </div>
                       ))}
                     </div>
                  )}
                </div>

                {/* Visualización del Menú Ejemplo con edición de porción */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   {mealData.selectedFoods?.map(item => {
                     const group = foodGroups.find(g => g.key === item.groupKey);
                     return (
                      <div key={item.instanceId} style={{ background: '#f5f5f5', padding: '10px 14px', borderRadius: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '12px', border: `1px solid ${group.color}20` }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: group.color }}></div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: '900', color: group.color, fontSize: '0.9rem' }}>{item.name}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6, fontWeight: '700' }}>P. Base: {item.portion}</p>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '4px 8px', borderRadius: '10px', border: '1px solid #eee' }}>
                          <button 
                            onClick={() => {
                              const updatedFoods = mealData.selectedFoods.map(f => 
                                f.instanceId === item.instanceId ? { ...f, qty: Math.max(1, (f.qty || 1) - 1) } : f
                              );
                              setMenus({
                                ...menus,
                                [activeDay]: {
                                  ...menus[activeDay],
                                  [meal.key]: { ...mealData, selectedFoods: updatedFoods }
                                }
                              });
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '900', cursor: 'pointer', padding: '4px' }}
                          >-</button>
                          <span style={{ fontWeight: '900', fontSize: '0.9rem', minWidth: '15px', textAlign: 'center' }}>{item.qty || 1}</span>
                          <button 
                            onClick={() => {
                              const updatedFoods = mealData.selectedFoods.map(f => 
                                f.instanceId === item.instanceId ? { ...f, qty: (f.qty || 1) + 1 } : f
                              );
                              setMenus({
                                ...menus,
                                [activeDay]: {
                                  ...menus[activeDay],
                                  [meal.key]: { ...mealData, selectedFoods: updatedFoods }
                                }
                              });
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '900', cursor: 'pointer', padding: '4px' }}
                          >+</button>
                        </div>

                        <button onClick={() => {
                          const updatedFoods = mealData.selectedFoods.filter(f => f.instanceId !== item.instanceId);
                          setMenus({
                            ...menus,
                            [activeDay]: {
                              ...menus[activeDay],
                              [meal.key]: { ...mealData, selectedFoods: updatedFoods }
                            }
                          });
                        }} style={{ background: 'rgba(255,0,0,0.05)', border: 'none', color: '#ff4444', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
                      </div>
                     );
                   })}
                  </div>

                  {(() => {
                    const targets = mealData.portions || {};
                    const used = getUsedPortionsInMeal(meal.key);
                    const missing = [];
                    
                    Object.keys(targets).forEach(gKey => {
                      const tgt = parseFloat(targets[gKey]) || 0;
                      const usd = used[gKey] || 0;
                      if (tgt > usd) {
                        const groupName = foodGroups.find(g => g.key === gKey)?.name || gKey;
                        missing.push(`${(tgt - usd).toFixed(1).replace('.0', '')} ${groupName}`);
                      }
                    });
                    
                    const hasTargets = Object.values(targets).some(t => parseFloat(t) > 0);
                    if (!hasTargets) return null;
                    
                    return (
                      <div style={{ 
                        marginTop: '15px', 
                        padding: '10px 12px', 
                        borderRadius: '12px', 
                        background: missing.length === 0 ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.08)',
                        border: missing.length === 0 ? '1px solid #2ecc71' : '1px solid rgba(231, 76, 60, 0.2)',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: missing.length === 0 ? '#27ae60' : '#c0392b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {missing.length === 0 ? (
                          <>
                            <CheckCircle size={14} />
                            <span>✔ ¡Raciones objetivo cubiertas con éxito!</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} />
                            <span>Pendiente: {missing.join(', ')}</span>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {/* Vista Previa del Menú en Tabla (Live - Mejorada para Celular) */}
          <section style={{ 
            marginTop: '40px', 
            marginRight: '-20px', 
            marginLeft: '-20px', 
            padding: '20px',
            background: 'white', 
            borderTop: '3px solid var(--primary)',
            borderBottom: '3px solid var(--primary)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase' }}>VISTA PREVIA DEL INFORME</h4>
                <div style={{ fontSize: '0.65rem', fontWeight: '800', background: 'var(--card-green-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '10px' }}>
                  Desliza para ver todo →
                </div>
             </div>

             <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '950px', tableLayout: 'fixed', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: 'var(--primary)', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                          {mealTypes.map(m => (
                            <th key={m.key} style={{ padding: '15px 10px', fontSize: '0.9rem', fontWeight: '900', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', textTransform: 'uppercase' }}>
                              {m.title}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                       {Array.from({ length: Math.max(...Object.values(menu).map(m => m.selectedFoods?.length || 0), 1) }).map((_, rowIdx) => (
                          <tr key={rowIdx}>
                            {mealTypes.map(meal => {
                                const food = menu[meal.key].selectedFoods?.[rowIdx];
                                if (!food) return <td key={meal.key} style={{ padding: '15px 12px', border: '1px solid #eee', verticalAlign: 'top', height: '140px' }}><div style={{ opacity: 0.1, fontSize: '0.8rem', textAlign: 'center', paddingTop: '40px' }}>-</div></td>;
                                
                                const group = foodGroups.find(g => g.key === food.groupKey);
                                // Lógica inteligente de porción: si es 1, mostrar normal. Si es > 1, mostrar "X porciones de Y (Total)"
                                const basePortionVal = parseFloat(food.portion.split(' ')[0]) || 1;
                                const unit = food.portion.split(' ').slice(1).join(' ');
                                const totalVal = basePortionVal * (food.qty || 1);
                                
                                return (
                                  <td key={meal.key} style={{ padding: '15px 12px', border: '1px solid #eee', verticalAlign: 'top', height: '140px' }}>
                                      <div style={{ fontSize: '0.85rem', borderLeft: `5px solid ${group.color}`, paddingLeft: '10px' }}>
                                          <p style={{ margin: '0 0 4px 0', fontWeight: '900', color: group.color, fontSize: '1rem' }}>
                                            {totalVal.toFixed(1).replace('.0', '')} {unit}
                                          </p>
                                          <p style={{ margin: 0, fontWeight: '700', color: '#111', lineHeight: '1.2' }}>{food.name}</p>
                                          {(food.qty > 1) && <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', opacity: 0.4, fontWeight: '800' }}>({food.qty} raciones de {food.portion})</p>}
                                      </div>
                                  </td>
                                );
                            })}
                          </tr>
                       ))}
                    </tbody>
                </table>
             </div>
          </section>

          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '24px', background: 'white', borderTop: '1px solid #eee', zIndex: 100, display: 'flex', gap: '12px' }}>
             <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, padding: '18px', borderRadius: '16px', fontWeight: '900' }}>← Volver</button>
             <button onClick={handleSave} className="btn-primary" style={{ flex: 2, padding: '18px', borderRadius: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
               <SaveAll size={20} /> Finalizar y Guardar Plan
             </button>
          </div>
        </div>
      )}
    </div>
  );
}


