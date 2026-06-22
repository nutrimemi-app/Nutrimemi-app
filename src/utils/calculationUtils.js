export const calculateClinicalData = (patient) => {
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
  const pi = heightCm > 152.4 ? (baseWeight + 2.3 * (inches - 60)) : baseWeight;

  // Peso de Cálculo (PC)
  let pc = weight;
  let pa = 0;

  if (profile === 'BAJO PESO') {
    pc = pi;
  } else if (profile === 'OBESIDAD') {
    pa = pi + (0.25 * (weight - pi));
    pc = pa;
  }

  return {
    imc: imc.toFixed(1),
    profile,
    pi: pi.toFixed(1),
    pa: pa.toFixed(1),
    pc: pc.toFixed(1)
  };
};

export const DISTRIBUTION_TEMPLATES = {
  recuperacion: { name: 'Recuperación / Bajo Peso', prot: 18, cho: 50, fat: 32 },
  control: { name: 'Control / Obesidad', prot: 20, cho: 55, fat: 25 },
  mantenimiento: { name: 'Mantenimiento / Estándar', prot: 15, cho: 55, fat: 30 }
};
