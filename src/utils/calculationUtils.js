export const calculateClinicalData = (patient, measurements = {}) => {
  const weight = parseFloat(patient.weight) || 0;
  const heightCm = parseFloat(patient.height) || 0;
  const heightM = heightCm / 100;
  const sex = (patient.sex || 'female').toLowerCase();

  const imc = heightM > 0 ? (weight / (heightM * heightM)) : 0;
  
  let profile = 'Normopeso';
  if (imc < 18.5) profile = 'BAJO PESO';
  else if (imc < 25) profile = 'NORMOPESO';
  else if (imc < 30) profile = 'SOBREPESO';
  else if (imc < 35) profile = 'OBESIDAD GRADO I';
  else if (imc < 40) profile = 'OBESIDAD GRADO II';
  else profile = 'OBESIDAD GRADO III (MÓRBIDA)';

  // Peso Ideal (Fórmula de Devine)
  // Mujeres: 45.5 + 2.3 * ((Talla / 2.54) - 60)
  // Hombres: 50.0 + 2.3 * ((Talla / 2.54) - 60)
  const inches = (heightCm / 2.54);
  const baseWeight = sex === 'male' ? 50.0 : 45.5;
  let calculatedPi = heightCm > 152.4 ? (baseWeight + 2.3 * (inches - 60)) : baseWeight;

  const pi = patient.manualPi ? parseFloat(patient.manualPi) : calculatedPi;

  // Peso de Cálculo (PC)
  let calculatedPc = weight;
  let pa = 0;

  if (profile === 'BAJO PESO' || profile === 'SOBREPESO') {
    calculatedPc = pi;
  } else if (profile.startsWith('OBESIDAD')) {
    pa = pi + (0.25 * (weight - pi));
    calculatedPc = pa;
  }

  const pc = patient.manualPc ? parseFloat(patient.manualPc) : calculatedPc;

  // % Grasa Corporal (Fórmula de la Marina de EE. UU. / US Navy Body Fat)
  let gc = 0;
  let grasaMagra = 0;
  const cintura = parseFloat(measurements?.CINTURA) || 0;
  const cuello = parseFloat(measurements?.CUELLO) || 0;
  const cadera = parseFloat(measurements?.CADERA) || 0;

  if (cintura > 0 && cuello > 0 && heightCm > 0) {
    if (sex === 'male' || sex === 'h' || sex === 'm') {
      const isActuallyMale = sex === 'male' || sex === 'h';
      if (isActuallyMale) {
        // Hombres: %GC = 495 / (1.0324 - 0.19077 * log10(cintura - cuello) + 0.15456 * log10(altura)) - 450
        const valLog1 = Math.log10(cintura - cuello);
        const valLog2 = Math.log10(heightCm);
        const denom = 1.0324 - 0.19077 * valLog1 + 0.15456 * valLog2;
        gc = denom > 0 ? (495 / denom) - 450 : 0;
      } else {
        // Mujeres: %GC = 495 / (1.29579 - 0.35004 * log10(cintura + cadera - cuello) + 0.22100 * log10(altura)) - 450
        if (cadera > 0 && (cintura + cadera - cuello) > 0) {
          const valLog1 = Math.log10(cintura + cadera - cuello);
          const valLog2 = Math.log10(heightCm);
          const denom = 1.29579 - 0.35004 * valLog1 + 0.22100 * valLog2;
          gc = denom > 0 ? (495 / denom) - 450 : 0;
        }
      }
    }
    if (gc < 0) gc = 0;
    grasaMagra = weight * (1 - gc / 100);
  }

  return {
    imc: imc.toFixed(1),
    profile,
    pi: pi.toFixed(1),
    pa: pa > 0 ? pa.toFixed(1) : '—',
    pc: pc.toFixed(1),
    gc: gc > 0 ? gc.toFixed(1) : '—',
    grasaMagra: grasaMagra > 0 ? grasaMagra.toFixed(1) : '—'
  };
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

  const isMale = g === 'male' || g === 'h' || g === 'hombres';
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
