'use client';
import { useState, Suspense, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, UserPlus, Smartphone, ShieldCheck, 
  CheckCircle2, Clock, Info, User, Phone, Mail, 
  FileText, ExternalLink, Target, Utensils, Activity, 
  Droplets, ShieldAlert, Ruler, Camera, Save, Check, X, Send
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUI } from '@/context/UIContext';
import { createPatient, updatePatient, getPatientById } from '@/lib/patients';
import { getAnthropometricIconSrc } from '@/utils/anthropometricIcon';

function NewPatientContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode'); // 'invitar' | null
  const patientIdParam = searchParams.get('patientId'); // UUID para edición directa
  const stepParam = searchParams.get('step'); // 1 a 6
  const isEditingExisting = Boolean(patientIdParam);

  const { showToast } = useUI();
  const router = useRouter();

  // Modo principal: 'presencial' | 'invitar'
  const [activeMode, setActiveMode] = useState(modeParam === 'invitar' ? 'invitar' : 'presencial');

  // Control de etapas del proceso presencial (1 a 6)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [createdPatientId, setCreatedPatientId] = useState(patientIdParam || null);
  const [patientUpdatedAt, setPatientUpdatedAt] = useState(null);
  const [patientBase, setPatientBase] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const ensurePatientVersion = async (targetId) => {
    if (patientUpdatedAt && patientBase) {
      return { updatedAt: patientUpdatedAt, base: patientBase };
    }
    const fresh = await getPatientById(targetId);
    if (fresh) {
      setPatientUpdatedAt(fresh.updated_at);
      setPatientBase(fresh);
      return { updatedAt: fresh.updated_at, base: fresh };
    }
    return { updatedAt: patientUpdatedAt, base: patientBase || {} };
  };

  // Cargar datos si se ingresa a editar un paciente existente
  useEffect(() => {
    if (patientIdParam) {
      setCreatedPatientId(patientIdParam);
      if (stepParam) {
        const s = parseInt(stepParam);
        if (s >= 1 && s <= 6) setCurrentStep(s);
      }
      getPatientById(patientIdParam).then(p => {
        if (!p) return;
        setPatientUpdatedAt(p.updated_at);
        setPatientBase(p);
        const det = p.details || {};
        const ans = p.onboardingAnswers || {};
        const meas = p.measurements || {};
        let r24 = ans.r24hNotes || '';
        try {
          const localR24 = localStorage.getItem(`r24h_notes_${patientIdParam}`);
          if (localR24) r24 = localR24;
        } catch (e) {}

        setFormData(prev => ({
          ...prev,
          name: p.name || det.name || '',
          email: det.email || '',
          ci: det.ci || '',
          phone: det.phone || '',
          birthDate: det.birthDate || '',
          gender: det.gender || 'female',
          isPediatric: Boolean(det.isPediatric),
          tutorName: det.tutorName || '',
          tutorPhone: det.tutorPhone || '',
          goals: Array.isArray(ans.goals) ? ans.goals : (ans.goals ? [ans.goals] : []),
          goalsOther: ans.goalsOther || '',
          tags: det.tags || [],
          clinicalHistory: det.clinicalHistory || '',
          medications: det.medications || '',
          notas: det.notas || '',
          favFood: ans.favFood || '',
          nonFavFood: ans.nonFavFood || '',
          mealPlan: det.mealPlan || ans.mealCount || '3+2 snacks',
          physicalActivity: ans.physicalActivity || '',
          allergies: ans.allergies || '',
          waterGlasses: ans.waterGlasses || '',
          waterLiters: ans.waterLiters || '',
          r24hNotes: r24,
          weight: det.weight ? det.weight.toString() : (meas.PESO ? meas.PESO.toString() : ''),
          height: det.height ? det.height.toString() : (meas.ESTATURA ? meas.ESTATURA.toString() : ''),
          measurements: {
            PESO: meas.PESO || det.weight || '',
            ESTATURA: meas.ESTATURA || det.height || '',
            CUELLO: meas.CUELLO || '',
            BRAZO: meas.BRAZO || '',
            TORSO: meas.TORSO || '',
            CINTURA: meas.CINTURA || '',
            CADERA: meas.CADERA || '',
            GLÚTEOS: meas.GLÚTEOS || '',
            MUSLO: meas.MUSLO || '',
            PANTORRILLA: meas.PANTORRILLA || ''
          }
        }));
      });
    }
  }, [patientIdParam, stepParam]);

  // ── ESTADO DEL EXPEDIENTE COMPLETO PRESENCIAL ──
  const [formData, setFormData] = useState({
    // Etapa 1: Datos Básicos
    name: '',
    email: '',
    ci: '',
    phone: '',
    birthDate: '',
    gender: 'female',
    isPediatric: false,
    tutorName: '',
    tutorPhone: '',
    goals: [],
    goalsOther: '',
    // Etapa 2: Historia Clínica
    tags: [],
    clinicalHistory: '',
    medications: '',
    notas: '',
    // Etapa 3: Hábitos y Preferencias
    favFood: '',
    nonFavFood: '',
    mealPlan: '3+2 snacks',
    physicalActivity: '',
    allergies: '',
    waterGlasses: '',
    waterLiters: '',
    // Etapa 4: Recordatorio 24 Horas
    r24hNotes: '',
    // Etapa 5: Antropometría
    height: '',
    weight: '',
    measurements: {
      PESO: '',
      ESTATURA: '',
      CUELLO: '',
      BRAZO: '',
      TORSO: '',
      CINTURA: '',
      CADERA: '',
      GLÚTEOS: '',
      MUSLO: '',
      PANTORRILLA: ''
    }
  });

  const [currentTag, setCurrentTag] = useState('');
  const [activeAnatomicalZone, setActiveAnatomicalZone] = useState('CINTURA');

  // Estado para fotografías clínicas (Etapa 6)
  const [photos, setPhotos] = useState({
    front: null,
    back: null,
    left: null,
    right: null
  });

  // Estado Modalidad 2: Invitar a registrarse (onboarding remoto)
  const [inviteForm, setInviteForm] = useState({
    name: '',
    phone: '',
    gender: '' // 'female' | 'male' | '' (no indicado)
  });
  const [invitePatientId, setInvitePatientId] = useState(null); // ID del expediente creado para el invitado
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [isSavingInvite, setIsSavingInvite] = useState(false);

  // Genera el enlace personal del paciente invitado
  const getPatientInviteLink = (patientId) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/paciente/${patientId}`;
  };

  // Crea el expediente mínimo y genera el enlace de invitación
  const handleCreateInvite = async () => {
    const trimmedName = inviteForm.name.trim();
    if (!trimmedName) {
      showToast('El nombre del paciente es obligatorio para generar el enlace', 'error');
      return;
    }
    setIsSavingInvite(true);
    try {
      const created = await createPatient({
        name: trimmedName,
        phone: inviteForm.phone.trim() || '',
        gender: inviteForm.gender || 'female',
        status: 'Pendiente',
        lastReminderDate: new Date().toISOString().split('T')[0]
      });
      setInvitePatientId(created.id);
      showToast('Expediente creado. Enlace personal disponible.', 'success');
    } catch (err) {
      console.error('Error creando expediente para invitación:', err);
      showToast('Error al crear el expediente. Verifica la conexión.', 'error');
    } finally {
      setIsSavingInvite(false);
    }
  };

  // Cálculo de edad automático
  const calculateAge = (dateString) => {
    if (!dateString) return '';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const calculatedAge = calculateAge(formData.birthDate);

  // Objetivos nutricionales predeterminados
  const goalOptions = [
    { id: 'fat_loss', label: 'Bajar porcentaje de grasa / Definición' },
    { id: 'muscle_gain', label: 'Aumento de masa muscular' },
    { id: 'digestive_health', label: 'Mejorar salud digestiva y energía' },
    { id: 'sports_performance', label: 'Rendimiento físico y deportivo' },
    { id: 'healthy_habits', label: 'Aprender a comer saludable sin restricciones' }
  ];

  const toggleGoal = (label) => {
    setFormData(prev => {
      const exists = prev.goals.includes(label);
      const updated = exists 
        ? prev.goals.filter(g => g !== label) 
        : [...prev.goals, label];
      return { ...prev, goals: updated };
    });
  };

  // Las 5 opciones exactas aprobadas para distribución de comidas
  const exactMealOptions = [
    '2 comidas principales.',
    '3 comidas principales.',
    '3 comidas principales + 2 snacks.',
    '3 comidas principales + 3 snacks.',
    '2 comidas principales + 2 snacks.'
  ];

  // Las 8 medidas anatómicas de Nutrimemi
  const measurementGuides = [
    { key: 'CUELLO', label: 'Cuello', desc: 'Punto medio del cuello, justo debajo de la manzana de Adán.' },
    { key: 'BRAZO', label: 'Brazo', desc: 'Punto medio entre el hombro y el codo, con el brazo relajado.' },
    { key: 'TORSO', label: 'Torso / Tórax', desc: 'Porción más ancha del tórax a la altura de los pezones.' },
    { key: 'CINTURA', label: 'Cintura', desc: 'Porción más estrecha del abdomen, por encima del ombligo.' },
    { key: 'CADERA', label: 'Cadera', desc: 'Porción de mayor circunferencia a nivel de la pelvis.' },
    { key: 'GLÚTEOS', label: 'Glúteos', desc: 'Porción de mayor prominencia posterior de los glúteos.' },
    { key: 'MUSLO', label: 'Muslo', desc: 'Punto medio entre la cadera y la rodilla derecha.' },
    { key: 'PANTORRILLA', label: 'Pantorrilla', desc: 'Porción de mayor circunferencia del músculo gemelo.' },
  ];

  const isFemale = formData.gender === 'female';

  // ── CÁLCULO EN TIEMPO REAL DE IMC, PERFIL Y SILUETA ANATÓMICA ──
  const currentWeightNum = parseFloat(formData.weight) || 0;
  const currentHeightNum = parseFloat(formData.height) || 0;
  const currentHeightM = currentHeightNum / 100;
  const currentImc = currentHeightM > 0 && currentWeightNum > 0 
    ? (currentWeightNum / (currentHeightM * currentHeightM)) 
    : 0;

  let currentImcProfile = 'NORMOPESO';
  let profileBadgeText = 'Normopeso (18.5 - 24.9)';
  let profileBadgeColor = '#1D512D';
  let profileBgColor = 'rgba(29, 81, 45, 0.08)';

  if (formData.isPediatric) {
    if (currentImc > 0) {
      if (currentImc < 14.5) {
        currentImcProfile = 'BAJO PESO';
        profileBadgeText = 'Bajo Peso (Criterio Pediátrico)';
        profileBadgeColor = '#1E90FF';
        profileBgColor = 'rgba(30, 144, 255, 0.1)';
      } else if (currentImc < 21) {
        currentImcProfile = 'NORMOPESO';
        profileBadgeText = 'Normopeso (Criterio Pediátrico)';
        profileBadgeColor = '#1D512D';
        profileBgColor = 'rgba(29, 81, 45, 0.1)';
      } else if (currentImc < 24) {
        currentImcProfile = 'SOBREPESO';
        profileBadgeText = 'Sobrepeso (Criterio Pediátrico)';
        profileBadgeColor = '#D97706';
        profileBgColor = 'rgba(217, 119, 6, 0.1)';
      } else {
        currentImcProfile = 'OBESIDAD';
        profileBadgeText = 'Obesidad (Criterio Pediátrico)';
        profileBadgeColor = '#DC2626';
        profileBgColor = 'rgba(220, 38, 38, 0.1)';
      }
    } else {
      profileBadgeText = 'Ingresa peso y talla (Criterio Pediátrico)';
    }
  } else {
    if (currentImc > 0) {
      if (currentImc < 18.5) {
        currentImcProfile = 'BAJO PESO';
        profileBadgeText = 'Bajo Peso (< 18.5)';
        profileBadgeColor = '#1E90FF';
        profileBgColor = 'rgba(30, 144, 255, 0.1)';
      } else if (currentImc < 25) {
        currentImcProfile = 'NORMOPESO';
        profileBadgeText = 'Normopeso (18.5 - 24.9)';
        profileBadgeColor = '#1D512D';
        profileBgColor = 'rgba(29, 81, 45, 0.1)';
      } else if (currentImc < 30) {
        currentImcProfile = 'SOBREPESO';
        profileBadgeText = 'Sobrepeso (25.0 - 29.9)';
        profileBadgeColor = '#D97706';
        profileBgColor = 'rgba(217, 119, 6, 0.1)';
      } else if (currentImc < 35) {
        currentImcProfile = 'OBESIDAD';
        profileBadgeText = 'Obesidad Grado I (30.0 - 34.9)';
        profileBadgeColor = '#EA580C';
        profileBgColor = 'rgba(234, 88, 12, 0.1)';
      } else {
        currentImcProfile = 'OBESIDAD II,III';
        profileBadgeText = 'Obesidad Grado II/III (≥ 35.0)';
        profileBadgeColor = '#DC2626';
        profileBgColor = 'rgba(220, 38, 38, 0.1)';
      }
    } else {
      profileBadgeText = 'Ingresa peso y talla para clasificar';
    }
  }

  // Silueta oficial dinámica según sexo y perfil real de IMC
  const dynamicSilhouetteSrc = getAnthropometricIconSrc(formData.gender, currentImcProfile);

  // Estimación de Grasa Corporal (US Navy) solo si existen circunferencias reales
  const cCuello = parseFloat(formData.measurements.CUELLO) || 0;
  const cCintura = parseFloat(formData.measurements.CINTURA) || 0;
  const cCadera = parseFloat(formData.measurements.CADERA) || 0;
  let usNavyGc = null;
  let masaMagraKg = null;

  if (cCuello > 0 && cCintura > 0 && currentHeightNum > 0) {
    if (formData.gender === 'male') {
      if ((cCintura - cCuello) > 0) {
        const d = 1.0324 - 0.19077 * Math.log10(cCintura - cCuello) + 0.15456 * Math.log10(currentHeightNum);
        if (d > 0) usNavyGc = (495 / d) - 450;
      }
    } else {
      if (cCadera > 0 && (cCintura + cCadera - cCuello) > 0) {
        const d = 1.29579 - 0.35004 * Math.log10(cCintura + cCadera - cCuello) + 0.22100 * Math.log10(currentHeightNum);
        if (d > 0) usNavyGc = (495 / d) - 450;
      }
    }
    if (usNavyGc !== null) {
      if (usNavyGc < 0) usNavyGc = 0;
      if (usNavyGc > 0 && currentWeightNum > 0) {
        masaMagraKg = currentWeightNum - (currentWeightNum * (usNavyGc / 100));
      }
    }
  }

  // Manejo de etiquetas/patologías
  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] });
      setCurrentTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  // Manejo de fotos
  const handlePhotoUpload = (key, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        showToast('La imagen supera el tamaño máximo de 8MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => ({ ...prev, [key]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper consolidado para garantizar que ninguna etapa sobrescriba respuestas previas
  const getConsolidatedOnboardingAnswers = () => ({
    goals: formData.goals,
    goalsOther: formData.goalsOther,
    favFood: formData.favFood,
    nonFavFood: formData.nonFavFood,
    mealCount: formData.mealPlan,
    physicalActivity: formData.physicalActivity,
    allergies: formData.allergies,
    waterGlasses: formData.waterGlasses,
    waterLiters: formData.waterLiters,
    r24hNotes: formData.r24hNotes,
    _origin: 'professional',
    reviewStatus: 'reviewed',
    lastUpdatedAt: new Date().toISOString()
  });

  // ── ETAPA 1: CREAR EL EXPEDIENTE BASE EN SUPABASE ──
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      showToast('El nombre completo del paciente es obligatorio', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (!createdPatientId) {
        // Crear nuevo paciente en base de datos
        const patientPayload = {
          name: trimmedName,
          ci: formData.ci.trim() || '',
          phone: formData.phone.trim() || '',
          email: formData.email.trim() || null,
          birthDate: formData.birthDate || null,
          gender: formData.gender || 'female',
          isPediatric: formData.isPediatric,
          tutorName: formData.isPediatric ? formData.tutorName : '',
          tutorPhone: formData.isPediatric ? formData.tutorPhone : '',
          mealPlan: formData.mealPlan || '3+2 snacks',
          tags: formData.tags || [],
          status: 'Activo',
          lastReminderDate: new Date().toISOString().split('T')[0]
        };

        const created = await createPatient(patientPayload);
        setCreatedPatientId(created.id);
        setPatientUpdatedAt(created.updated_at);
        setPatientBase(created);

        // Guardar objetivos iniciales en onboardingAnswers con CAS obligatorio
        const upd = await updatePatient(created.id, {
          onboardingAnswers: getConsolidatedOnboardingAnswers(),
          _expectedUpdatedAt: created.updated_at,
          _patientBase: created
        });
        if (upd?.updated_at) {
          setPatientUpdatedAt(upd.updated_at);
          setPatientBase(upd);
        }

        showToast('Expediente creado. Continuando con Historia Clínica...', 'success');
      } else {
        const { updatedAt, base } = await ensurePatientVersion(createdPatientId);
        // Si ya fue creado, actualizamos datos básicos sin perder otros campos con CAS
        const upd = await updatePatient(createdPatientId, {
          details: {
            name: trimmedName,
            ci: formData.ci.trim() || '',
            phone: formData.phone.trim() || '',
            email: formData.email.trim() || null,
            birthDate: formData.birthDate || null,
            gender: formData.gender || 'female',
            isPediatric: formData.isPediatric,
            tutorName: formData.isPediatric ? formData.tutorName : '',
            tutorPhone: formData.isPediatric ? formData.tutorPhone : ''
          },
          onboardingAnswers: getConsolidatedOnboardingAnswers(),
          _expectedUpdatedAt: updatedAt,
          _patientBase: base
        });
        if (upd?.updated_at) {
          setPatientUpdatedAt(upd.updated_at);
          setPatientBase(upd);
        }
        showToast('Datos personales actualizados', 'success');
      }

      if (isEditingExisting) {
        router.push(`/nutri/patient/${createdPatientId || patientIdParam}`);
      } else {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error al crear expediente:', err);
      if (err.code === 'VERSION_CONFLICT' || err.code === 'CLINICAL_FIELD_CONFLICT') {
        showToast('Conflicto concurrente: los datos fueron modificados por otra sesión. Recarga la página.', 'error');
      } else {
        showToast('Error al crear el expediente. Verifica la conexión a internet.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── ETAPA 2: GUARDAR HISTORIA CLÍNICA ──
  const handleStep2Submit = async (skipAdvance = false) => {
    if (!createdPatientId) return;
    setIsSaving(true);
    try {
      const { updatedAt, base } = await ensurePatientVersion(createdPatientId);
      const upd = await updatePatient(createdPatientId, {
        details: {
          clinicalHistory: formData.clinicalHistory,
          medications: formData.medications,
          notas: formData.notas,
          tags: formData.tags
        },
        onboardingAnswers: getConsolidatedOnboardingAnswers(),
        _expectedUpdatedAt: updatedAt,
        _patientBase: base
      });
      if (upd?.updated_at) {
        setPatientUpdatedAt(upd.updated_at);
        setPatientBase(upd);
      }
      showToast('Historia clínica guardada', 'success');
      if (!skipAdvance) {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error guardando historia clínica:', err);
      if (err.code === 'VERSION_CONFLICT' || err.code === 'CLINICAL_FIELD_CONFLICT') {
        showToast('Conflicto concurrente: los datos fueron modificados por otra sesión. Recarga la página.', 'error');
      } else {
        showToast('Error al guardar datos. Reintentando...', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── ETAPA 3: GUARDAR HÁBITOS Y PREFERENCIAS ──
  const handleStep3Submit = async (skipAdvance = false) => {
    if (!createdPatientId) return;
    setIsSaving(true);
    try {
      const { updatedAt, base } = await ensurePatientVersion(createdPatientId);
      const upd = await updatePatient(createdPatientId, {
        details: {
          mealPlan: formData.mealPlan
        },
        onboardingAnswers: getConsolidatedOnboardingAnswers(),
        _expectedUpdatedAt: updatedAt,
        _patientBase: base
      });
      if (upd?.updated_at) {
        setPatientUpdatedAt(upd.updated_at);
        setPatientBase(upd);
      }
      showToast('Hábitos nutricionales guardados', 'success');
      if (!skipAdvance) {
        setCurrentStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error guardando hábitos:', err);
      if (err.code === 'VERSION_CONFLICT' || err.code === 'CLINICAL_FIELD_CONFLICT') {
        showToast('Conflicto concurrente: los datos fueron modificados por otra sesión. Recarga la página.', 'error');
      } else {
        showToast('Error al guardar datos.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── ETAPA 4: GUARDAR RECORDATORIO 24 HORAS (R24H) EN SUPABASE ──
  const handleStep4Submit = async (skipAdvance = false) => {
    if (!createdPatientId) return;
    setIsSaving(true);
    try {
      // Guardar en localStorage solo como caché/respaldo local
      localStorage.setItem(`r24h_notes_${createdPatientId}`, formData.r24hNotes);

      const { updatedAt, base } = await ensurePatientVersion(createdPatientId);
      // Persistir de forma permanente y autoritativa en Supabase (onboardingAnswers y notas) con CAS
      const upd = await updatePatient(createdPatientId, {
        onboardingAnswers: getConsolidatedOnboardingAnswers(),
        details: {
          notas: formData.notas
        },
        _expectedUpdatedAt: updatedAt,
        _patientBase: base
      });
      if (upd?.updated_at) {
        setPatientUpdatedAt(upd.updated_at);
        setPatientBase(upd);
      }
      showToast('Recordatorio 24H guardado en expediente', 'success');
      if (!skipAdvance) {
        setCurrentStep(5);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error guardando R24H:', err);
      if (err.code === 'VERSION_CONFLICT' || err.code === 'CLINICAL_FIELD_CONFLICT') {
        showToast('Conflicto concurrente: los datos fueron modificados por otra sesión. Recarga la página.', 'error');
      } else {
        showToast('Error al guardar datos.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── ETAPA 5: GUARDAR ANTROPOMETRÍA PROFESIONAL ──
  const handleStep5Submit = async (skipAdvance = false) => {
    if (!createdPatientId) return;
    setIsSaving(true);
    try {
      const parsedWeight = formData.weight ? parseFloat(formData.weight) : null;
      const parsedHeight = formData.height ? parseFloat(formData.height) : null;

      // Medidas antropométricas en la capa profesional (NO autorreportadas)
      const professionalMeasurements = {
        PESO: formData.weight || '',
        ESTATURA: formData.height || '',
        CUELLO: formData.measurements.CUELLO || '',
        BRAZO: formData.measurements.BRAZO || '',
        TORSO: formData.measurements.TORSO || '',
        CINTURA: formData.measurements.CINTURA || '',
        CADERA: formData.measurements.CADERA || '',
        GLÚTEOS: formData.measurements.GLÚTEOS || '',
        MUSLO: formData.measurements.MUSLO || '',
        PANTORRILLA: formData.measurements.PANTORRILLA || '',
        _origin: 'professional',
        _status: 'reviewed',
        _recordedAt: new Date().toISOString()
      };

      const { updatedAt, base } = await ensurePatientVersion(createdPatientId);
      const upd = await updatePatient(createdPatientId, {
        details: {
          weight: parsedWeight,
          height: parsedHeight
        },
        measurements: professionalMeasurements,
        onboardingAnswers: getConsolidatedOnboardingAnswers(),
        _expectedUpdatedAt: updatedAt,
        _patientBase: base
      });
      if (upd?.updated_at) {
        setPatientUpdatedAt(upd.updated_at);
        setPatientBase(upd);
      }

      showToast('Antropometría profesional guardada', 'success');
      if (!skipAdvance) {
        setCurrentStep(6);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error guardando medidas:', err);
      if (err.code === 'VERSION_CONFLICT' || err.code === 'CLINICAL_FIELD_CONFLICT') {
        showToast('Conflicto concurrente: los datos fueron modificados por otra sesión. Recarga la página.', 'error');
      } else {
        showToast('Error al guardar medidas.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── ETAPA 6: FINALIZACIÓN Y APERTURA DE EXPEDIENTE COMPLETO ──
  const handleFinishAll = () => {
    if (!createdPatientId) return;
    showToast('¡Expediente completado con éxito!', 'success');
    router.push(`/nutri/patient/${createdPatientId}`);
  };

  // Atajo para salir directamente a la ficha en cualquier paso
  const handleExitToPatient = () => {
    if (createdPatientId) {
      router.push(`/nutri/patient/${createdPatientId}`);
    } else {
      router.push('/nutri/dashboard');
    }
  };

  return (
    <div style={{ 
      padding: '20px 20px 140px', 
      maxWidth: '720px', 
      margin: '0 auto',
      color: 'var(--text-primary)'
    }}>
      {/* ── CABECERA PRINCIPAL ── */}
      <header style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button"
            onClick={() => {
              if (isEditingExisting) {
                router.push(`/nutri/patient/${patientIdParam || createdPatientId}`);
              } else if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                router.push('/nutri/dashboard');
              }
            }}
            style={{ 
              color: 'var(--text-primary)',
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '12px',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>
              Incorporación de Paciente
            </h1>
            <p style={{ fontSize: '0.78rem', opacity: 0.65, margin: '2px 0 0', fontWeight: '600' }}>
              {activeMode === 'presencial' ? `Etapa ${currentStep} de ${totalSteps}: Proceso Clínico Presencial` : 'Modalidad Remota'}
            </p>
          </div>
        </div>

        {/* Botón para saltar a ficha si ya existe el ID */}
        {createdPatientId && activeMode === 'presencial' && (
          <button
            type="button"
            onClick={handleExitToPatient}
            style={{
              background: 'rgba(29, 81, 45, 0.08)',
              border: '1px solid rgba(29, 81, 45, 0.2)',
              borderRadius: '12px',
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: '850',
              color: 'var(--primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={15} />
            <span>Ir a Ficha Clínica</span>
          </button>
        )}
      </header>

      {/* ── SELECTOR DE MODALIDAD (Solo visible en Etapa 1) ── */}
      {currentStep === 1 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(0, 0, 0, 0.05)',
          padding: '5px',
          borderRadius: '16px',
          marginBottom: '20px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setActiveMode('presencial')}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeMode === 'presencial' ? '#FFFFFF' : 'transparent',
              color: activeMode === 'presencial' ? 'var(--primary)' : 'var(--text-primary)',
              fontWeight: activeMode === 'presencial' ? '900' : '700',
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: activeMode === 'presencial' ? '0 3px 10px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            <UserPlus size={18} />
            <span>Consulta Presencial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('invitar')}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              background: activeMode === 'invitar' ? '#FFFFFF' : 'transparent',
              color: activeMode === 'invitar' ? 'var(--primary)' : 'var(--text-primary)',
              fontWeight: activeMode === 'invitar' ? '900' : '700',
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: activeMode === 'invitar' ? '0 3px 10px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            <Smartphone size={18} />
            <span>Invitar a Distancia</span>
          </button>
        </div>
      )}

      {/* ── BARRA DE PROGRESO DE ETAPAS (Presencial) ── */}
      {activeMode === 'presencial' && (
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '850', color: 'var(--primary)', textTransform: 'uppercase' }}>
              {currentStep === 1 && '1. Datos Personales y Objetivos'}
              {currentStep === 2 && '2. Historia Clínica y Medicamentos'}
              {currentStep === 3 && '3. Hábitos y Preferencias Alimentarias'}
              {currentStep === 4 && '4. Recordatorio 24 Horas (R24H)'}
              {currentStep === 5 && '5. Antropometría y Medidas'}
              {currentStep === 6 && '6. Fotografías Clínicas y Cierre'}
            </span>
            <span style={{ fontSize: '0.74rem', fontWeight: '850', opacity: 0.6 }}>
              Paso {currentStep} de {totalSteps}
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(29, 81, 45, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${(currentStep / totalSteps) * 100}%`, 
              height: '100%', 
              background: 'var(--primary)', 
              borderRadius: '999px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── MODALIDAD PRESENCIAL: FLUJO COMPLETO EN 6 ETAPAS ─────────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeMode === 'presencial' && (
        <div>
          {/* ── ETAPA 1: DATOS PERSONALES BÁSICOS Y OBJETIVOS ── */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="fade-in">
              <section className="glass-panel" style={{ 
                padding: '24px', 
                borderRadius: '24px',
                background: '#FFFFFF',
                border: '1px solid rgba(29, 81, 45, 0.12)',
                boxShadow: 'var(--shadow-subtle)',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', margin: '0 0 4px', color: 'var(--primary)' }}>
                  DATOS PERSONALES BÁSICOS
                </h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0 0 18px' }}>
                  Apertura del expediente clínico. Al continuar, el paciente quedará registrado en el sistema.
                </p>

                {/* Nombre Completo */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                    <span>Nombre Completo</span>
                    <span style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: '800' }}>* Obligatorio</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Carolina Pérez Mendoza"
                    className="input-field"
                    style={{ width: '100%', padding: '12px 14px', fontSize: '0.92rem', borderRadius: '12px', marginBottom: 0 }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                {/* Cédula y Correo */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                      Cédula / DNI <span style={{ opacity: 0.5, fontWeight: '600' }}>(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. V-18.452.123"
                      className="input-field"
                      style={{ width: '100%', padding: '12px 14px', fontSize: '0.92rem', borderRadius: '12px', marginBottom: 0 }}
                      value={formData.ci}
                      onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                      Correo Electrónico <span style={{ opacity: 0.5, fontWeight: '600' }}>(Opcional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="ejemplo@correo.com"
                      className="input-field"
                      style={{ width: '100%', padding: '12px 14px', fontSize: '0.92rem', borderRadius: '12px', marginBottom: 0 }}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Género y Tipo de Paciente */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                      Sexo Biológico
                    </label>
                    <select
                      className="input-field"
                      style={{ width: '100%', padding: '12px 14px', fontSize: '0.92rem', borderRadius: '12px', marginBottom: 0, fontWeight: '750' }}
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="female">Femenino</option>
                      <option value="male">Masculino</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                      Tipo de Paciente
                    </label>
                    <select
                      className="input-field"
                      style={{ width: '100%', padding: '12px 14px', fontSize: '0.92rem', borderRadius: '12px', marginBottom: 0, fontWeight: '750' }}
                      value={formData.isPediatric ? 'si' : 'no'}
                      onChange={(e) => setFormData({ ...formData, isPediatric: e.target.value === 'si' })}
                    >
                      <option value="no">Adulto</option>
                      <option value="si">Pediátrico</option>
                    </select>
                  </div>
                </div>

                {/* Campos Pediátricos (si aplica) */}
                {formData.isPediatric && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px', background: 'rgba(29, 81, 45, 0.05)', padding: '14px', borderRadius: '14px', border: '1px dashed var(--primary)' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '850', marginBottom: '4px', display: 'block' }}>Nombre Tutor / Representante</label>
                      <input
                        type="text"
                        placeholder="Padre, Madre o Tutor"
                        className="input-field"
                        style={{ marginBottom: 0, padding: '10px 12px' }}
                        value={formData.tutorName}
                        onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '850', marginBottom: '4px', display: 'block' }}>Teléfono del Tutor</label>
                      <input
                        type="tel"
                        placeholder="Ej. +58 412..."
                        className="input-field"
                        style={{ marginBottom: 0, padding: '10px 12px' }}
                        value={formData.tutorPhone}
                        onChange={(e) => setFormData({ ...formData, tutorPhone: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Teléfono y Fecha de Nacimiento */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                      Teléfono Móvil
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. +58 412 1234567"
                      className="input-field"
                      style={{ width: '100%', padding: '12px 14px', fontSize: '0.92rem', borderRadius: '12px', marginBottom: 0 }}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      style={{ width: '100%', padding: '12px 14px', fontSize: '0.92rem', borderRadius: '12px', marginBottom: 0 }}
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                      Edad
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ width: '100%', padding: '12px 14px', fontSize: '0.92rem', borderRadius: '12px', marginBottom: 0, background: '#F3F4F6', fontWeight: '850', textAlign: 'center' }}
                      value={calculatedAge ? `${calculatedAge} años` : '—'}
                      readOnly
                    />
                  </div>
                </div>

                {/* Objetivos Nutricionales */}
                <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Target size={18} color="var(--primary)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-primary)' }}>
                      Objetivos Nutricionales Principales
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {goalOptions.map(opt => {
                      const isSelected = formData.goals.includes(opt.label);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => toggleGoal(opt.label)}
                          style={{
                            background: isSelected ? 'rgba(29, 81, 45, 0.08)' : 'rgba(0,0,0,0.02)',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.06)',
                            borderRadius: '12px',
                            padding: '10px 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontSize: '0.84rem', fontWeight: isSelected ? '850' : '700', color: isSelected ? 'var(--primary)' : '#374151' }}>
                            {opt.label}
                          </span>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '6px',
                            background: isSelected ? 'var(--primary)' : 'transparent',
                            border: isSelected ? 'none' : '2px solid rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    placeholder="Otro objetivo o detalle particular..."
                    className="input-field"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem', borderRadius: '10px', marginBottom: 0 }}
                    value={formData.goalsOther}
                    onChange={(e) => setFormData({ ...formData, goalsOther: e.target.value })}
                  />
                </div>
              </section>

              {/* Botón de envío Etapa 1 */}
              <button
                type="submit"
                disabled={isSaving}
                className="btn-accent"
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  borderRadius: '18px',
                  fontWeight: '900',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 22px rgba(29, 81, 45, 0.25)',
                  border: 'none',
                  cursor: isSaving ? 'wait' : 'pointer',
                  opacity: isSaving ? 0.75 : 1
                }}
              >
                <span>{isSaving ? 'Guardando...' : isEditingExisting ? 'Guardar y Volver a Ficha' : 'Crear Expediente y Continuar con Historia Clínica'}</span>
                <ArrowRight size={20} />
              </button>
            </form>
          )}

          {/* ── ETAPA 2: HISTORIA CLÍNICA, PATOLOGÍAS Y MEDICAMENTOS ── */}
          {currentStep === 2 && (
            <div className="fade-in">
              <section className="glass-panel" style={{ 
                padding: '24px', 
                borderRadius: '24px',
                background: '#FFFFFF',
                border: '1px solid rgba(29, 81, 45, 0.12)',
                boxShadow: 'var(--shadow-subtle)',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', margin: '0 0 4px', color: 'var(--primary)' }}>
                  HISTORIA CLÍNICA Y ANTECEDENTES
                </h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0 0 18px' }}>
                  Registra antecedentes médicos, diagnósticos, patologías y fármacos actuales del paciente.
                </p>

                {/* Etiquetas / Patologías */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                    Etiquetas / Patologías
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {formData.tags.map(tag => (
                      <span key={tag} style={{ background: 'var(--primary)', color: 'white', padding: '5px 12px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {tag} 
                        <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Ej: Diabetes Tipo 2, Hipotiroidismo, Resistencia a la Insulina..." 
                      className="input-field" 
                      style={{ marginBottom: 0, padding: '10px 14px' }}
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <button type="button" onClick={addTag} className="btn-secondary" style={{ padding: '0 18px', borderRadius: '12px', fontWeight: '850' }}>Añadir</button>
                  </div>
                </div>

                {/* Antecedentes Médicos */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                    Antecedentes Médicos / Enfermedades
                  </label>
                  <textarea 
                    className="input-field" 
                    placeholder="Detalla cirugías, diagnósticos médicos previos, antecedentes familiares..." 
                    style={{ minHeight: '80px', paddingTop: '10px', marginBottom: 0, width: '100%', borderRadius: '12px' }}
                    value={formData.clinicalHistory}
                    onChange={(e) => setFormData({ ...formData, clinicalHistory: e.target.value })}
                  />
                </div>

                {/* Medicamentos */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                    Medicamentos Actuales y Dosis
                  </label>
                  <textarea 
                    className="input-field" 
                    placeholder="Ej. Eutirox 50mcg en ayunas, Metformina 850mg con la cena..." 
                    style={{ minHeight: '65px', paddingTop: '10px', marginBottom: 0, width: '100%', borderRadius: '12px' }}
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  />
                </div>

                {/* Notas Adicionales */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                    Notas Adicionales (Exámenes de laboratorio, observaciones clínicas...)
                  </label>
                  <textarea 
                    className="input-field" 
                    placeholder="Cualquier nota adicional relevante para el seguimiento..." 
                    style={{ minHeight: '65px', paddingTop: '10px', marginBottom: 0, width: '100%', borderRadius: '12px' }}
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  />
                </div>
              </section>

              {/* Botones de navegación Etapa 2 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: '850' }}
                >
                  Regresar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={async () => {
                    await handleStep2Submit(isEditingExisting);
                    if (isEditingExisting && createdPatientId) router.push(`/nutri/patient/${createdPatientId}`);
                  }}
                  className="btn-accent"
                  style={{ flex: 2, padding: '16px', borderRadius: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>{isSaving ? 'Guardando...' : isEditingExisting ? 'Guardar y Volver a Ficha' : 'Guardar y Pasar a Hábitos'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── ETAPA 3: HÁBITOS Y PREFERENCIAS ALIMENTARIAS ── */}
          {currentStep === 3 && (
            <div className="fade-in">
              <section className="glass-panel" style={{ 
                padding: '24px', 
                borderRadius: '24px',
                background: '#FFFFFF',
                border: '1px solid rgba(29, 81, 45, 0.12)',
                boxShadow: 'var(--shadow-subtle)',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', margin: '0 0 4px', color: 'var(--primary)' }}>
                  GUSTOS, HÁBITOS Y PREFERENCIAS ALIMENTARIAS
                </h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0 0 18px' }}>
                  Recopila los alimentos preferidos, alergias, actividad física y distribución de comidas.
                </p>

                {/* Comida Favorita */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '4px' }}>
                    1. Comida y alimentos favoritos
                  </label>
                  <textarea 
                    className="input-field"
                    style={{ width: '100%', minHeight: '65px', padding: '10px 12px', fontSize: '0.88rem', borderRadius: '10px', marginBottom: 0 }}
                    value={formData.favFood}
                    onChange={(e) => setFormData({ ...formData, favFood: e.target.value })}
                    placeholder="Ej. Arepa con queso blanco y aguacate, pescado a la plancha, frutas..."
                  />
                </div>

                {/* Comida NO Favorita */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '4px' }}>
                    2. Comida y alimentos NO favoritos (que rechaza o evita)
                  </label>
                  <textarea 
                    className="input-field"
                    style={{ width: '100%', minHeight: '65px', padding: '10px 12px', fontSize: '0.88rem', borderRadius: '10px', marginBottom: 0 }}
                    value={formData.nonFavFood}
                    onChange={(e) => setFormData({ ...formData, nonFavFood: e.target.value })}
                    placeholder="Ej. Berenjenas, hígado, lácteos enteros..."
                  />
                </div>

                {/* Distribución de Comidas (Las 5 Opciones Oficiales) */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '4px' }}>
                    3. ¿Cuántas comidas desea realizar al día?
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {exactMealOptions.map(opt => {
                      const isSelected = formData.mealPlan === opt;
                      return (
                        <div
                          key={opt}
                          onClick={() => setFormData({ ...formData, mealPlan: opt })}
                          style={{
                            background: isSelected ? 'rgba(29, 81, 45, 0.08)' : 'rgba(0,0,0,0.02)',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.06)',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span style={{ fontSize: '0.84rem', fontWeight: isSelected ? '850' : '700', color: isSelected ? 'var(--primary)' : '#374151' }}>
                            {opt}
                          </span>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: isSelected ? '5px solid var(--primary)' : '2px solid rgba(0,0,0,0.25)',
                            background: '#FFFFFF'
                          }} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actividad Física */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '4px' }}>
                    4. Actividad física (tipo, frecuencia y duración)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {['Sedentario / Sin actividad', 'Caminata 30-45 min (3 días)', 'Gimnasio / Pesas (4-5 días)', 'Crossfit / Funcional', 'Yoga / Pilates'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = formData.physicalActivity ? `${formData.physicalActivity}, ${tag}` : tag;
                          setFormData({ ...formData, physicalActivity: current });
                        }}
                        style={{
                          background: 'rgba(29, 81, 45, 0.05)',
                          border: '1px solid rgba(29, 81, 45, 0.15)',
                          borderRadius: '999px',
                          padding: '3px 10px',
                          fontSize: '0.72rem',
                          fontWeight: '750',
                          color: 'var(--primary)',
                          cursor: 'pointer'
                        }}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                  <textarea 
                    className="input-field"
                    style={{ width: '100%', minHeight: '65px', padding: '10px 12px', fontSize: '0.88rem', borderRadius: '10px', marginBottom: 0 }}
                    value={formData.physicalActivity}
                    onChange={(e) => setFormData({ ...formData, physicalActivity: e.target.value })}
                    placeholder="Describe el tipo de actividad y frecuencia semanal..."
                  />
                </div>

                {/* Consumo Hídrico */}
                <div style={{ marginBottom: '16px', background: 'rgba(2, 132, 199, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', color: '#0369A1', marginBottom: '8px' }}>
                    5. Consumo Hídrico Diario (Agua al día)
                  </label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.65, display: 'block', marginBottom: '4px' }}>VASOS DE AGUA:</span>
                      <input 
                        type="number" 
                        step="0.5" 
                        className="input-field"
                        style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: '900', color: '#0284C7', marginBottom: 0, padding: '8px' }}
                        value={formData.waterGlasses}
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = parseFloat(val);
                          setFormData({
                            ...formData,
                            waterGlasses: val,
                            waterLiters: val ? (parsed * 0.24).toFixed(2).replace(/\.?0+$/, '') : ''
                          });
                        }}
                      />
                      <span style={{ fontSize: '0.62rem', opacity: 0.6 }}>(1 vaso = 240 ml)</span>
                    </div>

                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0284C7' }}>=</div>

                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.65, display: 'block', marginBottom: '4px' }}>LITROS DE AGUA:</span>
                      <input 
                        type="number" 
                        step="0.1" 
                        className="input-field"
                        style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: '900', color: '#0284C7', marginBottom: 0, padding: '8px' }}
                        value={formData.waterLiters}
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = parseFloat(val);
                          setFormData({
                            ...formData,
                            waterLiters: val,
                            waterGlasses: val ? (parsed / 0.24).toFixed(1).replace(/\.?0+$/, '') : ''
                          });
                        }}
                      />
                      <span style={{ fontSize: '0.62rem', opacity: 0.6 }}>(litros totales)</span>
                    </div>
                  </div>
                </div>

                {/* Alergias e Intolerancias */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '4px' }}>
                    6. Intolerancia o alergia a algún alimento
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {['Ninguna conocida', 'Lactosa', 'Gluten / Celíaco', 'Mariscos', 'Maní / Frutos secos', 'Huevo'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = formData.allergies ? `${formData.allergies}, ${tag}` : tag;
                          setFormData({ ...formData, allergies: current });
                        }}
                        style={{
                          background: 'rgba(253, 158, 20, 0.08)',
                          border: '1px solid rgba(253, 158, 20, 0.25)',
                          borderRadius: '999px',
                          padding: '3px 10px',
                          fontSize: '0.72rem',
                          fontWeight: '750',
                          color: '#92400E',
                          cursor: 'pointer'
                        }}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                  <textarea 
                    className="input-field"
                    style={{ width: '100%', minHeight: '65px', padding: '10px 12px', fontSize: '0.88rem', borderRadius: '10px', marginBottom: 0 }}
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="Detalla cualquier intolerancia o alimento que le genere malestar..."
                  />
                </div>
              </section>

              {/* Botones de navegación Etapa 3 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: '850' }}
                >
                  Regresar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={async () => {
                    await handleStep3Submit(isEditingExisting);
                    if (isEditingExisting && createdPatientId) router.push(`/nutri/patient/${createdPatientId}`);
                  }}
                  className="btn-accent"
                  style={{ flex: 2, padding: '16px', borderRadius: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>{isSaving ? 'Guardando...' : isEditingExisting ? 'Guardar y Volver a Ficha' : 'Guardar y Pasar a Recordatorio 24H'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── ETAPA 4: RECORDATORIO 24 HORAS (R24H) ── */}
          {currentStep === 4 && (
            <div className="fade-in">
              <section className="glass-panel" style={{ 
                padding: '24px', 
                borderRadius: '24px',
                background: '#FFFFFF',
                border: '1px solid rgba(29, 81, 45, 0.12)',
                boxShadow: 'var(--shadow-subtle)',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', margin: '0 0 4px', color: 'var(--primary)' }}>
                  RECORDATORIO DE ALIMENTACIÓN DE 24 HORAS (R24H)
                </h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0 0 16px', lineHeight: '1.4' }}>
                  Anota detalladamente todo lo que el paciente consumió en las últimas 24 horas: alimentos, horarios habituales, preparaciones y raciones aproximadas.
                </p>

                <textarea 
                  className="input-field" 
                  placeholder="Ejemplo:&#10;• Desayuno (8:00 AM): 2 arepas con queso blanco y café con leche descremada.&#10;• Merienda AM (11:00 AM): 1 manzana verde con almendras.&#10;• Almuerzo (1:30 PM): 1 taza de arroz, pechuga de pollo a la plancha y ensalada de vegetales.&#10;• Merienda PM (5:00 PM): Café negro y galleta integral.&#10;• Cena (8:00 PM): Ensalada de atún con aguacate y huevo cocido..." 
                  style={{ 
                    minHeight: '220px', 
                    padding: '16px', 
                    fontSize: '0.9rem', 
                    lineHeight: '1.5',
                    borderRadius: '16px', 
                    border: '1px solid rgba(0,0,0,0.12)', 
                    width: '100%',
                    marginBottom: 0
                  }}
                  value={formData.r24hNotes}
                  onChange={(e) => setFormData({ ...formData, r24hNotes: e.target.value })}
                />
              </section>

              {/* Botones de navegación Etapa 4 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: '850' }}
                >
                  Regresar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={async () => {
                    await handleStep4Submit(isEditingExisting);
                    if (isEditingExisting && createdPatientId) router.push(`/nutri/patient/${createdPatientId}`);
                  }}
                  className="btn-accent"
                  style={{ flex: 2, padding: '16px', borderRadius: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>{isSaving ? 'Guardando...' : isEditingExisting ? 'Guardar y Volver a Ficha' : 'Guardar y Pasar a Antropometría'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── ETAPA 5: ANTROPOMETRÍA PROFESIONAL ── */}
          {currentStep === 5 && (
            <div className="fade-in">
              <section className="glass-panel" style={{ 
                padding: '24px', 
                borderRadius: '24px',
                background: '#FFFFFF',
                border: '1px solid rgba(29, 81, 45, 0.12)',
                boxShadow: 'var(--shadow-subtle)',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', margin: '0 0 4px', color: 'var(--primary)' }}>
                  ANTROPOMETRÍA Y MEDIDAS CLÍNICAS
                </h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0 0 18px' }}>
                  Ingresa las mediciones profesionales tomadas en la consulta.
                </p>

                {/* Peso y Estatura con cálculo en vivo e IMC */}
                <div style={{ background: 'rgba(217, 119, 6, 0.05)', padding: '18px', borderRadius: '18px', border: '1px solid rgba(217, 119, 6, 0.2)', marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', alignItems: 'center' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '850', color: '#B45309', marginBottom: '4px' }}>
                        PESO ACTUAL (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Ej. 68.5"
                        className="input-field"
                        style={{ width: '100%', padding: '12px', fontSize: '1.15rem', fontWeight: '900', borderRadius: '12px', textAlign: 'center', marginBottom: 0 }}
                        value={formData.weight}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          weight: e.target.value,
                          measurements: { ...formData.measurements, PESO: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '850', color: '#B45309', marginBottom: '4px' }}>
                        ESTATURA (cm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Ej. 165"
                        className="input-field"
                        style={{ width: '100%', padding: '12px', fontSize: '1.15rem', fontWeight: '900', borderRadius: '12px', textAlign: 'center', marginBottom: 0 }}
                        value={formData.height}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          height: e.target.value,
                          measurements: { ...formData.measurements, ESTATURA: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '850', color: '#B45309', marginBottom: '4px' }}>
                        IMC ESTIMADO
                      </label>
                      <div style={{ 
                        height: '50px', 
                        background: '#FFFFFF', 
                        borderRadius: '12px', 
                        border: '1.5px solid rgba(0,0,0,0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: '900', 
                        fontSize: '1.25rem',
                        color: profileBadgeColor
                      }}>
                        {currentImc > 0 ? currentImc.toFixed(1) : '—'}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '850', color: '#B45309', marginBottom: '4px' }}>
                        CLASIFICACIÓN CLÍNICA
                      </label>
                      <div style={{ 
                        height: '50px', 
                        background: profileBgColor, 
                        borderRadius: '12px', 
                        border: `1.5px solid ${profileBadgeColor}`, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: '900', 
                        fontSize: '0.8rem',
                        color: profileBadgeColor,
                        padding: '4px 8px',
                        textAlign: 'center',
                        lineHeight: '1.2'
                      }}>
                        {profileBadgeText}
                      </div>
                    </div>
                  </div>

                  {/* Composición Corporal (US Navy) si hay datos */}
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed rgba(217, 119, 6, 0.25)', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', opacity: 0.65, display: 'block' }}>% GRASA CORPORAL (US NAVY)</span>
                      <span style={{ fontSize: '1.05rem', fontWeight: '900', color: usNavyGc ? '#D97706' : '#9CA3AF' }}>
                        {usNavyGc ? `${usNavyGc.toFixed(1)}%` : 'Requiere Cuello y Cintura'}
                      </span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', opacity: 0.65, display: 'block' }}>MASA MAGRA ESTIMADA</span>
                      <span style={{ fontSize: '1.05rem', fontWeight: '900', color: masaMagraKg ? 'var(--primary)' : '#9CA3AF' }}>
                        {masaMagraKg ? `${masaMagraKg.toFixed(1)} kg` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Guía Anatómica de las 8 Circunferencias (Ilustración Prominente y Adaptativa) */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <span style={{ fontSize: '0.88rem', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase' }}>
                        Guía Anatómica de Circunferencias
                      </span>
                      <span style={{ fontSize: '0.72rem', opacity: 0.65, display: 'block' }}>
                        Ilustración adaptada según sexo biológico y clasificación de IMC
                      </span>
                    </div>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: '850', 
                      padding: '4px 10px', 
                      background: profileBgColor, 
                      color: profileBadgeColor, 
                      borderRadius: '12px',
                      border: `1px solid ${profileBadgeColor}`
                    }}>
                      {isFemale ? 'Femenino' : 'Masculino'} · {currentImcProfile}
                    </span>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
                    gap: '20px', 
                    alignItems: 'center',
                    marginBottom: '18px' 
                  }}>
                    {/* Silueta Anatómica Ampliada y Destacada */}
                    <div style={{
                      height: '380px',
                      background: 'rgba(29, 81, 45, 0.02)',
                      borderRadius: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px',
                      border: '1.5px solid rgba(29, 81, 45, 0.1)',
                      position: 'relative',
                      boxShadow: 'var(--shadow-subtle)'
                    }}>
                      <img 
                        src={dynamicSilhouetteSrc} 
                        alt={`Silueta Anatómica ${isFemale ? 'Femenina' : 'Masculina'} - ${currentImcProfile}`} 
                        style={{ height: '330px', maxWidth: '100%', objectFit: 'contain' }}
                      />
                      <span style={{ 
                        fontSize: '0.68rem', 
                        fontWeight: '800', 
                        color: 'var(--primary)', 
                        opacity: 0.7, 
                        marginTop: '6px',
                        textTransform: 'uppercase'
                      }}>
                        {isFemale ? 'Silueta Femenina' : 'Silueta Masculina'} · {currentImcProfile}
                      </span>
                    </div>

                    {/* Zona Activa e Instrucción Clínica */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ 
                        background: 'rgba(217, 119, 6, 0.08)', 
                        padding: '16px', 
                        borderRadius: '16px', 
                        border: '1.5px solid rgba(217, 119, 6, 0.25)' 
                      }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: '900', color: '#B45309', textTransform: 'uppercase' }}>
                          Punto Anatómico Seleccionado:
                        </span>
                        <p style={{ margin: '4px 0 6px', fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                          {measurementGuides.find(g => g.key === activeAnatomicalZone)?.label || activeAnatomicalZone}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#4B5563', lineHeight: '1.4' }}>
                          {measurementGuides.find(g => g.key === activeAnatomicalZone)?.desc}
                        </p>
                      </div>

                      {/* Selector de Medida de la Zona Activa */}
                      <div style={{ 
                        background: '#FFFFFF', 
                        border: '1.5px solid var(--primary)', 
                        borderRadius: '16px', 
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: '900', color: 'var(--primary)' }}>
                            Medida de {measurementGuides.find(g => g.key === activeAnatomicalZone)?.label}:
                          </span>
                          <span style={{ fontSize: '0.68rem', opacity: 0.6, display: 'block' }}>Cinta métrica en cm</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            step="0.1"
                            min="10"
                            max="250"
                            placeholder="0.0"
                            style={{
                              width: '85px',
                              padding: '8px 10px',
                              fontSize: '1.15rem',
                              fontWeight: '900',
                              border: '1.5px solid var(--primary)',
                              borderRadius: '10px',
                              textAlign: 'center',
                              outline: 'none',
                              color: 'var(--primary)'
                            }}
                            value={formData.measurements[activeAnatomicalZone] || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              measurements: { ...formData.measurements, [activeAnatomicalZone]: e.target.value }
                            })}
                          />
                          <span style={{ fontSize: '0.82rem', fontWeight: '850', color: 'var(--primary)' }}>cm</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de las 8 Medidas en Cuadrícula Interactiva */}
                  <span style={{ fontSize: '0.75rem', fontWeight: '850', color: 'var(--text-primary)', opacity: 0.7, display: 'block', marginBottom: '8px' }}>
                    Selecciona una zona o ingresa directamente los valores:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    {measurementGuides.map(guide => {
                      const isActive = activeAnatomicalZone === guide.key;
                      return (
                        <div
                          key={guide.key}
                          onClick={() => setActiveAnatomicalZone(guide.key)}
                          style={{
                            background: isActive ? 'rgba(29, 81, 45, 0.08)' : 'rgba(0,0,0,0.02)',
                            border: isActive ? '1.5px solid var(--primary)' : '1px solid rgba(0,0,0,0.06)',
                            borderRadius: '12px',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: isActive ? '900' : '750', color: isActive ? 'var(--primary)' : 'var(--text-primary)', display: 'block' }}>
                              {guide.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="0.0"
                              style={{
                                width: '55px',
                                padding: '4px 6px',
                                fontSize: '0.85rem',
                                fontWeight: '850',
                                border: '1px solid rgba(0,0,0,0.15)',
                                borderRadius: '6px',
                                textAlign: 'center',
                                outline: 'none',
                                background: '#FFFFFF'
                              }}
                              value={formData.measurements[guide.key] || ''}
                              onFocus={() => setActiveAnatomicalZone(guide.key)}
                              onChange={(e) => setFormData({
                                ...formData,
                                measurements: { ...formData.measurements, [guide.key]: e.target.value }
                              })}
                            />
                            <span style={{ fontSize: '0.62rem', opacity: 0.6, fontWeight: '700' }}>cm</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Botones de navegación Etapa 5 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: '850' }}
                >
                  Regresar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={async () => {
                    await handleStep5Submit(isEditingExisting);
                    if (isEditingExisting && createdPatientId) router.push(`/nutri/patient/${createdPatientId}`);
                  }}
                  className="btn-accent"
                  style={{ flex: 2, padding: '16px', borderRadius: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>{isSaving ? 'Guardando...' : isEditingExisting ? 'Guardar y Volver a Ficha' : 'Guardar y Pasar a Fotografías'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── ETAPA 6: FOTOGRAFÍAS CLÍNICAS (OPCIONAL) Y CIERRE ── */}
          {currentStep === 6 && (
            <div className="fade-in">
              <section className="glass-panel" style={{ 
                padding: '24px', 
                borderRadius: '24px',
                background: '#FFFFFF',
                border: '1px solid rgba(29, 81, 45, 0.12)',
                boxShadow: 'var(--shadow-subtle)',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', margin: '0 0 4px', color: 'var(--primary)' }}>
                  REGISTRO FOTOGRÁFICO CLÍNICO (OPCIONAL)
                </h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0 0 18px' }}>
                  Puedes capturar o adjuntar fotos iniciales del paciente para el seguimiento de evolución corporal.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { key: 'front', label: 'Frente' },
                    { key: 'back', label: 'Espalda' },
                    { key: 'left', label: 'Perfil Izquierdo' },
                    { key: 'right', label: 'Perfil Derecho' }
                  ].map(view => (
                    <div 
                      key={view.key}
                      style={{
                        background: 'rgba(0,0,0,0.02)',
                        border: '1.5px dashed rgba(0,0,0,0.15)',
                        borderRadius: '16px',
                        padding: '16px 12px',
                        textAlign: 'center',
                        position: 'relative',
                        minHeight: '130px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {photos[view.key] ? (
                        <div style={{ position: 'relative', width: '100%', height: '100px' }}>
                          <img 
                            src={photos[view.key]} 
                            alt={view.label}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                          />
                          <button
                            type="button"
                            onClick={() => setPhotos({ ...photos, [view.key]: null })}
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              background: '#EF4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '22px',
                              height: '22px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <Camera size={24} color="var(--primary)" opacity={0.7} />
                          <span style={{ fontSize: '0.8rem', fontWeight: '850', color: 'var(--text-primary)' }}>
                            {view.label}
                          </span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>Subir imagen</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            onChange={(e) => handlePhotoUpload(view.key, e)}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{
                  background: 'rgba(217, 119, 6, 0.08)',
                  border: '1px solid rgba(217, 119, 6, 0.25)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <Info size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: '850', color: '#B45309', display: 'block', marginBottom: '2px' }}>
                      Módulo de fotos clínicas en preparación
                    </span>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#78350F', lineHeight: '1.4' }}>
                      Las fotografías se cargan exclusivamente en memoria local como previsualización de apoyo durante la consulta. No se persisten ni suben a la nube para proteger la privacidad del paciente hasta la activación del almacenamiento seguro en Supabase Storage.
                    </p>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(29, 81, 45, 0.05)',
                  border: '1px solid rgba(29, 81, 45, 0.15)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle2 size={20} color="var(--primary)" />
                  <span style={{ fontSize: '0.78rem', fontWeight: '750', color: 'var(--primary)', lineHeight: '1.3' }}>
                    Todas las etapas anteriores (Datos, Historia, Hábitos, R24H y Medidas) están guardadas de forma permanente en el expediente clínico del paciente.
                  </span>
                </div>
              </section>

              {/* Botón final */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '18px', borderRadius: '18px', fontWeight: '850' }}
                >
                  Regresar a Medidas
                </button>
                <button
                  type="button"
                  onClick={handleFinishAll}
                  className="btn-accent"
                  style={{
                    flex: 2,
                    padding: '18px 24px',
                    borderRadius: '18px',
                    fontWeight: '900',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 22px rgba(29, 81, 45, 0.25)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle2 size={20} />
                  <span>Finalizar y Abrir Ficha Completa</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── MODALIDAD 2: INVITAR PACIENTE A REGISTRARSE (REMOTO) ─────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeMode === 'invitar' && (
        <div className="fade-in">
          <section className="glass-panel" style={{ 
            padding: '24px', 
            borderRadius: '24px',
            background: '#FFFFFF',
            border: '1px solid rgba(2, 132, 199, 0.18)',
            boxShadow: 'var(--shadow-subtle)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                <Smartphone size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0 }}>Invitación para Registro Remoto</h2>
                <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: '800', textTransform: 'uppercase' }}>Autocompletado desde el móvil del paciente</span>
              </div>
            </div>
            <p style={{ fontSize: '0.83rem', opacity: 0.7, margin: '8px 0 20px', lineHeight: '1.4' }}>
              Crea el expediente e inmediatamente comparte el enlace personal con el paciente para que complete su información desde su teléfono.
            </p>

            {/* Nombre del paciente */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                <span>Nombre Completo del Paciente</span>
                <span style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: '800' }}>* Obligatorio</span>
              </label>
              <input
                type="text"
                placeholder="Ej. María Pérez"
                className="input-field"
                style={{ width: '100%', padding: '14px 16px', fontSize: '0.95rem', borderRadius: '14px', marginBottom: 0 }}
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                disabled={Boolean(invitePatientId)}
              />
            </div>

            {/* Género */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                Género <span style={{ opacity: 0.5, fontWeight: '600' }}>(Opcional — para personalizar el mensaje)</span>
              </label>
              <select
                className="input-field"
                style={{ width: '100%', padding: '12px 14px', fontSize: '0.92rem', borderRadius: '12px', marginBottom: 0 }}
                value={inviteForm.gender}
                onChange={(e) => setInviteForm({ ...inviteForm, gender: e.target.value })}
                disabled={Boolean(invitePatientId)}
              >
                <option value="">No indicado (mensaje neutral)</option>
                <option value="female">Femenino — «Bienvenida»</option>
                <option value="male">Masculino — «Bienvenido»</option>
              </select>
            </div>

            {/* Teléfono */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '850', marginBottom: '6px' }}>
                <span>Teléfono Móvil (WhatsApp)</span>
                <span style={{ opacity: 0.5, fontWeight: '600', fontSize: '0.75rem' }}>Opcional</span>
              </label>
              <input
                type="tel"
                placeholder="Ej. +58 412 9876543"
                className="input-field"
                style={{ width: '100%', padding: '14px 16px', fontSize: '0.95rem', borderRadius: '14px', marginBottom: 0 }}
                value={inviteForm.phone}
                onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                disabled={Boolean(invitePatientId)}
              />
            </div>

            {/* Botón crear expediente e invitación */}
            {!invitePatientId ? (
              <button
                type="button"
                onClick={handleCreateInvite}
                disabled={isSavingInvite || !inviteForm.name.trim()}
                style={{
                  width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                  background: inviteForm.name.trim() ? '#0284C7' : '#D1D5DB',
                  color: 'white', fontWeight: '900', fontSize: '0.95rem', cursor: inviteForm.name.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <ShieldCheck size={18} />
                {isSavingInvite ? 'Creando expediente...' : 'Crear Expediente y Generar Enlace'}
              </button>
            ) : (
              <div>
                {/* Enlace generado */}
                <div style={{ background: 'rgba(29,81,45,0.05)', border: '1.5px solid rgba(29,81,45,0.2)', borderRadius: '14px', padding: '14px 16px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: '900', opacity: 0.5, textTransform: 'uppercase', marginBottom: '6px' }}>Enlace personal del paciente</p>
                  <p style={{ fontSize: '0.82rem', fontWeight: '700', wordBreak: 'break-all', color: '#0284C7', margin: '0 0 10px' }}>
                    {getPatientInviteLink(invitePatientId)}
                  </p>
                  <p style={{ fontSize: '0.72rem', opacity: 0.6, margin: 0 }}>
                    Este enlace lleva directamente al portal personal del paciente, vinculado a su expediente.
                  </p>
                </div>

                {/* Vista previa del mensaje */}
                <div style={{ background: '#F9FAFB', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '14px', padding: '14px 16px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: '900', opacity: 0.5, textTransform: 'uppercase', marginBottom: '8px' }}>Vista previa del mensaje (WhatsApp)</p>
                  <p style={{ fontSize: '0.82rem', fontStyle: 'italic', background: '#FFFFFF', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                    {`¡Hola, ${inviteForm.name.trim() || '[Nombre]'}! ${inviteForm.gender === 'female' ? '¡Bienvenida' : inviteForm.gender === 'male' ? '¡Bienvenido' : '¡Bienvenid@'} a Nutrimemi! Tu nutricionista te ha invitado a completar tu información inicial. Accede desde tu enlace personal:\n\n${getPatientInviteLink(invitePatientId)}`}
                  </p>
                </div>

                {/* Acciones */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getPatientInviteLink(invitePatientId)).then(() => {
                        setInviteLinkCopied(true);
                        showToast('Enlace copiado al portapapeles', 'success');
                        setTimeout(() => setInviteLinkCopied(false), 2500);
                      }).catch(() => {
                        showToast('No se pudo copiar automáticamente. Copia el enlace de arriba.', 'error');
                      });
                    }}
                    style={{
                      padding: '12px', borderRadius: '12px', border: '1.5px solid #0284C7',
                      background: inviteLinkCopied ? '#0284C7' : '#FFFFFF',
                      color: inviteLinkCopied ? 'white' : '#0284C7',
                      fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    {inviteLinkCopied ? <CheckCircle2 size={16} /> : <ExternalLink size={16} />}
                    {inviteLinkCopied ? 'Copiado' : 'Copiar Enlace'}
                  </button>

                  {inviteForm.phone.trim() ? (
                    <a
                      href={`https://wa.me/${inviteForm.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`¡Hola, ${inviteForm.name.trim()}! ${inviteForm.gender === 'female' ? '¡Bienvenida' : inviteForm.gender === 'male' ? '¡Bienvenido' : '¡Bienvenid@'} a Nutrimemi! Tu nutricionista te ha invitado a completar tu información inicial. Accede desde tu enlace personal: ${getPatientInviteLink(invitePatientId)}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <button
                        type="button"
                        style={{
                          width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                          background: '#25D366', color: 'white', fontWeight: '800', fontSize: '0.82rem',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        <Send size={16} /> Enviar por WhatsApp
                      </button>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Invitación Nutrimemi',
                            text: `¡Hola, ${inviteForm.name.trim()}! Tu nutricionista te ha invitado a Nutrimemi.`,
                            url: getPatientInviteLink(invitePatientId)
                          }).catch(() => {});
                        } else {
                          showToast('Agrega un teléfono para enviar por WhatsApp, o copia el enlace.', 'info');
                        }
                      }}
                      style={{
                        padding: '12px', borderRadius: '12px', border: 'none',
                        background: '#25D366', color: 'white', fontWeight: '800', fontSize: '0.82rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <Send size={16} /> Compartir Enlace
                    </button>
                  )}
                </div>

                {/* Ir al expediente */}
                <button
                  type="button"
                  onClick={() => router.push(`/nutri/patient/${invitePatientId}`)}
                  style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', color: 'var(--primary)' }}
                >
                  Ir al expediente del paciente →
                </button>
              </div>
            )}

            {/* Aviso honesto de canales */}
            <div style={{ marginTop: '20px', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '12px', padding: '12px 14px', fontSize: '0.74rem', lineHeight: '1.4', color: '#92400E' }}>
              <strong>ℹ️ Sobre el envío:</strong> El enlace se genera inmediatamente y es funcional. El envío automático por SMS o correo electrónico requiere configuración de un proveedor externo (no está configurado actualmente). Puedes compartir el enlace por WhatsApp (si indicaste teléfono) o copiarlo para enviarlo por cualquier otro medio.
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function NewPatient() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <p style={{ fontWeight: '800', color: 'var(--text-primary)' }}>Cargando formulario...</p>
      </div>
    }>
      <NewPatientContent />
    </Suspense>
  );
}
