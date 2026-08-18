'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, MapPin, Phone, User, Activity, FileText, ArrowLeft, Save, CheckCircle, Info, Bell } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { calculateClinicalData } from '@/utils/calculationUtils';
import { usePatient } from '@/hooks/usePatient';

import { getMealTypes, MEAL_PLANS } from '@/utils/mealUtils';

export default function ClinicalReport() {
  const params = useParams();
  const router = useRouter();
  const { showToast, showConfirm } = useUI();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const { patient, status } = usePatient(params.id);
  const [snapshot, setSnapshot] = useState(null);
  const reportId = searchParams?.get('reportId');

  useEffect(() => {
    if (patient && reportId && patient.reports) {
      const foundSnapshot = patient.reports.find(r => r.id == reportId);
      if (foundSnapshot) setSnapshot(foundSnapshot);
    }
  }, [patient, reportId]);

  if (status === 'loading') return <div style={{ padding: '40px', textAlign: 'center', fontWeight: 'bold' }}>Generando informe...</div>;
  if (status === 'not-found') return <div style={{ padding: '40px', textAlign: 'center' }}>No encontramos este informe.</div>;
  if (status === 'error') return <div style={{ padding: '40px', textAlign: 'center' }}>Hubo un error cargando el informe.</div>;
  if (!patient) return null;

  // Render logic targets either the live data or the snapshot data
  const targetDetails = snapshot ? snapshot.details : patient.details;
  const targetMeasurements = snapshot ? snapshot.measurements : patient.measurements;
  const targetMenu = snapshot ? snapshot.menu : patient.menu;
  const targetMenus = snapshot ? (snapshot.menus || { day1: snapshot.menu || {} }) : (patient.menus || { day1: patient.menu || {} });
  
  const clinical = snapshot ? snapshot.clinical : calculateClinicalData({
    weight: targetDetails?.weight,
    height: targetDetails?.height,
    sex: targetDetails?.gender || 'female',
    manualPi: targetDetails?.manualPi,
    manualPa: targetDetails?.manualPa,
    manualPc: targetDetails?.manualPc
  });

  const foodGroups = {
    cereales: { color: '#FFA500', name: 'Almidones' },
    proteinas: { color: '#FF0000', name: 'Proteínas' },
    vegetales: { color: '#228B22', name: 'Veg' },
    frutas: { color: '#BA55D3', name: 'Frutas' },
    lacteos: { color: '#1E90FF', name: 'Lácteos' },
    grasas: { color: '#FFD700', name: 'Grasas' }
  };

  const gNamesShort = {
    cereales: 'Cer',
    proteinas: 'Prot',
    vegetales: 'Veg',
    frutas: 'Frut',
    lacteos: 'Lác',
    grasas: 'Gras'
  };

  const handlePrint = () => {
    window.print();
  };

  // Obtener próxima cita del paciente (sólo para snapshot futuro, si es historial usa el guardado)
  const appointments = JSON.parse(localStorage.getItem('nutri_appointments') || '[]');
  const nextApp = snapshot ? { date: snapshot.nextAppDate } : appointments
    .filter(a => a.patientId == patient.id && new Date(a.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const handleSaveReport = async () => {
    showConfirm(
      "Guardar Informe",
      "¿Deseas guardar una copia inmutable de este informe en el expediente del paciente para poder re-imprimirlo en el futuro?",
      async () => {
        const newReport = {
          id: Date.now(),
          date: new Date().toISOString(),
          details: { ...patient.details },
          measurements: { ...patient.measurements },
          menu: patient.menus?.day1 || patient.menu || {},
          menus: patient.menus ? { ...patient.menus } : { day1: patient.menu || {} },
          clinical: { imc: clinical.imc, profile: clinical.profile, pi: clinical.pi },
          nextAppDate: nextApp?.date || null
        };

        try {
          // Guardar en Supabase usando api
          const { addReport } = await import('@/lib/patients');
          await addReport(patient.id, newReport);

          const updatedPatient = { ...patient, reports: [...(patient.reports || []), newReport] };
          
          // Actualizar caché optimista local
          const savedPatients = JSON.parse(localStorage.getItem('cached_patients') || '[]');
          localStorage.setItem('cached_patients', JSON.stringify(savedPatients.map(p => p.id === patient.id ? updatedPatient : p)));
          
          setPatient(updatedPatient);
          showToast('¡Informe guardado en el expediente!', 'success');
        } catch (err) {
          showToast('Error al guardar el informe', 'error');
        }
      }
    );
  };

  return (
    <div className="report-container" style={{ background: '#f5f5f5', minHeight: '100vh', padding: '40px 0', paddingBottom: '100px' }}>
      {/* Estilos para Impresión y Pantalla */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* ESTILOS DE PANTALLA (MÓVIL / ESCRITORIO) */
        .letter-page {
          background-color: white !important;
          background-image: url('/Membrete_Mesa%20de%20trabajo%201.png') !important;
          background-size: contain !important;
          background-position: top center !important;
          background-repeat: repeat-y !important;
          width: 100% !important;
          max-width: 800px !important;
          margin: 0 auto !important;
          position: relative !important;
          box-sizing: border-box !important;
          border-radius: 20px !important;
          box-shadow: 0 12px 36px rgba(0,0,0,0.12) !important;
        }

        .report-content-wrapper {
          position: relative;
          z-index: 1;
          padding: 180px 20px 40px 20px !important;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }

        .appointment-widget {
          position: absolute;
          top: 20px !important;
          right: 20px !important;
          width: 100px !important;
          height: 90px !important;
          background: white;
          border: 2px solid #fd9e14;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          z-index: 10;
        }
        
        .appointment-widget-day { font-size: 1.5rem !important; }
        .appointment-widget-month { font-size: 0.6rem !important; }

        .info-grid-3 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 20px;
          background: rgba(29, 81, 45, 0.04);
          padding: 12px;
          border-radius: 8px;
        }

        .info-grid-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 15px;
          margin-bottom: 25px;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        table {
          width: 100% !important;
          min-width: 600px;
          table-layout: fixed;
          word-wrap: break-word;
        }
        td, th {
          word-break: break-word;
          font-size: 0.75rem !important;
        }

        /* AJUSTES PARA PANTALLA GRANDE */
        @media (min-width: 768px) {
          .info-grid-3 { grid-template-columns: repeat(3, 1fr); }
          .info-grid-2 { grid-template-columns: 1.2fr 0.8fr; }
          .report-content-wrapper { padding: 4.8cm 1.2cm 2cm 1.2cm !important; }
          .appointment-widget {
             top: 0.8cm !important;
             right: 1.2cm !important;
             width: 120px !important;
             height: 110px !important;
             border-radius: 25px;
          }
          .appointment-widget-day { font-size: 2.2rem !important; }
          .appointment-widget-month { font-size: 0.7rem !important; }
          .bg-membrete {
            object-fit: cover;
          }
        }

        /* ESTILOS EXACTOS DE IMPRESIÓN */
        @media print {
          @page { size: letter; margin: 0; }
          .no-print, nav, footer:not(.report-footer), .tab-bar, #tab-bar { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .report-container { background: white !important; padding: 0 !important; margin: 0 !important; }
          .letter-page { 
            box-shadow: none !important; 
            border: none !important; 
            margin: 0 !important; 
            width: 215.9mm !important; 
            max-width: 215.9mm !important; 
            min-height: 279.4mm !important;
            padding: 0 !important;
            border-radius: 0 !important;
            page-break-after: always;
            background-size: 215.9mm 279.4mm !important;
            background-repeat: repeat-y !important;
            background-position: top center !important;
          }
          .report-content-wrapper { padding: 4.8cm 1.2cm 2cm 1.2cm !important; }
          .appointment-widget {
             top: 0.8cm !important;
             right: 1.2cm !important;
             width: 120px !important;
             height: 110px !important;
             border-radius: 25px;
          }
          .appointment-widget-day { font-size: 2.2rem !important; }
          .appointment-widget-month { font-size: 0.7rem !important; }
          .info-grid-3 { grid-template-columns: repeat(3, 1fr) !important; gap: 15px !important; }
          .info-grid-2 { grid-template-columns: 1.2fr 0.8fr !important; gap: 20px !important; }
          .bg-membrete {
            object-fit: fill !important;
            height: 100% !important;
            min-height: auto !important;
          }
          table { min-width: 100% !important; font-size: 0.65rem !important; }
          td, th { font-size: 0.65rem !important; padding: 6px !important; }
        }
      `}} />

      {/* Botones de Acción (No imprimibles) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', padding: '0 20px' }}>
        <button 
          onClick={() => router.push(`/nutri/patient/${patient.id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: '900', border: '2px solid #ddd', background: 'white', color: '#333', cursor: 'pointer', outline: 'none' }}
        >
          <ArrowLeft size={20} /> <span>Volver</span>
        </button>
        {!snapshot && (
          <button 
            onClick={handleSaveReport}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: '900', border: 'none', background: '#1D512D', color: 'white', cursor: 'pointer', outline: 'none' }}
          >
            <Save size={20} /> <span>Guardar</span>
          </button>
        )}
        <button 
          onClick={handlePrint}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: '900', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', outline: 'none' }}
        >
          <Printer size={20} /> <span>Imprimir</span>
        </button>
      </div>

      <div className="letter-page">
        


        {/* Contenedor Superior de Datos (zIndex 1 asegura que renderiza sobre el fondo) */}
        <div className="report-content-wrapper">
          
          {/* Widget de Próxima Cita Siempre Visible */}
          <div className="appointment-widget">
            <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: '800', color: '#333' }}>Próxima cita</p>
            {nextApp ? (
              <>
                <p className="appointment-widget-day" style={{ margin: 0, fontWeight: '900', color: '#1d512d', lineHeight: '1' }}>
                  {nextApp.date.split('-')[2]}
                </p>
                <p className="appointment-widget-month" style={{ margin: 0, fontWeight: '900', color: '#333', textTransform: 'uppercase' }}>
                  {new Date(nextApp.date + 'T00:00:00').toLocaleString('es-ES', { month: 'long' })} {nextApp.date.split('-')[0]}
                </p>
              </>
            ) : (
                <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', fontWeight: '900', opacity: 0.6, lineHeight: '1.2' }}>
                  Por<br/>agendar
                </p>
            )}
          </div>

          <div className="info-grid-3">
            <div>
               <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.4, marginBottom: '2px' }}>PACIENTE</p>
               <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>{patient.name}</p>
            </div>
            <div>
               <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.4, marginBottom: '2px' }}>C.I. / CÉDULA</p>
               <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>{patient.details?.ci || 'N/A'}</p>
            </div>
            <div>
               <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.4, marginBottom: '2px' }}>EDAD / SEXO</p>
               <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>{patient.details?.age} años / {patient.details?.gender === 'male' ? 'Masc' : 'Fem'}</p>
            </div>
          </div>

          <div className="info-grid-2">
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
          {/* PLAN DE MENÚ DINÁMICO SEGÚN PACIENTE EN 2 FILAS */}
          <div style={{ border: '2px solid var(--primary)', borderRadius: '12px', background: 'white', overflow: 'hidden', marginBottom: '25px', pageBreakInside: 'avoid' }}>
             <h3 style={{ margin: '0', background: 'var(--primary)', color: 'white', padding: '10px', fontSize: '0.85rem', fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' }}>PLAN DE MENÚ ESTIMADO</h3>
             <div className="table-responsive" style={{ paddingBottom: '10px' }}>
             <table style={{ borderCollapse: 'collapse' }}>
                <thead>
                   <tr style={{ background: 'var(--card-green-light)', color: 'var(--primary)' }}>
                      <th style={{ padding: '8px 5px', fontSize: '0.62rem', fontWeight: '900', border: '1px solid var(--primary)', width: '68px', textAlign: 'center' }}>
                         DÍA
                      </th>
                      {getMealTypes(targetDetails?.mealPlan).map(meal => (
                        <th key={meal.key} style={{ padding: '8px 4px', fontSize: '0.62rem', fontWeight: '900', border: '1px solid var(--primary)', textAlign: 'center' }}>
                           {meal.label}
                        </th>
                      ))}
                   </tr>
                </thead>
                <tbody>
                   {/* FILA DÍA 1 */}
                   <tr>
                      <td style={{ padding: '10px 5px', border: '1px solid var(--primary)', textAlign: 'center', background: 'rgba(29, 81, 45, 0.08)', fontWeight: '900', fontSize: '0.7rem', color: 'var(--primary)' }}>
                        ☀️ DÍA 1
                      </td>
                      {getMealTypes(targetDetails?.mealPlan).map(meal => {
                         const mealData = targetMenus?.day1?.[meal.key] || targetMenu?.[meal.key] || {};
                         const portions = mealData.portions || {};
                         const activeP = Object.entries(portions)
                           .filter(([_, val]) => parseFloat(val) > 0)
                           .map(([k, val]) => `${val} ${gNamesShort[k] || k}`)
                           .join(' | ');

                         return (
                            <td key={meal.key} style={{ padding: '8px 6px', border: '1px solid var(--primary)', verticalAlign: 'top', minHeight: '90px' }}>
                               {activeP && (
                                 <p style={{ margin: '0 0 4px 0', fontSize: '0.52rem', fontWeight: '850', color: 'var(--primary)', opacity: 0.8, background: 'rgba(29, 81, 45, 0.05)', padding: '2px', borderRadius: '4px', textAlign: 'center' }}>
                                   {activeP}
                                 </p>
                               )}
                               {mealData.selectedFoods?.length > 0 ? (
                                 <div style={{ fontSize: '0.6rem', color: '#111', lineHeight: '1.25' }}>
                                    {mealData.selectedFoods.map((f, idx) => (
                                      <div key={idx} style={{ marginBottom: '2.5px', borderLeft: `2.5px solid ${foodGroups[f.groupKey]?.color || '#333'}`, paddingLeft: '4.5px' }}>
                                        {f.qty && f.qty !== 1 ? `${f.qty.toString().replace('.0', '')}x ` : ''}{f.name}
                                      </div>
                                    ))}
                                 </div>
                               ) : (
                                 <div style={{ opacity: 0.15, fontSize: '0.5rem', textAlign: 'center', marginTop: '10px' }}>-</div>
                               )}
                            </td>
                         );
                      })}
                   </tr>

                   {/* FILA DÍA 2 */}
                   <tr>
                      <td style={{ padding: '10px 5px', border: '1px solid var(--primary)', textAlign: 'center', background: '#F9FBE7', fontWeight: '900', fontSize: '0.7rem', color: '#827717' }}>
                        🌙 DÍA 2
                      </td>
                      {getMealTypes(targetDetails?.mealPlan).map(meal => {
                         const mealData = targetMenus?.day2?.[meal.key] || {};
                         const portions = mealData.portions || {};
                         const activeP = Object.entries(portions)
                           .filter(([_, val]) => parseFloat(val) > 0)
                           .map(([k, val]) => `${val} ${gNamesShort[k] || k}`)
                           .join(' | ');

                         return (
                            <td key={meal.key} style={{ padding: '8px 6px', border: '1px solid var(--primary)', verticalAlign: 'top', minHeight: '90px' }}>
                               {activeP && (
                                 <p style={{ margin: '0 0 4px 0', fontSize: '0.52rem', fontWeight: '850', color: '#558B2F', opacity: 0.8, background: 'rgba(175, 180, 43, 0.08)', padding: '2px', borderRadius: '4px', textAlign: 'center' }}>
                                   {activeP}
                                 </p>
                               )}
                               {mealData.selectedFoods?.length > 0 ? (
                                 <div style={{ fontSize: '0.6rem', color: '#111', lineHeight: '1.25' }}>
                                    {mealData.selectedFoods.map((f, idx) => (
                                      <div key={idx} style={{ marginBottom: '2.5px', borderLeft: `2.5px solid ${foodGroups[f.groupKey]?.color || '#333'}`, paddingLeft: '4.5px' }}>
                                        {f.qty && f.qty !== 1 ? `${f.qty.toString().replace('.0', '')}x ` : ''}{f.name}
                                      </div>
                                    ))}
                                 </div>
                               ) : (
                                 <div style={{ opacity: 0.15, fontSize: '0.5rem', textAlign: 'center', marginTop: '10px' }}>-</div>
                               )}
                            </td>
                         );
                      })}
                   </tr>
                </tbody>
             </table>
             </div>
          </div>

          <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.8)', border: '1px dashed var(--accent)', padding: '12px', borderRadius: '8px', pageBreakInside: 'avoid' }}>
             <h4 style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--accent)', marginBottom: '6px', textTransform: 'uppercase' }}>Observaciones del Especialista</h4>
             <div style={{ fontSize: '0.75rem', lineHeight: '1.4', color: '#444' }}>
               {targetDetails?.notes || 'Seguir las indicaciones generales discutidas en consulta.'}
             </div>
          </div>

          <footer style={{ marginTop: '40px', textAlign: 'center', pageBreakInside: 'avoid', zIndex: 5, position: 'relative' }}>
             <div style={{ display: 'inline-block', borderTop: '1px solid #333', padding: '8px 50px' }}>
                <p style={{ margin: 0, fontWeight: '900', fontSize: '0.85rem' }}>Lic. en Nutrición y Dietética</p>
                <p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.6 }}>Registro Profesional / Matrícula</p>
             </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
