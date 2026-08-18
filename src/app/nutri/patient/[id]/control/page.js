'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateClinicalData, suggestPortionsFromMacros } from '@/utils/calculationUtils';
import { addHistoryEntry, getPatientById, updatePatient } from '@/lib/patients';

export default function ControlPage({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [patient, setPatient] = useState(null);
  const [clinical, setClinical] = useState(null);
  const [toast, setToast] = useState(null);
  
  const [localPctProt, setLocalPctProt] = useState('');
  const [localPctCho, setLocalPctCho] = useState('');
  const [customSuggestions, setCustomSuggestions] = useState(null);

  const [controlData, setControlData] = useState({
    weight: '',
    rct: '',
    pctProt: '',
    pctCho: '',
    notes: '',
    CINTURA: '', CADERA: '', CUELLO: '', BRAZO: '', TORSO: '', GLÚTEOS: '', MUSLO: '', PANTORRILLA: '',
    manualPi: '', manualPa: '', manualPc: ''
  });

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchPatientData = async () => {
      const p = await getPatientById(id);
      if (p) {
        setPatient(p);
        
        // Calculate clinical data based on patient details
        const clinData = calculateClinicalData({
          weight: p.details?.weight,
          height: p.details?.height,
          sex: p.details?.gender || 'female',
          manualPi: p.details?.manualPi,
          manualPa: p.details?.manualPa,
          manualPc: p.details?.manualPc
        });
        setClinical(clinData);

        setControlData({
          weight: p.details?.weight || '',
          rct: p.dietForm?.rct || '',
          pctProt: p.dietForm?.pctProt || '',
          pctCho: p.dietForm?.pctCho || '',
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
      }
    };
    
    fetchPatientData();
  }, [id]);

  if (!patient || !clinical) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando paciente...</div>;

  const currentWeight = parseFloat(controlData.weight) || patient.details?.weight;
  const liveClinical = calculateClinicalData({
    weight: currentWeight,
    height: patient.details?.height,
    sex: patient.details?.gender || 'female',
    manualPi: controlData.manualPi !== '' ? parseFloat(controlData.manualPi) : null,
    manualPa: controlData.manualPa !== '' ? parseFloat(controlData.manualPa) : null,
    manualPc: controlData.manualPc !== '' ? parseFloat(controlData.manualPc) : null
  });

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
        rct: controlData.rct !== '' ? controlData.rct : patient.dietForm?.rct,
        pctProt: controlData.pctProt !== '' ? controlData.pctProt : patient.dietForm?.pctProt,
        pctCho: controlData.pctCho !== '' ? controlData.pctCho : patient.dietForm?.pctCho
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
      updatePatient(patient.id, updatedPatient);
      
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
                placeholder={`Calculado: ${liveClinical.pi} kg`}
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
                placeholder={`Calculado: ${liveClinical.pa} kg`}
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
                placeholder={`Calculado: ${liveClinical.pc} kg`}
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

        {/* Tarjeta Fórmula Dietética Interactiva (Importada de dashboard) */}
        <div style={{ background: 'white', border: '1.5px solid var(--primary)', padding: '20px', borderRadius: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '955', color: 'var(--primary)', margin: 0, textTransform: 'uppercase' }}>
              📊 Cálculo Automático de Fórmula
            </h4>
            <span style={{ fontSize: '0.7rem', fontWeight: '805', background: 'var(--card-green-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px' }}>
              PC: {liveClinical.pc} kg
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {[
              { name: 'Control Peso', prot: 20, cho: 55 },
              { name: 'Mantenimiento', prot: 15, cho: 55 },
              { name: 'Bajo Peso', prot: 18, cho: 50 },
            ].map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setControlData({ ...controlData, pctProt: tmpl.prot, pctCho: tmpl.cho });
                  setLocalPctProt(tmpl.prot.toString());
                  setLocalPctCho(tmpl.cho.toString());
                  showToast(`Distribuido: Proteína ${tmpl.prot}%, CHO ${tmpl.cho}%`, 'success');
                }}
                style={{
                  background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)',
                  fontSize: '0.65rem', fontWeight: '800', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer'
                }}
              >
                {tmpl.name}
              </button>
            ))}
          </div>

          {/* Tabla interactiva */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '6px', fontWeight: '900', color: 'var(--primary)' }}>GRUPO</th>
                  <th style={{ padding: '6px', fontWeight: '900', color: 'var(--primary)', textAlign: 'center' }}>%</th>
                  <th style={{ padding: '6px', fontWeight: '900', color: 'var(--primary)', textAlign: 'right' }}>KCAL</th>
                  <th style={{ padding: '6px', fontWeight: '900', color: 'var(--primary)', textAlign: 'right' }}>GR</th>
                  <th style={{ padding: '6px', fontWeight: '900', color: 'var(--primary)', textAlign: 'right' }}>G/KG</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rct = parseFloat(controlData.rct) || parseFloat(patient.dietForm?.rct) || 1700;
                  const getSuggestedPct = (key) => {
                    const prof = liveClinical?.profile ? liveClinical.profile.toUpperCase() : 'NORMOPESO';
                    if (prof === 'BAJO PESO') return key === 'pctProt' ? 18 : key === 'pctCho' ? 50 : 32;
                    else if (prof === 'SOBREPESO' || prof.startsWith('OBESIDAD')) return key === 'pctProt' ? 20 : key === 'pctCho' ? 55 : 25;
                    else return key === 'pctProt' ? 15 : key === 'pctCho' ? 55 : 30;
                  };

                  const pctProt = controlData.pctProt !== '' ? parseFloat(controlData.pctProt) : getSuggestedPct('pctProt');
                  const pctCho = controlData.pctCho !== '' ? parseFloat(controlData.pctCho) : getSuggestedPct('pctCho');
                  const pctLip = Math.max(0, 100 - pctProt - pctCho);
                  const w = parseFloat(liveClinical.pc) || 70;

                  const rows = [
                    { name: 'PROT', pct: pctProt, isInput: true, divider: 4, key: 'pctProt' },
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
                            <td style={{ padding: '8px 4px', fontWeight: '700' }}>{row.name}</td>
                            <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                              {row.isInput ? (
                                <input
                                  type="number"
                                  value={row.key === 'pctProt' ? (localPctProt !== '' ? localPctProt : pctProt) : (localPctCho !== '' ? localPctCho : pctCho)}
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    if (row.key === 'pctProt') setLocalPctProt(valStr);
                                    else if (row.key === 'pctCho') setLocalPctCho(valStr);
                                    setControlData({ ...controlData, [row.key]: parseFloat(valStr) || 0 });
                                  }}
                                  style={{ width: '45px', padding: '2px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '800' }}
                                />
                              ) : (
                                <span style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.6 }}>{row.pct.toFixed(1)}%</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: '600' }}>{rowKcal.toFixed(0)}</td>
                            <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: '750', color: 'var(--primary)' }}>{rowGrams.toFixed(1)}</td>
                            <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: '700' }}>{rowGramsPerKg.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ background: 'rgba(29, 81, 45, 0.05)', fontWeight: '900' }}>
                        <td style={{ padding: '10px 4px' }}>TOTAL</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center' }}>{(pctProt + pctCho + pctLip).toFixed(1)}%</td>
                        <td style={{ padding: '10px 4px', textAlign: 'right' }}>{rct}</td>
                        <td colSpan="2"></td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
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
