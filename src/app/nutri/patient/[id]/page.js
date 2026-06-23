'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Activity, Printer, Calendar, Save, History, Camera, FileText } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { calculateClinicalData } from '@/utils/calculationUtils';

export default function PatientFile() {
  const params = useParams();
  const { showToast, showConfirm } = useUI();
  const [patient, setPatient] = useState(null);
  const [gender, setGender] = useState('female'); // 'male' or 'female'
  const [currentTag, setCurrentTag] = useState('');
  const [editingAnswers, setEditingAnswers] = useState(false);

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
    sex: gender
  };
  const clinical = calculateClinicalData(patientDataForCalc);

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

  const measurements = [
    { label: 'CUELLO', desc: 'Base del cuello' },
    { label: 'BRAZO', desc: 'Punto medio (Relajado)' },
    { label: 'TORSO', desc: 'Línea mamaria' },
    { label: 'CINTURA', desc: 'Punto más estrecho' },
    { label: 'CADERA', desc: 'Punto más ancho' },
    { label: 'GLÚTEOS', desc: 'Prominencia máxima' },
    { label: 'MUSLO', desc: 'Punto medio del muslo' },
    { label: 'PANTORRILLA', desc: 'Perímetro máximo' },
  ];

  return (
    <div style={{ padding: '20px', paddingBottom: '160px' }} className="fade-in">
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <Link href="/nutri/dashboard" style={{ color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px' }}>{patient.name}</h2>
            <p style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: '700' }}>DNI: {patient.details?.ci} | Tel: {patient.details?.phone}</p>
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
          <Link href={`/nutri/patient/${patient.id}/menu`} className="btn-primary" style={{ textDecoration: 'none', padding: '16px', borderRadius: '16px', fontWeight: '900', fontSize: '1rem', textAlign: 'center', display: 'block', boxShadow: '0 8px 20px rgba(29, 81, 45, 0.2)' }}>
            Planificador de Menú
          </Link>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.5, marginBottom: '4px' }}>IMC REAL</p>
              <p style={{ fontSize: '1.4rem', fontWeight: '900' }}>{clinical.imc}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.5, marginBottom: '4px' }}>P. REF (PC)</p>
              <p style={{ fontSize: '1.4rem', fontWeight: '900' }}>{clinical.pc}kg</p>
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.5, marginBottom: '4px' }}>P. IDEAL</p>
              <p style={{ fontSize: '1.4rem', fontWeight: '900' }}>{clinical.pi}kg</p>
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
          <div style={{ flex: 1, position: 'relative', minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>
            {gender === 'female' ? (
              <svg viewBox="0 0 100 220" style={{ height: '300px', width: 'auto' }}>
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
                  <circle cx="50" cy="30" r="6" fill="var(--accent)" onClick={() => document.getElementById('input-CUELLO')?.focus()} />
                  <circle cx="25" cy="80" r="6" fill="white" onClick={() => document.getElementById('input-BRAZO')?.focus()} />
                  <circle cx="50" cy="55" r="6" fill="white" onClick={() => document.getElementById('input-TORSO')?.focus()} />
                  <circle cx="50" cy="85" r="6" fill="white" onClick={() => document.getElementById('input-CINTURA')?.focus()} />
                  <circle cx="50" cy="115" r="6" fill="white" onClick={() => document.getElementById('input-CADERA')?.focus()} />
                  <circle cx="50" cy="140" r="6" fill="white" onClick={() => document.getElementById('input-GLÚTEOS')?.focus()} />
                  <circle cx="36" cy="180" r="6" fill="white" onClick={() => document.getElementById('input-MUSLO')?.focus()} />
                  <circle cx="64" cy="180" r="6" fill="white" onClick={() => document.getElementById('input-PANTORRILLA')?.focus()} />
                </g>
              </svg>
            ) : (
              <svg viewBox="0 0 100 220" style={{ height: '300px', width: 'auto' }}>
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
                  <circle cx="50" cy="35" r="6" fill="var(--accent)" onClick={() => document.getElementById('input-CUELLO')?.focus()} />
                  <circle cx="15" cy="90" r="6" fill="white" onClick={() => document.getElementById('input-BRAZO')?.focus()} />
                  <circle cx="50" cy="65" r="6" fill="white" onClick={() => document.getElementById('input-TORSO')?.focus()} />
                  <circle cx="50" cy="115" r="6" fill="white" onClick={() => document.getElementById('input-CINTURA')?.focus()} />
                  <circle cx="50" cy="135" r="6" fill="white" onClick={() => document.getElementById('input-CADERA')?.focus()} />
                  <circle cx="50" cy="155" r="6" fill="white" onClick={() => document.getElementById('input-GLÚTEOS')?.focus()} />
                  <circle cx="32" cy="180" r="6" fill="white" onClick={() => document.getElementById('input-MUSLO')?.focus()} />
                  <circle cx="68" cy="180" r="6" fill="white" onClick={() => document.getElementById('input-PANTORRILLA')?.focus()} />
                </g>
              </svg>
            )}
            <div style={{ position: 'absolute', bottom: '5px', left: '0', right: '0', fontSize: '0.65rem', opacity: 0.6, textAlign: 'center', color: 'white' }}>
              Modelo {gender === 'female' ? 'Femenino' : 'Masculino'}
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
                      onBlur={(e) => {
                        const updated = { ...patient, measurements: { ...patient.measurements, [m.label]: e.target.value } };
                        const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
                        localStorage.setItem('nutri_patients', JSON.stringify(saved.map(p => p.id === patient.id ? updated : p)));
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
          onClick={() => {
            const el = document.getElementById('ev-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="btn-secondary" 
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '16px', fontSize: '0.85rem' }}
        >
          <History size={18} /> <span className="btn-text">Seguimiento</span>
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
    </div>
  );
}
