export const isMaleGender = (sex) => {
  if (!sex) return false;
  const s = sex.toLowerCase().trim();
  return ['male', 'm', 'h', 'hombre', 'hombres', 'masculino'].includes(s);
};

export const calculateClinicalData = (patient, measurements = {}) => {
  const weight = parseFloat(patient.weight) || 0;
  const heightCm = parseFloat(patient.height) || 0;
  const heightM = heightCm / 100;
  const sex = (patient.sex || 'female').toLowerCase();
  const isMale = isMaleGender(sex);
  const rawAge = parseFloat(patient.age);
  const isPediatric = Boolean(patient.isPediatric) || (!isNaN(rawAge) && rawAge > 0 && rawAge < 18);

  const imc = heightM > 0 && weight > 0 ? (weight / (heightM * heightM)) : 0;
  
  // ── PROTECCIÓN PEDIÁTRICA ──
  // Los pacientes pediátricos NO deben recibir automáticamente diagnósticos ni fórmulas adultas.
  if (isPediatric) {
    return {
      imc: imc > 0 ? imc.toFixed(2) : '—',
      profile: 'PEDIÁTRICO (Evaluar con Percentiles/Z-Score OMS)',
      pi: 'Requiere percentiles OMS',
      pa: 'No aplica en pediatría',
      pc: weight > 0 ? weight.toFixed(2) : '—',
      gc: 'Requiere evaluación pediátrica',
      grasaMagra: '—',
      suggestedPi: 'Requiere percentiles OMS',
      suggestedPa: 'No aplica en pediatría',
      suggestedPc: weight > 0 ? weight.toFixed(2) : '—',
      piDevine: 'No aplica (fórmula adulta)',
      piLorentz: 'No aplica (fórmula adulta)',
      isPediatric: true
    };
  }

  let profile = 'Normopeso';
  if (imc < 18.5) profile = 'BAJO PESO';
  else if (imc < 25) profile = 'NORMOPESO';
  else if (imc < 30) profile = 'SOBREPESO';
  else if (imc < 35) profile = 'OBESIDAD GRADO I';
  else if (imc < 40) profile = 'OBESIDAD GRADO II';
  else profile = 'OBESIDAD GRADO III (MÓRBIDA)';

  // Peso Ideal Adulto (Fórmula de Devine)
  // Mujeres: 45.5 + 2.3 * ((Talla_cm / 2.54) - 60)
  // Hombres: 50.0 + 2.3 * ((Talla_cm / 2.54) - 60)
  const inches = (heightCm / 2.54);
  const baseWeight = isMale ? 50.0 : 45.5;
  let calculatedPi = heightCm > 152.4 ? (baseWeight + 2.3 * (inches - 60)) : baseWeight;

  // Peso Ideal Adulto (Fórmula de Lorentz)
  // Hombres: (Talla - 100) - ((Talla - 150) / 4)
  // Mujeres: (Talla - 100) - ((Talla - 150) / 2.5)
  let calculatedPiLorentz = 0;
  if (heightCm > 0) {
    calculatedPiLorentz = isMale
      ? (heightCm - 100 - ((heightCm - 150) / 4))
      : (heightCm - 100 - ((heightCm - 150) / 2.5));
    if (calculatedPiLorentz < 0) calculatedPiLorentz = 0;
  }

  // Si la nutricionista fijó un PI manual, tiene prioridad
  const pi = patient.manualPi ? parseFloat(patient.manualPi) : calculatedPi;

  // Peso Ajustado (PA) para sobrepeso y obesidad:
  // PA = PI + 0.25 * (Peso Actual - PI)
  let calculatedPa = pi + (0.25 * (weight - pi));
  let calculatedPaLorentz = calculatedPiLorentz > 0 ? calculatedPiLorentz + (0.25 * (weight - calculatedPiLorentz)) : 0;
  
  let pa = 0;
  if (profile === 'SOBREPESO' || profile.startsWith('OBESIDAD')) {
    pa = patient.manualPa ? parseFloat(patient.manualPa) : calculatedPa;
  } else {
    pa = patient.manualPa ? parseFloat(patient.manualPa) : 0;
  }

  // Peso de Cálculo (PC)
  let calculatedPc = weight;
  if (profile === 'BAJO PESO') {
    calculatedPc = pi;
  } else if (profile === 'SOBREPESO' || profile.startsWith('OBESIDAD')) {
    calculatedPc = pa > 0 ? pa : calculatedPa;
  }

  const pc = patient.manualPc ? parseFloat(patient.manualPc) : calculatedPc;

  // % Grasa Corporal Adulto (Fórmula de la Marina de EE. UU. / US Navy Body Fat)
  let gc = 0;
  let grasaMagra = 0;
  const cintura = parseFloat(measurements?.CINTURA) || 0;
  const cuello = parseFloat(measurements?.CUELLO) || 0;
  const cadera = parseFloat(measurements?.CADERA) || 0;

  if (cintura > 0 && cuello > 0 && heightCm > 0) {
    if (isMale) {
      if ((cintura - cuello) > 0) {
        const valLog1 = Math.log10(cintura - cuello);
        const valLog2 = Math.log10(heightCm);
        const denom = 1.0324 - 0.19077 * valLog1 + 0.15456 * valLog2;
        gc = denom > 0 ? (495 / denom) - 450 : 0;
      }
    } else {
      if (cadera > 0 && (cintura + cadera - cuello) > 0) {
        const valLog1 = Math.log10(cintura + cadera - cuello);
        const valLog2 = Math.log10(heightCm);
        const denom = 1.29579 - 0.35004 * valLog1 + 0.22100 * valLog2;
        gc = denom > 0 ? (495 / denom) - 450 : 0;
      }
    }
    if (gc < 0) gc = 0;
    
    if (gc > 0) {
      grasaMagra = weight - (weight * (gc / 100));
    }
  }

  return {
    imc: imc > 0 ? imc.toFixed(2) : '—',
    profile,
    pi: pi > 0 ? pi.toFixed(2) : '—',
    pa: pa > 0 ? pa.toFixed(2) : '—',
    pc: pc > 0 ? pc.toFixed(2) : '—',
    gc: gc > 0 ? gc.toFixed(2) : '—',
    grasaMagra: grasaMagra > 0 ? grasaMagra.toFixed(2) : '—',
    suggestedPi: calculatedPi > 0 ? calculatedPi.toFixed(2) : '—',
    suggestedPa: calculatedPa > 0 ? calculatedPa.toFixed(2) : '—',
    suggestedPc: calculatedPc > 0 ? calculatedPc.toFixed(2) : '—',
    piDevine: calculatedPi > 0 ? calculatedPi.toFixed(2) : '—',
    piLorentz: calculatedPiLorentz > 0 ? calculatedPiLorentz.toFixed(2) : '—',
    paLorentz: calculatedPaLorentz > 0 ? calculatedPaLorentz.toFixed(2) : '—',
    isPediatric: false
  };
};

