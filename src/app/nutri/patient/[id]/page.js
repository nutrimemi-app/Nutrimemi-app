'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Activity, Printer, Calendar, Save, History, Camera, FileText, BookOpen, BarChart2, MessageCircle, FileDown } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { calculateClinicalData, getBodyFatProfile, suggestPortionsFromMacros } from '@/utils/calculationUtils';
import PortionCalculator from '@/components/PortionCalculator';
import { getAnthropometricIconSrc } from '@/utils/anthropometricIcon';
import { updatePatient } from '@/lib/patients';
import { usePatient } from '@/hooks/usePatient';

import { getMealTypes, MEAL_PLANS } from '@/utils/mealUtils';

const EXCHANGE_GUIDE_DB = {
  cereales: {
    name: 'CEREALES',
    color: '#FFA500',
    textColor: 'white',
    foods: [
      { name: 'Granos / Batata / Papa / Arroz / Yuca / Puré', base: 0.5, unit: 'taza' },
      { name: 'Tortilla de yuca / pan integral (tostado)', base: 1, unit: 'unidad' },
      { name: 'Plátano', base: 0.25, unit: 'plátano' },
      { name: 'Avena / Harina de maíz / Harina de yuca / Harina de avena', base: 2, unit: 'cucharadas', alt: 15 },
      { name: 'Miel', base: 1, unit: 'cucharada', alt: 15 }
    ]
  },
  proteinas: {
    name: 'CARNES / PROTEÍNA',
    color: '#FF0000',
    textColor: 'white',
    foods: [
      { name: 'Atún en lata / Carne / Pollo / Salmón / Camarones', base: 0.25, unit: 'taza', alt: 120 },
      { name: 'Queso paisa / Jamón de pavo', base: 2, unit: 'rebanadas finas', alt: 15 },
      { name: 'Guayanés / Ricotta / Cuajada / Palmita / Palmizulia', base: 0.25, unit: 'taza', alt: 120 },
      { name: 'Huevo', base: 1, unit: 'unidad' },
      { name: 'Claras de huevo', base: 2, unit: 'unidades', alt: 30 }
    ]
  },
  vegetales: {
    name: 'VEGETALES',
    color: '#228B22',
    textColor: 'white',
    foods: [
      { name: 'Vegetales crudos', base: 1, unit: 'taza' },
      { name: 'Vegetales cocidos', base: 0.5, unit: 'taza' },
      { name: 'Los vegetales que desees', base: null, unit: 'Libre' }
    ]
  },
  frutas: {
    name: 'FRUTAS',
    color: '#BA55D3',
    textColor: 'white',
    foods: [
      { name: 'Fruta pequeña/mediana o picada', base: 1, unit: 'unidad o 1 taza' },
      { name: 'Las frutas que desees menos cítricas', base: null, unit: 'Libre' }
    ]
  },
  lacteos: {
    name: 'LÁCTEOS',
    color: '#1E90FF',
    textColor: 'white',
    foods: [
      { name: 'Yogurt griego', base: 0.75, unit: 'taza' },
      { name: 'Requesón', base: 30, unit: 'g' },
      { name: 'Leche descremada', base: 1, unit: 'taza' }
    ]
  },
  grasas: {
    name: 'GRASAS',
    color: '#FFD700',
    textColor: '#1d512d',
    foods: [
      { name: 'Queso mozzarella / Tocineta / Aguacate', base: 2, unit: 'rebanadas', alt: 15 },
      { name: 'Queso crema / salsas', base: 1, unit: 'cucharada' },
      { name: 'Mantequilla / aceites / mantequilla de frutos secos', base: 2, unit: 'cucharaditas' },
      { name: 'Frutos secos', base: 10, unit: 'unidades' },
      { name: 'Leche vegetal', base: 1, unit: 'taza' },
      { name: 'Harina de almendra', base: 20, unit: 'g' }
    ]
  }
};

const displayCalculatedPortion = (food, targetVal) => {
  if (targetVal === 0 || isNaN(targetVal)) {
    if (food.base === null) return food.unit;
    return `1 Ración = ${food.base} ${food.unit}${food.alt ? ` (${food.alt * 1}g)` : ''}`;
  }
  if (food.base === null) return `${food.unit} (Libre)`;
  const totalVal = food.base * targetVal;
  
  const formatValue = (v) => {
    if (v % 1 === 0) return v.toString();
    if (v === 0.25) return '1/4';
    if (v === 0.5) return '1/2';
    if (v === 0.75) return '3/4';
    if (v === 1.25) return '1 y 1/4';
    if (v === 1.5) return '1 y 1/2';
    if (v === 1.75) return '1 y 3/4';
    return v.toFixed(1).replace('.0', '');
  };
  
  return `${targetVal} ración${targetVal > 1 ? 'es' : ''} = ${formatValue(totalVal)} ${food.unit}${food.alt ? ` (${food.alt * targetVal}g)` : ''}`;
};

