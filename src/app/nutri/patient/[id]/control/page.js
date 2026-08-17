'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNutri } from '@/context/NutriContext';
import { calculateClinicalData } from '@/utils/calculations';
import { addHistoryEntry } from '@/lib/patients';

export default function ControlPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const { patients, updatePatient } = useNutri();
  
  const [patient, setPatient] = useState(null);
  const [clinical, setClinical] = useState(null);
  const [toast, setToast] = useState(null);
  
  const [controlData, setControlData] = useState({
    weight: '',
    rct: '',
    notes: '',
    CINTURA: '', CADERA: '', CUELLO: '', BRAZO: '', TORSO: '', GLÚTEOS: '', MUSLO: '', PANTORRILLA: '',
    manualPi: '', manualPa: '', manualPc: ''
  });

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Check if patient exists
    const p = patients.find(p => p.id === id);
    if (p) {
      setPatient(p);
      setClinical(calculateClinicalData(p));
      setControlData({
        weight: p.details?.weight || '',
        rct: p.dietForm?.rct || '',
        notes: '',
        CINTURA: p.measurements?.CINTURA || '',
        CADERA: p.measurements?.CADERA || '',
        CUELLO: p.measurements?.CUELLO || '',
        BRAZO: p.measurements?.BRAZO || '',
        TORSO: p.measurements?.TORSO || '',
        GLÚTEOS: p.measurements?.GLÚTEOS || '',
        MUSLO: p.measurements?.MUSLO || '',
        PANTORRILLA: p.measurements?.PANTORRILLA || '',
        manualPi: p.details?.manualPi || '',
        manualPa: p.details?.manualPa || '',
        manualPc: p.details?.manualPc || ''
      });
    } else {
        // Find in localstorage directly
        const localPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
        const lp = localPatients.find(p => p.id === id);
        if (lp) {
            setPatient(lp);
            setClinical(calculateClinicalData(lp));
            setControlData({
                weight: lp.details?.weight || '',
                rct: lp.dietForm?.rct || '',
                notes: '',
                CINTURA: lp.measurements?.CINTURA || '',
                CADERA: lp.measurements?.CADERA || '',
                CUELLO: lp.measurements?.CUELLO || '',
                BRAZO: lp.measurements?.BRAZO || '',
                TORSO: lp.measurements?.TORSO || '',
                GLÚTEOS: lp.measurements?.GLÚTEOS || '',
                MUSLO: lp.measurements?.MUSLO || '',
                PANTORRILLA: lp.measurements?.PANTORRILLA || '',
                manualPi: lp.details?.manualPi || '',
                manualPa: lp.details?.manualPa || '',
                manualPc: lp.details?.manualPc || ''
            });
        }
    }
  }, [id, patients]);

  if (!patient || !clinical) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando paciente...</div>;

  const measurements = [
    { label: 'CUELLO' },
    { label: 'BRAZO' },
    { label: 'TORSO' },
    { label: 'CINTURA' },
    { label: 'CADERA' },
    { label: 'GLÚTEOS' },
    { label: 'MUSLO' },
    { label: 'PANTORRILLA' }
  ];

  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    if (!patient) return;

    try {
      const pastEntry = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        details: { ...patient.details },
        measurements: { ...patient.measurements },
        dietForm: { ...patient.dietForm },
        imc: clinical.imc,
        profile: clinical.profile,
        menus: patient.menu || null,
        notes: patient.details?.notes || ''
      };

      const updatedDetails = {
        ...patient.details,
        weight: parseFloat(controlData.weight) || patient.details?.weight,
        manualPi: controlData.manualPi !== '' ? parseFloat(controlData.manualPi) : patient.details?.manualPi,
        manualPa: controlData.manualPa !== '' ? parseFloat(controlData.manualPa) : patient.details?.manualPa,
        manualPc: controlData.manualPc !== '' ? parseFloat(controlData.manualPc) : patient.details?.manualPc,
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

      const updatedPatient = {
        ...patient,
        details: updatedDetails,
        measurements: updatedMeasurements,
        dietForm: updatedDietForm,
        history: [...(patient.history || []), pastEntry]
      };
      
      // Save entry to IndexedDB
      await addHistoryEntry(patient.id, pastEntry);
      
      // Save patient to LocalStorage
      const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
      localStorage.setItem('nutri_patients', JSON.stringify(saved.map(p => p.id === patient.id ? updatedPatient : p)));
      updatePatient(updatedPatient);
      
      showToast("¡Consulta de control guardada con éxito!", "success");
      
      setTimeout(() => {
        router.push(`/nutri/patient/${patient.id}/menu?control=true`);
      }, 1000);

    } catch (err) {
      console.error(err);
      showToast("Error al guardar el control. Reintente.", "error");
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', minHeight: '100dvh' }} className="fade-in">
        {/* TOAST */}
        {toast && (
            <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#EF5350' : '#4CAF50', color: 'white', padding: '12px 24px', borderRadius: '30px', fontWeight: '900', zIndex: 99999, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            {toast.msg}
            </div>
        )}

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-primary)' }}>Nueva Consulta de Control</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Registra el progreso del paciente y compara con la última sesión</p>
        </div>
        <button 
            onClick={() => router.back()}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.6, display: 'block', marginBottom: '6px' }}>Peso Ideal Clínico (PI)</label>
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
            <label style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.6, display: 'block', marginBottom: '6px' }}>Peso Ajustado Clínico (PA)</label>
            <input 
                type="number" 
                step="0.1"
                placeholder={`Calculado: ${clinical.pa} kg`}
                className="input-field"
                style={{ margin: 0 }}
                value={controlData.manualPa || ''}
                onChange={(e) => setControlData({...controlData, manualPa: e.target.value})}
            />
            </div>
            <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.6, display: 'block', marginBottom: '6px' }}>Peso de Cálculo (PC)</label>
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
            onClick={() => router.back()}
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
  );
}