export const suggestPortionsFromMacros = (targetProt, targetCho, targetFat) => {
  const lacteos = 1;    // Siempre suele ser 1 lácteo
  const vegetales = 2;  // Siempre suele ser 2 vegetales
  const frutas = 2;     // Basado en frutas moderadas por defecto

  // Cálculo de CHO de base
  const choBase = lacteos * 12 + vegetales * 5 + frutas * 15;
  const remainingCho = Math.max(0, targetCho - choBase);
  const cereales = Math.round(remainingCho / 15);

  // Cálculo de Proteína de base
  const protBase = lacteos * 8 + vegetales * 2 + cereales * 2;
  const remainingProt = Math.max(0, targetProt - protBase);
  const proteinas = Math.round(remainingProt / 7);

  // Cálculo de Grasa de base
  const fatBase = lacteos * 5 + proteinas * 3;
  const remainingFat = Math.max(0, targetFat - fatBase);
  const grasas = Math.round(remainingFat / 5);

  return { cereales, proteinas, vegetales, frutas, lacteos, grasas };
};

export const DISTRIBUTION_TEMPLATES = {
  recuperacion: { name: 'Recuperación / Bajo Peso', prot: 18, cho: 50, fat: 32 },
  control: { name: 'Control / Obesidad', prot: 20, cho: 55, fat: 25 },
  mantenimiento: { name: 'Mantenimiento / Estándar', prot: 15, cho: 55, fat: 30 }
};

