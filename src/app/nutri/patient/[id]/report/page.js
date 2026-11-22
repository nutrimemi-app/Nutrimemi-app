'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Save } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { calculateClinicalData } from '@/utils/calculationUtils';
import { usePatient } from '@/hooks/usePatient';
import { getMealTypes } from '@/utils/mealUtils';

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

  const gNamesShort = {
    cereales: 'Cer', proteinas: 'Prot', vegetales: 'Veg',
    frutas: 'Frut', lacteos: 'Lác', grasas: 'Gras'
  };
  const foodGroupColors = {
    cereales: '#FFA500', proteinas: '#FF0000', vegetales: '#228B22',
    frutas: '#BA55D3', lacteos: '#1E90FF', grasas: '#FFD700'
  };

  const appointments = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('nutri_appointments') || '[]') : [];
  const nextApp = snapshot ? { date: snapshot.nextAppDate } : appointments
    .filter(a => a.patientId == patient.id && new Date(a.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const handlePrint = () => window.print();

  const handleSaveReport = async () => {
    showConfirm(
      "Guardar Informe",
      "¿Deseas guardar una copia inmutable de este informe?",
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
          const { addReport } = await import('@/lib/patients');
          await addReport(patient.id, newReport).catch(() => {
            const localReports = JSON.parse(localStorage.getItem(`patient_reports_${patient.id}`) || '[]');
            localReports.push(newReport);
            localStorage.setItem(`patient_reports_${patient.id}`, JSON.stringify(localReports));
          });
          showToast('Informe guardado en el expediente.', 'success');
        } catch (error) {
          showToast('Error guardando el informe.', 'error');
        }
      }
    );
  };

  const mealTypes = getMealTypes(targetDetails?.mealPlan);
  const hasHistory = patient.history?.length > 0;
  const measurements = Object.entries(patient.measurements || {}).slice(0, 8);

  return (
    <div className="report-root">
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── VARIABLES ── */
        :root { --green: #1D512D; --accent: #fd9e14; }

        /* ── BASE ── */
        .report-root {
          background: #e8e8e8;
          min-height: 100vh;
          padding: 30px 0 120px;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        }

        /* ── ACTIONS BAR ── */
        .report-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          padding: 0 16px;
        }
        .report-actions button {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 22px; border-radius: 10px;
          font-weight: 800; cursor: pointer; font-size: 0.85rem;
        }
        .btn-back  { border: 2px solid #ccc; background: white; color: #333; }
        .btn-save  { border: none; background: var(--green); color: white; }
        .btn-print { border: none; background: var(--green); color: white; }

        /* ── PAGE WRAPPER ── */
        .page-wrap {
          width: 100%;
          max-width: 780px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.18);
          overflow: hidden;
          position: relative;
          background-image: url('/Membrete_Mesa%20de%20trabajo%201.png');
          background-size: contain;
          background-repeat: repeat-y;
          background-position: top center;
        }

        /* ── REPORT BODY ── */
        .report-body {
          padding: 185px 28px 30px;
          position: relative;
          z-index: 1;
        }

        /* ── CITA WIDGET ── */
        .cita-widget {
          position: absolute;
          top: 28px; right: 28px;
          width: 88px; height: 80px;
          background: white;
          border: 2px solid var(--accent);
          border-radius: 14px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          z-index: 10;
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        }
        .cita-widget .cita-label { font-size: 0.55rem; font-weight: 800; color: #555; margin: 0; }
        .cita-widget .cita-day   { font-size: 1.6rem; font-weight: 900; color: var(--green); line-height: 1; margin: 0; }
        .cita-widget .cita-month { font-size: 0.55rem; font-weight: 800; color: #555; text-transform: uppercase; margin: 0; }
        .cita-widget .cita-pend  { font-size: 0.75rem; font-weight: 900; opacity: 0.55; line-height: 1.2; margin: 6px 0 0; }

        /* ── SECTION TITLE ── */
        .sec-title {
          font-size: 0.62rem; font-weight: 900; letter-spacing: 1px;
          text-transform: uppercase; opacity: 0.45;
          border-bottom: 1px solid rgba(0,0,0,0.1);
          padding-bottom: 4px; margin-bottom: 8px;
        }

        /* ── INFO GRID 3 ── */
        .info3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          background: rgba(29,81,45,0.04);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 10px;
        }
        .info3 .lbl { font-size: 0.55rem; font-weight: 800; opacity: 0.4; margin: 0; }
        .info3 .val { font-size: 0.82rem; font-weight: 700; margin: 2px 0 0; }

        /* ── INFO GRID 2 ── */
        .info2 {
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 8px;
          margin-bottom: 10px;
        }
        .info-card {
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 8px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.8);
        }

        /* ── IMC ROW ── */
        .imc-row { display: flex; align-items: center; gap: 16px; }
        .imc-big  { font-size: 1.8rem; font-weight: 900; color: var(--green); margin: 0; line-height: 1; }
        .imc-sub  { font-size: 0.52rem; font-weight: 800; opacity: 0.5; margin: 0; }
        .imc-profile { font-size: 0.95rem; font-weight: 900; margin: 0 0 3px; }
        .imc-detail  { font-size: 0.65rem; color: #666; margin: 0; }

        /* ── MEDIDAS GRID ── */
        .medidas-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
          margin-bottom: 8px;
        }
        .medida-cell {
          text-align: center;
          border: 1px solid rgba(0,0,0,0.04);
          border-radius: 4px;
          padding: 5px 2px;
          background: rgba(255,255,255,0.7);
        }
        .medida-cell .m-lbl { font-size: 0.48rem; font-weight: 800; opacity: 0.4; margin: 0; }
        .medida-cell .m-val { font-size: 0.72rem; font-weight: 700; margin: 1px 0 0; }

        /* ── EVOLUTION DIFF ── */
        .evo-diff {
          display: flex; gap: 6px; flex-wrap: wrap;
          margin-top: 6px;
        }
        .evo-diff span {
          font-size: 0.58rem; font-weight: 700;
          border: 1px solid rgba(0,0,0,0.06);
          padding: 2px 6px; border-radius: 4px;
        }

        /* ── MENU TABLE ── */
        .menu-wrap {
          border: 2px solid var(--green);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .menu-title {
          background: var(--green); color: white;
          padding: 7px; font-size: 0.72rem; font-weight: 900;
          text-align: center; text-transform: uppercase;
          margin: 0;
        }
        .menu-table {
          width: 100%; border-collapse: collapse;
          table-layout: fixed; font-size: 0.58rem;
        }
        .menu-table th {
          padding: 5px 3px; font-size: 0.58rem; font-weight: 900;
          border: 1px solid var(--green);
          background: rgba(29,81,45,0.07);
          color: var(--green); text-align: center;
        }
        .menu-table td {
          padding: 5px 4px; border: 1px solid var(--green);
          vertical-align: top; font-size: 0.58rem; line-height: 1.3;
        }
        .dia-cell {
          text-align: center; font-weight: 900; font-size: 0.65rem;
          width: 52px;
        }
        .meal-food { margin-bottom: 2px; padding-left: 5px; }

        /* ── OBSERVACIONES ── */
        .obs-box {
          border: 1px dashed var(--accent);
          border-radius: 8px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.85);
          margin-bottom: 10px;
        }
        .obs-title { font-size: 0.6rem; font-weight: 900; color: var(--accent); text-transform: uppercase; margin: 0 0 5px; }
        .obs-text  { font-size: 0.72rem; line-height: 1.45; color: #444; margin: 0; }

        /* ── FOOTER ── */
        .report-footer {
          margin-top: 20px; text-align: center;
          border-top: 1px solid rgba(0,0,0,0.1); padding-top: 12px;
        }
        .report-footer p { margin: 0; }
        .report-footer .foot-name { font-size: 0.82rem; font-weight: 900; }
        .report-footer .foot-reg  { font-size: 0.6rem; opacity: 0.5; }

        /* ══════════════════════════════════════
           ESTILOS DE IMPRESIÓN
           ══════════════════════════════════════ */
        @media print {
          /* Ocultar UI del navegador y controles */
          .report-actions, nav, footer:not(.report-footer),
          .tab-bar, #tab-bar, .no-print { display: none !important; }

          @page {
            size: letter portrait;
            margin: 0;
          }

          /* El membrete PNG ya está en background-image en .page-wrap,
             se repite en cada página automáticamente con repeat-y */
          body {
            margin: 0 !important; padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .report-root {
            background: white !important;
            padding: 0 !important;
          }

          /* ── PAGE WRAP en impresión ── */
          .page-wrap {
            width: 215.9mm !important;
            max-width: 215.9mm !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            /* El background-image con repeat-y actúa como membrete en cada hoja */
            background-size: 215.9mm auto !important;
            background-repeat: repeat-y !important;
          }

          /* ── BODY PADDING para dejar espacio al membrete (≈3.3cm) ── */
          .report-body {
            /* padding-top = alto del membrete en impresión */
            padding: 3.2cm 0.75cm 1cm 0.75cm !important;
          }

          /* Widget de cita */
          .cita-widget {
            top: 20px !important; right: 30px !important;
            width: 78px !important; height: 72px !important;
          }
          .cita-widget .cita-day { font-size: 1.3rem !important; }

          /* Texto compacto general */
          .info3 .val, .imc-profile { font-size: 0.75rem !important; }
          .imc-big { font-size: 1.5rem !important; }
          .info-card { padding: 7px 10px !important; }
          .info3 { padding: 7px 10px !important; margin-bottom: 7px !important; }
          .info2 { gap: 6px !important; margin-bottom: 7px !important; }

          /* Medidas compactas */
          .medidas-grid { gap: 3px !important; margin-bottom: 6px !important; }
          .medida-cell  { padding: 3px 2px !important; }
          .medida-cell .m-val { font-size: 0.65rem !important; }
          
          .sec-title { margin-bottom: 5px !important; }

          /* Tabla de Menú compacta */
          .menu-wrap   { margin-bottom: 8px !important; }
          .menu-title  { padding: 5px !important; font-size: 0.65rem !important; }
          .menu-table, .menu-table th, .menu-table td { font-size: 0.52rem !important; }
          .menu-table th { padding: 4px 2px !important; }
          .menu-table td { padding: 4px 3px !important; }
          .dia-cell { font-size: 0.58rem !important; width: 44px !important; }

          /* Observaciones compactas */
          .obs-box  { padding: 7px 10px !important; margin-bottom: 8px !important; }
          .obs-text { font-size: 0.65rem !important; }

          /* Footer */
          .report-footer { margin-top: 14px !important; padding-top: 8px !important; }
          .report-footer .foot-name { font-size: 0.75rem !important; }

          /* Diferencias de evolución */
          .evo-diff span { font-size: 0.54rem !important; }

          /* No cortar celdas de tabla a mitad */
          .menu-wrap, .obs-box, .report-footer { page-break-inside: avoid; }
        }
      `}} />

      {/* ── BOTONES NO IMPRIMIBLES ── */}
      <div className="report-actions">
        <button className="btn-back" onClick={() => router.push(`/nutri/patient/${patient.id}`)}>
          <ArrowLeft size={18} /> Volver
        </button>
        {!snapshot && (
          <button className="btn-save" onClick={handleSaveReport}>
            <Save size={18} /> Guardar
          </button>
        )}
        <button className="btn-print" onClick={handlePrint}>
          <Printer size={18} /> Imprimir
        </button>
      </div>

      {/* ── HOJA / PAGE WRAP ── */}
      <div className="page-wrap">
        <div className="report-body">

          {/* Widget próxima cita */}
          <div className="cita-widget">
            <p className="cita-label">Próxima cita</p>
            {nextApp?.date ? (
              <>
                <p className="cita-day">{nextApp.date.split('-')[2]}</p>
                <p className="cita-month">
                  {new Date(nextApp.date + 'T00:00:00').toLocaleString('es-ES', { month: 'short' })} {nextApp.date.split('-')[0]}
                </p>
              </>
            ) : (
              <p className="cita-pend">Por<br/>agendar</p>
            )}
          </div>

          {/* ── 1. DATOS DEL PACIENTE ── */}
          <div className="info3">
            <div>
              <p className="lbl">PACIENTE</p>
              <p className="val">{patient.name}</p>
            </div>
            <div>
              <p className="lbl">C.I. / CÉDULA</p>
              <p className="val">{targetDetails?.ci || 'N/A'}</p>
            </div>
            <div>
              <p className="lbl">EDAD / SEXO</p>
              <p className="val">{targetDetails?.age ? `${targetDetails.age} años` : '—'} / {targetDetails?.gender === 'male' ? 'Masc' : 'Fem'}</p>
            </div>
          </div>

          {/* ── 2. ESTADO NUTRICIONAL + PATOLOGÍAS ── */}
          <div className="info2">
            <div className="info-card">
              <p className="sec-title">Estado Nutricional Actual</p>
              <div className="imc-row">
                <div style={{ textAlign: 'center' }}>
                  <p className="imc-big">{clinical.imc}</p>
                  <p className="imc-sub">IMC REAL</p>
                </div>
                <div>
                  <p className="imc-profile">{clinical.profile}</p>
                  <p className="imc-detail">Peso: {targetDetails?.weight} kg | Ideal: {clinical.pi} kg</p>
                  {targetDetails?.height && (
                    <p className="imc-detail">Talla: {targetDetails.height} cm</p>
                  )}
                </div>
              </div>
            </div>
            <div className="info-card">
              <p className="sec-title">Patologías / Tags</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {targetDetails?.tags?.length
                  ? targetDetails.tags.map(tag => (
                    <span key={tag} style={{ border: '1px solid #333', padding: '2px 6px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: '700' }}>{tag}</span>
                  ))
                  : <span style={{ opacity: 0.4, fontSize: '0.68rem' }}>Ninguna registrada</span>
                }
              </div>
            </div>
          </div>

          {/* ── 3. MEDIDAS CORPORALES ── */}
          {measurements.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <p className="sec-title">Medidas Corporales (cm)</p>
              <div className="medidas-grid">
                {measurements.map(([key, val]) => (
                  <div key={key} className="medida-cell">
                    <p className="m-lbl">{key}</p>
                    <p className="m-val">{val || '--'}</p>
                  </div>
                ))}
              </div>

              {/* Diferencias vs primer historial */}
              {hasHistory && (
                <div className="evo-diff">
                  <span style={{ opacity: 0.45, fontWeight: '800', fontSize: '0.52rem', alignSelf: 'center' }}>Δ vs. 1ª cita:</span>
                  {measurements.map(([key, val]) => {
                    const firstVal = patient.history[0].measurements?.[key];
                    if (!firstVal) return null;
                    const diff = parseFloat(val) - parseFloat(firstVal);
                    if (isNaN(diff) || diff === 0) return null;
                    return (
                      <span key={key} style={{ color: diff < 0 ? 'var(--green)' : '#cc0000' }}>
                        {key}: {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 4. GRÁFICO DE EVOLUCIÓN DE PESO (mini, solo si hay historial) ── */}
          {hasHistory && (() => {
            const entries = [...patient.history, {
              date: new Date().toISOString().split('T')[0],
              details: { weight: patient.details.weight }
            }];
            const weights = entries.map(e => parseFloat(e.details?.weight) || 0);
            const maxW = Math.max(...weights);
            const minW = Math.min(...weights) * 0.9;
            return (
              <div style={{ marginBottom: '10px', background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(29,81,45,0.2)', borderRadius: '8px', padding: '8px 10px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.6rem', fontWeight: '900', color: 'var(--green)', textTransform: 'uppercase', opacity: 0.7 }}>Evolución — Peso Corporal</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '55px', paddingBottom: '4px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  {entries.map((entry, i) => {
                    const val = parseFloat(entry.details?.weight) || 0;
                    const pct = Math.max(8, ((val - minW) / (maxW - minW || 1)) * 100);
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: '900', marginBottom: '3px', color: '#333' }}>{val}kg</span>
                        <div style={{ width: '100%', height: `${pct}%`, background: i === entries.length - 1 ? 'var(--green)' : 'rgba(29,81,45,0.25)', borderRadius: '3px 3px 0 0', minHeight: '5px' }} />
                        <span style={{ fontSize: '0.44rem', opacity: 0.55, marginTop: '3px', whiteSpace: 'nowrap' }}>
                          {new Date(entry.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── 5. PLAN DE MENÚ ── */}
          <div className="menu-wrap">
            <p className="menu-title">Plan de Menú Estimado</p>
            <div style={{ overflowX: 'auto' }}>
              <table className="menu-table">
                <thead>
                  <tr>
                    <th style={{ width: '52px' }}>DÍA</th>
                    {mealTypes.map(m => (
                      <th key={m.key}>{m.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '☀️ Día 1', key: 'day1', bg: 'rgba(29,81,45,0.06)', color: 'var(--green)' },
                    { label: '🌙 Día 2', key: 'day2', bg: 'rgba(250,230,70,0.1)', color: '#827717' }
                  ].map(({ label, key, bg, color }) => (
                    <tr key={key}>
                      <td className="dia-cell" style={{ background: bg, color }}>{label}</td>
                      {mealTypes.map(meal => {
                        const mealData = (key === 'day1'
                          ? (targetMenus?.day1?.[meal.key] || targetMenu?.[meal.key])
                          : targetMenus?.[key]?.[meal.key]) || {};
                        const portions = mealData.portions || {};
                        const activeP = Object.entries(portions)
                          .filter(([_, v]) => parseFloat(v) > 0)
                          .map(([k, v]) => `${v} ${gNamesShort[k] || k}`)
                          .join(' | ');
                        return (
                          <td key={meal.key}>
                            {activeP && (
                              <div style={{ color, fontWeight: '850', background: bg, borderRadius: '3px', padding: '1px 2px', marginBottom: '2px', textAlign: 'center', fontSize: '0.5rem' }}>
                                {activeP}
                              </div>
                            )}
                            {mealData.selectedFoods?.length > 0
                              ? mealData.selectedFoods.map((f, idx) => (
                                <div key={idx} className="meal-food" style={{ borderLeft: `2px solid ${foodGroupColors[f.groupKey] || '#999'}` }}>
                                  {f.qty && f.qty !== 1 ? `${f.qty.toString().replace('.0', '')}x ` : ''}{f.name}
                                </div>
                              ))
                              : <div style={{ opacity: 0.15, textAlign: 'center' }}>—</div>
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 6. OBSERVACIONES ── */}
          <div className="obs-box">
            <p className="obs-title">Observaciones del Especialista</p>
            <p className="obs-text">{targetDetails?.notes || 'Seguir las indicaciones generales discutidas en consulta.'}</p>
          </div>

          {/* ── 7. FIRMA ── */}
          <footer className="report-footer">
            <div style={{ display: 'inline-block', borderTop: '1px solid #333', padding: '6px 50px' }}>
              <p className="foot-name">Lic. en Nutrición y Dietética</p>
              <p className="foot-reg">Registro Profesional / Matrícula</p>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}