export default function PatientFile() {
  const params = useParams();
  const router = useRouter();
  const { showToast, showConfirm } = useUI();
  const { patient, setPatient, status } = usePatient(params.id);
  const [selectedExchangeMeal, setSelectedExchangeMeal] = useState('');
  const [gender, setGender] = useState('female');
  const [savedR24h, setSavedR24h] = useState(null);
  const [savedR24hNotes, setSavedR24hNotes] = useState('');
  const [localPctProt, setLocalPctProt] = useState('20');
  const [localPctCho, setLocalPctCho] = useState('50');
  const [currentTag, setCurrentTag] = useState('');
  const [item, setItem] = useState('');
  const [newPhotoFile, setNewPhotoFile] = useState('');
  const [selectedPhotosForComp, setSelectedPhotosForComp] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [localPctLip, setLocalPctLip] = useState('30');
  const [focusedMeasurement, setFocusedMeasurement] = useState('');
  const [editingAnswers, setEditingAnswers] = useState('');
  const [photoSessionFilter, setPhotoSessionFilter] = useState('');
  const [newPhotoLabel, setNewPhotoLabel] = useState('');
  const [newPhotoDate, setNewPhotoDate] = useState('');
  const [previewDashboardOpen, setPreviewDashboardOpen] = useState('');
  const [previewDay, setPreviewDay] = useState('');
  const [customSuggestions, setCustomSuggestions] = useState(null);

  useEffect(() => {
    if (patient) {
      if (patient.details?.gender) {
        setGender(patient.details.gender);
      }
      
      // Auto-migración de onboardingPhotos fijas a la nueva photosGallery dinámica
      if (patient.onboardingPhotos && (!patient.photosGallery || patient.photosGallery.length === 0)) {
        const initialPhotos = [];
        const dateStr = patient.onboardingDate || new Date().toISOString().split('T')[0];
        
        if (patient.onboardingPhotos.front) {
          initialPhotos.push({
            id: `front-${Date.now()}`,
            date: dateStr,
            uploadedBy: 'Paciente',
            label: 'Frente',
            url: patient.onboardingPhotos.front,
            folder: `Sesión ${dateStr}`
          });
        }
        if (patient.onboardingPhotos.back) {
          initialPhotos.push({
            id: `back-${Date.now() + 1}`,
            date: dateStr,
            uploadedBy: 'Paciente',
            label: 'Espalda',
            url: patient.onboardingPhotos.back,
            folder: `Sesión ${dateStr}`
          });
        }
        if (patient.onboardingPhotos.left) {
          initialPhotos.push({
            id: `left-${Date.now() + 2}`,
            date: dateStr,
            uploadedBy: 'Paciente',
            label: 'Lat. Izquierdo',
            url: patient.onboardingPhotos.left,
            folder: `Sesión ${dateStr}`
          });
        }
        if (patient.onboardingPhotos.right) {
          initialPhotos.push({
            id: `right-${Date.now() + 3}`,
            date: dateStr,
            uploadedBy: 'Paciente',
            label: 'Lat. Derecho',
            url: patient.onboardingPhotos.right,
            folder: `Sesión ${dateStr}`
          });
        }
        
        const updatedPatient = { ...patient, photosGallery: initialPhotos };
        updatePatient(patient.id, { photosGallery: initialPhotos }).then(() => {
          setPatient(updatedPatient);
        });
      }
      
      // Cargar R24H e inputs locales
      try {
        const r24hVal = localStorage.getItem(`r24h_${patient.id}`);
        if (r24hVal) {
          setSavedR24h(JSON.parse(r24hVal));
        } else {
          setSavedR24h(null);
        }
        const r24hNotesVal = localStorage.getItem(`r24h_notes_${patient.id}`);
        if (r24hNotesVal) {
          setSavedR24hNotes(r24hNotesVal);
        } else {
          setSavedR24hNotes('');
        }
      } catch (e) {}

      if (patient.dietForm) {
        setLocalPctProt(patient.dietForm.pctProt !== undefined ? patient.dietForm.pctProt.toString() : '20');
        setLocalPctCho(patient.dietForm.pctCho !== undefined ? patient.dietForm.pctCho.toString() : '50');
      } else {
        setLocalPctProt('20');
        setLocalPctCho('50');
      }
    }
  }, [patient?.id]);

  const mealPlanKey = patient?.details?.mealPlan || '3+2 snacks';
  const mealsForPatient = getMealTypes(mealPlanKey);

  useEffect(() => {
    if (mealsForPatient && mealsForPatient.length > 0 && !selectedExchangeMeal) {
      setSelectedExchangeMeal(mealsForPatient[0].key);
    }
  }, [mealsForPatient, selectedExchangeMeal]);

  if (status === 'loading') return <div style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold' }}>Cargando paciente...</div>;
  if (status === 'not-found') return <div style={{ padding: '20px', textAlign: 'center' }}><h3>No encontramos este paciente</h3><button onClick={() => window.history.back()} style={{ padding: '10px 20px', background: 'var(--card-yellow)', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Volver al dashboard</button></div>;
  if (status === 'error') return <div style={{ padding: '20px', textAlign: 'center' }}><h3>Hubo un problema cargando los datos</h3><button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: 'var(--card-yellow)', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Reintentar</button></div>;
  if (!patient) return null;

  // Adaptar datos para el utilitario
  const clinical = patient ? calculateClinicalData({
    weight: patient.details?.weight,
    height: patient.details?.height,
    sex: patient.details?.gender || 'female',
    manualPi: patient.details?.manualPi,
    manualPa: patient.details?.manualPa,
    manualPc: patient.details?.manualPc
  }, patient.measurements) : null;

  const addTag = () => {
    if (currentTag && !patient.details.tags?.includes(currentTag)) {
      const updatedDetails = { ...patient.details, tags: [...(patient.details.tags || []), currentTag] };
      const updatedPatient = { ...patient, details: updatedDetails };
      savePatientUpdate(updatedPatient);
      setCurrentTag('');
    }
  };

  const removeTag = (tag) => {
    const updatedDetails = { ...patient.details, tags: patient.details.tags.filter(t => t !== tag) };
    const updatedPatient = { ...patient, details: updatedDetails };
    savePatientUpdate(updatedPatient);
  };

  const savePatientUpdate = (updatedPatient) => {
    // Sincronizar formulas con el estado de dietForm
    const rct = parseFloat(updatedPatient.dietForm?.rct) || 1700;
    
    // Calcular sugerencias basadas en el peso/perfil
    const tempClinical = calculateClinicalData({
      weight: updatedPatient.details?.weight,
      height: updatedPatient.details?.height,
      sex: updatedPatient.details?.gender || 'female',
      manualPi: updatedPatient.details?.manualPi,
      manualPa: updatedPatient.details?.manualPa,
      manualPc: updatedPatient.details?.manualPc
    });
    
    const getSuggestedPct = (key) => {
      const prof = tempClinical?.profile ? tempClinical.profile.toUpperCase() : 'NORMOPESO';
      if (prof === 'BAJO PESO') {
        return key === 'pctProt' ? 18 : 50;
      } else if (prof === 'SOBREPESO' || prof.startsWith('OBESIDAD')) {
        return key === 'pctProt' ? 20 : 55;
      } else {
        return key === 'pctProt' ? 15 : 55;
      }
    };

    const getFormVal = (key, fallback) => {
      const val = updatedPatient.dietForm?.[key];
      if (val === undefined || val === null || val === '') return fallback;
      const num = parseFloat(val);
      return isNaN(num) ? fallback : num;
    };
    const pctProt = getFormVal('pctProt', getSuggestedPct('pctProt'));
    const pctCho = getFormVal('pctCho', getSuggestedPct('pctCho'));
    const pctLip = Math.max(0, 100 - pctProt - pctCho);

    updatedPatient.formulas = {
      kcal: rct.toString(),
      prot: ((rct * pctProt) / 100 / 4).toFixed(1),
      cho: ((rct * pctCho) / 100 / 4).toFixed(1),
      fat: ((rct * pctLip) / 100 / 9).toFixed(1)
    };

    setPatient(updatedPatient);
    // Sincronizar con Supabase de forma asíncrona sin bloquear la UI
    updatePatient(patient.id, updatedPatient).catch(err => {
      console.error('Error sincronizando con base de datos', err);
      // Opcional: showToast('Error guardando en la nube', 'error');
    });
  };

  const handlePhotoUpload = (e) => {
    e.preventDefault();
    if (!newPhotoFile) {
      showToast('Por favor, selecciona una foto.', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Str = reader.result;
      
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        
        const newPhotoItem = {
          id: `doc-${Date.now()}`,
          date: newPhotoDate,
          uploadedBy: 'Doctor',
          label: newPhotoLabel,
          url: compressedBase64,
          folder: `Sesión ${newPhotoDate}`
        };
        
        const updatedGallery = [...(patient.photosGallery || []), newPhotoItem];
        const updatedPatient = { ...patient, photosGallery: updatedGallery };
        savePatientUpdate(updatedPatient);
        showToast('Foto cargada y comprimida con éxito.', 'success');
        
        setNewPhotoFile(null);
        const fileInput = document.getElementById('new-photo-upload-input');
        if (fileInput) fileInput.value = '';
      };
    };
    reader.readAsDataURL(newPhotoFile);
  };

  const handleDeletePhoto = (photoId) => {
    showConfirm('Eliminar Foto', '¿Estás seguro de que deseas eliminar esta foto de la galería?', () => {
      const updatedGallery = (patient.photosGallery || []).filter(ph => ph.id !== photoId);
      const updatedPatient = { ...patient, photosGallery: updatedGallery };
      savePatientUpdate(updatedPatient);
      setSelectedPhotosForComp(selectedPhotosForComp.filter(id => id !== photoId));
      showToast('Foto eliminada.', 'success');
    });
  };

  const handleToggleCompPhoto = (photoId) => {
    if (selectedPhotosForComp.includes(photoId)) {
      setSelectedPhotosForComp(selectedPhotosForComp.filter(id => id !== photoId));
    } else {
      if (selectedPhotosForComp.length >= 2) {
        showToast('Sólo puedes comparar un máximo de 2 fotos a la vez.', 'warning');
        return;
      }
      setSelectedPhotosForComp([...selectedPhotosForComp, photoId]);
    }
  };

  const handleSaveComparisonCanvas = () => {
    if (selectedPhotosForComp.length !== 2) return;
    const photoA = (patient.photosGallery || []).find(p => p.id === selectedPhotosForComp[0]);
    const photoB = (patient.photosGallery || []).find(p => p.id === selectedPhotosForComp[1]);
    if (!photoA || !photoB) return;
    
    // Dibujo en Canvas
    const imgA = new Image();
    const imgB = new Image();
    imgA.src = photoA.url;
    imgB.src = photoB.url;
    
    let loaded = 0;
    const onLoaded = () => {
      loaded++;
      if (loaded === 2) {
        const canvas = document.createElement('canvas');
        const h = Math.max(imgA.height, imgB.height, 400);
        const wA = imgA.width * (h / imgA.height);
        const wB = imgB.width * (h / imgB.height);
        
        canvas.width = wA + wB + 10;
        canvas.height = h + 60;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(imgA, 0, 0, wA, h);
        ctx.drawImage(imgB, wA + 10, 0, wB, h);
        
        ctx.fillStyle = '#1D512D';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`${photoA.label} (${photoA.date})`, 25, h + 35);
        ctx.fillText(`${photoB.label} (${photoB.date})`, wA + 35, h + 35);
        
        const combinedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        const todayStr = new Date().toISOString().split('T')[0];
        
        const newPhotoItem = {
          id: `comp-${Date.now()}`,
          date: todayStr,
          uploadedBy: 'Doctor',
          label: `Comparación: ${photoA.label} (${photoA.date}) vs ${photoB.label} (${photoB.date})`,
          url: combinedBase64,
          folder: 'Comparativas',
          sharedWithPatient: true
        };
        
        const updatedGallery = [...(patient.photosGallery || []), newPhotoItem];
        const updatedPatient = { ...patient, photosGallery: updatedGallery };
        savePatientUpdate(updatedPatient);
        showToast('Comparación guardada y compartida con el paciente en la carpeta Comparativas.', 'success');
        setSelectedPhotosForComp([]);
        setShowComparisonModal(false);
      }
    };
    imgA.onload = onLoaded;
    imgB.onload = onLoaded;
  };

  const getProfileColor = (p) => {
    if (p === 'OBESIDAD') return '#ff4444';
    if (p === 'BAJO PESO') return '#1E90FF';
    if (p === 'SOBREPESO') return '#FD9E14';
    return 'var(--primary)';
  };

  const saveHistory = async () => {
    if (!patient) return;
    showConfirm(
      "Guardar Consulta",
      "¿Deseas guardar los datos actuales (Peso, Medidas y Menú) como una nueva sesión en el historial?",
      async () => {
        const newEntry = {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          details: { ...patient.details },
          measurements: { ...patient.measurements },
          dietForm: { ...patient.dietForm },
          imc: clinical.imc,
          profile: clinical.profile,
          menus: { ...patient.menu }
        };

        const updatedHistory = [...(patient.history || []), newEntry];
        const updatedPatient = { ...patient, history: updatedHistory };
        
        try {
          const { addHistoryEntry } = await import('@/lib/patients');
          await addHistoryEntry(patient.id, newEntry).catch(e => {
             console.warn("Supabase addHistoryEntry failed, falling back to local storage", e);
             localStorage.setItem(`patient_history_${patient.id}`, JSON.stringify(updatedHistory));
          });
        } catch (e) {
          localStorage.setItem(`patient_history_${patient.id}`, JSON.stringify(updatedHistory));
        }
        
        savePatientUpdate(updatedPatient);
        showToast("¡Sesión guardada en el historial!", "success");
      }
    );
  };

  const measurements = [
    { label: 'CUELLO', desc: 'Base del cuello', guide: 'Pasa la cinta métrica horizontalmente por debajo de la laringe (nuez de Adán).' },
    { label: 'BRAZO', desc: 'Punto medio (Relajado)', guide: 'Brazo extendido y relajado. Mide en el punto medio entre el hombro (acromion) y el codo.' },
    { label: 'TORSO', desc: 'Línea mamaria', guide: 'Mide horizontalmente alrededor del torso, pasando directamente por encima de los pezones.' },
    { label: 'CINTURA', desc: 'Punto más estrecho', guide: 'Con el torso erguido y abdomen relajado, mide en el punto medio entre la última costilla y la cadera.' },
    { label: 'CADERA', desc: 'Punto más ancho', guide: 'Con los pies juntos, pasa la cinta de forma horizontal rodeando el punto de máximo volumen glúteo.' },
    { label: 'GLÚTEOS', desc: 'Prominencia máxima', guide: 'Rodea la parte más sobresaliente de los glúteos de forma paralela al suelo.' },
    { label: 'MUSLO', desc: 'Punto medio del muslo', guide: 'Estando de pie, mide horizontalmente el punto medio de la distancia entre la ingle y la rodilla.' },
    { label: 'PANTORRILLA', desc: 'Perímetro máximo', guide: 'Mide horizontalmente el contorno abultado de la pantorrilla con la pierna relajada.' },
  ];

  return (
    <>
    <div style={{ padding: '20px', paddingBottom: '160px' }} className="fade-in">
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <Link href="/nutri/dashboard" style={{ color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px' }}>{patient.name}</h2>
              {patient.details?.isPediatric && (
                <span style={{ background: '#E3F2FD', color: '#0D47A1', fontSize: '0.65rem', fontWeight: '900', padding: '2px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                  PEDIÁTRICO
                </span>
              )}
            </div>
            {patient.details?.isPediatric ? (
              <p style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: '700', color: 'var(--primary)' }}>
                Tutor: {patient.details?.tutorName || 'N/A'} | Tlf: {patient.details?.tutorPhone || 'N/A'} | Edad: {patient.details?.age || '--'} años
              </p>
            ) : (
              <p style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: '700' }}>C.I.: {patient.details?.ci} | Tel: {patient.details?.phone} | Edad: {patient.details?.age || '--'} años</p>
            )}
          </div>
        </div>
        
        {/* Fila de Acciones Reorganizada */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
            {(() => {
              const appointments = JSON.parse(localStorage.getItem('nutri_appointments') || '[]');
              const myNext = appointments.find(a => a.patientId == patient.id && new Date(a.date) >= new Date());
              return myNext ? (
                <Link href="/nutri/agenda" style={{ textDecoration: 'none', background: 'var(--card-yellow-light)', color: 'var(--accent)', padding: '12px 8px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid var(--accent)', textAlign: 'center' }}>
                  <Calendar size={16} /> {myNext.date.split('-').reverse().join('/')}
                </Link>
              ) : (
                <Link href="/nutri/agenda" style={{ textDecoration: 'none', background: 'rgba(0,0,0,0.05)', color: '#666', padding: '12px 8px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid rgba(0,0,0,0.1)', textAlign: 'center' }}>
                  <Calendar size={16} /> Programar Cita
                </Link>
              );
            })()}
            {patient.details?.phone && (
              <a href={`https://wa.me/${patient.details.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#25D366', color: 'white', padding: '12px 8px', borderRadius: '16px', fontWeight: '900', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1.5px solid #128C7E', textAlign: 'center' }}>
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
            <Link href={`/nutri/patient/${patient.id}/report`} style={{ textDecoration: 'none', background: 'white', color: 'var(--primary)', padding: '12px 8px', borderRadius: '16px', fontWeight: '900', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1.5px solid var(--primary)', textAlign: 'center' }}>
              <Printer size={16} /> Informe Imprimible
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
            <Link href={`/nutri/patient/${patient.id}/menu`} className="btn-primary" style={{ textDecoration: 'none', padding: '12px 8px', borderRadius: '16px', fontWeight: '900', fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 8px 20px rgba(29, 81, 45, 0.2)' }}>
              Menú y Dietética
            </Link>
            <Link href={`/nutri/patient/${patient.id}/reminder`} style={{ textDecoration: 'none', background: 'var(--card-yellow-light)', border: '1.5px solid var(--accent)', color: 'var(--text-primary)', padding: '12px 8px', borderRadius: '16px', fontWeight: '900', fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <History size={16} /> R24H
            </Link>
            <Link href={`/nutri/patient/${patient.id}/food-log`} style={{ textDecoration: 'none', background: '#FFEBEE', border: '1.5px solid #EF5350', color: '#B71C1C', padding: '12px 8px', borderRadius: '16px', fontWeight: '900', fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <BookOpen size={16} /> Bitácora
            </Link>
          </div>
          <button 
            onClick={() => router.push(`/nutri/patient/${patient.id}/control`)}
            className="btn-secondary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', boxShadow: 'var(--shadow-subtle)' }}
          >
            <History size={18} /> Nuevo Control
          </button>
        </div>
      </header>

      {/* Tarjeta Antropometría (Coral) */}
      <section className="glass-panel" style={{
        background: gender === 'female' ? '#FFF0F5' : '#E6F2FF',
        color: '#111',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Antropometría</h4>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', padding: '4px 12px', background: 'rgba(0,0,0,0.1)', borderRadius: '20px' }}>
            {gender.toUpperCase()}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>IMC: {clinical.imc} kG/mts2 ({clinical.profile})</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.6, marginBottom: '2px' }}>% GRASA (GC)</p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: '900', color: '#EF5350', margin: 0 }}>
                  {clinical.gc !== '—' ? `${clinical.gc}%` : '—'}
                </p>
                {clinical.gc !== '—' && (
                  <span style={{ fontSize: '0.55rem', fontWeight: '900', color: '#B71C1C', opacity: 0.8, textTransform: 'uppercase', lineHeight: 1, marginTop: '2px' }}>
                    {getBodyFatProfile(gender, patient.details?.age || 30, clinical.gc)}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.6, marginBottom: '2px' }}>G. MAGRA</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '900', color: '#66BB6A', margin: 0 }}>
                {clinical.grasaMagra !== '—' ? `${clinical.grasaMagra}kg` : '—'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, position: 'relative', minHeight: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', paddingBottom: '90px' }}>
            {patient.details?.isPediatric ? (
              <svg viewBox="0 0 100 220" style={{ height: '320px', width: 'auto' }}>
                <g stroke="white" strokeWidth="1.5" fill="none" opacity="0.7">
                  {/* Cabeza */}
                  <circle cx="50" cy="25" r="14" />
                  {/* Torso Infantil (más pequeño, cabeza proporcionalmente más grande) */}
                  <path d="M42 39 Q50 37 58 39 L60 75 Q50 82 40 75 Z" />
                  <path d="M44 75 Q50 78 56 75 L57 110 Q50 115 43 110 Z" />
                  {/* Brazos */}
                  <path d="M42 39 L28 80 M58 39 L72 80" />
                  {/* Piernas */}
                  <path d="M43 110 L38 200 M57 110 L62 200" />
                </g>
                <g style={{ cursor: 'pointer' }}>
                  <circle cx="50" cy="35" r="4" fill="var(--accent)" onClick={() => setFocusedMeasurement('CUELLO')} onMouseEnter={() => setFocusedMeasurement('CUELLO')} />
                  <circle cx="28" cy="80" r="4" fill="white" stroke="#333" strokeWidth="0.5" onClick={() => setFocusedMeasurement('BRAZO')} onMouseEnter={() => setFocusedMeasurement('BRAZO')} />
                  <circle cx="50" cy="57" r="4" fill="white" stroke="#333" strokeWidth="0.5" onClick={() => setFocusedMeasurement('TORSO')} onMouseEnter={() => setFocusedMeasurement('TORSO')} />
                  <circle cx="50" cy="92" r="4" fill="white" stroke="#333" strokeWidth="0.5" onClick={() => setFocusedMeasurement('CINTURA')} onMouseEnter={() => setFocusedMeasurement('CINTURA')} />
                  <circle cx="50" cy="118" r="4" fill="white" stroke="#333" strokeWidth="0.5" onClick={() => setFocusedMeasurement('CADERA')} onMouseEnter={() => setFocusedMeasurement('CADERA')} />
                  <circle cx="50" cy="135" r="4" fill="white" stroke="#333" strokeWidth="0.5" onClick={() => setFocusedMeasurement('GLÚTEOS')} onMouseEnter={() => setFocusedMeasurement('GLÚTEOS')} />
                  <circle cx="41" cy="160" r="4" fill="white" stroke="#333" strokeWidth="0.5" onClick={() => setFocusedMeasurement('MUSLO')} onMouseEnter={() => setFocusedMeasurement('MUSLO')} />
                  <circle cx="59" cy="160" r="4" fill="white" stroke="#333" strokeWidth="0.5" onClick={() => setFocusedMeasurement('PANTORRILLA')} onMouseEnter={() => setFocusedMeasurement('PANTORRILLA')} />
                </g>
              </svg>
            ) : gender === 'female' ? (
              <div style={{ position: 'relative', height: '340px', width: '160px' }}>
                <img 
                  src={getAnthropometricIconSrc(gender, clinical.profile)} 
                  alt={clinical.profile} 
                  style={{ position: 'absolute', height: '100%', width: '100%', objectFit: 'contain' }} 
                />
                <svg viewBox="0 0 100 220" style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', zIndex: 1 }}>
                  {/* Puntos Interactivos (Invisibles, actúan como hitboxes sobre los círculos del SVG original) */}
                  <g style={{ cursor: 'pointer', opacity: 0 }}>
                    <circle cx="50" cy="22" r="12" fill="red" onClick={() => setFocusedMeasurement('CUELLO')} onMouseEnter={() => setFocusedMeasurement('CUELLO')} />
                    <circle cx="25" cy="50" r="12" fill="red" onClick={() => setFocusedMeasurement('BRAZO')} onMouseEnter={() => setFocusedMeasurement('BRAZO')} />
                    <circle cx="50" cy="42" r="12" fill="red" onClick={() => setFocusedMeasurement('TORSO')} onMouseEnter={() => setFocusedMeasurement('TORSO')} />
                    <circle cx="50" cy="65" r="12" fill="red" onClick={() => setFocusedMeasurement('CINTURA')} onMouseEnter={() => setFocusedMeasurement('CINTURA')} />
                    <circle cx="50" cy="85" r="12" fill="red" onClick={() => setFocusedMeasurement('CADERA')} onMouseEnter={() => setFocusedMeasurement('CADERA')} />
                    <circle cx="50" cy="95" r="12" fill="red" onClick={() => setFocusedMeasurement('GLÚTEOS')} onMouseEnter={() => setFocusedMeasurement('GLÚTEOS')} />
                    <circle cx="42" cy="125" r="12" fill="red" onClick={() => setFocusedMeasurement('MUSLO')} onMouseEnter={() => setFocusedMeasurement('MUSLO')} />
                    <circle cx="40" cy="165" r="12" fill="red" onClick={() => setFocusedMeasurement('PANTORRILLA')} onMouseEnter={() => setFocusedMeasurement('PANTORRILLA')} />
                  </g>
                </svg>
              </div>
            ) : (
              <div style={{ position: 'relative', height: '340px', width: '160px' }}>
                <img 
                  src={getAnthropometricIconSrc(gender, clinical.profile)} 
                  alt={clinical.profile} 
                  style={{ position: 'absolute', height: '100%', width: '100%', objectFit: 'contain' }} 
                />
                <svg viewBox="0 0 100 220" style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', zIndex: 1 }}>
                  {/* Puntos Interactivos (Invisibles, actúan como hitboxes sobre los círculos del SVG original) */}
                  <g style={{ cursor: 'pointer', opacity: 0 }}>
                    <circle cx="50" cy="22" r="12" fill="red" onClick={() => setFocusedMeasurement('CUELLO')} onMouseEnter={() => setFocusedMeasurement('CUELLO')} />
                    <circle cx="25" cy="50" r="12" fill="red" onClick={() => setFocusedMeasurement('BRAZO')} onMouseEnter={() => setFocusedMeasurement('BRAZO')} />
                    <circle cx="50" cy="42" r="12" fill="red" onClick={() => setFocusedMeasurement('TORSO')} onMouseEnter={() => setFocusedMeasurement('TORSO')} />
                    <circle cx="50" cy="65" r="12" fill="red" onClick={() => setFocusedMeasurement('CINTURA')} onMouseEnter={() => setFocusedMeasurement('CINTURA')} />
                    <circle cx="50" cy="85" r="12" fill="red" onClick={() => setFocusedMeasurement('CADERA')} onMouseEnter={() => setFocusedMeasurement('CADERA')} />
                    <circle cx="50" cy="95" r="12" fill="red" onClick={() => setFocusedMeasurement('GLÚTEOS')} onMouseEnter={() => setFocusedMeasurement('GLÚTEOS')} />
                    <circle cx="42" cy="125" r="12" fill="red" onClick={() => setFocusedMeasurement('MUSLO')} onMouseEnter={() => setFocusedMeasurement('MUSLO')} />
                    <circle cx="40" cy="165" r="12" fill="red" onClick={() => setFocusedMeasurement('PANTORRILLA')} onMouseEnter={() => setFocusedMeasurement('PANTORRILLA')} />
                  </g>
                </svg>
              </div>
            )}
            
            {/* Guía Explicativa Detallada de Cinta Métrica */}
            <div style={{ 
              position: 'absolute', 
              bottom: '10px', 
              left: '10px', 
              right: '10px', 
              fontSize: '0.65rem', 
              background: 'rgba(0,0,0,0.85)', 
              color: 'white', 
              padding: '10px 12px', 
              borderRadius: '12px',
              minHeight: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              lineHeight: '1.35',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {focusedMeasurement ? (
                <span>
                  <strong style={{ color: 'var(--accent)', textTransform: 'uppercase' }}>{focusedMeasurement}:</strong> {measurements.find(m => m.label === focusedMeasurement)?.guide}
                </span>
              ) : (
                <span style={{ opacity: 0.8 }}>📍 Posiciona el cursor o toca los puntos del avatar para ver la guía de medición de cinta.</span>
              )}
            </div>
          </div>
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {measurements.map((m) => (
              <div key={m.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: '800', fontFamily: 'Belinda, sans-serif', cursor: 'pointer', color: '#111', textTransform: 'uppercase', marginRight: '16px' }} onClick={() => setFocusedMeasurement(m.label)}>{m.label}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      id={`input-${m.label}`}
                      type="number"
                      placeholder="0"
                      defaultValue={patient.measurements?.[m.label] || ''}
                      style={{
                        width: '60px',
                        background: 'rgba(0,0,0,0.05)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '6px',
                        padding: '8px 8px',
                        color: '#111',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        textAlign: 'right'
                      }}
                      onFocus={() => setFocusedMeasurement(m.label)}
                      onBlur={(e) => {
                        const updated = { ...patient, measurements: { ...patient.measurements, [m.label]: e.target.value } };
                        const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
                        localStorage.setItem('nutri_patients', JSON.stringify(saved.map(p => p.id === patient.id ? updated : p)));
                        setPatient(updated);
                        setFocusedMeasurement(null);
                      }}
                    />
                    <span style={{ fontSize: '0.65rem' }}>cm</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.5rem', opacity: 0.6, marginTop: '4px' }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Etiquetas / Patologías */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {patient.details?.tags?.map(tag => (
          <span key={tag} style={{ background: 'var(--card-yellow)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {tag} <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>x</button>
          </span>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '20px', padding: '2px 10px' }}>
           <input 
            type="text" 
            placeholder="+ Patología" 
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.75rem', width: '80px', padding: '4px' }}
           />
           <button onClick={addTag} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold' }}>+</button>
        </div>
      </div>

      {/* Grid Superior Reorganizado a Horizontal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
        {/* Resumen Clínico Horizontal */}
        <section className="glass-panel" style={{
          background: 'white',
          border: `2.5px solid ${getProfileColor(clinical.profile)}`,
          padding: '24px',
          position: 'relative',
          borderRadius: '24px'
        }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: getProfileColor(clinical.profile) }}>{clinical.profile}</h3>
             <Activity size={24} color={getProfileColor(clinical.profile)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.5, marginBottom: '4px' }}>IMC REAL</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '900', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{clinical.imc}</p>
            </div>

            <div>
              <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.5, marginBottom: '4px' }}>P. IDEAL</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '900', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{clinical.pi} kg</p>
            </div>
          </div>
          
          {/* Tracker de Evolución */}
          {patient.history?.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: '900', opacity: 0.5 }}>ULTIMA CITA VS HOY:</p>
              {(() => {
                const last = patient.history[patient.history.length - 1];
                const dWeight = (parseFloat(patient.details.weight) - parseFloat(last.details.weight)).toFixed(1);
                const dImc = (parseFloat(clinical.imc) - parseFloat(last.imc)).toFixed(1);
                return (
                  <div style={{ display: 'flex', gap: '25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '900', color: dWeight <= 0 ? '#1D512D' : '#cc0000' }}>{dWeight > 0 ? `+${dWeight}` : dWeight} <span style={{fontSize: '0.6rem'}}>kg</span></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '900', color: dImc <= 0 ? '#1D512D' : '#cc0000' }}>{dImc > 0 ? `+${dImc}` : dImc} <span style={{fontSize: '0.6rem'}}>IMC</span></span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </section>

        {/* Caja de Ajustes de Peso */}
        <section className="glass-panel shadow-premium" style={{ padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.08)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            ⚖️ Cálculos y Ajustes de Peso (Lorentz / Devine)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.015)', padding: '12px 16px', borderRadius: '16px', fontSize: '0.75rem', lineHeight: '1.45', borderLeft: '3px solid var(--primary)' }}>
              <p style={{ margin: 0, fontWeight: '750', color: 'var(--primary)' }}>Fórmulas Clínicas:</p>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
                <strong>Peso Ideal (PI):</strong> {gender === 'female' ? 'PI = 45.5 + 2.3 * ((Talla_cm / 2.54) - 60)' : 'PI = 50.0 + 2.3 * ((Talla_cm / 2.54) - 60)'}
              </p>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
                <strong>Peso Ajustado (PA):</strong> PA = ((Peso Actual - PI) * 0.25) + PI (Recomendado para sobrepeso y obesidad)
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.6, display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>P. ACTUAL</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '2px 8px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={patient.details?.weight || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const updatedDetails = { ...patient.details, weight: val };
                      const updatedPatient = { ...patient, details: updatedDetails };
                      savePatientUpdate(updatedPatient);
                    }}
                    style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: '800', padding: '8px 2px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.5 }}>kg</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.6, display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>P. IDEAL (PI)</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '2px 8px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={patient.details?.manualPi || ''}
                    placeholder={clinical.suggestedPi}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updatedDetails = { ...patient.details, manualPi: val };
                      const updatedPatient = { ...patient, details: updatedDetails };
                      savePatientUpdate(updatedPatient);
                    }}
                    style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: '800', padding: '8px 2px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.5 }}>kg</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.6, display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>P. AJUSTADO (PA)</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '2px 8px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={patient.details?.manualPa || ''}
                    placeholder={clinical.suggestedPa}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updatedDetails = { ...patient.details, manualPa: val };
                      const updatedPatient = { ...patient, details: updatedDetails };
                      savePatientUpdate(updatedPatient);
                    }}
                    style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: '800', padding: '8px 2px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.5 }}>kg</span>
                </div>
              </div>


            </div>
          </div>
        </section>

        {/* Notas del Nutricionista */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(0,0,0,0.02)' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-primary)', opacity: 0.6, marginBottom: '12px' }}>NOTAS Y OBSERVACIONES CLÍNICAS</p>
        <textarea 
          style={{ 
            width: '100%', 
            minHeight: '100px', 
            background: 'white', 
            border: '1.5px solid rgba(0,0,0,0.05)', 
            borderRadius: '16px', 
            padding: '16px', 
            fontSize: '0.9rem', 
            fontFamily: 'inherit',
            color: '#444',
            outline: 'none',
            resize: 'none'
          }}
          placeholder="Escribe aquí tus notas sobre exámenes o recordatorios para la próxima sesión..."
          defaultValue={patient.details?.notes || ''}
          onBlur={(e) => {
            const updatedDetails = { ...patient.details, notes: e.target.value };
            const updatedPatient = { ...patient, details: updatedDetails };
            savePatientUpdate(updatedPatient);
          }}
        />
      </section>


      {/* Selector de Distribución de Comidas */}
      <section className="glass-panel shadow-premium" style={{ padding: '24px', marginBottom: '20px', background: 'white', borderRadius: '24px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase' }}>🍽️ Distribución de Comidas al Día</h4>
        <select 
          value={patient.details?.mealPlan || '3+2 snacks'}
          onChange={(e) => {
             const updatedDetails = { ...patient.details, mealPlan: e.target.value };
             savePatientUpdate({ ...patient, details: updatedDetails });
          }}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9rem', fontWeight: '700', outline: 'none' }}
        >
          {Object.keys(MEAL_PLANS).map(key => (
            <option key={key} value={key}>{key} ({MEAL_PLANS[key].length} comidas)</option>
          ))}
        </select>
      </section>

      {/* Tarjeta Fórmula Dietética Interactiva */}
      <section className="glass-panel shadow-premium" style={{
        background: 'white',
        border: '1.5px solid var(--primary)',
        padding: '24px',
        borderRadius: '24px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '955', color: 'var(--primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📊 Cálculo Automático de Fórmula Dietética
          </h4>

        </div>

        {/* Input de RCT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.6, display: 'block', marginBottom: '6px' }}>REFERENCIA DE PESO</label>
              <select 
                value={patient.dietForm?.weightRef || 'PI'}
                onChange={(e) => {
                  const val = e.target.value;
                  const updatedDietForm = { ...patient.dietForm, weightRef: val };
                  const weightToUse = val === 'PI' ? (patient.details?.manualPi || clinical.pi) : (patient.details?.manualPa || clinical.pa);
                  const rct = (parseFloat(weightToUse) || 0) * (parseFloat(updatedDietForm.kcalPerKg) || 0);
                  if (rct > 0) updatedDietForm.rct = rct.toFixed(0);
                  savePatientUpdate({ ...patient, dietForm: updatedDietForm });
                }}
                className="input-field" style={{ margin: 0, padding: '8px', fontSize: '0.9rem' }}
              >
                <option value="PI">Peso Ideal (PI)</option>
                <option value="PA">Peso Ajustado (PA)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.6, display: 'block', marginBottom: '6px' }}>KCAL X KG</label>
              <input
                type="number"
                value={patient.dietForm?.kcalPerKg || ''}
                placeholder="ej. 25"
                onChange={(e) => {
                  const val = e.target.value;
                  const updatedDietForm = { ...patient.dietForm, kcalPerKg: val };
                  const weightToUse = updatedDietForm.weightRef === 'PA' ? (patient.details?.manualPa || clinical.pa) : (patient.details?.manualPi || clinical.pi);
                  const rct = (parseFloat(weightToUse) || 0) * (parseFloat(val) || 0);
                  if (rct > 0) updatedDietForm.rct = rct.toFixed(0);
                  savePatientUpdate({ ...patient, dietForm: updatedDietForm });
                }}
                className="input-field" style={{ margin: 0, padding: '8px', fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.55rem', opacity: 0.7, marginTop: '4px', display: 'block' }}>Ref: Déficit 20-25 | Mant. 25-30 | Superávit 30-35</span>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.6, display: 'block', marginBottom: '6px' }}>RCT CALCULADO</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  value={patient.dietForm?.rct || ''}
                  onChange={(e) => {
                    const updatedDietForm = { ...patient.dietForm, rct: e.target.value };
                    savePatientUpdate({ ...patient, dietForm: updatedDietForm });
                  }}
                  style={{ width: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)', background: '#fff' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--text-primary)' }}>Kcal/día</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {[
              { name: 'Control Peso', prot: 20, cho: 55 },
              { name: 'Mantenimiento', prot: 15, cho: 55 },
              { name: 'Bajo Peso', prot: 18, cho: 50 },
            ].map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const updatedDietForm = { ...patient.dietForm, pctProt: tmpl.prot, pctCho: tmpl.cho };
                  const updatedPatient = { ...patient, dietForm: updatedDietForm };
                  setLocalPctProt(tmpl.prot.toString());
                  setLocalPctCho(tmpl.cho.toString());
                  savePatientUpdate(updatedPatient);
                  showToast(`Distribuido: Proteína ${tmpl.prot}%, CHO ${tmpl.cho}%, Lípidos ${100 - tmpl.prot - tmpl.cho}%`, 'success');
                }}
                style={{
                  background: 'none',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla interactiva */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '20px', minWidth: '320px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.08)', textAlign: 'left' }}>
                <th style={{ padding: '8px', fontWeight: '900', color: 'var(--primary)' }}>GRUPO</th>
                <th style={{ padding: '8px', fontWeight: '900', color: 'var(--primary)', textAlign: 'center', width: '65px' }}>%</th>
                <th style={{ padding: '8px', fontWeight: '900', color: 'var(--primary)', textAlign: 'right' }}>KCAL</th>
                <th style={{ padding: '8px', fontWeight: '900', color: 'var(--primary)', textAlign: 'right' }}>GR</th>
                <th style={{ padding: '8px', fontWeight: '900', color: 'var(--primary)', textAlign: 'right' }}>GR/KG</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rct = parseFloat(patient.dietForm?.rct) || 1700;

                const getSuggestedPct = (key) => {
                  const prof = clinical?.profile ? clinical.profile.toUpperCase() : 'NORMOPESO';
                  if (prof === 'BAJO PESO') {
                    return key === 'pctProt' ? 18 : key === 'pctCho' ? 50 : 32;
                  } else if (prof === 'SOBREPESO' || prof.startsWith('OBESIDAD')) {
                    return key === 'pctProt' ? 20 : key === 'pctCho' ? 55 : 25;
                  } else {
                    return key === 'pctProt' ? 15 : key === 'pctCho' ? 55 : 30;
                  }
                };
                const sugProt = getSuggestedPct('pctProt');
                const sugCho = getSuggestedPct('pctCho');
                const sugLip = getSuggestedPct('pctLip');

                const pctProt = (patient.dietForm?.pctProt !== undefined && patient.dietForm?.pctProt !== null && patient.dietForm?.pctProt !== '') ? parseFloat(patient.dietForm.pctProt) : sugProt;
                const pctCho = (patient.dietForm?.pctCho !== undefined && patient.dietForm?.pctCho !== null && patient.dietForm?.pctCho !== '') ? parseFloat(patient.dietForm.pctCho) : sugCho;
                const pctLip = Math.max(0, 100 - pctProt - pctCho);
                const w = parseFloat(clinical.pc) || 70;

                const rows = [
                  { name: 'PROTEÍNA', pct: pctProt, isInput: true, divider: 4, key: 'pctProt' },
                  { name: 'CHO', pct: pctCho, isInput: true, divider: 4, key: 'pctCho' },
                  { name: 'LÍPIDOS', pct: pctLip, isInput: false, divider: 9, key: 'pctLip' },
                ];

                return (
                  <>
                    {rows.map((row, idx) => {
                      const rowKcal = rct * (row.pct / 100);
                      const rowGrams = rowKcal / row.divider;
                      const rowGramsPerKg = rowGrams / w;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                          <td style={{ padding: '10px 4px', fontWeight: '700' }}>{row.name}</td>
                          <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                            {row.isInput ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <input
                                  type="number"
                                  value={row.key === 'pctProt' ? (localPctProt !== '' ? localPctProt : pctProt) : (localPctCho !== '' ? localPctCho : pctCho)}
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    if (row.key === 'pctProt') {
                                      setLocalPctProt(valStr);
                                    } else if (row.key === 'pctCho') {
                                      setLocalPctCho(valStr);
                                    }
                                    const val = parseFloat(valStr) || 0;
                                    const updatedDietForm = { ...patient.dietForm, [row.key]: val };
                                    const updatedPatient = { ...patient, dietForm: updatedDietForm };
                                    savePatientUpdate(updatedPatient);
                                  }}
                                  style={{ width: '45px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '800' }}
                                />
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.6 }}>{row.pct}%</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '600' }}>{rowKcal.toFixed(0)}</td>
                          <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '750', color: 'var(--primary)' }}>{rowGrams.toFixed(1)}</td>
                          <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '700' }}>{rowGramsPerKg.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: 'rgba(29, 81, 45, 0.05)', fontWeight: '900' }}>
                      <td style={{ padding: '12px 4px' }}>TOTAL</td>
                      <td style={{ padding: '12px 4px', textAlign: 'center' }}>{(pctProt + pctCho + pctLip).toFixed(1)}%</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right' }}>{rct}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right' }}>-</td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>

        {/* Caja de sugerencia de raciones de intercambio */}
        {(() => {
          const rct = parseFloat(patient.dietForm?.rct) || 1700;
          const getSuggestedPct = (key) => {
            const prof = clinical?.profile ? clinical.profile.toUpperCase() : 'NORMOPESO';
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

          const pctProt = (patient.dietForm?.pctProt !== undefined && patient.dietForm?.pctProt !== null && patient.dietForm?.pctProt !== '') ? parseFloat(patient.dietForm.pctProt) : sugProt;
          const pctCho = (patient.dietForm?.pctCho !== undefined && patient.dietForm?.pctCho !== null && patient.dietForm?.pctCho !== '') ? parseFloat(patient.dietForm.pctCho) : sugCho;
          const pctLipStr = (100 - pctProt - pctCho);
          const pctLip = pctLipStr > 0 ? pctLipStr : 0;

          const targetProtGrams = (rct * pctProt / 100) / 4;
          const targetChoGrams = (rct * pctCho / 100) / 4;
          const targetFatGrams = (rct * pctLip / 100) / 9;

          const calculatedSuggestions = suggestPortionsFromMacros(targetProtGrams, targetChoGrams, targetFatGrams);
          const suggestions = customSuggestions || calculatedSuggestions;

          return (
            <div style={{
              background: '#F9FBE7',
              border: '2px solid #AFB42B',
              borderRadius: '20px',
              padding: '16px'
            }}>
              <PortionCalculator 
                portions={suggestions} 
                onChange={setCustomSuggestions} 
                targetProt={targetProtGrams} 
                targetCho={targetChoGrams} 
                targetLip={targetFatGrams} 
              />

              <button
                type="button"
                onClick={() => {
                  const updatedMenu = { ...patient.menu };
                  const activeKeys = mealsForPatient.map(m => m.key);
                  const cCount = activeKeys.length;
                  
                  activeKeys.forEach((key, idx) => {
                    updatedMenu[key] = {
                      ...(updatedMenu[key] || { time: '08:00', selectedFoods: [] }),
                      portions: { cereales: '0', proteinas: '0', vegetales: '0', frutas: '0', lacteos: '0', grasas: '0' }
                    };
                  });

                  if (activeKeys.includes('almuerzo')) updatedMenu.almuerzo.portions.vegetales = '1';
                  if (activeKeys.includes('cena')) updatedMenu.cena.portions.vegetales = '1';

                  if (activeKeys.includes('desayuno')) {
                    updatedMenu.desayuno.portions.lacteos = '1';
                  } else if (activeKeys.length > 0) {
                    updatedMenu[activeKeys[0]].portions.lacteos = '1';
                  }

                  if (activeKeys.includes('desayuno')) updatedMenu.desayuno.portions.frutas = '1';
                  else if (activeKeys.length > 0) updatedMenu[activeKeys[0]].portions.frutas = '1';

                  if (activeKeys.includes('meriendaPM')) updatedMenu.meriendaPM.portions.frutas = '1';
                  else if (activeKeys.includes('cena')) updatedMenu.cena.portions.frutas = '1';

                  activeKeys.forEach((key, idx) => {
                    let cPortion = Math.floor(suggestions.cereales / cCount);
                    if (idx === cCount - 1) cPortion += (suggestions.cereales % cCount);
                    updatedMenu[key].portions.cereales = cPortion.toString();

                    let pPortion = Math.floor(suggestions.proteinas / cCount);
                    if (idx === cCount - 1) pPortion += (suggestions.proteinas % cCount);
                    updatedMenu[key].portions.proteinas = pPortion.toString();

                    let gPortion = Math.floor(suggestions.grasas / cCount);
                    if (idx === cCount - 1) gPortion += (suggestions.grasas % cCount);
                    updatedMenu[key].portions.grasas = gPortion.toString();
                  });

                  const updatedPatient = { ...patient, menu: updatedMenu };
                  savePatientUpdate(updatedPatient);
                  showToast('¡Distribución sugerida aplicada a las comidas con éxito!', 'success');
                }}
                style={{
                  width: '100%',
                  background: '#1d512d',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: '900',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 16px rgba(29, 81, 45, 0.15)'
                }}
              >
                📥 Aplicar Distribución Sugerida a las Comidas
              </button>
            </div>
          );
        })()}
      </section>


      {/* DATOS DE INGRESO */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '40px', marginBottom: '20px', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '10px' }}>DATOS DE INGRESO / HISTORIAL</h3>
      {/* Ficha Clínica Editable Horizontal */}
        <section className="glass-panel shadow-premium" style={{ padding: '24px', background: 'var(--card-green)', color: 'white', borderRadius: '24px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '900', marginBottom: '16px', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '8px' }}>FICHA CLÍNICA (EDITABLE)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: '900', marginBottom: '6px' }}>ANTECEDENTES FAMILIARES / PATOLÓGICOS</p>
              <textarea 
                defaultValue={patient.details?.clinicalHistory || ''}
                onBlur={(e) => {
                  const updatedPatient = { ...patient, details: { ...patient.details, clinicalHistory: e.target.value } };
                  savePatientUpdate(updatedPatient);
                  showToast('Antecedentes actualizados', 'success');
                }}
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '0.85rem', outline: 'none', resize: 'none', minHeight: '80px' }}
                placeholder="Escribir antecedentes aquí..."
              />
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: '900', marginBottom: '6px' }}>MEDICAMENTOS EN USO</p>
              <textarea 
                defaultValue={patient.details?.medications || ''}
                onBlur={(e) => {
                  const updatedPatient = { ...patient, details: { ...patient.details, medications: e.target.value } };
                  savePatientUpdate(updatedPatient);
                  showToast('Medicación actualizada', 'success');
                }}
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '0.85rem', outline: 'none', resize: 'none', minHeight: '60px' }}
                placeholder="Listar medicamentos aquí..."
              />
            </div>
            {/* Expediente de Informes Guardados (Estilo Carpetas) */}
            {patient.reports?.length > 0 && (
              <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.8, marginBottom: '10px' }}>HISTORIAL DE INFORMES</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                  {[...patient.reports].reverse().map(report => (
                    <Link key={report.id} href={`/nutri/patient/${patient.id}/report?reportId=${report.id}`} style={{
                      textDecoration: 'none', background: 'rgba(255,255,255,0.1)', color: 'white',
                      padding: '16px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800',
                      textAlign: 'center', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                    }} className="folder-hover">
                      <FileText size={28} opacity={0.9} />
                      <span>{new Date(report.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>


      {/* Resumen del Recordatorio de 24 Horas (R24H) */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '20px', background: 'white', border: '1.5px dashed var(--accent)', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '955', color: 'var(--primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🍏 Consulta / Resumen R24H (Última Ingesta)
          </h4>
          {patient.lastReminderDate && (
            <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'var(--card-yellow-light)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '12px' }}>
              Modificado: {patient.lastReminderDate.split('-').reverse().join('/')}
            </span>
          )}
        </div>

        {!savedR24h ? (
          <div style={{ padding: '16px', textAlign: 'center', opacity: 0.6, fontSize: '0.85rem' }}>
            No hay recordatorio de 24 horas guardado todavía. 
            <div style={{ marginTop: '10px' }}>
              <Link href={`/nutri/patient/${patient.id}/reminder`} className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', padding: '8px 16px', borderRadius: '10px', fontSize: '0.75rem' }}>
                + Llenar R24H
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Totales Nutricionales */}
            {patient.r24hTotals && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '16px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '16px' }}>
                <div>
                  <p style={{ fontSize: '0.55rem', fontWeight: '800', opacity: 0.6 }}>CALORÍAS</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--primary)', marginTop: '2px' }}>{patient.r24hTotals.kcal?.toFixed(0)} <span style={{ fontSize: '0.6rem' }}>kcal</span></p>
                </div>
                <div>
                  <p style={{ fontSize: '0.55rem', fontWeight: '800', opacity: 0.6, color: '#FFA500' }}>CHO</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: '900', color: '#FFA500', marginTop: '2px' }}>{patient.r24hTotals.cho?.toFixed(1)}g</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.55rem', fontWeight: '800', opacity: 0.6, color: '#EF5350' }}>PROT</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: '900', color: '#EF5350', marginTop: '2px' }}>{patient.r24hTotals.prot?.toFixed(1)}g</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.55rem', fontWeight: '800', opacity: 0.6, color: '#CBBC1E' }}>GRASA</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: '900', color: '#CBBC1E', marginTop: '2px' }}>{patient.r24hTotals.fat?.toFixed(1)}g</p>
                </div>
              </div>
            )}

            {/* Listado de Alimentos por comida */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'visible', paddingRight: '4px', marginBottom: '16px' }}>
              {['Desayuno', 'Merienda AM', 'Almuerzo', 'Merienda PM', 'Cena', 'Colación Nocturna'].map(meal => {
                const entries = savedR24h[meal] || [];
                if (entries.length === 0) return null;
                return (
                  <div key={meal} style={{ background: 'rgba(0,0,0,0.015)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '4px' }}>{meal.toUpperCase()}</p>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: '#555' }}>
                      {entries.map(e => (
                        <li key={e.id}>
                          <span style={{ fontWeight: '700', color: '#222' }}>{e.portionsQty} rac. de {e.name}</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '6px' }}>({(e.kcal).toFixed(0)} kcal)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Notas Manuales */}
            {savedR24hNotes && (
              <div style={{ background: '#FFFDF0', borderLeft: '3.5px solid var(--accent)', padding: '12px 14px', borderRadius: '0 12px 12px 0', fontSize: '0.85rem' }}>
                <p style={{ margin: '0 0 4px 0', fontWeight: '900', fontSize: '0.7rem', opacity: 0.7, color: 'var(--accent)', textTransform: 'uppercase' }}>Notas Manuales del Recordatorio:</p>
                <p style={{ margin: 0, color: '#555', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{savedR24hNotes}</p>
              </div>
            )}

            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
              <Link href={`/nutri/patient/${patient.id}/reminder`} style={{ textDecoration: 'none' }}>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <History size={14} /> Editar Recordatorio
                </button>
              </Link>
            </div>
          </div>
        )}
      </section>


      {/* Sección de Preguntas del Onboarding */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '900' }}>RESPUESTAS DEL PACIENTE</h4>
          <button 
            onClick={() => {
              if (editingAnswers) {
                showToast('Respuestas actualizadas correctamente', 'success');
              }
              setEditingAnswers(!editingAnswers);
            }} 
            style={{ fontSize: '0.75rem', padding: '6px 14px', borderRadius: '10px', border: editingAnswers ? 'none' : '1px solid var(--primary)', background: editingAnswers ? 'var(--primary)' : 'none', color: editingAnswers ? 'white' : 'var(--primary)', fontWeight: '800', cursor: 'pointer' }}
          >
            {editingAnswers ? 'Guardar Cambios' : 'Editar'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {[
            { q: "1. Comida favorita", key: "favFood" },
            { q: "2. Comida y alimento NO favorito", key: "nonFavFood" },
            { q: "3. Comidas que desea realizar", key: "mealCount" },
            { q: "4. Actividad física", key: "physicalActivity" },
            { q: "5. Intolerancia o alergia", key: "allergies" },
            { q: "6. Consumo Hídrico (Agua al día)", key: "waterGlasses", isWater: true }
          ].map((item) => (
            <div key={item.key} style={{ background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '10px', borderLeft: '4px solid var(--primary)' }}>
              <p style={{ fontWeight: '800', fontSize: '0.8rem', opacity: 0.6, marginBottom: '4px', textTransform: 'uppercase' }}>{item.q}</p>
              {item.isWater ? (
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: editingAnswers ? '6px' : '2px' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', opacity: 0.5, display: 'block', fontWeight: '800' }}>VASOS DE AGUA:</span>
                    <input 
                      type="number" 
                      step="0.5" 
                      disabled={!editingAnswers}
                      value={patient.onboardingAnswers?.waterGlasses || ''} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const parsed = parseFloat(val);
                        const updatedAnswers = { 
                          ...patient.onboardingAnswers, 
                          waterGlasses: val,
                          waterLiters: val ? (parsed * 0.24).toFixed(2).replace(/\.?0+$/, '') : ''
                        };
                        const updatedPatient = { ...patient, onboardingAnswers: updatedAnswers };
                        savePatientUpdate(updatedPatient);
                      }}
                      style={{ background: editingAnswers ? 'white' : 'transparent', border: editingAnswers ? '1px solid rgba(0,0,0,0.1)' : 'none', cursor: editingAnswers ? 'text' : 'default', padding: '6px', fontSize: '0.9rem', borderRadius: '6px', width: '90px', fontWeight: '900', textAlign: editingAnswers ? 'center' : 'left', outline: 'none' }} 
                    />
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--primary)', alignSelf: 'flex-end', paddingBottom: '2px' }}>=</div>
                  <div>
                    <span style={{ fontSize: '0.65rem', opacity: 0.5, display: 'block', fontWeight: '800' }}>LITROS DE AGUA:</span>
                    <input 
                      type="number" 
                      step="0.1" 
                      disabled={!editingAnswers}
                      value={patient.onboardingAnswers?.waterLiters || ''} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const parsed = parseFloat(val);
                        const updatedAnswers = { 
                          ...patient.onboardingAnswers, 
                          waterLiters: val,
                          waterGlasses: val ? (parsed / 0.24).toFixed(1).replace(/\.?0+$/, '') : ''
                        };
                        const updatedPatient = { ...patient, onboardingAnswers: updatedAnswers };
                        savePatientUpdate(updatedPatient);
                      }}
                      style={{ background: editingAnswers ? 'white' : 'transparent', border: editingAnswers ? '1px solid rgba(0,0,0,0.1)' : 'none', cursor: editingAnswers ? 'text' : 'default', padding: '6px', fontSize: '0.9rem', borderRadius: '6px', width: '90px', fontWeight: '900', textAlign: editingAnswers ? 'center' : 'left', outline: 'none' }} 
                    />
                  </div>
                </div>
              ) : (
                editingAnswers ? (
                  <textarea 
                    className="input-field"
                    style={{ width: '100%', minHeight: '60px', padding: '10px', fontSize: '0.9rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', marginTop: '4px' }}
                    value={patient.onboardingAnswers?.[item.key] || ''}
                    placeholder={`Escribe aquí la respuesta para: ${item.q}...`}
                    onChange={(e) => {
                      const updatedAnswers = { ...patient.onboardingAnswers, [item.key]: e.target.value };
                      const updatedPatient = { ...patient, onboardingAnswers: updatedAnswers };
                      savePatientUpdate(updatedPatient);
                    }}
                  />
                ) : (
                  <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#333', whiteSpace: 'pre-wrap' }}>
                    {patient.onboardingAnswers?.[item.key] || 'Pendiente por llenar por el paciente...'}
                  </p>
                )
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Historial de Controles */}
      {patient.history && patient.history.length > 0 && (
        <section className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '900' }}>HISTORIAL DE CONTROLES</h4>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'var(--card-green-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px' }}>
              {patient.history.length} Sesiones
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...patient.history].reverse().map((entry, idx) => (
              <details key={entry.id} style={{ background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <summary style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: '900', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '0.7rem' }}>#{patient.history.length - idx}</span>
                    {entry.date}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: '700' }}>
                    Peso: {entry.details?.weight || '--'} kg | IMC: {entry.imc || '--'}
                  </div>
                </summary>
                <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid rgba(0,0,0,0.05)', marginTop: '8px', paddingTop: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)' }}>
                      <p style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: '800', marginBottom: '4px', margin: 0 }}>PERFIL CLÍNICO</p>
                      <p style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--primary)', margin: 0 }}>{entry.profile || '--'}</p>
                    </div>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)' }}>
                      <p style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: '800', marginBottom: '4px', margin: 0 }}>RCT / DIETA</p>
                      <p style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--accent)', margin: 0 }}>{entry.dietForm?.rct || '--'} Kcal</p>
                    </div>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)' }}>
                      <p style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: '800', marginBottom: '4px', margin: 0 }}>CINTURA</p>
                      <p style={{ fontSize: '0.85rem', fontWeight: '900', margin: 0 }}>{entry.measurements?.CINTURA || '--'} cm</p>
                    </div>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow-subtle)' }}>
                      <p style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: '800', marginBottom: '4px', margin: 0 }}>CADERA</p>
                      <p style={{ fontSize: '0.85rem', fontWeight: '900', margin: 0 }}>{entry.measurements?.CADERA || '--'} cm</p>
                    </div>
                  </div>
                  {entry.notes && (
                    <div style={{ background: 'white', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
                      <p style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: '800', marginBottom: '6px', margin: 0 }}>NOTAS DE EVOLUCIÓN</p>
                      <p style={{ fontSize: '0.85rem', margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>"{entry.notes}"</p>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Informes Guardados */}
      {patient.reports && patient.reports.length > 0 && (
        <section className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '900' }}>INFORMES GUARDADOS</h4>
            <FileDown size={24} color="var(--primary)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {patient.reports.map((r, idx) => (
              <div key={idx} style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--primary)', margin: '0 0 4px 0' }}>Informe #{patient.reports.length - idx}</p>
                  <p style={{ fontSize: '0.65rem', opacity: 0.6, margin: 0 }}>{new Date(r.date).toLocaleDateString()}</p>
                </div>
                <Link href={`/nutri/patient/${patient.id}/report?reportId=${r.id}`} style={{ textDecoration: 'none', background: 'var(--card-green-light)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  Ver / Imprimir
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Galería de Fotos de Evolución */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
           <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>COMPOSICIÓN CORPORAL (FOTOS)</h4>
           
           <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             {/* Filtro de Carpeta/Sesión */}
             <select
               value={photoSessionFilter}
               onChange={(e) => setPhotoSessionFilter(e.target.value)}
               className="input-field"
               style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto', minWidth: '130px', margin: 0 }}
             >
               <option value="All">📁 Todas las fotos</option>
               {[...new Set((patient.photosGallery || []).map(p => p.folder).filter(Boolean))].map(f => (
                 <option key={f} value={f}>📁 {f}</option>
               ))}
               <option value="Comparativas">📂 Comparativas</option>
             </select>

             {/* Botón de comparativa */}
             <button
               onClick={() => {
                 if (selectedPhotosForComp.length !== 2) {
                   showToast('Por favor, selecciona exactamente 2 fotos para comparar.', 'info');
                   return;
                 }
                 setShowComparisonModal(true);
               }}
               disabled={selectedPhotosForComp.length !== 2}
               style={{
                 padding: '6px 12px',
                 fontSize: '0.8rem',
                 fontWeight: '700',
                 borderRadius: '8px',
                 border: 'none',
                 background: selectedPhotosForComp.length === 2 ? 'var(--accent)' : '#ccc',
                 color: selectedPhotosForComp.length === 2 ? 'white' : '#666',
                 cursor: selectedPhotosForComp.length === 2 ? 'pointer' : 'not-allowed',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '6px'
               }}
             >
               Comparar ({selectedPhotosForComp.length}/2)
             </button>
           </div>
         </div>

         {/* Formulario rápido para subir fotos por el Doctor */}
         <div style={{ background: 'rgba(29, 81, 45, 0.05)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
           <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: '900', color: 'var(--primary)' }}>Cargar Nueva Toma del Paciente</p>
           <form onSubmit={handlePhotoUpload} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
             <div>
               <label style={{ fontSize: '0.65rem', fontWeight: '800', display: 'block', marginBottom: '3px', opacity: 0.7 }}>POSE / TOMA</label>
               <select
                 value={newPhotoLabel}
                 onChange={(e) => setNewPhotoLabel(e.target.value)}
                 className="input-field"
                 style={{ padding: '6px', fontSize: '0.8rem', margin: 0, width: '130px' }}
               >
                 <option value="Frente">Frente</option>
                 <option value="Espalda">Espalda</option>
                 <option value="Lat. Izquierdo">Lat. Izquierdo</option>
                 <option value="Lat. Derecho">Lat. Derecho</option>
                 <option value="Comparativa">Comparativa</option>
                 <option value="Otra">Otra</option>
               </select>
             </div>

             <div>
               <label style={{ fontSize: '0.65rem', fontWeight: '800', display: 'block', marginBottom: '3px', opacity: 0.7 }}>FECHA CONSULTA</label>
               <input
                 type="date"
                 value={newPhotoDate}
                 onChange={(e) => setNewPhotoDate(e.target.value)}
                 className="input-field"
                 style={{ padding: '4px 6px', fontSize: '0.8rem', margin: 0, width: '135px' }}
               />
             </div>

             <div style={{ flex: 1, minWidth: '150px' }}>
               <label style={{ fontSize: '0.65rem', fontWeight: '800', display: 'block', marginBottom: '3px', opacity: 0.7 }}>ARCHIVO IMAGEN</label>
               <input
                 type="file"
                 id="new-photo-upload-input"
                 accept="image/*"
                 onChange={(e) => setNewPhotoFile(e.target.files[0])}
                 style={{ fontSize: '0.75rem' }}
               />
             </div>

             <button
               type="submit"
               style={{
                 alignSelf: 'flex-end',
                 padding: '8px 16px',
                 fontSize: '0.8rem',
                 fontWeight: '800',
                 borderRadius: '8px',
                 border: 'none',
                 background: 'var(--primary)',
                 color: 'white',
                 cursor: 'pointer'
               }}
             >
               Cargar
             </button>
           </form>
         </div>

         {/* Grid de Fotos */}
         {patient.photosGallery && patient.photosGallery.length > 0 ? (
           <div>
             {/* Agrupamiento dinámico por carpetas */}
             {(() => {
               let filteredPhotos = patient.photosGallery;
               if (photoSessionFilter !== 'All') {
                 filteredPhotos = patient.photosGallery.filter(p => p.folder === photoSessionFilter);
               }
               
               if (filteredPhotos.length === 0) {
                 return (
                   <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.85rem', padding: '20px' }}>No hay fotos en esta carpeta.</p>
                 );
               }

               const groups = {};
               filteredPhotos.forEach(p => {
                 const f = p.folder || 'Sin Sesión';
                 if (!groups[f]) groups[f] = [];
                 groups[f].push(p);
               });

               return Object.entries(groups).map(([folderName, photosInFolder]) => (
                 <div key={folderName} style={{ marginBottom: '24px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1.5px solid rgba(29, 81, 45, 0.1)', paddingBottom: '4px' }}>
                     <span style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase' }}>📁 {folderName}</span>
                     <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>({photosInFolder.length} fotos)</span>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
                     {photosInFolder.map(photo => {
                       const isSelected = selectedPhotosForComp.includes(photo.id);
                       return (
                         <div
                           key={photo.id}
                           style={{
                             background: 'white',
                             borderRadius: '12px',
                             overflow: 'hidden',
                             border: isSelected ? '2.5px solid var(--accent)' : '1px solid rgba(0,0,0,0.08)',
                             boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                             position: 'relative',
                             display: 'flex',
                             flexDirection: 'column'
                           }}
                         >
                           <div style={{ position: 'relative', width: '100%', aspectRatio: '0.85', background: '#f5f5f5' }}>
                             <img
                               src={photo.url}
                               alt={photo.label}
                               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                             />
                             <div
                               style={{
                                 position: 'absolute',
                                 top: '6px',
                                 left: '6px',
                                 background: 'rgba(0,0,0,0.6)',
                                 color: 'white',
                                 padding: '2px 6px',
                                 borderRadius: '4px',
                                 fontSize: '0.55rem',
                                 fontWeight: '800'
                               }}
                             >
                               {photo.label}
                             </div>
                           </div>

                           <div style={{ padding: '8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '4px' }}>
                             <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>
                               <p style={{ margin: 0 }}>Subido: {photo.date}</p>
                               <p style={{ margin: 0, fontWeight: '700' }}>Por: {photo.uploadedBy}</p>
                             </div>
                             
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid #f0f0f0', paddingTop: '4px' }}>
                               <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '800', color: isSelected ? 'var(--accent)' : '#444' }}>
                                 <input
                                   type="checkbox"
                                   checked={isSelected}
                                   onChange={() => handleToggleCompPhoto(photo.id)}
                                   style={{ margin: 0, cursor: 'pointer' }}
                                 />
                                 Comparar
                               </label>
                               
                               <button
                                 onClick={() => handleDeletePhoto(photo.id)}
                                 style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '2px' }}
                                 title="Eliminar foto"
                               >
                                 ✕
                               </button>
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               ));
             })()}
           </div>
         ) : (
           <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.4 }}>
             <Camera size={40} style={{ margin: '0 auto 10px' }} />
             <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>El paciente aún no tiene fotos en su galería corporal.</p>
           </div>
         )}

         {showComparisonModal && selectedPhotosForComp.length === 2 && (() => {
           const photoA = (patient.photosGallery || []).find(p => p.id === selectedPhotosForComp[0]);
           const photoB = (patient.photosGallery || []).find(p => p.id === selectedPhotosForComp[1]);
           if (!photoA || !photoB) return null;
           
           return (
             <div style={{
               position: 'fixed',
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               background: 'rgba(0,0,0,0.85)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 9999,
               padding: '20px'
             }}>
               <div style={{
                 background: 'white',
                 borderRadius: '24px',
                 padding: '24px',
                 maxWidth: '750px',
                 width: '100%',
                 boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
               }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: '900', fontSize: '1.2rem' }}>Comparar Toma de Fotos</h3>
                   <button
                     onClick={() => setShowComparisonModal(false)}
                     style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666', fontWeight: '700' }}
                   >
                     ✕
                   </button>
                 </div>
                 
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                   <div style={{ textAlign: 'center' }}>
                     <p style={{ fontWeight: '800', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--primary)' }}>TOMA A: {photoA.label} ({photoA.date})</p>
                     <div style={{ width: '100%', aspectRatio: '0.85', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                       <img src={photoA.url} alt="A" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     </div>
                   </div>
                   <div style={{ textAlign: 'center' }}>
                     <p style={{ fontWeight: '800', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--primary)' }}>TOMA B: {photoB.label} ({photoB.date})</p>
                     <div style={{ width: '100%', aspectRatio: '0.85', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                       <img src={photoB.url} alt="B" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     </div>
                   </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                   <button
                     onClick={() => setShowComparisonModal(false)}
                     style={{
                       padding: '10px 20px',
                       fontSize: '0.9rem',
                       fontWeight: '700',
                       borderRadius: '50px',
                       border: '1px solid #ccc',
                       background: 'white',
                       color: '#666',
                       cursor: 'pointer'
                     }}
                   >
                     Cancelar
                   </button>
                   <button
                     onClick={handleSaveComparisonCanvas}
                     style={{
                       padding: '10px 24px',
                       fontSize: '0.9rem',
                       fontWeight: '900',
                       borderRadius: '50px',
                       border: 'none',
                       background: 'var(--primary)',
                       color: 'white',
                       cursor: 'pointer'
                     }}
                   >
                     Guardar Comparativa en Álbum
                   </button>
                 </div>
               </div>
             </div>
           );
         })()}
      </section>


      {/* Historial y Evolución */}
      <section id="ev-section" className="glass-panel" style={{ padding: '20px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <History size={24} color="var(--primary)" />
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Evolución</h4>
        </div>

        {(!patient.history || patient.history.length === 0) ? (
          <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px 0' }}>No hay sesiones registradas aún. Guarda la sesión actual para empezar el historial.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Fecha</th>
                  <th style={{ padding: '12px 8px' }}>Peso</th>
                  <th style={{ padding: '12px 8px' }}>IMC</th>
                  <th style={{ padding: '12px 8px' }}>Cintura</th>
                  <th style={{ padding: '12px 8px' }}>Menú</th>
                </tr>
              </thead>
              <tbody>
                {patient.history.slice().reverse().map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{entry.date}</td>
                    <td style={{ padding: '12px 8px' }}>{entry.details?.weight || '--'}kg</td>
                    <td style={{ padding: '12px 8px' }}>{entry.imc || '--'}</td>
                    <td style={{ padding: '12px 8px' }}>{entry.measurements?.CINTURA || '--'}cm</td>
                    <td style={{ padding: '12px 8px' }}>
                      {entry.menus ? <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Sí</span> : <span style={{ opacity: 0.5 }}>No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Botones de Acción Fijos */}
      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: '16px 20px', 
        background: 'rgba(255,255,255,0.95)', 
        backdropFilter: 'blur(15px)', 
        borderTop: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        gap: '12px',
        zIndex: 10000, 
        boxShadow: '0 -10px 25px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={saveHistory}
          className="btn-accent" 
          style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '16px', fontSize: '0.85rem' }}
        >
          <Save size={18} /> <span className="btn-text">Guardar</span>
        </button>
        <Link 
          href={`/nutri/patient/${patient.id}/report`}
          style={{ flex: 1, textDecoration: 'none' }}
        >
          <button 
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '16px', fontSize: '0.85rem' }}
          >
            <Printer size={18} /> <span className="btn-text">Informe</span>
          </button>
        </Link>
      </div>
    </div>
    </>
  );
}
