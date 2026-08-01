'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Activity, Printer, Calendar, Save, History, Camera, FileText, BookOpen, BarChart2 } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { calculateClinicalData, getBodyFatProfile } from '@/utils/calculationUtils';

const exchangeMeals = [
  { key: 'desayuno', name: 'Desayuno' },
  { key: 'meriendaAM', name: 'Merienda AM' },
  { key: 'almuerzo', name: 'Almuerzo' },
  { key: 'meriendaPM', name: 'Merienda PM' },
  { key: 'cena', name: 'Cena' }
];

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
  const { showToast, showConfirm } = useUI();
  const [patient, setPatient] = useState(null);
  const [gender, setGender] = useState('female'); // 'male' or 'female'
  const [currentTag, setCurrentTag] = useState('');
  const [editingAnswers, setEditingAnswers] = useState(false);
  const [showControlModal, setShowControlModal] = useState(false);
  const [focusedMeasurement, setFocusedMeasurement] = useState(null);
  const [selectedExchangeMeal, setSelectedExchangeMeal] = useState('desayuno');
  const [previewDashboardOpen, setPreviewDashboardOpen] = useState(true);
  const [controlData, setControlData] = useState({
    weight: '',
    rct: '',
    notes: '',
    CINTURA: '',
    CADERA: '',
    CUELLO: '',
    BRAZO: '',
    TORSO: '',
    GLÚTEOS: '',
    MUSLO: '',
    PANTORRILLA: '',
    manualPi: '',
    manualPc: ''
  });

  useEffect(() => {
    const savedPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const found = savedPatients.find(p => p.id === parseInt(params.id));
    if (found) {
      setPatient(found);
      if (found.details?.gender) {
        setGender(found.details.gender);
      }
    }
  }, [params.id]);

  if (!patient) return <div style={{ padding: '20px' }}>Cargando paciente...</div>;

  // Adaptar datos para el utilitario
  const patientDataForCalc = {
    weight: patient.details?.weight,
    height: patient.details?.height,
    sex: gender,
    manualPi: patient.details?.manualPi,
    manualPc: patient.details?.manualPc
  };
  const clinical = calculateClinicalData(patientDataForCalc, patient.measurements || {});

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
    setPatient(updatedPatient);
    const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    localStorage.setItem('nutri_patients', JSON.stringify(saved.map(p => p.id === patient.id ? updatedPatient : p)));
  };

  const getProfileColor = (p) => {
    if (p === 'OBESIDAD') return '#ff4444';
    if (p === 'BAJO PESO') return '#1E90FF';
    if (p === 'SOBREPESO') return '#FD9E14';
    return 'var(--primary)';
  };

  const saveHistory = () => {
    if (!patient) return;
    showConfirm(
      "Guardar Consulta",
      "¿Deseas guardar los datos actuales (Peso, Medidas y Menú) como una nueva sesión en el historial?",
      () => {
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
        savePatientUpdate(updatedPatient);
        showToast("¡Sesión guardada en el historial!", "success");
      }
    );
  };

  const startFollowUp = () => {
    if (!patient) return;
    setControlData({
      weight: patient.details?.weight || '',
      rct: patient.dietForm?.rct || '',
      notes: '',
      CINTURA: patient.measurements?.CINTURA || '',
      CADERA: patient.measurements?.CADERA || '',
      CUELLO: patient.measurements?.CUELLO || '',
      BRAZO: patient.measurements?.BRAZO || '',
      TORSO: patient.measurements?.TORSO || '',
      GLÚTEOS: patient.measurements?.GLÚTEOS || '',
      MUSLO: patient.measurements?.MUSLO || '',
      PANTORRILLA: patient.measurements?.PANTORRILLA || '',
      manualPi: patient.details?.manualPi || '',
      manualPc: patient.details?.manualPc || ''
    });
    setShowControlModal(true);
  };

  const handleSaveFollowUp = (e) => {
    e.preventDefault();
    if (!patient) return;

    // 1. Archivar estado actual en historial
    const pastEntry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      details: { ...patient.details },
      measurements: { ...patient.measurements },
      dietForm: { ...patient.dietForm },
      imc: clinical.imc,
      profile: clinical.profile,
      menus: patient.menu || null
    };

    // 2. Definir nuevos valores activos
    const updatedDetails = {
      ...patient.details,
      weight: parseFloat(controlData.weight) || patient.details?.weight,
      manualPi: controlData.manualPi ? parseFloat(controlData.manualPi) : patient.details?.manualPi,
      manualPc: controlData.manualPc ? parseFloat(controlData.manualPc) : patient.details?.manualPc,
      notes: controlData.notes || patient.details?.notes
    };

    const updatedMeasurements = {
      CUELLO: controlData.CUELLO !== '' ? parseFloat(controlData.CUELLO) : patient.measurements?.CUELLO,
      BRAZO: controlData.BRAZO !== '' ? parseFloat(controlData.BRAZO) : patient.measurements?.BRAZO,
      TORSO: controlData.TORSO !== '' ? parseFloat(controlData.TORSO) : patient.measurements?.TORSO,
      CINTURA: controlData.CINTURA !== '' ? parseFloat(controlData.CINTURA) : patient.measurements?.CINTURA,
      CADERA: controlData.CADERA !== '' ? parseFloat(controlData.CADERA) : patient.measurements?.CADERA,
      GLÚTEOS: controlData.GLÚTEOS !== '' ? parseFloat(controlData.GLÚTEOS) : patient.measurements?.GLÚTEOS,
      MUSLO: controlData.MUSLO !== '' ? parseFloat(controlData.MUSLO) : patient.measurements?.MUSLO,
      PANTORRILLA: controlData.PANTORRILLA !== '' ? parseFloat(controlData.PANTORRILLA) : patient.measurements?.PANTORRILLA
    };

    const updatedDietForm = {
      ...patient.dietForm,
      rct: controlData.rct !== '' ? controlData.rct : patient.dietForm?.rct
    };

    // 3. Compilar paciente actualizado
    const updatedPatient = {
      ...patient,
      details: updatedDetails,
      measurements: updatedMeasurements,
      dietForm: updatedDietForm,
      history: [...(patient.history || []), pastEntry]
    };

    // 4. Guardar y redirigir
    savePatientUpdate(updatedPatient);
    setShowControlModal(false);
    showToast("¡Consulta de control guardada con éxito!", "success");

    // Redirección directa al planificador con flag de control
    window.location.href = `/nutri/patient/${patient.id}/menu?control=true`;
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
              <p style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: '700' }}>DNI: {patient.details?.ci} | Tel: {patient.details?.phone} | Edad: {patient.details?.age || '--'} años</p>
            )}
          </div>
        </div>
        
        {/* Fila de Acciones Reorganizada */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(() => {
              const appointments = JSON.parse(localStorage.getItem('nutri_appointments') || '[]');
              const myNext = appointments.find(a => a.patientId == patient.id && new Date(a.date) >= new Date());
              return myNext ? (
                <Link href="/nutri/agenda" style={{ flex: 1, textDecoration: 'none', background: 'var(--card-yellow-light)', color: 'var(--accent)', padding: '14px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--accent)' }}>
                  <Calendar size={18} /> {myNext.date.split('-').reverse().join('/')}
                </Link>
              ) : (
                <Link href="/nutri/agenda" style={{ flex: 1, textDecoration: 'none', background: 'rgba(0,0,0,0.05)', color: '#666', padding: '14px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <Calendar size={18} /> Programar Cita
                </Link>
              );
            })()}
            <Link href={`/nutri/patient/${patient.id}/report`} style={{ flex: 1, textDecoration: 'none', background: 'white', color: 'var(--primary)', padding: '14px', borderRadius: '16px', fontWeight: '900', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1.5px solid var(--primary)' }}>
              <Printer size={18} /> Informe Imprimible
            </Link>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href={`/nutri/patient/${patient.id}/menu`} className="btn-primary" style={{ textDecoration: 'none', padding: '16px', borderRadius: '16px', fontWeight: '900', fontSize: '0.85rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 2, boxShadow: '0 8px 20px rgba(29, 81, 45, 0.2)' }}>
              Menú y Dietética
            </Link>
            <Link href={`/nutri/patient/${patient.id}/reminder`} style={{ textDecoration: 'none', flex: 1.5, background: 'var(--card-yellow-light)', border: '1.5px solid var(--accent)', color: 'var(--text-primary)', padding: '16px', borderRadius: '16px', fontWeight: '900', fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <History size={16} /> R24H
            </Link>
            <Link href={`/nutri/patient/${patient.id}/food-log`} style={{ textDecoration: 'none', flex: 1.2, background: '#FFEBEE', border: '1.5px solid #EF5350', color: '#B71C1C', padding: '16px', borderRadius: '16px', fontWeight: '900', fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <BookOpen size={16} /> Bitácora
            </Link>
          </div>
        </div>
      </header>

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.5, marginBottom: '4px' }}>IMC REAL</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '900', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{clinical.imc}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.5, marginBottom: '4px' }}>P. REF (PC)</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', height: '36px' }}>
                <input
                  type="number"
                  step="0.1"
                  key={patient.details?.manualPc || 'autoPc'}
                  defaultValue={patient.details?.manualPc || ''}
                  placeholder={clinical.pc}
                  onBlur={(e) => {
                    const val = e.target.value;
                    const updatedDetails = { ...patient.details, manualPc: val };
                    const updatedPatient = { ...patient, details: updatedDetails };
                    savePatientUpdate(updatedPatient);
                    showToast('Peso de cálculo actualizado', 'success');
                  }}
                  style={{
                    width: '50px',
                    background: 'rgba(0,0,0,0.05)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1.1rem',
                    fontWeight: '900',
                    textAlign: 'center',
                    padding: '2px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.7rem', fontWeight: '850' }}>kg</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.5, marginBottom: '4px' }}>P. IDEAL</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', height: '36px' }}>
                <input
                  type="number"
                  step="0.1"
                  key={patient.details?.manualPi || 'autoPi'}
                  defaultValue={patient.details?.manualPi || ''}
                  placeholder={clinical.pi}
                  onBlur={(e) => {
                    const val = e.target.value;
                    const updatedDetails = { ...patient.details, manualPi: val };
                    const updatedPatient = { ...patient, details: updatedDetails };
                    savePatientUpdate(updatedPatient);
                    showToast('Peso ideal actualizado', 'success');
                  }}
                  style={{
                    width: '50px',
                    background: 'rgba(0,0,0,0.05)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1.1rem',
                    fontWeight: '900',
                    textAlign: 'center',
                    padding: '2px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.7rem', fontWeight: '850' }}>kg</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.5, marginBottom: '4px' }}>% GRASA (GC)</p>
              <div style={{ height: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '1rem', fontWeight: '900', color: '#EF5350', margin: 0 }}>
                  {clinical.gc !== '—' ? `${clinical.gc}%` : '—'}
                </p>
                {clinical.gc !== '—' && (
                  <span style={{ fontSize: '0.5rem', fontWeight: '900', color: '#B71C1C', opacity: 0.8, textTransform: 'uppercase', lineHeight: 1, marginTop: '2px' }}>
                    {getBodyFatProfile(patient.gender || patient.details?.sex || 'female', patient.details?.age || 30, clinical.gc)}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.5, marginBottom: '4px' }}>G. MAGRA</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '900', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#66BB6A' }}>
                {clinical.grasaMagra !== '—' ? `${clinical.grasaMagra}kg` : '—'}
              </p>
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
            {/* Expediente de Informes Guardados (Moviéndolo aquí para visibilidad) */}
            {patient.reports?.length > 0 && (
              <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.8, marginBottom: '10px' }}>HISTORIAL DE INFORMES</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[...patient.reports].reverse().slice(0, 4).map(report => (
                    <Link key={report.id} href={`/nutri/patient/${patient.id}/report?reportId=${report.id}`} style={{
                      textDecoration: 'none', background: 'rgba(255,255,255,0.15)', color: 'white',
                      padding: '10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800',
                      textAlign: 'center', border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      Copia {new Date(report.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

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

      {/* Tarjeta Fórmula Dietética (Oliva) */}
      <section className="glass-panel" style={{
        background: 'var(--card-yellow)',
        color: 'white',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h4 style={{ textAlign: 'center', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Fórmula Dietética</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <tbody>
            {[
              { label: 'PROTEÍNA', key: 'prot', placeholder: '1.4g / 76.5g / 306 Kcal' },
              { label: 'CHO', key: 'cho', placeholder: '3.7g / 208.3g / 833 Kcal' },
              { label: 'LÍPIDOS', key: 'lip', placeholder: '1.1g / 62.3g / 561 Kcal' },
              { label: 'RCT', key: 'rct', placeholder: '1700 Kcal / d' },
            ].map((item, idx) => (
              <tr key={item.key} style={{ borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                <td style={{ padding: '8px', fontWeight: '700' }}>{item.label}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>
                  <input
                    type="text"
                    placeholder={item.placeholder}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: 'white',
                      textAlign: 'right',
                      fontSize: '0.8rem',
                      width: '100%',
                      outline: 'none',
                      padding: '4px'
                    }}
                    defaultValue={patient.dietForm?.[item.key] || ''}
                    onBlur={(e) => {
                      const updated = { ...patient, dietForm: { ...patient.dietForm, [item.key]: e.target.value } };
                      const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
                      localStorage.setItem('nutri_patients', JSON.stringify(saved.map(p => p.id === patient.id ? updated : p)));
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Tarjeta Antropometría (Coral) */}
      <section className="glass-panel" style={{
        background: gender === 'female' ? 'var(--card-red)' : 'var(--card-blue)',
        color: 'white',
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
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, position: 'relative', minHeight: '370px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', paddingBottom: '70px' }}>
            {patient.details?.isPediatric ? (
              <svg viewBox="0 0 100 220" style={{ height: '280px', width: 'auto' }}>
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
                  <circle cx="50" cy="35" r="6" fill="var(--accent)" onClick={() => document.getElementById('input-CUELLO')?.focus()} onMouseEnter={() => setFocusedMeasurement('CUELLO')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="28" cy="80" r="6" fill="white" onClick={() => document.getElementById('input-BRAZO')?.focus()} onMouseEnter={() => setFocusedMeasurement('BRAZO')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="50" cy="57" r="6" fill="white" onClick={() => document.getElementById('input-TORSO')?.focus()} onMouseEnter={() => setFocusedMeasurement('TORSO')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="50" cy="92" r="6" fill="white" onClick={() => document.getElementById('input-CINTURA')?.focus()} onMouseEnter={() => setFocusedMeasurement('CINTURA')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="50" cy="118" r="6" fill="white" onClick={() => document.getElementById('input-CADERA')?.focus()} onMouseEnter={() => setFocusedMeasurement('CADERA')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="50" cy="135" r="6" fill="white" onClick={() => document.getElementById('input-GLÚTEOS')?.focus()} onMouseEnter={() => setFocusedMeasurement('GLÚTEOS')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="41" cy="160" r="6" fill="white" onClick={() => document.getElementById('input-MUSLO')?.focus()} onMouseEnter={() => setFocusedMeasurement('MUSLO')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="59" cy="160" r="6" fill="white" onClick={() => document.getElementById('input-PANTORRILLA')?.focus()} onMouseEnter={() => setFocusedMeasurement('PANTORRILLA')} onMouseLeave={() => setFocusedMeasurement(null)} />
                </g>
              </svg>
            ) : gender === 'female' ? (
              <svg viewBox="0 0 100 220" style={{ height: '280px', width: 'auto' }}>
                <g stroke="white" strokeWidth="1.5" fill="none" opacity="0.7">
                  {/* Cabeza */}
                  <circle cx="50" cy="20" r="10" />
                  {/* Torso con curvas */}
                  <path d="M40 35 Q50 32 60 35 L62 70 Q50 80 38 70 Z" />
                  <path d="M42 70 Q50 75 58 70 L60 110 Q50 120 40 110 Z" />
                  {/* Brazos */}
                  <path d="M40 35 L25 80 M60 35 L75 80" />
                  {/* Piernas */}
                  <path d="M40 110 L35 210 M60 110 L65 210" />
                </g>
                {/* Puntos Interactivos */}
                <g style={{ cursor: 'pointer' }}>
                  <circle cx="50" cy="30" r="6" fill="var(--accent)" onClick={() => document.getElementById('input-CUELLO')?.focus()} onMouseEnter={() => setFocusedMeasurement('CUELLO')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="25" cy="80" r="6" fill="white" onClick={() => document.getElementById('input-BRAZO')?.focus()} onMouseEnter={() => setFocusedMeasurement('BRAZO')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="50" cy="55" r="6" fill="white" onClick={() => document.getElementById('input-TORSO')?.focus()} onMouseEnter={() => setFocusedMeasurement('TORSO')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="50" cy="85" r="6" fill="white" onClick={() => document.getElementById('input-CINTURA')?.focus()} onMouseEnter={() => setFocusedMeasurement('CINTURA')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="50" cy="115" r="6" fill="white" onClick={() => document.getElementById('input-CADERA')?.focus()} onMouseEnter={() => setFocusedMeasurement('CADERA')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="50" cy="140" r="6" fill="white" onClick={() => document.getElementById('input-GLÚTEOS')?.focus()} onMouseEnter={() => setFocusedMeasurement('GLÚTEOS')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="36" cy="180" r="6" fill="white" onClick={() => document.getElementById('input-MUSLO')?.focus()} onMouseEnter={() => setFocusedMeasurement('MUSLO')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="64" cy="180" r="6" fill="white" onClick={() => document.getElementById('input-PANTORRILLA')?.focus()} onMouseEnter={() => setFocusedMeasurement('PANTORRILLA')} onMouseLeave={() => setFocusedMeasurement(null)} />
                </g>
              </svg>
            ) : (
              <svg viewBox="0 0 100 220" style={{ height: '280px', width: 'auto' }}>
                <g stroke="white" strokeWidth="1.8" fill="none" opacity="0.7">
                  {/* Cabeza */}
                  <circle cx="50" cy="20" r="11" />
                  {/* Torso V-Shape */}
                  <path d="M30 40 L70 40 L65 110 L35 110 Z" />
                  {/* Brazos Fuertes */}
                  <path d="M30 40 L15 90 M70 40 L85 90" />
                  {/* Piernas */}
                  <path d="M35 110 L30 210 M65 110 L70 210" />
                </g>
                <g style={{ cursor: 'pointer' }}>
                  <circle cx="50" cy="35" r="6" fill="var(--accent)" onClick={() => document.getElementById('input-CUELLO')?.focus()} onMouseEnter={() => setFocusedMeasurement('CUELLO')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="15" cy="90" r="6" fill="white" onClick={() => document.getElementById('input-BRAZO')?.focus()} onMouseEnter={() => setFocusedMeasurement('BRAZO')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="50" cy="65" r="6" fill="white" onClick={() => document.getElementById('input-TORSO')?.focus()} onMouseEnter={() => setFocusedMeasurement('TORSO')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="50" cy="115" r="6" fill="white" onClick={() => document.getElementById('input-CINTURA')?.focus()} onMouseEnter={() => setFocusedMeasurement('CINTURA')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="50" cy="135" r="6" fill="white" onClick={() => document.getElementById('input-CADERA')?.focus()} onMouseEnter={() => setFocusedMeasurement('CADERA')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="50" cy="155" r="6" fill="white" onClick={() => document.getElementById('input-GLÚTEOS')?.focus()} onMouseEnter={() => setFocusedMeasurement('GLÚTEOS')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="32" cy="180" r="6" fill="white" onClick={() => document.getElementById('input-MUSLO')?.focus()} onMouseEnter={() => setFocusedMeasurement('MUSLO')} onMouseLeave={() => setFocusedMeasurement(null)} />
                  <circle cx="68" cy="180" r="6" fill="white" onClick={() => document.getElementById('input-PANTORRILLA')?.focus()} onMouseEnter={() => setFocusedMeasurement('PANTORRILLA')} onMouseLeave={() => setFocusedMeasurement(null)} />
                </g>
              </svg>
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
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {measurements.map((m) => (
              <div key={m.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: '700' }}>{m.label}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      id={`input-${m.label}`}
                      type="number"
                      placeholder="0"
                      defaultValue={patient.measurements?.[m.label] || ''}
                      style={{
                        width: '45px',
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px',
                        color: 'white',
                        fontSize: '0.8rem',
                        textAlign: 'right'
                      }}
                      onFocus={() => setFocusedMeasurement(m.label)}
                      onBlur={(e) => {
                        const updated = { ...patient, measurements: { ...patient.measurements, [m.label]: e.target.value } };
                        const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
                        localStorage.setItem('nutri_patients', JSON.stringify(saved.map(p => p.id === patient.id ? updated : p)));
                        setFocusedMeasurement(null);
                      }}
                    />
                    <span style={{ fontSize: '0.6rem' }}>cm</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.5rem', opacity: 0.6, marginTop: '2px' }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
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
            { q: "5. Intolerancia o alergia", key: "allergies" }
          ].map((item) => (
            <div key={item.key} style={{ background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '10px', borderLeft: '4px solid var(--primary)' }}>
              <p style={{ fontWeight: '800', fontSize: '0.8rem', opacity: 0.6, marginBottom: '4px', textTransform: 'uppercase' }}>{item.q}</p>
              {editingAnswers ? (
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
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Galería de Fotos de Evolución */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
         <h4 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1.2rem', textAlign: 'center', fontWeight: '900' }}>COMPOSICIÓN CORPORAL (FOTOS)</h4>
         {patient.onboardingPhotos ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               {[
                 { label: 'Frente', key: 'front' },
                 { label: 'Espalda', key: 'back' },
                 { label: 'Lat. Izquierdo', key: 'left' },
                 { label: 'Lat. Derecho', key: 'right' }
               ].map(item => (
                 <div key={item.key} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: '800', marginBottom: '6px', opacity: 0.5 }}>{item.label}</p>
                    <div style={{ 
                      width: '100%', 
                      aspectRatio: '0.8', 
                      background: patient.onboardingPhotos[item.key] ? `url(${patient.onboardingPhotos[item.key]})` : '#eee',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }} />
                 </div>
               ))}
            </div>
         ) : (
           <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.4 }}>
              <Camera size={40} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>El paciente aún no ha cargado fotos de su evolución corporal.</p>
           </div>
         )}
      </section>
      {/* PREVISUALIZACIÓN DEL DASHBOARD INTERACTIVO DEL PACIENTE */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '20px', background: 'white' }}>
        <div 
          onClick={() => setPreviewDashboardOpen(!previewDashboardOpen)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>👁️</span>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>
              PREVISUALIZACIÓN DE PLAN E INTERCAMBIOS
            </h4>
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--primary)' }}>{previewDashboardOpen ? '▲ Ocultar' : '▼ Expandir'}</span>
        </div>

        {previewDashboardOpen && (
          <div className="fade-in" style={{ marginTop: '24px', borderTop: '1.5px solid rgba(0,0,0,0.08)', paddingTop: '20px' }}>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '20px', fontStyle: 'italic' }}>
              Así es como el paciente visualiza su distribución e intercambios auto-calculada en tiempo real:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
              {/* LADO IZQUIERDO: MENÚ (Amarillo-Mostaza estilo la guía) */}
              <div style={{ 
                background: '#F9FBE7', 
                border: '2.5px solid #AFB42B', 
                borderRadius: '20px', 
                padding: '20px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px',
                alignSelf: 'start'
              }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '950', margin: '0 0 10px 0', color: '#1d512d', textAlign: 'center', borderBottom: '2.5px solid #AFB42B', paddingBottom: '8px' }}>
                  DISTRIBUCIÓN
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {exchangeMeals.map(m => {
                    const isActive = selectedExchangeMeal === m.key;
                    const mealPortions = patient.menu?.[m.key]?.portions || {};
                    const hasPortions = Object.values(mealPortions).some(val => parseFloat(val) > 0);
                    
                    return (
                      <div 
                        key={m.key} 
                        onClick={() => setSelectedExchangeMeal(m.key)}
                        style={{ 
                          padding: '12px 14px', 
                          borderRadius: '12px',
                          background: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                          border: isActive ? '2px solid #AFB42B' : '2px solid transparent',
                          boxShadow: isActive ? '0 8px 20px rgba(0,0,0,0.06)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <p style={{ margin: '0 0 6px 0', fontWeight: '950', fontSize: '0.85rem', textTransform: 'uppercase', color: isActive ? '#1d512d' : '#555' }}>
                          {m.name}
                        </p>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {Object.keys(EXCHANGE_GUIDE_DB).map(groupKey => {
                            const target = parseFloat(mealPortions[groupKey]) || 0;
                            if (target === 0) return null;
                            const groupMeta = EXCHANGE_GUIDE_DB[groupKey];
                            return (
                              <div key={groupKey} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '800', color: '#1d512d' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: groupMeta.color, display: 'inline-block' }}></span>
                                <span>{groupMeta.name.split('/')[0].split(' ')[0]}: {target}</span>
                              </div>
                            );
                          })}
                          {!hasPortions && (
                            <span style={{ fontSize: '0.65rem', opacity: 0.5, fontStyle: 'italic', color: '#555' }}>Sin porciones objetivo</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LADO DERECHO: INTERCAMBIOS AUTO-RELLENADOS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '900', margin: '0 0 4px 0', color: '#1d512d' }}>
                  📋 TABLA DE INTERCAMBIOS PARA: <span style={{ textTransform: 'uppercase', color: '#1d512d', fontWeight: '950' }}>{exchangeMeals.find(em => em.key === selectedExchangeMeal)?.name}</span>
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(EXCHANGE_GUIDE_DB).map(([groupKey, groupMeta]) => {
                    const targetVal = parseFloat(patient.menu?.[selectedExchangeMeal]?.portions?.[groupKey]) || 0;
                    
                    return (
                      <div key={groupKey} style={{ border: `1.5px solid ${groupMeta.color}`, borderRadius: '16px', overflow: 'hidden' }}>
                        {/* Header del Grupo */}
                        <div style={{ 
                          background: groupMeta.color, 
                          color: groupMeta.textColor, 
                          padding: '10px 14px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          fontWeight: '950',
                          fontSize: '0.85rem'
                        }}>
                          <span>{groupMeta.name}</span>
                          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem' }}>
                            Meta: {targetVal} ración{targetVal !== 1 ? 'es' : ''}
                          </span>
                        </div>
                        
                        {/* Lista de Alimentos con Cálculo de Porciones */}
                        <div style={{ background: '#fafafa', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {groupMeta.foods.map((food, idx) => (
                            <div key={idx} style={{ 
                              borderBottom: idx < groupMeta.foods.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                              paddingBottom: idx < groupMeta.foods.length - 1 ? '6px' : 0,
                              fontSize: '0.8rem',
                              fontWeight: '700'
                            }}>
                              <p style={{ margin: '0 0 3px 0', color: '#333' }}>{food.name}</p>
                              <p style={{ margin: 0, color: groupMeta.color === '#FFD700' ? '#b59c00' : groupMeta.color, fontSize: '0.75rem', fontWeight: '900' }}>
                                👉 {displayCalculatedPortion(food, targetVal)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
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
          onClick={startFollowUp}
          className="btn-secondary" 
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '16px', fontSize: '0.85rem' }}
        >
          <History size={18} /> <span className="btn-text">Nuevo Control</span>
        </button>
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

      {/* MODAL DE NUEVA CONSULTA DE CONTROL Y EVOLUCIÓN */}
      {showControlModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '28px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 24px 50px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.05)',
            position: 'relative'
          }} className="scale-in">
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-primary)' }}>Nueva Consulta de Control</h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Registra el progreso del paciente y compara con la última sesión</p>
              </div>
              <button 
                onClick={() => setShowControlModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', opacity: 0.5 }}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleSaveFollowUp}>
              {/* Comparación de peso y calorías principales */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(29, 81, 45, 0.05)', padding: '20px', borderRadius: '20px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.6 }}>1. PESO DE CONTROL (kg)</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Previo: {patient.details?.weight}kg</span>
                    <input 
                      type="number"
                      step="0.1"
                      required
                      placeholder="Nuevo Peso"
                      className="input-field"
                      style={{ marginBottom: 0, padding: '8px 12px', fontSize: '0.9rem', width: '100%' }}
                      value={controlData.weight}
                      onChange={(e) => setControlData({...controlData, weight: e.target.value})}
                    />
                  </div>
                  {controlData.weight && (
                    <p style={{ fontSize: '0.7rem', fontWeight: '900', marginTop: '4px', color: parseFloat(controlData.weight) - parseFloat(patient.details?.weight) <= 0 ? 'var(--primary)' : '#EF5350' }}>
                      Diferencia: {(parseFloat(controlData.weight) - parseFloat(patient.details?.weight)).toFixed(1)} kg
                    </p>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.6 }}>2. RCT DIETA PRESCRITA (kcal)</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Previo: {patient.dietForm?.rct || 1700} Kcal</span>
                    <input 
                      type="text"
                      placeholder="Eej: 1600 Kcal"
                      className="input-field"
                      style={{ marginBottom: 0, padding: '8px 12px', fontSize: '0.9rem', width: '100%' }}
                      value={controlData.rct}
                      onChange={(e) => setControlData({...controlData, rct: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Ajustes Manuales de Pesos clínicos en este control */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.6, display: 'block', marginBottom: '6px' }}>Ajustar Peso Ideal Clínico (PI)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder={`Calculado: ${clinical.pi} kg`}
                    className="input-field"
                    style={{ margin: 0 }}
                    value={controlData.manualPi}
                    onChange={(e) => setControlData({...controlData, manualPi: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.6, display: 'block', marginBottom: '6px' }}>Ajustar Peso de Cálculo (PC)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder={`Calculado: ${clinical.pc} kg`}
                    className="input-field"
                    style={{ margin: 0 }}
                    value={controlData.manualPc}
                    onChange={(e) => setControlData({...controlData, manualPc: e.target.value})}
                  />
                </div>
              </div>

              {/* Grid 2 Columnas de Medidas Corporales */}
              <h4 style={{ fontSize: '0.75rem', fontWeight: '900', opacity: 0.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Medidas Antropométricas</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', background: 'rgba(0,0,0,0.01)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)', marginBottom: '20px' }}>
                {measurements.map(m => (
                  <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', width: '90px' }}>{m.label}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>({patient.measurements?.[m.label] || '--'}cm)</span>
                    <input 
                      type="number"
                      step="0.1"
                      placeholder="Nuevo"
                      className="input-field"
                      style={{ marginBottom: 0, padding: '4px 8px', fontSize: '0.8rem', width: '70px', textAlign: 'center' }}
                      value={controlData[m.label] || ''}
                      onChange={(e) => setControlData({...controlData, [m.label]: e.target.value})}
                    />
                  </div>
                ))}
              </div>

              {/* Notas de evolución en este control */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '900', opacity: 0.6, display: 'block', marginBottom: '8px' }}>NOTAS DE CONTROL Y EVOLUCIÓN</label>
                <textarea 
                  placeholder="Ej: El paciente refiere adherencia al menú del 80%. Reporta mejoría en su digestión y energía. Aumentó su consumo hídrico a 8 vasos diarios..."
                  className="input-field"
                  style={{ height: '80px', padding: '12px', fontSize: '0.85rem' }}
                  value={controlData.notes}
                  onChange={(e) => setControlData({...controlData, notes: e.target.value})}
                />
              </div>

              {/* Botón enviar */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowControlModal(false)}
                  className="btn-secondary" 
                  style={{ flex: 1, padding: '14px', borderRadius: '16px', fontWeight: '900' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 1.5, padding: '14px', borderRadius: '16px', fontWeight: '900' }}
                >
                  Guardar y Ajustar Menú →
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
