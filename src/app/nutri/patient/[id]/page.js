'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Printer, Calendar, Save, History, 
  Camera, FileText, BookOpen, MessageCircle, FileDown, 
  Edit, X, User, Stethoscope, Utensils, ClipboardList, 
  Ruler, Image, Check, CheckCircle2, ChevronRight, 
  AlertCircle, Sparkles, Scale, Flame, RefreshCw, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { 
  calculateClinicalData, 
  getBodyFatProfile, 
  suggestPortionsFromMacros, 
  calculateTMB, 
  ACTIVITY_FACTORS 
} from '@/utils/calculationUtils';
import PortionCalculator from '@/components/PortionCalculator';
import { updatePatient, addHistoryEntry } from '@/lib/patients';
import { usePatient } from '@/hooks/usePatient';
import { getMealTypes, MEAL_PLANS } from '@/utils/mealUtils';

export default function PatientFile() {
  const params = useParams();
  const router = useRouter();
  const { showToast, showConfirm } = useUI();
  const { patient, setPatient, status } = usePatient(params.id);

  // Estados locales para la fórmula dietética interactiva
  const [localPctProt, setLocalPctProt] = useState('');
  const [localPctCho, setLocalPctCho] = useState('');
  const [customSuggestions, setCustomSuggestions] = useState(null);
  const [showEditInitialModal, setShowEditInitialModal] = useState(false);
  const [showWeightAdjustSection, setShowWeightAdjustSection] = useState(false);
  const [showIntakeDetails, setShowIntakeDetails] = useState(false);
  const [currentTag, setCurrentTag] = useState('');

  // Estados para comparación de fotos
  const [selectedPhotosForComp, setSelectedPhotosForComp] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [photoSessionFilter, setPhotoSessionFilter] = useState('All');

  // Inicialización de porcentajes locales al cargar el paciente
  useEffect(() => {
    if (patient) {
      if (patient.dietForm) {
        setLocalPctProt(patient.dietForm.pctProt !== undefined && patient.dietForm.pctProt !== null ? patient.dietForm.pctProt.toString() : '');
        setLocalPctCho(patient.dietForm.pctCho !== undefined && patient.dietForm.pctCho !== null ? patient.dietForm.pctCho.toString() : '');
      } else {
        setLocalPctProt('20');
        setLocalPctCho('50');
      }

      // Migración automática de onboardingPhotos fijas a photosGallery dinámica
      if (patient.onboardingPhotos && (!patient.photosGallery || patient.photosGallery.length === 0)) {
        const initialPhotos = [];
        const dateStr = patient.onboardingDate || new Date().toISOString().split('T')[0];
        if (patient.onboardingPhotos.front) {
          initialPhotos.push({ id: `front-${Date.now()}`, date: dateStr, uploadedBy: 'Paciente', label: 'Frente', url: patient.onboardingPhotos.front, folder: `Sesión ${dateStr}` });
        }
        if (patient.onboardingPhotos.back) {
          initialPhotos.push({ id: `back-${Date.now() + 1}`, date: dateStr, uploadedBy: 'Paciente', label: 'Espalda', url: patient.onboardingPhotos.back, folder: `Sesión ${dateStr}` });
        }
        if (patient.onboardingPhotos.left) {
          initialPhotos.push({ id: `left-${Date.now() + 2}`, date: dateStr, uploadedBy: 'Paciente', label: 'Lat. Izquierdo', url: patient.onboardingPhotos.left, folder: `Sesión ${dateStr}` });
        }
        if (patient.onboardingPhotos.right) {
          initialPhotos.push({ id: `right-${Date.now() + 3}`, date: dateStr, uploadedBy: 'Paciente', label: 'Lat. Derecho', url: patient.onboardingPhotos.right, folder: `Sesión ${dateStr}` });
        }
        const updatedPatient = { ...patient, photosGallery: initialPhotos };
        updatePatient(patient.id, { photosGallery: initialPhotos, _expectedUpdatedAt: patient.updated_at, _patientBase: patient }).then((res) => {
          setPatient({ ...updatedPatient, updated_at: res?.updated_at || patient.updated_at });
        });
      }
    }
  }, [patient?.id]);

  if (status === 'loading') {
    return <div style={{ padding: '40px', textAlign: 'center', fontWeight: 'bold' }}>Cargando expediente del paciente...</div>;
  }
  if (status === 'not-found') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>No encontramos este paciente</h3>
        <button onClick={() => router.push('/nutri/dashboard')} style={{ padding: '10px 20px', background: 'var(--card-yellow)', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px' }}>
          Volver al dashboard
        </button>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>Hubo un problema cargando los datos clínicos</h3>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: 'var(--card-yellow)', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px' }}>
          Reintentar
        </button>
      </div>
    );
  }
  if (!patient) return null;

  // ── DATOS CLÍNICOS Y ANTROPOMÉTRICOS ──
  const rawAge = parseFloat(patient.details?.age);
  const hasValidAge = !isNaN(rawAge) && rawAge > 0;
  const age = hasValidAge ? rawAge : null;
  const isPediatric = Boolean(patient.details?.isPediatric) || (hasValidAge && age < 18);
  const currentWeight = parseFloat(patient.details?.weight) || 0;
  const heightCm = parseFloat(patient.details?.height) || 0;
  const gender = (patient.details?.gender || 'female').toLowerCase();

  const clinical = calculateClinicalData({
    weight: currentWeight,
    height: heightCm,
    sex: gender,
    age,
    isPediatric,
    manualPi: patient.details?.manualPi,
    manualPa: patient.details?.manualPa,
    manualPc: patient.details?.manualPc
  }, patient.measurements);

  const isOverweightOrObese = clinical.profile === 'SOBREPESO' || clinical.profile.startsWith('OBESIDAD');

  // ── REFERENCIA DE PESO CLÍNICA ──
  // Si el paciente tiene sobrepeso u obesidad, el peso de referencia predeterminado es Peso Ajustado (PA).
  // Si es normopeso, es Peso Actual.
  const piVal = parseFloat(clinical.pi) || 0;
  const paVal = parseFloat(clinical.pa) || 0;
  
  const defaultWeightRef = isOverweightOrObese && paVal > 0 ? 'PA' : 'ACTUAL';
  const activeWeightRef = patient.dietForm?.weightRef || defaultWeightRef;
  
  const getRefWeightValue = (refKey) => {
    if (refKey === 'PA') return paVal > 0 ? paVal : currentWeight;
    if (refKey === 'PI') return piVal > 0 ? piVal : currentWeight;
    return currentWeight; // 'ACTUAL' sin inventar peso arbitrario
  };

  const activeRefWeight = getRefWeightValue(activeWeightRef);

  // ── REQUERIMIENTO CALÓRICO TOTAL (RCT) ──
  const rctMethod = patient.dietForm?.rctMethod || 'kcalKg';
  const activityFactor = parseFloat(patient.dietForm?.activityFactor) || 1.2;
  const caloricAdjustment = parseFloat(patient.dietForm?.caloricAdjustment) || 0;
  const kcalPerKg = parseFloat(patient.dietForm?.kcalPerKg) || (isOverweightOrObese ? 22 : 28);

  // Tasa Metabólica Basal (TMB) calculada sobre el peso de referencia
  const tmbMifflin = calculateTMB({
    weight: activeRefWeight,
    height: heightCm,
    age,
    sex: gender,
    formula: 'mifflin',
    isPediatric: clinical.isPediatric
  });

  const tmbHarris = calculateTMB({
    weight: activeRefWeight,
    height: heightCm,
    age,
    sex: gender,
    formula: 'harris',
    isPediatric: clinical.isPediatric
  });

  // Cálculo en vivo del requerimiento según el método profesional seleccionado
  let calculatedLiveRct = 0;
  if (rctMethod === 'mifflin') {
    calculatedLiveRct = tmbMifflin !== null ? (tmbMifflin * activityFactor) + caloricAdjustment : 0;
  } else if (rctMethod === 'harris') {
    calculatedLiveRct = tmbHarris !== null ? (tmbHarris * activityFactor) + caloricAdjustment : 0;
  } else if (rctMethod === 'kcalKg') {
    calculatedLiveRct = activeRefWeight > 0 ? activeRefWeight * kcalPerKg : 0;
  }

  // RCT activo para macronutrientes (si el usuario ya guardó un RCT explícito, se respeta; sino, usa el calculado)
  const activeRct = (patient.dietForm?.rct !== undefined && patient.dietForm?.rct !== null && patient.dietForm?.rct !== '')
    ? parseFloat(patient.dietForm.rct)
    : (calculatedLiveRct > 0 ? calculatedLiveRct : 0);

  // ── MACRONUTRIENTES ──
  const getSuggestedPct = (key) => {
    const prof = clinical.profile ? clinical.profile.toUpperCase() : 'NORMOPESO';
    if (prof === 'BAJO PESO') {
      return key === 'pctProt' ? 18 : key === 'pctCho' ? 50 : 32;
    } else if (prof === 'SOBREPESO' || prof.startsWith('OBESIDAD')) {
      return key === 'pctProt' ? 20 : key === 'pctCho' ? 55 : 25;
    } else {
      return key === 'pctProt' ? 15 : key === 'pctCho' ? 55 : 30;
    }
  };

  const pctProt = (patient.dietForm?.pctProt !== undefined && patient.dietForm?.pctProt !== null && patient.dietForm?.pctProt !== '')
    ? parseFloat(patient.dietForm.pctProt)
    : getSuggestedPct('pctProt');

  const pctCho = (patient.dietForm?.pctCho !== undefined && patient.dietForm?.pctCho !== null && patient.dietForm?.pctCho !== '')
    ? parseFloat(patient.dietForm.pctCho)
    : getSuggestedPct('pctCho');

  const pctLip = Math.max(0, 100 - pctProt - pctCho);

  // Calorías y gramos sin redondeo prematuro intermedio
  const kcalProt = (activeRct * pctProt) / 100;
  const kcalCho = (activeRct * pctCho) / 100;
  const kcalLip = (activeRct * pctLip) / 100;

  const gramsProt = kcalProt / 4;
  const gramsCho = kcalCho / 4;
  const gramsLip = kcalLip / 9;

  // Gramos por kilogramo calculados con el Peso de Referencia clínico
  const gPerKgProt = activeRefWeight > 0 ? gramsProt / activeRefWeight : 0;
  const gPerKgCho = activeRefWeight > 0 ? gramsCho / activeRefWeight : 0;
  const gPerKgLip = activeRefWeight > 0 ? gramsLip / activeRefWeight : 0;

  // Intercambios sugeridos a partir de los macronutrientes calculados
  const calculatedSuggestions = suggestPortionsFromMacros(gramsProt, gramsCho, gramsLip);
  const suggestions = customSuggestions || calculatedSuggestions;

  // Tiempos de comida del paciente
  const mealPlanKey = patient.details?.mealPlan || '3+2 snacks';
  const mealsForPatient = getMealTypes(mealPlanKey);

  // ── FUNCIONES DE GUARDADO Y SINCRONIZACIÓN ──
  const savePatientUpdate = (updatedPatient, partialPayload) => {
    setPatient(updatedPatient);
    const payloadToSend = {
      ...(partialPayload || updatedPatient),
      _expectedUpdatedAt: patient.updated_at,
      _patientBase: patient
    };
    updatePatient(patient.id, payloadToSend).then(updated => {
      if (updated?.updated_at) {
        setPatient(prev => ({ ...prev, ...updated, updated_at: updated.updated_at }));
      }
    }).catch(err => {
      console.error('Error sincronizando con base de datos:', err);
      if (err.code === 'VERSION_CONFLICT' || err.code === 'CLINICAL_FIELD_CONFLICT') {
        showToast('El expediente fue modificado concurrentemente por otra sesión. Recarga la página.', 'error');
      } else {
        showToast('Error al sincronizar con la base de datos', 'error');
      }
    });
  };

  const handleUpdateDietForm = (updates) => {
    const updatedDietForm = {
      ...patient.dietForm,
      ...updates
    };

    // Recalcular rct si cambió algún parámetro de fórmula metabólica
    let newRct = updatedDietForm.rct !== undefined ? parseFloat(updatedDietForm.rct) : activeRct;
    const curMethod = updates.rctMethod || updatedDietForm.rctMethod || rctMethod;
    const curWeightRef = updates.weightRef || updatedDietForm.weightRef || activeWeightRef;
    const curWeightVal = getRefWeightValue(curWeightRef);
    const curActFactor = updates.activityFactor !== undefined ? parseFloat(updates.activityFactor) : activityFactor;
    const curCalAdj = updates.caloricAdjustment !== undefined ? parseFloat(updates.caloricAdjustment) : caloricAdjustment;
    const curKcalPerKg = updates.kcalPerKg !== undefined ? parseFloat(updates.kcalPerKg) : kcalPerKg;

    if (updates.rctMethod || updates.weightRef || updates.activityFactor !== undefined || updates.caloricAdjustment !== undefined || updates.kcalPerKg !== undefined) {
      if (curMethod === 'mifflin') {
        const tmb = calculateTMB({ weight: curWeightVal, height: heightCm, age, sex: gender, formula: 'mifflin', isPediatric: clinical.isPediatric });
        newRct = tmb !== null ? (tmb * curActFactor) + curCalAdj : 0;
      } else if (curMethod === 'harris') {
        const tmb = calculateTMB({ weight: curWeightVal, height: heightCm, age, sex: gender, formula: 'harris', isPediatric: clinical.isPediatric });
        newRct = tmb !== null ? (tmb * curActFactor) + curCalAdj : 0;
      } else if (curMethod === 'kcalKg') {
        newRct = curWeightVal * curKcalPerKg;
      }
      updatedDietForm.rct = newRct.toFixed(2);
    }

    const curPctProt = updatedDietForm.pctProt !== undefined && updatedDietForm.pctProt !== '' ? parseFloat(updatedDietForm.pctProt) : pctProt;
    const curPctCho = updatedDietForm.pctCho !== undefined && updatedDietForm.pctCho !== '' ? parseFloat(updatedDietForm.pctCho) : pctCho;
    const curPctLip = Math.max(0, 100 - curPctProt - curPctCho);

    const newKcalProt = (newRct * curPctProt) / 100;
    const newKcalCho = (newRct * curPctCho) / 100;
    const newKcalLip = (newRct * curPctLip) / 100;

    const finalFormulas = {
      kcal: newRct.toFixed(2),
      prot: (newKcalProt / 4).toFixed(2),
      cho: (newKcalCho / 4).toFixed(2),
      fat: (newKcalLip / 9).toFixed(2)
    };

    const updatedPatient = {
      ...patient,
      dietForm: updatedDietForm,
      formulas: finalFormulas
    };

    // Envía únicamente dietForm y formulas; no toca menu ni menus
    savePatientUpdate(updatedPatient, {
      dietForm: updatedDietForm,
      formulas: finalFormulas
    });
  };

  const handleApplySuggestedDistributionToMeals = () => {
    const updatedMenu = { ...(patient.menu || {}) };
    const activeKeys = mealsForPatient.map(m => m.key);
    const count = activeKeys.length;

    activeKeys.forEach((key) => {
      updatedMenu[key] = {
        ...(updatedMenu[key] || { time: '08:00', selectedFoods: [] }),
        portions: { cereales: '0', proteinas: '0', vegetales: '0', frutas: '0', lacteos: '0', grasas: '0' }
      };
    });

    // Asignación base cualitativa clínica
    if (activeKeys.includes('almuerzo')) updatedMenu.almuerzo.portions.vegetales = '1';
    if (activeKeys.includes('cena')) updatedMenu.cena.portions.vegetales = '1';
    if (activeKeys.includes('desayuno')) updatedMenu.desayuno.portions.lacteos = '1';
    else if (activeKeys.length > 0) updatedMenu[activeKeys[0]].portions.lacteos = '1';

    if (activeKeys.includes('desayuno')) updatedMenu.desayuno.portions.frutas = '1';
    if (activeKeys.includes('meriendaPM')) updatedMenu.meriendaPM.portions.frutas = '1';

    // Distribución proporcional de carbohidratos, proteínas y grasas
    activeKeys.forEach((key, idx) => {
      let cPortion = Math.floor(suggestions.cereales / count);
      if (idx === count - 1) cPortion += (suggestions.cereales % count);
      updatedMenu[key].portions.cereales = cPortion.toString();

      let pPortion = Math.floor(suggestions.proteinas / count);
      if (idx === count - 1) pPortion += (suggestions.proteinas % count);
      updatedMenu[key].portions.proteinas = pPortion.toString();

      let gPortion = Math.floor(suggestions.grasas / count);
      if (idx === count - 1) gPortion += (suggestions.grasas % count);
      updatedMenu[key].portions.grasas = gPortion.toString();
    });

    const updatedPatient = { ...patient, menu: updatedMenu };
    savePatientUpdate(updatedPatient, { menu: updatedMenu });
    showToast('Porciones distribuidas en las comidas con éxito', 'success');
  };

  const handleMealPortionChange = (mealKey, groupKey, value) => {
    const updatedMenu = { ...(patient.menu || {}) };
    const currentMeal = updatedMenu[mealKey] || { time: '08:00', selectedFoods: [], portions: {} };
    const currentPortions = { ...(currentMeal.portions || {}) };
    currentPortions[groupKey] = value;

    updatedMenu[mealKey] = {
      ...currentMeal,
      portions: currentPortions
    };

    savePatientUpdate({ ...patient, menu: updatedMenu }, { menu: updatedMenu });
  };

  const saveHistory = async () => {
    showConfirm(
      "Guardar Consulta",
      "¿Deseas guardar la sesión actual con sus métricas antropométricas, fórmula dietética y menú en el historial?",
      async () => {
        const newEntry = {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          details: { ...patient.details },
          measurements: { ...patient.measurements },
          dietForm: { ...patient.dietForm },
          imc: clinical.imc,
          profile: clinical.profile,
          menus: { ...(patient.menu || {}) },
          notes: patient.details?.notes || ''
        };

        const updatedHistory = [...(patient.history || []), newEntry];
        const updatedPatient = { ...patient, history: updatedHistory };
        setPatient(updatedPatient);
        try {
          await addHistoryEntry(patient.id, newEntry);
          showToast("¡Consulta guardada exitosamente en el historial!", "success");
        } catch (e) {
          console.error('Error guardando entrada de historial:', e);
          showToast("Error al guardar consulta en historial", "error");
        }
      }
    );
  };

  const addTag = () => {
    if (currentTag && !patient.details.tags?.includes(currentTag)) {
      const updatedDetails = { ...patient.details, tags: [...(patient.details.tags || []), currentTag] };
      const updatedPatient = { ...patient, details: updatedDetails };
      savePatientUpdate(updatedPatient, { details: { tags: updatedDetails.tags } });
      setCurrentTag('');
    }
  };

  const removeTag = (tag) => {
    const updatedDetails = { ...patient.details, tags: patient.details.tags.filter(t => t !== tag) };
    const updatedPatient = { ...patient, details: updatedDetails };
    savePatientUpdate(updatedPatient, { details: { tags: updatedDetails.tags } });
  };

  const getProfileColor = (p) => {
    if (p === 'PEDIÁTRICO') return '#0D47A1';
    if (p === 'OBESIDAD' || p?.startsWith('OBESIDAD')) return '#DC2626';
    if (p === 'SOBREPESO') return '#D97706';
    if (p === 'BAJO PESO') return '#0284C7';
    return '#1D512D'; // Normopeso
  };

  // Sumas de raciones asignadas en las comidas para verificar balance
  const assignedMealTotals = { cereales: 0, proteinas: 0, vegetales: 0, frutas: 0, lacteos: 0, grasas: 0 };
  mealsForPatient.forEach(m => {
    const pObj = patient.menu?.[m.key]?.portions || {};
    Object.keys(assignedMealTotals).forEach(g => {
      assignedMealTotals[g] += parseFloat(pObj[g]) || 0;
    });
  });

  return (
    <>
    <div style={{ padding: '20px', paddingBottom: '160px', maxWidth: '1000px', margin: '0 auto' }} className="fade-in">
      
      {/* ── ENCABEZADO Y ACCIONES PRINCIPALES ── */}
      <header style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <Link href="/nutri/dashboard" style={{ color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
                {patient.name}
              </h1>
              {isPediatric && (
                <span style={{ background: '#E3F2FD', color: '#0D47A1', fontSize: '0.68rem', fontWeight: '900', padding: '3px 10px', borderRadius: '20px' }}>
                  PACIENTE PEDIÁTRICO
                </span>
              )}
            </div>
            {isPediatric ? (
              <p style={{ fontSize: '0.82rem', opacity: 0.8, fontWeight: '700', color: 'var(--primary)', margin: '4px 0 0' }}>
                Tutor: {patient.details?.tutorName || 'No indicado'} | Tel: {patient.details?.tutorPhone || 'No indicado'} | Edad: {patient.details?.age || '--'} años
              </p>
            ) : (
              <p style={{ fontSize: '0.82rem', opacity: 0.65, fontWeight: '700', margin: '4px 0 0' }}>
                C.I.: {patient.details?.ci || '—'} | Tel: {patient.details?.phone || '—'} | Edad: {patient.details?.age || '--'} años | Sexo: {gender === 'male' ? 'Masculino' : 'Femenino'}
              </p>
            )}
          </div>
        </div>

        {/* Fila de Acciones Clínicas Principales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            <Link href="/nutri/agenda" style={{ textDecoration: 'none', background: '#FFFFFF', color: 'var(--text-primary)', padding: '12px 10px', borderRadius: '14px', fontSize: '0.78rem', fontWeight: '850', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid rgba(0,0,0,0.08)', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <Calendar size={15} color="var(--primary)" /> Programar Cita
            </Link>
            {patient.details?.phone && (
              <a href={`https://wa.me/${patient.details.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#25D366', color: 'white', padding: '12px 10px', borderRadius: '14px', fontWeight: '900', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1.5px solid #128C7E', textAlign: 'center' }}>
                <MessageCircle size={15} /> WhatsApp
              </a>
            )}
            <Link href={`/nutri/patient/${patient.id}/report`} style={{ textDecoration: 'none', background: '#FFFFFF', color: 'var(--primary)', padding: '12px 10px', borderRadius: '14px', fontWeight: '900', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1.5px solid var(--primary)', textAlign: 'center' }}>
              <Printer size={15} /> Informe Imprimible
            </Link>
            <Link href={`/nutri/patient/${patient.id}/food-log`} style={{ textDecoration: 'none', background: '#FFEBEE', border: '1.5px solid #EF5350', color: '#B71C1C', padding: '12px 10px', borderRadius: '14px', fontWeight: '900', fontSize: '0.78rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <BookOpen size={15} /> Bitácora
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button 
              onClick={() => router.push(`/nutri/patient/${patient.id}/control`)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(29, 81, 45, 0.2)' }}
            >
              <History size={16} /> Nuevo Control Antropométrico
            </button>

            <button
              onClick={() => setShowEditInitialModal(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', background: '#FFFFFF', border: '1.5px dashed var(--primary)', color: 'var(--primary)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}
            >
              <Edit size={16} /> Ver / Editar datos iniciales
            </button>
          </div>
        </div>
      </header>

      {/* ── MODAL: VER / EDITAR DATOS INICIALES (LAS 6 ETAPAS ORIGINALES) ── */}
      {showEditInitialModal && (
        <div
          onClick={() => setShowEditInitialModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#FFFFFF', borderRadius: '28px 28px 0 0', padding: '28px 20px 40px', width: '100%', maxWidth: '560px', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, color: 'var(--primary)' }}>
                  Expediente de Datos Iniciales
                </h3>
                <p style={{ fontSize: '0.78rem', opacity: 0.65, margin: '4px 0 0', fontWeight: '600' }}>
                  Consulta o edita directamente cualquiera de las 6 etapas recopiladas durante el ingreso.
                </p>
              </div>
              <button onClick={() => setShowEditInitialModal(false)} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {[
              { step: 1, icon: <User size={18} color="var(--primary)" />, label: 'Datos personales y objetivos', desc: 'Nombre, C.I., contacto, fecha de nacimiento, sexo, objetivos nutricionales.' },
              { step: 2, icon: <Stethoscope size={18} color="#D97706" />, label: 'Historia clínica', desc: 'Antecedentes patológicos, medicamentos actuales, notas de ingreso.' },
              { step: 3, icon: <Utensils size={18} color="#7C3AED" />, label: 'Hábitos y preferencias', desc: 'Comidas favoritas, aversiones, actividad física, hidratación, comidas/día.' },
              { step: 4, icon: <ClipboardList size={18} color="#059669" />, label: 'Recordatorio de 24 horas', desc: 'Registro de ingestas y horarios habituales del día previo.' },
              { step: 5, icon: <Ruler size={18} color="#DC2626" />, label: 'Antropometría y medidas iniciales', desc: 'Peso, estatura e historial de las 8 circunferencias corporales.' },
              { step: 6, icon: <Image size={18} color="#6B7280" />, label: 'Fotografías clínicas iniciales', desc: 'Galería de tomas fotográficas corporales del ingreso.' },
            ].map(({ step, icon, label, desc }) => (
              <button
                key={step}
                onClick={() => {
                  setShowEditInitialModal(false);
                  router.push(`/nutri/new-patient?patientId=${patient.id}&step=${step}`);
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.015)', cursor: 'pointer', marginBottom: '10px', textAlign: 'left' }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: '900', display: 'block', color: 'var(--text-primary)' }}>
                    Etapa {step}: {label}
                  </span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.6, display: 'block', marginTop: '2px' }}>
                    {desc}
                  </span>
                </div>
                <ChevronRight size={16} opacity={0.4} />
              </button>
            ))}

            <button
              onClick={() => setShowEditInitialModal(false)}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', marginTop: '6px' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. RESUMEN ANTROPOMÉTRICO Y EVALUACIÓN NUTRICIONAL
      ─────────────────────────────────────────────────────────────── */}
      <section className="glass-panel shadow-premium" style={{ background: '#FFFFFF', border: `2px solid ${getProfileColor(clinical.profile)}`, padding: '24px', borderRadius: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: '900', color: getProfileColor(clinical.profile), textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              EVALUACIÓN Y CLASIFICACIÓN NUTRICIONAL
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: getProfileColor(clinical.profile), margin: '2px 0 0' }}>
              {clinical.profile}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={24} color={getProfileColor(clinical.profile)} />
          </div>
        </div>

        {/* Aviso Destacado de Protección Pediátrica */}
        {clinical.isPediatric && (
          <div style={{ background: '#EFF6FF', border: '1.5px solid #3B82F6', borderRadius: '14px', padding: '12px 16px', marginBottom: '16px', color: '#1E40AF', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={20} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.82rem', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                PROTECCIÓN PEDIÁTRICA ACTIVA (Paciente menor de 18 años)
              </strong>
              <p style={{ margin: 0, fontSize: '0.74rem', lineHeight: '1.4' }}>
                Las fórmulas adultas (Devine, Lorentz, Peso Ajustado, % Grasa de la Marina y TMB de Mifflin / Harris) han sido <strong>desactivadas</strong> para este paciente. 
                La evaluación nutricional se debe realizar con las <strong>Tablas de Percentiles y Puntuación Z de la OMS</strong> (P/E, T/E, IMC/E) y los requerimientos calóricos según las pautas de crecimiento pediátrico.
              </p>
            </div>
          </div>
        )}

        {/* Cuadrícula de Métricas Antropométricas Principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 8px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: '850', opacity: 0.55, margin: '0 0 4px', textTransform: 'uppercase' }}>IMC REAL</p>
            <p style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>{clinical.imc}</p>
            <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>kg/m²</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 8px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: '850', opacity: 0.55, margin: '0 0 4px', textTransform: 'uppercase' }}>PESO ACTUAL</p>
            <p style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
              {currentWeight > 0 ? currentWeight.toFixed(2) : '—'}
            </p>
            <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>kg</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 8px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: '850', opacity: 0.55, margin: '0 0 4px', textTransform: 'uppercase' }}>P. IDEAL (DEVINE)</p>
            <p style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>{clinical.piDevine || clinical.pi}</p>
            <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>kg</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 8px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: '850', opacity: 0.55, margin: '0 0 4px', textTransform: 'uppercase' }}>P. IDEAL (LORENTZ)</p>
            <p style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>{clinical.piLorentz}</p>
            <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>kg</span>
          </div>

          <div style={{ 
            background: isOverweightOrObese ? 'rgba(217, 119, 6, 0.08)' : 'rgba(0,0,0,0.02)', 
            padding: '10px 8px', 
            borderRadius: '12px', 
            border: isOverweightOrObese ? '1.5px solid #D97706' : '1px solid rgba(0,0,0,0.04)' 
          }}>
            <p style={{ fontSize: '0.62rem', fontWeight: '850', color: isOverweightOrObese ? '#D97706' : 'inherit', opacity: isOverweightOrObese ? 1 : 0.55, margin: '0 0 4px', textTransform: 'uppercase' }}>
              PESO AJUSTADO (PA)
            </p>
            <p style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, color: isOverweightOrObese ? '#D97706' : 'var(--text-primary)' }}>
              {clinical.pa}
            </p>
            <span style={{ fontSize: '0.6rem', fontWeight: isOverweightOrObese ? '800' : '400', color: isOverweightOrObese ? '#D97706' : 'inherit', opacity: isOverweightOrObese ? 1 : 0.5 }}>
              {isOverweightOrObese ? '★ Ref. Clínica' : 'kg'}
            </span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 8px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: '850', opacity: 0.55, margin: '0 0 4px', textTransform: 'uppercase' }}>% GRASA (MARINA)</p>
            <p style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, color: '#B71C1C' }}>
              {!isNaN(parseFloat(clinical.gc)) ? `${clinical.gc}%` : (clinical.gc || '—')}
            </p>
            <span style={{ fontSize: '0.58rem', fontWeight: '800', color: '#B71C1C', textTransform: 'uppercase' }}>
              {clinical.isPediatric ? 'No aplica en pediatría' : (!isNaN(parseFloat(clinical.gc)) ? getBodyFatProfile(gender, age, clinical.gc) : 'Requiere medidas')}
            </span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 8px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: '850', opacity: 0.55, margin: '0 0 4px', textTransform: 'uppercase' }}>GRASA MAGRA</p>
            <p style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, color: '#16A34A' }}>
              {!isNaN(parseFloat(clinical.grasaMagra)) ? `${clinical.grasaMagra} kg` : (clinical.grasaMagra || '—')}
            </p>
            <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>Masa libre de grasa</span>
          </div>
        </div>

        {/* Resumen Compacto de Medidas Antropométricas */}
        <div style={{ background: 'rgba(29, 81, 45, 0.03)', border: '1px solid rgba(29, 81, 45, 0.1)', borderRadius: '16px', padding: '14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📏 Circunferencias Corporales Registradas
            </span>
            <Link href={`/nutri/patient/${patient.id}/control`} style={{ fontSize: '0.72rem', fontWeight: '850', color: 'var(--primary)', textDecoration: 'none' }}>
              + Nuevo Registro en Control &rarr;
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px', textAlign: 'center' }}>
            {[
              { label: 'CUELLO', val: patient.measurements?.CUELLO },
              { label: 'BRAZO', val: patient.measurements?.BRAZO },
              { label: 'TORSO', val: patient.measurements?.TORSO },
              { label: 'CINTURA', val: patient.measurements?.CINTURA },
              { label: 'CADERA', val: patient.measurements?.CADERA },
              { label: 'GLÚTEOS', val: patient.measurements?.GLÚTEOS },
              { label: 'MUSLO', val: patient.measurements?.MUSLO },
              { label: 'PANTORRILLA', val: patient.measurements?.PANTORRILLA },
            ].map(m => (
              <div key={m.label} style={{ background: '#FFFFFF', padding: '6px 4px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: '800', opacity: 0.6, display: 'block' }}>{m.label}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-primary)' }}>{m.val ? `${m.val} cm` : '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sección Opcional: Personalización Manual de Pesos de Referencia */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '10px' }}>
          <button
            onClick={() => setShowWeightAdjustSection(!showWeightAdjustSection)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '850', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Scale size={14} />
            <span>{showWeightAdjustSection ? 'Ocultar ajustes manuales de peso' : 'Personalizar pesos de referencia manuales'}</span>
            {showWeightAdjustSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showWeightAdjustSection && (
            <div style={{ marginTop: '12px', background: '#FAFAFA', padding: '14px', borderRadius: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: '850', opacity: 0.65, display: 'block', marginBottom: '4px' }}>PESO ACTUAL (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patient.details?.weight || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    savePatientUpdate({ ...patient, details: { ...patient.details, weight: val } });
                  }}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontWeight: '800' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: '850', opacity: 0.65, display: 'block', marginBottom: '4px' }}>P. IDEAL MANUAL (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={clinical.suggestedPi}
                  value={patient.details?.manualPi || ''}
                  onChange={(e) => {
                    savePatientUpdate({ ...patient, details: { ...patient.details, manualPi: e.target.value } });
                  }}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontWeight: '800' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: '850', opacity: 0.65, display: 'block', marginBottom: '4px' }}>P. AJUSTADO MANUAL (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={clinical.suggestedPa}
                  value={patient.details?.manualPa || ''}
                  onChange={(e) => {
                    savePatientUpdate({ ...patient, details: { ...patient.details, manualPa: e.target.value } });
                  }}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', fontWeight: '800' }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. EVALUACIÓN Y PATOLOGÍAS CLÍNICAS
      ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '900', opacity: 0.6, marginRight: '4px' }}>PATOLOGÍAS / OBJETIVOS:</span>
        {patient.details?.tags?.map(tag => (
          <span key={tag} style={{ background: 'var(--card-yellow)', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {tag} <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </span>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '20px', padding: '2px 10px' }}>
          <input 
            type="text" 
            placeholder="+ Agregar etiqueta" 
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.75rem', width: '110px', padding: '4px' }}
          />
          <button onClick={addTag} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2.1 CONSULTA RÁPIDA: EXPEDIENTE DE INGRESO (HISTORIA, HÁBITOS, R24H)
      ─────────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setShowIntakeDetails(!showIntakeDetails)}
          style={{
            width: '100%',
            background: '#FFFFFF',
            border: '1.5px solid rgba(29, 81, 45, 0.2)',
            borderRadius: showIntakeDetails ? '18px 18px 0 0' : '18px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={20} color="var(--primary)" />
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: '900', color: 'var(--primary)', display: 'block' }}>
                Expediente de Ingreso (Historia, Hábitos, Alergias y R24H)
              </span>
              <span style={{ fontSize: '0.72rem', opacity: 0.65, display: 'block' }}>
                {showIntakeDetails ? 'Clic para contraer' : 'Clic para consultar las respuestas completas del paciente sin salir de la ficha'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '850', color: 'var(--primary)' }}>
              {showIntakeDetails ? 'Ocultar' : 'Consultar'}
            </span>
            {showIntakeDetails ? <ChevronUp size={18} color="var(--primary)" /> : <ChevronDown size={18} color="var(--primary)" />}
          </div>
        </button>

        {showIntakeDetails && (
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid rgba(29, 81, 45, 0.2)',
            borderTop: 'none',
            borderRadius: '0 0 18px 18px',
            padding: '18px 20px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {/* Objetivos */}
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  🎯 Objetivos Nutricionales
                </span>
                {Array.isArray(patient.onboardingAnswers?.goals) && patient.onboardingAnswers.goals.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    {patient.onboardingAnswers.goals.map((g, i) => (
                      <span key={i} style={{ background: 'rgba(29, 81, 45, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: '800' }}>
                        {g}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: '0 0 4px', fontSize: '0.78rem', opacity: 0.6 }}>No especificados</p>
                )}
                {patient.onboardingAnswers?.goalsOther && (
                  <p style={{ margin: 0, fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.8 }}>
                    &ldquo;{patient.onboardingAnswers.goalsOther}&rdquo;
                  </p>
                )}
              </div>

              {/* Historia y Medicamentos */}
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '900', color: '#D97706', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  🩺 Historia Clínica y Medicamentos
                </span>
                <p style={{ margin: '0 0 4px', fontSize: '0.78rem' }}>
                  <strong>Antecedentes:</strong> {patient.details?.clinicalHistory || 'Sin antecedentes reportados'}
                </p>
                <p style={{ margin: '0 0 4px', fontSize: '0.78rem' }}>
                  <strong>Medicamentos:</strong> {patient.details?.medications || 'Ninguno'}
                </p>
                {patient.details?.notas && (
                  <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.75 }}>
                    <strong>Notas de ingreso:</strong> {patient.details.notas}
                  </p>
                )}
              </div>

              {/* Hábitos y Preferencias */}
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '900', color: '#7C3AED', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  🍽️ Preferencias y Alergias
                </span>
                <p style={{ margin: '0 0 4px', fontSize: '0.78rem' }}>
                  <strong>Favoritos:</strong> {patient.onboardingAnswers?.favFood || 'No indicado'}
                </p>
                <p style={{ margin: '0 0 4px', fontSize: '0.78rem' }}>
                  <strong>No favoritos / Rechazo:</strong> {patient.onboardingAnswers?.nonFavFood || 'Ninguno'}
                </p>
                <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: '#DC2626' }}>
                  <strong>Alergias / Intolerancias:</strong> {patient.onboardingAnswers?.allergies || 'Ninguna conocida'}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem' }}>
                  <strong>Actividad física:</strong> {patient.onboardingAnswers?.physicalActivity || 'No reportada'}
                </p>
              </div>

              {/* Recordatorio 24 Horas */}
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '900', color: '#059669', textTransform: 'uppercase' }}>
                    ⏰ Recordatorio de 24 Horas (R24H)
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push(`/nutri/new-patient?patientId=${patient.id}&step=4`)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: '850', cursor: 'pointer' }}
                  >
                    Editar &rarr;
                  </button>
                </div>
                <div style={{ maxHeight: '100px', overflowY: 'auto', background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)', fontSize: '0.78rem', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {patient.onboardingAnswers?.r24hNotes || 'Sin registro R24H'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowEditInitialModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: '850', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Edit size={14} /> Abrir editor completo de datos iniciales
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. REQUERIMIENTO CALÓRICO TOTAL (RCT) Y FÓRMULAS METABÓLICAS
      ─────────────────────────────────────────────────────────────── */}
      <section className="glass-panel shadow-premium" style={{ background: '#FFFFFF', border: '1.5px solid var(--primary)', padding: '24px', borderRadius: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--primary)', margin: 0, textTransform: 'uppercase' }}>
              Cálculo de Requerimiento Calórico Total (RCT)
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '850', background: 'rgba(29, 81, 45, 0.08)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '20px' }}>
            Ref: {activeWeightRef === 'PA' ? 'Peso Ajustado' : activeWeightRef === 'PI' ? 'Peso Ideal' : 'Peso Actual'} ({activeRefWeight} kg)
          </span>
        </div>

        {/* Métodos de Cálculo y Parámetros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '16px', marginBottom: '16px' }}>
          
          {/* Selector de Método */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.65, display: 'block', marginBottom: '6px' }}>MÉTODO DE CÁLCULO</label>
            <select
              value={rctMethod}
              onChange={(e) => handleUpdateDietForm({ rctMethod: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.85rem', fontWeight: '800', background: '#FFFFFF' }}
            >
              <option value="kcalKg">Kcal por Kilogramo (Práctico)</option>
              <option value="mifflin">Mifflin-St Jeor (TMB + Actividad)</option>
              <option value="harris">Harris-Benedict (TMB + Actividad)</option>
              <option value="manual">Manual Directo (Ingreso Libre)</option>
            </select>
          </div>

          {/* Selector de Peso de Referencia */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.65, display: 'block', marginBottom: '6px' }}>PESO DE REFERENCIA</label>
            <select
              value={activeWeightRef}
              onChange={(e) => handleUpdateDietForm({ weightRef: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.85rem', fontWeight: '800', background: '#FFFFFF' }}
            >
              <option value="PA">Peso Ajustado ({paVal > 0 ? paVal : '—'} kg) {isOverweightOrObese ? '★ Recomendado' : ''}</option>
              <option value="ACTUAL">Peso Actual ({currentWeight} kg)</option>
              <option value="PI">Peso Ideal ({piVal > 0 ? piVal : '—'} kg)</option>
            </select>
          </div>

          {/* Parámetros Específicos según el Método */}
          {rctMethod === 'kcalKg' ? (
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.65, display: 'block', marginBottom: '6px' }}>KCAL X KG</label>
              <input
                type="number"
                step="0.5"
                value={patient.dietForm?.kcalPerKg || kcalPerKg}
                onChange={(e) => handleUpdateDietForm({ kcalPerKg: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9rem', fontWeight: '850', background: '#FFFFFF' }}
              />
              <span style={{ fontSize: '0.62rem', opacity: 0.65, display: 'block', marginTop: '3px' }}>Hipocalórico: 20-24 | Normocalórico: 25-30 | Hiper: &gt;30</span>
            </div>
          ) : (rctMethod === 'mifflin' || rctMethod === 'harris') ? (
            <>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.65, display: 'block', marginBottom: '6px' }}>FACTOR DE ACTIVIDAD</label>
                <select
                  value={activityFactor}
                  onChange={(e) => handleUpdateDietForm({ activityFactor: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.82rem', fontWeight: '800', background: '#FFFFFF' }}
                >
                  {ACTIVITY_FACTORS.map(af => (
                    <option key={af.key} value={af.factor}>{af.factor} - {af.label.split('(')[0]}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.62rem', opacity: 0.65, display: 'block', marginTop: '3px' }}>
                  TMB calculada: {
                    clinical.isPediatric 
                      ? 'No aplica en pediatría' 
                      : (rctMethod === 'mifflin' 
                          ? (tmbMifflin !== null ? `${tmbMifflin.toFixed(2)} kcal/día` : 'Pendiente datos') 
                          : (tmbHarris !== null ? `${tmbHarris.toFixed(2)} kcal/día` : 'Pendiente datos'))
                  }
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.65, display: 'block', marginBottom: '6px' }}>AJUSTE CLÍNICO (kcal)</label>
                <select
                  value={caloricAdjustment}
                  onChange={(e) => handleUpdateDietForm({ caloricAdjustment: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.82rem', fontWeight: '800', background: '#FFFFFF' }}
                >
                  <option value="-500">-500 kcal (Déficit pérdida de peso)</option>
                  <option value="-300">-300 kcal (Déficit moderado)</option>
                  <option value="0">0 kcal (Mantenimiento)</option>
                  <option value="300">+300 kcal (Superávit masa muscular)</option>
                  <option value="500">+500 kcal (Superávit alto)</option>
                </select>
              </div>
            </>
          ) : null}

          {/* Resultado del RCT */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.65, display: 'block', marginBottom: '6px' }}>RCT FINAL (Kcal/día)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                step="0.01"
                value={patient.dietForm?.rct !== undefined ? patient.dietForm.rct : (activeRct > 0 ? activeRct.toFixed(2) : '')}
                placeholder="0.00"
                onChange={(e) => handleUpdateDietForm({ rct: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid var(--primary)', fontSize: '1.1rem', fontWeight: '900', color: 'var(--primary)', background: '#FFFFFF' }}
              />
            </div>
            <span style={{ fontSize: '0.62rem', opacity: 0.65, display: 'block', marginTop: '3px' }}>Conserva decimales para cálculo fino</span>
          </div>
        </div>

        {/* Resumen de la Fórmula Aplicada */}
        <div style={{ fontSize: '0.75rem', background: '#FFFFFF', border: '1px dashed rgba(29, 81, 45, 0.25)', padding: '10px 14px', borderRadius: '12px', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <span>
            <strong>Fórmula activa:</strong> {
              clinical.isPediatric
                ? `Requerimiento Pediátrico: RCT = ${activeRct.toFixed(2)} kcal/día (definido según percentiles / prescripción pediátrica OMS)`
                : rctMethod === 'mifflin' 
                ? (tmbMifflin !== null 
                    ? `Mifflin-St Jeor: [TMB (${tmbMifflin.toFixed(2)}) × FA (${activityFactor})] + Ajuste (${caloricAdjustment}) = ${activeRct.toFixed(2)} kcal/día`
                    : 'Mifflin-St Jeor: Requiere registrar peso, talla y edad para calcular TMB')
                : rctMethod === 'harris'
                ? (tmbHarris !== null
                    ? `Harris-Benedict: [TMB (${tmbHarris.toFixed(2)}) × FA (${activityFactor})] + Ajuste (${caloricAdjustment}) = ${activeRct.toFixed(2)} kcal/día`
                    : 'Harris-Benedict: Requiere registrar peso, talla y edad para calcular TMB')
                : rctMethod === 'kcalKg'
                ? `Kcal/kg: ${activeRefWeight > 0 ? activeRefWeight.toFixed(2) : '—'} kg × ${kcalPerKg} kcal/kg = ${activeRct.toFixed(2)} kcal/día`
                : `Manual: ${activeRct.toFixed(2)} kcal/día ingresadas directamente`
            }
          </span>
          <span style={{ fontWeight: '800' }}>Peso base: {activeRefWeight > 0 ? `${activeRefWeight.toFixed(2)} kg` : '—'}</span>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. MACRONUTRIENTES (PROTEÍNAS, LÍPIDOS, CARBOHIDRATOS)
      ─────────────────────────────────────────────────────────────── */}
      <section className="glass-panel shadow-premium" style={{ background: '#FFFFFF', border: '1.5px solid rgba(0,0,0,0.08)', padding: '24px', borderRadius: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase' }}>
              📊 Distribución de Macronutrientes
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.75rem', opacity: 0.65 }}>
              Calculados en base a: <strong>{activeWeightRef === 'PA' ? 'Peso Ajustado (PA)' : activeWeightRef === 'PI' ? 'Peso Ideal (PI)' : 'Peso Actual'} = {activeRefWeight > 0 ? `${activeRefWeight.toFixed(2)} kg` : '—'}</strong>
            </p>
          </div>

          {/* Plantillas Rápidas */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { name: 'Control Peso / Obesidad', prot: 20, cho: 55 },
              { name: 'Mantenimiento', prot: 15, cho: 55 },
              { name: 'Bajo Peso / Recuperación', prot: 18, cho: 50 },
              { name: 'Hiperproteica', prot: 25, cho: 45 },
            ].map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setLocalPctProt(tmpl.prot.toString());
                  setLocalPctCho(tmpl.cho.toString());
                  handleUpdateDietForm({ pctProt: tmpl.prot, pctCho: tmpl.cho });
                  showToast(`Plantilla ${tmpl.name} aplicada`, 'success');
                }}
                style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.68rem', fontWeight: '850', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer' }}
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla Profesional de Macronutrientes */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '16px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.08)', textAlign: 'left' }}>
                <th style={{ padding: '8px', fontWeight: '900', color: 'var(--primary)' }}>MACRONUTRIENTE</th>
                <th style={{ padding: '8px', fontWeight: '900', color: 'var(--primary)', textAlign: 'center', width: '80px' }}>% ENERGÍA</th>
                <th style={{ padding: '8px', fontWeight: '900', color: 'var(--primary)', textAlign: 'right' }}>KCAL</th>
                <th style={{ padding: '8px', fontWeight: '900', color: 'var(--primary)', textAlign: 'right' }}>GRAMOS TOTALES</th>
                <th style={{ padding: '8px', fontWeight: '900', color: 'var(--primary)', textAlign: 'right' }}>g / kg de {activeWeightRef}</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'PROTEÍNA (4 kcal/g)', pct: pctProt, isInput: true, key: 'pctProt', kcal: kcalProt, grams: gramsProt, gPerKg: gPerKgProt },
                { name: 'CARBOHIDRATOS (4 kcal/g)', pct: pctCho, isInput: true, key: 'pctCho', kcal: kcalCho, grams: gramsCho, gPerKg: gPerKgCho },
                { name: 'LÍPIDOS (9 kcal/g)', pct: pctLip, isInput: false, key: 'pctLip', kcal: kcalLip, grams: gramsLip, gPerKg: gPerKgLip },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: '800' }}>{row.name}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    {row.isInput ? (
                      <input
                        type="number"
                        value={row.key === 'pctProt' ? (localPctProt !== '' ? localPctProt : pctProt) : (localPctCho !== '' ? localPctCho : pctCho)}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          if (row.key === 'pctProt') setLocalPctProt(valStr);
                          if (row.key === 'pctCho') setLocalPctCho(valStr);
                          const val = parseFloat(valStr) || 0;
                          handleUpdateDietForm({ [row.key]: val });
                        }}
                        style={{ width: '55px', padding: '4px', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '900' }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.85rem', fontWeight: '900', opacity: 0.7 }}>{row.pct.toFixed(2)}%</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '700' }}>{row.kcal.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '900', color: 'var(--primary)' }}>{row.grams.toFixed(2)} g</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '800' }}>{row.gPerKg.toFixed(2)} g/kg</td>
                </tr>
              ))}

              <tr style={{ background: 'rgba(29, 81, 45, 0.05)', fontWeight: '900' }}>
                <td style={{ padding: '12px 8px' }}>TOTAL</td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>{(pctProt + pctCho + pctLip).toFixed(2)}%</td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>{(kcalProt + kcalCho + kcalLip).toFixed(2)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>{(gramsProt + gramsCho + gramsLip).toFixed(2)} g</td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Desglose Clínico Explicativo de Fórmulas y Cálculos */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: '900', color: '#1E293B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔬</span> Desglose Clínico de Fórmulas y Cálculos
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '0.75rem', color: '#334155' }}>
            <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
              <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>1. Referencias de Peso Utilizadas</strong>
              <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.5' }}>
                <li><strong>Peso para TMB y RCT:</strong> {activeRefWeight > 0 ? `${activeRefWeight.toFixed(2)} kg` : 'Pendiente'} ({activeWeightRef === 'PA' ? 'Peso Ajustado [PA]' : activeWeightRef === 'PI' ? 'Peso Ideal [PI]' : 'Peso Actual'}).</li>
                <li><strong>Peso divisor para g/kg:</strong> {activeRefWeight > 0 ? `${activeRefWeight.toFixed(2)} kg` : 'Pendiente'} ({activeWeightRef === 'PA' ? 'Peso Ajustado [PA]' : activeWeightRef === 'PI' ? 'Peso Ideal [PI]' : 'Peso Actual'}).</li>
                {isOverweightOrObese && (
                  <li style={{ color: '#D97706', fontWeight: '750' }}>★ Criterio clínico activo: En sobrepeso/obesidad se utiliza el Peso Ajustado (PA) como referencia predeterminada para evitar sobreestimación calórica y proteica.</li>
                )}
              </ul>
            </div>

            <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
              <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>2. Determinación de Macronutrientes</strong>
              <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.5' }}>
                <li><strong>Proteínas:</strong> ({activeRct.toFixed(2)} kcal × {pctProt.toFixed(2)}%) ÷ 4 kcal/g = <strong>{gramsProt.toFixed(2)} g</strong> &rarr; Divisor: {gramsProt.toFixed(2)} g ÷ {activeRefWeight > 0 ? activeRefWeight.toFixed(2) : '—'} kg = <strong>{gPerKgProt.toFixed(2)} g/kg</strong></li>
                <li><strong>Carbohidratos:</strong> ({activeRct.toFixed(2)} kcal × {pctCho.toFixed(2)}%) ÷ 4 kcal/g = <strong>{gramsCho.toFixed(2)} g</strong> &rarr; Divisor: {gramsCho.toFixed(2)} g ÷ {activeRefWeight > 0 ? activeRefWeight.toFixed(2) : '—'} kg = <strong>{gPerKgCho.toFixed(2)} g/kg</strong></li>
                <li><strong>Lípidos:</strong> ({activeRct.toFixed(2)} kcal × {pctLip.toFixed(2)}%) ÷ 9 kcal/g = <strong>{gramsLip.toFixed(2)} g</strong> &rarr; Divisor: {gramsLip.toFixed(2)} g ÷ {activeRefWeight > 0 ? activeRefWeight.toFixed(2) : '—'} kg = <strong>{gPerKgLip.toFixed(2)} g/kg</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. TABLA DE INTERCAMBIOS Y PORCIONES (PortionCalculator)
      ─────────────────────────────────────────────────────────────── */}
      <section className="glass-panel shadow-premium" style={{ background: '#F9FBE7', border: '2px solid #AFB42B', padding: '24px', borderRadius: '24px', marginBottom: '20px' }}>
        <PortionCalculator
          portions={suggestions}
          onChange={setCustomSuggestions}
          targetProt={gramsProt}
          targetCho={gramsCho}
          targetLip={gramsLip}
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleApplySuggestedDistributionToMeals}
            style={{ flex: 1, minWidth: '220px', background: '#1d512d', color: 'white', border: 'none', padding: '12px 16px', borderRadius: '12px', fontWeight: '900', fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(29, 81, 45, 0.2)' }}
          >
            📥 Distribuir estas Raciones en las Comidas del Paciente
          </button>

          {customSuggestions && (
            <button
              type="button"
              onClick={() => setCustomSuggestions(null)}
              style={{ background: '#FFFFFF', color: '#666', border: '1px solid #ccc', padding: '12px 16px', borderRadius: '12px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}
            >
              Restablecer sugerencia matemática
            </button>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. DISTRIBUCIÓN DE COMIDAS AL DÍA
      ─────────────────────────────────────────────────────────────── */}
      <section className="glass-panel shadow-premium" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', padding: '24px', borderRadius: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase' }}>
              🍽️ Distribución de Raciones por Tiempo de Comida
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.75rem', opacity: 0.65 }}>
              Reparte las porciones de intercambio entre las comidas activas del paciente.
            </p>
          </div>

          {/* Selector de Esquema de Comidas */}
          <select
            value={mealPlanKey}
            onChange={(e) => {
              const updatedDetails = { ...patient.details, mealPlan: e.target.value };
              savePatientUpdate({ ...patient, details: updatedDetails }, { details: { mealPlan: e.target.value } });
            }}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.85rem', fontWeight: '850', background: '#FFFFFF', cursor: 'pointer' }}
          >
            {Object.keys(MEAL_PLANS).map(key => (
              <option key={key} value={key}>{key} ({MEAL_PLANS[key].length} tiempos)</option>
            ))}
          </select>
        </div>

        {/* Matriz de Comidas y Raciones */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.08)' }}>
                <th style={{ padding: '8px', textAlign: 'left', color: 'var(--primary)' }}>TIEMPO DE COMIDA</th>
                <th style={{ padding: '8px', color: '#FFA500' }}>CEREALES</th>
                <th style={{ padding: '8px', color: '#FF0000' }}>PROTEÍNAS</th>
                <th style={{ padding: '8px', color: '#228B22' }}>VEGETALES</th>
                <th style={{ padding: '8px', color: '#BA55D3' }}>FRUTAS</th>
                <th style={{ padding: '8px', color: '#1E90FF' }}>LÁCTEOS</th>
                <th style={{ padding: '8px', color: '#D97706' }}>GRASAS</th>
              </tr>
            </thead>
            <tbody>
              {mealsForPatient.map(meal => {
                const mealPortions = patient.menu?.[meal.key]?.portions || {};
                return (
                  <tr key={meal.key} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '8px', textAlign: 'left', fontWeight: '850', color: 'var(--text-primary)' }}>
                      {meal.title || meal.name}
                    </td>
                    {['cereales', 'proteinas', 'vegetales', 'frutas', 'lacteos', 'grasas'].map(group => (
                      <td key={group} style={{ padding: '8px' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={mealPortions[group] || ''}
                          placeholder="0"
                          onChange={(e) => handleMealPortionChange(meal.key, group, e.target.value)}
                          style={{ width: '42px', padding: '4px', textAlign: 'center', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', fontWeight: '850' }}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* Fila de Balance: Asignado vs. Meta */}
              <tr style={{ background: 'rgba(29, 81, 45, 0.05)', fontWeight: '900' }}>
                <td style={{ padding: '10px 8px', textAlign: 'left' }}>TOTAL ASIGNADO</td>
                {['cereales', 'proteinas', 'vegetales', 'frutas', 'lacteos', 'grasas'].map(group => {
                  const assigned = assignedMealTotals[group];
                  const target = suggestions[group] || 0;
                  const diff = assigned - target;
                  return (
                    <td key={group} style={{ padding: '10px 8px' }}>
                      <span>{assigned}</span>
                      <span style={{ fontSize: '0.65rem', display: 'block', color: diff === 0 ? '#16A34A' : diff > 0 ? '#DC2626' : '#D97706' }}>
                        {diff === 0 ? '✓ Exacto' : diff > 0 ? `+${diff}` : `${diff}`}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. DIETÉTICA Y CREACIÓN DEL MENÚ
      ─────────────────────────────────────────────────────────────── */}
      <section className="glass-panel shadow-premium" style={{ background: '#FFFFFF', border: '1.5px solid var(--primary)', padding: '24px', borderRadius: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--primary)', margin: 0, textTransform: 'uppercase' }}>
              🥗 Dietética y Menú Ejemplo del Paciente
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.75rem', opacity: 0.65 }}>
              Construye el menú cuantitativo seleccionando alimentos de la biblioteca que cumplan las raciones calculadas.
            </p>
          </div>

          <Link href={`/nutri/patient/${patient.id}/menu`} style={{ textDecoration: 'none' }}>
            <button style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '14px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(29, 81, 45, 0.25)' }}>
              <Utensils size={16} /> Abrir Constructor de Menú y Biblioteca
            </button>
          </Link>
        </div>

        {/* Resumen del menú asignado */}
        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {mealsForPatient.map(meal => {
              const mealFoods = patient.menu?.[meal.key]?.selectedFoods || [];
              const portions = patient.menu?.[meal.key]?.portions || {};
              return (
                <div key={meal.key} style={{ background: '#FFFFFF', borderRadius: '12px', padding: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '900', color: 'var(--primary)' }}>{meal.title || meal.name}</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{mealFoods.length} alimentos</span>
                  </div>
                  {mealFoods.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', opacity: 0.85, lineHeight: '1.4' }}>
                      {mealFoods.slice(0, 3).map((f, i) => (
                        <li key={i}>{f.name} ({f.portion || '1 ración'})</li>
                      ))}
                      {mealFoods.length > 3 && <li>y {mealFoods.length - 3} más...</li>}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.5, fontStyle: 'italic' }}>
                      Raciones asignadas sin alimentos seleccionados aún.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. HISTORIAL, EVOLUCIÓN Y NOTAS DE SEGUIMIENTO
      ─────────────────────────────────────────────────────────────── */}
      <section className="glass-panel shadow-premium" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', padding: '24px', borderRadius: '24px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <History size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase' }}>
            Evolución y Notas de Seguimiento
          </h3>
        </div>

        {/* Notas Clínicas de Seguimiento de la Nutricionista */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: '850', opacity: 0.65, display: 'block', marginBottom: '6px' }}>
            NOTAS Y OBSERVACIONES CLÍNICAS DE LA SESIÓN
          </label>
          <textarea
            style={{ width: '100%', minHeight: '85px', background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '14px', padding: '12px', fontSize: '0.85rem', color: '#333', outline: 'none', resize: 'vertical' }}
            placeholder="Anotaciones de evolución, adherencia, síntomas digestivos o acuerdos para la próxima consulta..."
            defaultValue={patient.details?.notes || ''}
            onBlur={(e) => {
              const updatedDetails = { ...patient.details, notes: e.target.value };
              savePatientUpdate({ ...patient, details: updatedDetails });
            }}
          />
        </div>

        {/* Historial de Sesiones Anteriores */}
        {patient.history && patient.history.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--primary)', display: 'block', marginBottom: '10px' }}>
              HISTORIAL DE CONSULTAS ANTERIORES ({patient.history.length})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...patient.history].reverse().map((entry, idx) => (
                <details key={entry.id || idx} style={{ background: '#FAFAFA', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <summary style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: '850', fontSize: '0.82rem' }}>
                    <span>Sesión #{patient.history.length - idx} · {entry.date}</span>
                    <span style={{ opacity: 0.6 }}>Peso: {entry.details?.weight || '--'} kg | IMC: {entry.imc || '--'}</span>
                  </summary>
                  <div style={{ padding: '0 16px 14px', fontSize: '0.78rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px' }}>
                    <p style={{ margin: '0 0 4px' }}><strong>Perfil Clínico:</strong> {entry.profile || '—'}</p>
                    <p style={{ margin: '0 0 4px' }}><strong>RCT / Dieta:</strong> {entry.dietForm?.rct || '—'} kcal</p>
                    {entry.notes && <p style={{ margin: '4px 0 0', fontStyle: 'italic' }}>&ldquo;{entry.notes}&rdquo;</p>}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Informes Guardados */}
        {patient.reports && patient.reports.length > 0 && (
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--primary)', display: 'block', marginBottom: '10px' }}>
              INFORMES CLÍNICOS GUARDADOS ({patient.reports.length})
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              {patient.reports.map((r, idx) => (
                <div key={r.id || idx} style={{ background: '#FAFAFA', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: '900', display: 'block' }}>Informe #{patient.reports.length - idx}</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{new Date(r.date).toLocaleDateString()}</span>
                  </div>
                  <Link href={`/nutri/patient/${patient.id}/report?reportId=${r.id}`} style={{ textDecoration: 'none', background: 'var(--card-green-light)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '800' }}>
                    Ver
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── BARRA FIJA INFERIOR ── */}
      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: '14px 20px', 
        background: 'rgba(255,255,255,0.96)', 
        backdropFilter: 'blur(15px)', 
        borderTop: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        gap: '12px',
        zIndex: 1000, 
        boxShadow: '0 -10px 25px rgba(0,0,0,0.08)'
      }}>
        <button 
          onClick={saveHistory}
          style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '900', background: 'var(--action)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(253, 158, 20, 0.25)' }}
        >
          <Save size={18} /> <span>Guardar Consulta en Historial</span>
        </button>
        <Link 
          href={`/nutri/patient/${patient.id}/report`}
          style={{ flex: 1, textDecoration: 'none' }}
        >
          <button 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '900', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(29, 81, 45, 0.2)' }}
          >
            <Printer size={18} /> <span>Informe Imprimible</span>
          </button>
        </Link>
      </div>

    </div>
    </>
  );
}
