'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, MapPin, Phone, User, Activity, FileText, ArrowLeft, Save, CheckCircle, Info, Bell } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { calculateClinicalData } from '@/utils/calculationUtils';

export default function ClinicalReport() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [patient, setPatient] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const reportId = searchParams?.get('reportId');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const found = saved.find(p => p.id === parseInt(params.id));
    if (found) {
      setPatient(found);
      if (reportId && found.reports) {
        const foundSnapshot = found.reports.find(r => r.id == reportId);
        if (foundSnapshot) setSnapshot(foundSnapshot);
      }
    }
  }, [params.id, reportId]);

  if (!patient) return <div style={{ padding: '40px' }}>Generando informe...</div>;

  // Render logic targets either the live data or the snapshot data
  const targetDetails = snapshot ? snapshot.details : patient.details;
  const targetMeasurements = snapshot ? snapshot.measurements : patient.measurements;
  const targetMenu = snapshot ? snapshot.menu : patient.menu;
  
  const clinical = snapshot ? snapshot.clinical : calculateClinicalData({
    weight: targetDetails?.weight,
    height: targetDetails?.height,
    sex: targetDetails?.gender || 'female'
  });

  const foodGroups = {
    cereales: { color: '#FFA500', name: 'Almidones' },
    proteinas: { color: '#FF0000', name: 'Proteínas' },
    vegetales: { color: '#228B22', name: 'Veg' },
    frutas: { color: '#BA55D3', name: 'Frutas' },
    lacteos: { color: '#1E90FF', name: 'Lácteos' },
    grasas: { color: '#FFD700', name: 'Grasas' }
  };

  const handlePrint = () => {
    window.print();
  };

  // Obtener próxima cita del paciente (sólo para snapshot futuro, si es historial usa el guardado)
  const appointments = JSON.parse(localStorage.getItem('nutri_appointments') || '[]');
  const nextApp = snapshot ? { date: snapshot.nextAppDate } : appointments
    .filter(a => a.patientId == patient.id && new Date(a.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const handleSaveReport = () => {
    showConfirm(
      "Guardar Informe",
      "¿Deseas guardar una copia inmutable de este informe en el expediente del paciente para poder re-imprimirlo en el futuro?",
      () => {
        const newReport = {
          id: Date.now(),
          date: new Date().toISOString(),
          details: { ...patient.details },
          measurements: { ...patient.measurements },
          menu: { ...patient.menu },
          clinical: { imc: clinical.imc, profile: clinical.profile, pi: clinical.pi },
          nextAppDate: nextApp?.date || null
        };

        const updatedPatient = { ...patient, reports: [...(patient.reports || []), newReport] };
        const savedPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
        localStorage.setItem('nutri_patients', JSON.stringify(savedPatients.map(p => p.id === patient.id ? updatedPatient : p)));
        setPatient(updatedPatient);
        showToast('¡Informe guardado en el expediente!', 'success');
      }
    );
  };

  return (
    <div className="report-container" style={{ background: '#f5f5f5', minHeight: '100vh', padding: '40px 0' }}>
      <style jsx global>{`
        @media print {
          .no-print, nav, footer:not(.report-footer), .tab-bar, #tab-bar { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .report-container { background: white !important; padding: 0 !important; margin: 0 !important; }
          .letter-page { 
            box-shadow: none !important; 
            border: none !important; 
            margin: 0 !important; 
            width: 215.9mm !important; 
            height: 279.4mm !important;
            padding: 0 !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            page-break-after: always;
          }
        }
        .letter-page {
          width: 215.9mm;
          height: 279.4mm;
          position: relative;
          background: white;
          margin: 0 auto;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
          border-radius: 2px;
          overflow: hidden;
        }
      `}</style>

      {/* Botones de Acción (No imprimibles) */}
      <div className="no-print" style={{ position: 'fixed', bottom: '30px', right: '30px', display: 'flex', gap: '15px', zIndex: 1000 }}>
        <button 
          onClick={() => router.push(`/nutri/patient/${patient.id}`)}
          style={{ 
            background: 'white', color: 'var(--text-primary)', border: '1px solid #ddd', 
            padding: '16px 24px', borderRadius: '50px', fontWeight: '800', 
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}
        >
          <ArrowLeft size={20} /> Volver
        </button>
        {!snapshot && (
          <button 
            onClick={handleSaveReport}
            style={{ 
              background: '#1D512D', color: 'white', border: 'none', 
              padding: '16px 24px', borderRadius: '50px', fontWeight: '800', 
              boxShadow: '0 10px 20px rgba(0,0,0,0.2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <Save size={20} /> Guardar Expediente
          </button>
        )}
        <button 
          onClick={handlePrint}
          style={{ 
            background: 'var(--primary)', color: 'white', border: 'none', 
            padding: '16px 24px', borderRadius: '50px', fontWeight: '900', 
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}
        >
          <Printer size={20} /> Imprimir en Mi Papel Membretado
        </button>
      </div>

      <div className="letter-page">
        
        {/* Fondo Membretado Físico (img tag asegura impresión correcta) */}
        <img 
          src="/Membrete_Mesa%20de%20trabajo%201.png"
          alt="Membrete Oficial"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            objectFit: 'cover',
            pointerEvents: 'none'
          }}
        />

        {/* Contenedor Superior de Datos (zIndex 1 asegura que renderiza sobre el fondo) */}
        <div style={{ position: 'relative', zIndex: 1, padding: '4.8cm 1.2cm 2cm 1.2cm', width: '100%', height: '100%' }}>
          
          {/* Widget de Próxima Cita Siempre Visible */}
          <div style={{
            position: 'absolute',
            top: '0.8cm',
            right: '1.2cm',
            width: '120px',
            height: '110px',
            background: 'white',
            border: '2px solid #fd9e14', /* Color dorado/anaranjado de la UI */
            borderRadius: '25px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            zIndex: 10
          }}>
            <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: '800', color: '#333' }}>Próxima cita</p>
            {nextApp ? (
              <>
                <p style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900', color: '#1d512d', lineHeight: '1' }}>
                  {nextApp.date.split('-')[2]}
                </p>
                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '900', color: '#333', textTransform: 'uppercase' }}>
                  {new Date(nextApp.date + 'T00:00:00').toLocaleString('es-ES', { month: 'long' })} {nextApp.date.split('-')[0]}
                </p>
              </>
            ) : (
                <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', fontWeight: '900', opacity: 0.6, lineHeight: '1.2' }}>
                  Por<br/>agendar
                </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px', background: 'rgba(29, 81, 45, 0.04)', padding: '12px', borderRadius: '8px' }}>
            <div>
               <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.4, marginBottom: '2px' }}>PACIENTE</p>
               <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>{patient.name}</p>
            </div>
            <div>
               <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.4, marginBottom: '2px' }}>DNI / CÉDULA</p>
               <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>{patient.details?.ci || 'N/A'}</p>
            </div>
            <div>
               <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.4, marginBottom: '2px' }}>EDAD / SEXO</p>
               <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>{patient.details?.age} años / {patient.details?.gender === 'male' ? 'Masc' : 'Fem'}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '25px' }}>
             <div style={{ border: '1px solid rgba(0,0,0,0.06)', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.7)' }}>
                <h4 style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.5, marginBottom: '10px' }}>ESTADO NUTRICIONAL ACTUAL</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                   <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary)', margin: 0 }}>{clinical.imc}</p>
                      <p style={{ fontSize: '0.55rem', fontWeight: '800', opacity: 0.6 }}>IMC REAL</p>
                   </div>
                   <div>
                      <p style={{ fontSize: '1rem', fontWeight: '900', color: '#000', margin: '0 0 4px 0' }}>{clinical.profile}</p>
                      <p style={{ fontSize: '0.7rem', color: '#666', margin: 0 }}>
                        Peso: {targetDetails?.weight} kg | Ideal: {clinical.pi} kg
                      </p>
                   </div>
                </div>
             </div>
             <div style={{ border: '1px solid rgba(0,0,0,0.06)', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.7)' }}>
                <h4 style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.5, marginBottom: '10px' }}>PATOLOGÍAS / TAGS</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                   {targetDetails?.tags?.length ? targetDetails.tags.map(tag => (
                     <span key={tag} style={{ border: '1px solid #333', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700' }}>{tag}</span>
                   )) : <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>Ninguna registrada</span>}
                </div>
             </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
             <h4 style={{ fontSize: '0.75rem', fontWeight: '900', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '6px', marginBottom: '10px' }}>MEDIDAS CORPORALES (CM)</h4>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {Object.entries(patient.measurements || {}).slice(0, 8).map(([key, val]) => (
                  <div key={key} style={{ textAlign: 'center', border: '1px solid rgba(0,0,0,0.03)', padding: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.7)' }}>
                     <p style={{ fontSize: '0.55rem', fontWeight: '800', opacity: 0.4, marginBottom: '2px' }}>{key}</p>
                     <p style={{ fontSize: '0.8rem', fontWeight: '700' }}>{val || '--'} <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>cm</span></p>
                  </div>
                ))}
             </div>
             {/* Evolución de Medidas */}
             {patient.history?.length > 0 && Object.keys(patient.measurements || {}).length > 0 && (
                <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.5)', padding: '8px', borderRadius: '6px' }}>
                   <p style={{ margin: '0 0 6px 0', fontSize: '0.6rem', fontWeight: '800', opacity: 0.5 }}>DIFERENCIA DESDE PRIMERA CITA:</p>
                   <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {Object.entries(patient.measurements || {}).slice(0, 8).map(([key, val]) => {
                        const firstVal = patient.history[0].measurements?.[key];
                        if (!firstVal) return null;
                        const diff = parseFloat(val) - parseFloat(firstVal);
                        if (isNaN(diff) || diff === 0) return null;
                        return (
                          <span key={key} style={{ fontSize: '0.6rem', fontWeight: '700', color: diff < 0 ? 'var(--primary)' : '#cc0000', border: '1px solid rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                            {key}: {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                          </span>
                        )
                      })}
                   </div>
                </div>
             )}
          </div>

          {/* Gráfico de Evolución (Sólo si hay historial) */}
          {patient.history?.length > 0 && (
            <div style={{ marginBottom: '25px', background: 'rgba(255,255,255,0.9)', border: '1.5px solid var(--primary)', borderRadius: '12px', padding: '15px' }}>
               <h4 style={{ fontSize: '0.8rem', fontWeight: '900', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px', marginBottom: '20px', color: 'var(--primary)', textTransform: 'uppercase' }}>Gráfico de Evolución - Peso Corporal</h4>
               <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '120px', paddingBottom: '5px', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingTop: '10px' }}>
                 {[...patient.history, { date: new Date().toISOString().split('T')[0], details: { weight: patient.details.weight } }].map((entry, i, arr) => {
                   const maxW = Math.max(...arr.map(a => parseFloat(a.details?.weight) || 0));
                   const minW = Math.min(...arr.map(a => parseFloat(a.details?.weight) || 0)) * 0.85;
                   const val = parseFloat(entry.details?.weight) || 0;
                   const heightPct = Math.max(10, ((val - minW) / (maxW - minW)) * 100);
                   return (
                     <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', position: 'relative' }}>
                       <span style={{ fontSize: '0.7rem', fontWeight: '900', marginBottom: '6px', color: '#333' }}>{val} <span style={{fontSize: '0.55rem', opacity: 0.6}}>kg</span></span>
                       <div style={{ width: '100%', height: `${heightPct}%`, background: i === arr.length - 1 ? 'var(--primary)' : 'rgba(29, 81, 45, 0.2)', borderRadius: '6px 6px 0 0', minHeight: '10px' }}></div>
                       <span style={{ fontSize: '0.55rem', fontWeight: '800', opacity: 0.6, position: 'absolute', bottom: '-20px', whiteSpace: 'nowrap' }}>
                         {new Date(entry.date + 'T00:00:00').toLocaleDateString('es-ES', {month:'short', day:'numeric'})}
                       </span>
                     </div>
                   )
                 })}
               </div>
            </div>
          )}

          {/* PLAN DE MENÚ DINÁMICO SEGÚN PACIENTE */}
          <div style={{ border: '2px solid var(--primary)', borderRadius: '12px', background: 'white', overflow: 'hidden', marginBottom: '25px', pageBreakInside: 'avoid' }}>
             <h3 style={{ margin: '0', background: 'var(--primary)', color: 'white', padding: '10px', fontSize: '1rem', fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' }}>PLAN DE MENÚ ESTIMADO</h3>
             <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                   <tr style={{ background: 'var(--card-green-light)', color: 'var(--primary)' }}>
                      {[
                        { key: 'desayuno', label: 'DESAYUNO' },
                        { key: 'meriendaAM', label: 'MER. AM', active: ['3+1', '3+2', '3+3'].includes(patient.mealPlan) },
                        { key: 'almuerzo', label: 'ALMUERZO' },
                        { key: 'meriendaPM', label: 'MER. PM', active: ['3+2', '3+3'].includes(patient.mealPlan) },
                        { key: 'cena', label: 'CENA' },
                        { key: 'snackNoche', label: 'S. NOCHE', active: patient.mealPlan === '3+3' }
                      ].filter(m => m.active !== false).map(meal => (
                        <th key={meal.key} style={{ padding: '10px 5px', fontSize: '0.65rem', fontWeight: '900', border: '1px solid var(--primary)' }}>
                           {meal.label}
                        </th>
                      ))}
                   </tr>
                </thead>
                <tbody>
                   {Array.from({ length: Math.max(...Object.values(targetMenu || {}).map(m => m.selectedFoods?.length || 0), 1) }).map((_, rowIdx) => (
                      <tr key={rowIdx}>
                         {[
                            { key: 'desayuno' },
                            { key: 'meriendaAM', active: ['3+1', '3+2', '3+3'].includes(patient.mealPlan) },
                            { key: 'almuerzo' },
                            { key: 'meriendaPM', active: ['3+2', '3+3'].includes(patient.mealPlan) },
                            { key: 'cena' },
                            { key: 'snackNoche', active: patient.mealPlan === '3+3' }
                         ].filter(m => m.active !== false).map(meal => {
                            const food = targetMenu?.[meal.key]?.selectedFoods?.[rowIdx];
                            return (
                               <td key={meal.key} style={{ padding: '8px 6px', border: '1px solid var(--primary)', verticalAlign: 'top', height: '60px' }}>
                                  {food ? (
                                     <div style={{ fontSize: '0.62rem', borderLeft: `3px solid ${foodGroups[food.groupKey]?.color || '#333'}`, paddingLeft: '4px', lineHeight: '1.2' }}>
                                        <p style={{ margin: '0 0 2px 0', fontWeight: '900', color: foodGroups[food.groupKey]?.color }}>{food.portion}</p>
                                        <p style={{ margin: 0, fontWeight: '700', color: '#111' }}>{food.name}</p>
                                     </div>
                                  ) : (
                                    <div style={{ opacity: 0.05, fontSize: '0.5rem', textAlign: 'center' }}>-</div>
                                  )}
                               </td>
                            );
                         })}
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.8)', border: '1px dashed var(--accent)', padding: '12px', borderRadius: '8px' }}>
             <h4 style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--accent)', marginBottom: '6px', textTransform: 'uppercase' }}>Observaciones del Especialista</h4>
             <div style={{ fontSize: '0.75rem', lineHeight: '1.4', color: '#444' }}>
               {targetDetails?.notes || 'Seguir las indicaciones generales discutidas en consulta.'}
             </div>
          </div>

          <footer style={{ position: 'absolute', bottom: '2cm', left: '1.5cm', right: '1.5cm', textAlign: 'center' }}>
             <div style={{ display: 'inline-block', borderTop: '1px solid #333', padding: '8px 40px' }}>
                <p style={{ margin: 0, fontWeight: '900', fontSize: '0.85rem' }}>Lic. en Nutrición y Dietética</p>
                <p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.6 }}>Registro Profesional / Matrícula</p>
             </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