export const getBodyFatProfile = (sex, age, gc) => {
  const g = (sex || 'female').toLowerCase();
  const a = parseInt(age) || 30;
  const val = parseFloat(gc);
  if (isNaN(val) || val <= 0) return '—';

  const isMale = isMaleGender(g);
  if (!isMale) {
    // Mujeres
    if (a >= 15 && a <= 39) {
      if (val < 16) return 'Bajo en grasa';
      if (val <= 28) return 'Saludable';
      if (val <= 39) return 'Sobrepeso';
      return 'Obesidad';
    } else if (a >= 40 && a <= 59) {
      if (val < 18) return 'Bajo en grasa';
      if (val <= 30) return 'Saludable';
      if (val <= 40) return 'Sobrepeso';
      return 'Obesidad';
    } else {
      if (val < 20) return 'Bajo en grasa';
      if (val <= 32) return 'Saludable';
      if (val <= 42) return 'Sobrepeso';
      return 'Obesidad';
    }
  } else {
    // Hombres
    if (a >= 15 && a <= 39) {
      if (val < 8) return 'Bajo en grasa';
      if (val <= 20) return 'Saludable';
      if (val <= 25) return 'Sobrepeso';
      return 'Obesidad';
    } else if (a >= 40 && a <= 59) {
      if (val < 11) return 'Bajo en grasa';
      if (val <= 22) return 'Saludable';
      if (val <= 28) return 'Sobrepeso';
      return 'Obesidad';
    } else {
      if (val < 13) return 'Bajo en grasa';
      if (val <= 25) return 'Saludable';
      if (val <= 30) return 'Sobrepeso';
      return 'Obesidad';
    }
  }
};

/**
 * Factores de Actividad Física reconocidos clínicamente (FAO/OMS / ADA)
 */
export const ACTIVITY_FACTORS = [
  { key: 'sedentario', label: 'Sedentario (trabajo de escritorio, sin ejercicio estructurado)', factor: 1.2 },
  { key: 'ligero', label: 'Ligero (ejercicio suave / caminata 1-3 días/semana)', factor: 1.375 },
  { key: 'moderado', label: 'Moderado (entrenamiento deportivo 3-5 días/semana)', factor: 1.55 },
  { key: 'intenso', label: 'Intenso (ejercicio vigoroso 6-7 días/semana)', factor: 1.725 },
  { key: 'muy_intenso', label: 'Muy Intenso (atletas de alto rendimiento / doble turno)', factor: 1.9 }
];

/**
 * Cálculo de Tasa Metabólica Basal (TMB)
 * - Mifflin-St Jeor (1990) - Recomendado como gold standard clínico en adultos
 * - Harris-Benedict Revisada (Roza y Shizgal, 1984)
 * 
 * Reglas clínicas obligatorias:
 * 1. Si faltan datos obligatorios (peso, talla o edad), retorna null para reflejar cálculo pendiente (no inventa datos).
 * 2. Protección pediátrica: no aplica fórmulas de adultos a pacientes pediátricos o menores de 18 años.
 * 3. Conserva precisión completa sin redondeos intermedios.
 * 
 * @param {Object} params { weight, height, age, sex, formula, isPediatric }
 * @returns {number|null} TMB en kcal/día con precisión completa
 */
export const calculateTMB = ({ weight, height, age, sex, formula = 'mifflin', isPediatric = false }) => {
  const w = parseFloat(weight);
  const h = parseFloat(height);
  const a = parseFloat(age);
  const isMale = isMaleGender(sex);

  // Validación estricta: datos obligatorios presentes
  if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0 || isNaN(a) || a <= 0) {
    return null; // Datos incompletos
  }

  // Protección pediátrica: fórmulas adultas no aplican a infantes
  if (isPediatric || a < 18) {
    return null; // Requiere evaluación metabólica pediátrica específica
  }

  if (formula === 'harris') {
    // Harris-Benedict Revisada (Roza y Shizgal, 1984)
    return isMale
      ? (88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a))
      : (447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a));
  }

  // Mifflin-St Jeor (1990)
  return isMale
    ? ((10 * w) + (6.25 * h) - (5 * a) + 5)
    : ((10 * w) + (6.25 * h) - (5 * a) - 161);
};

