'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Activity, Scale, Ruler } from 'lucide-react';
import { getPatientById } from '@/lib/patients';
import { calculateClinicalData } from '@/utils/calculationUtils';

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-VE', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return d; }
}

function getProfileColor(p) {
  if (!p) return '#888';
  if (p.startsWith('OBESIDAD')) return '#DC2626';
  if (p === 'SOBREPESO') return '#D97706';
  if (p === 'BAJO PESO') return '#0284C7';
  if (p === 'NORMOPESO') return '#1D512D';
  return '#888';
}

function deltaColor(delta, lowerIsBetter = true) {
  if (delta === null || delta === undefined || isNaN(delta)) return '#888';
  if (delta === 0) return '#888';
  const good = lowerIsBetter ? delta < 0 : delta > 0;
  return good ? '#1D512D' : '#EF5350';
}

function deltaSign(delta) {
  if (delta > 0) return '▲';
  if (delta < 0) return '▼';
  return '—';
}

// Calcula %GC de US Navy desde las medidas de una entrada del historial
function calcGC(measurements, details, patientDetails) {
  const lm = measurements || {};
  const cintura = parseFloat(lm.CINTURA) || 0;
  const cuello  = parseFloat(lm.CUELLO)  || 0;
  const cadera  = parseFloat(lm.CADERA)  || 0;
  const h = parseFloat(details?.height || patientDetails?.height) || 0;
  const sexStr = (details?.gender || patientDetails?.gender || 'female').toLowerCase();
  const isMale = ['male','m','h','hombre','masculino'].includes(sexStr);
  if (cintura > 0 && cuello > 0 && h > 0) {
    let g = 0;
    if (isMale && (cintura - cuello) > 0) {
      const d = 1.0324 - 0.19077 * Math.log10(cintura - cuello) + 0.15456 * Math.log10(h);
      g = d > 0 ? (495 / d) - 450 : 0;
    } else if (!isMale && cadera > 0 && (cintura + cadera - cuello) > 0) {
      const d = 1.29579 - 0.35004 * Math.log10(cintura + cadera - cuello) + 0.22100 * Math.log10(h);
      g = d > 0 ? (495 / d) - 450 : 0;
    }
    return g > 0 ? parseFloat(g.toFixed(2)) : null;
  }
  return null;
}

// ── SVG Chart (puntos discretos, sin interpolar gaps) ────────────────────────

function LineChart({ data, color = '#1D512D', unit = '' }) {
  if (!data || data.length === 0) return <p style={{ fontSize: '0.75rem', opacity: 0.4, textAlign: 'center', padding: '12px 0' }}>Sin datos suficientes</p>;

  const W = 320, H = 100, PAD = { top: 10, right: 20, bottom: 24, left: 40 };
  const vals = data.map(d => d.value).filter(v => v !== null);
  if (vals.length === 0) return <p style={{ fontSize: '0.75rem', opacity: 0.4, textAlign: 'center' }}>Sin datos</p>;

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const toX = (i) => PAD.left + (i / (data.length - 1 || 1)) * (W - PAD.left - PAD.right);
  const toY = (v) => PAD.top + (1 - (v - min) / range) * (H - PAD.top - PAD.bottom);

  // Construir segmentos (solo conectar puntos consecutivos que no tienen null)
  const segments = [];
  let seg = [];
  data.forEach((d, i) => {
    if (d.value !== null) {
      seg.push({ x: toX(i), y: toY(d.value), v: d.value, label: d.label });
    } else {
      if (seg.length > 1) segments.push([...seg]);
      seg = [];
    }
  });
  if (seg.length > 1) segments.push(seg);

  const points = data.map((d, i) => d.value !== null ? { x: toX(i), y: toY(d.value), v: d.value, label: d.label } : null).filter(Boolean);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block', overflow: 'visible' }}>
      {/* Y axis labels */}
      <text x={PAD.left - 4} y={PAD.top + 4} textAnchor="end" fontSize="8" fill="#999">{max.toFixed(1)}</text>
      <text x={PAD.left - 4} y={H - PAD.bottom} textAnchor="end" fontSize="8" fill="#999">{min.toFixed(1)}</text>

      {/* Grid lines */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#eee" strokeWidth="1" />
      <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#eee" strokeWidth="1" />

      {/* Connected segments */}
      {segments.map((seg, si) => (
        <polyline
          key={si}
          points={seg.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}

      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={color} />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="8" fill={color} fontWeight="bold">{p.v}{unit}</text>
        </g>
      ))}

      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 2} textAnchor="middle" fontSize="7" fill="#bbb">{d.label}</text>
      ))}
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function HistoriaClinica() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [expandedEntry, setExpandedEntry] = useState(null);

  useEffect(() => {
    getPatientById(params.id).then(p => {
      setPatient(p);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando historia clínica...</div>;
  if (!patient) return <div style={{ padding: '40px', textAlign: 'center' }}>Paciente no encontrado.</div>;

  // Ordenar historial de más reciente a más antiguo
  const history = [...(patient.history || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (history.length === 0) {
    return (
      <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '20px' }}>
          <ArrowLeft size={18} /> Volver al expediente
        </button>
        <div style={{ background: 'rgba(29,81,45,0.04)', borderRadius: '20px', padding: '40px', textAlign: 'center', opacity: 0.6 }}>
          <Activity size={40} color="#1d512d" style={{ marginBottom: '12px' }} />
          <p style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--primary)' }}>Sin historial de consultas</p>
          <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Guarda una consulta desde el expediente o realiza una Consulta de Control para comenzar el historial evolutivo.</p>
        </div>
      </div>
    );
  }

  // Preparar datos para gráficos (orden cronológico)
  const chronological = [...history].reverse();

  const chartLabel = (d) => {
    try { return new Date(d.date + 'T12:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }); }
    catch { return d.date; }
  };

  const weightData  = chronological.map(d => ({ label: chartLabel(d), value: d.details?.weight ? parseFloat(d.details.weight) : null }));
  const imcData     = chronological.map(d => ({ label: chartLabel(d), value: d.imc ? parseFloat(d.imc) : null }));
  const gcData      = chronological.map(d => ({ label: chartLabel(d), value: calcGC(d.measurements, d.details, patient.details) }));
  const cinturaData = chronological.map(d => ({ label: chartLabel(d), value: d.measurements?.CINTURA ? parseFloat(d.measurements.CINTURA) : null }));
  const brazoData   = chronological.map(d => ({ label: chartLabel(d), value: d.measurements?.BRAZO ? parseFloat(d.measurements.BRAZO) : null }));

  // Comparación entre dos entradas
  const entryA = compareA !== null ? history[compareA] : null;
  const entryB = compareB !== null ? history[compareB] : null;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }} className="fade-in">

      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '20px' }}>
        <ArrowLeft size={18} /> Volver al expediente
      </button>

      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)', margin: 0 }}>
          Historia Clínica Evolutiva
        </h2>
        <p style={{ fontSize: '0.82rem', opacity: 0.6, marginTop: '4px' }}>
          {patient.name} · {history.length} {history.length === 1 ? 'consulta registrada' : 'consultas registradas'}
        </p>
      </header>

      {/* ── GRÁFICOS EVOLUTIVOS ── */}
      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: '900', opacity: 0.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>
          Evolución por indicador
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Peso (kg)', data: weightData, color: '#1D512D', unit: '' },
            { label: 'IMC', data: imcData, color: '#D97706', unit: '' },
            { label: '% Grasa Corporal', data: gcData, color: '#DC2626', unit: '%' },
            { label: 'Cintura (cm)', data: cinturaData, color: '#7C3AED', unit: '' },
            { label: 'Brazo (cm)', data: brazoData, color: '#0284C7', unit: '' },
          ].map(chart => (
            <div key={chart.label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '18px', padding: '16px' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: '900', opacity: 0.6, marginBottom: '10px', textTransform: 'uppercase' }}>{chart.label}</p>
              <LineChart data={chart.data} color={chart.color} unit={chart.unit} />
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARACIÓN ENTRE DOS CONSULTAS ── */}
      {history.length >= 2 && (
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: '900', opacity: 0.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>
            Comparar dos consultas
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[{ label: 'Consulta A', val: compareA, setter: setCompareA }, { label: 'Consulta B', val: compareB, setter: setCompareB }].map(sel => (
              <div key={sel.label}>
                <label style={{ fontSize: '0.7rem', fontWeight: '900', opacity: 0.6, display: 'block', marginBottom: '6px' }}>{sel.label}</label>
                <select
                  value={sel.val ?? ''}
                  onChange={e => sel.setter(e.target.value === '' ? null : Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid rgba(29,81,45,0.2)', fontSize: '0.82rem', fontWeight: '700', background: 'white', color: 'var(--text-primary)' }}
                >
                  <option value="">— Seleccionar —</option>
                  {history.map((h, i) => (
                    <option key={i} value={i}>{fmtDate(h.date)} · {h.details?.weight ? `${h.details.weight} kg` : ''} {h.profile ? `· ${h.profile}` : ''}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {entryA && entryB && (
            <div style={{ background: 'white', border: '1.5px solid rgba(29,81,45,0.15)', borderRadius: '20px', padding: '20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.07)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '900', color: 'var(--primary)', fontSize: '0.72rem' }}>Indicador</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '900', color: 'var(--primary)', fontSize: '0.72rem' }}>{fmtDate(entryA.date)}</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '900', color: 'var(--primary)', fontSize: '0.72rem' }}>{fmtDate(entryB.date)}</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '900', fontSize: '0.72rem' }}>Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Peso (kg)', a: entryA.details?.weight, b: entryB.details?.weight, lowerBetter: true },
                    { name: 'IMC', a: entryA.imc, b: entryB.imc, lowerBetter: true },
                    { name: '% Grasa', a: calcGC(entryA.measurements, entryA.details, patient.details), b: calcGC(entryB.measurements, entryB.details, patient.details), lowerBetter: true },
                    { name: 'Cintura (cm)', a: entryA.measurements?.CINTURA, b: entryB.measurements?.CINTURA, lowerBetter: true },
                    { name: 'Cadera (cm)', a: entryA.measurements?.CADERA, b: entryB.measurements?.CADERA, lowerBetter: false },
                    { name: 'Cuello (cm)', a: entryA.measurements?.CUELLO, b: entryB.measurements?.CUELLO, lowerBetter: false },
                    { name: 'Brazo (cm)', a: entryA.measurements?.BRAZO, b: entryB.measurements?.BRAZO, lowerBetter: false },
                    { name: 'Muslo (cm)', a: entryA.measurements?.MUSLO, b: entryB.measurements?.MUSLO, lowerBetter: false },
                  ].map(row => {
                    const va = row.a !== undefined && row.a !== null ? parseFloat(row.a) : null;
                    const vb = row.b !== undefined && row.b !== null ? parseFloat(row.b) : null;
                    const delta = (va !== null && vb !== null) ? va - vb : null;
                    return (
                      <tr key={row.name} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: '800' }}>{row.name}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{va !== null ? va : '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{vb !== null ? vb : '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '900', color: deltaColor(delta, row.lowerBetter) }}>
                          {delta !== null ? `${deltaSign(delta)} ${Math.abs(delta).toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: '2px solid rgba(0,0,0,0.07)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: '800' }}>Clasificación IMC</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '900', color: getProfileColor(entryA.profile) }}>{entryA.profile || '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '900', color: getProfileColor(entryB.profile) }}>{entryB.profile || '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '900', color: '#888' }}>
                      {entryA.profile === entryB.profile ? 'Sin cambio' : (entryA.profile && entryB.profile ? `${entryB.profile} → ${entryA.profile}` : '—')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── LÍNEA DE TIEMPO ── */}
      <section>
        <h3 style={{ fontSize: '0.75rem', fontWeight: '900', opacity: 0.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>
          Línea de tiempo clínica
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((entry, idx) => {
            const gc = calcGC(entry.measurements, entry.details, patient.details);
            const isExpanded = expandedEntry === idx;
            const prevEntry = history[idx + 1] || null;
            const prevWeight = prevEntry?.details?.weight ? parseFloat(prevEntry.details.weight) : null;
            const curWeight  = entry.details?.weight ? parseFloat(entry.details.weight) : null;
            const weightDelta = (curWeight !== null && prevWeight !== null) ? curWeight - prevWeight : null;

            return (
              <div key={entry.id || idx} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
                {/* Cabecera de la entrada */}
                <button
                  onClick={() => setExpandedEntry(isExpanded ? null : idx)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getProfileColor(entry.profile), flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontWeight: '900', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{fmtDate(entry.date)}</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.6, marginTop: '2px' }}>
                        {entry.profile || '—'}
                        {entry.details?.weight ? ` · ${entry.details.weight} kg` : ''}
                        {entry.imc ? ` · IMC ${parseFloat(entry.imc).toFixed(1)}` : ''}
                        {gc ? ` · GC ${gc}%` : ''}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {weightDelta !== null && (
                      <span style={{ fontSize: '0.78rem', fontWeight: '900', color: weightDelta <= 0 ? '#1d512d' : '#EF5350' }}>
                        {deltaSign(weightDelta)} {Math.abs(weightDelta).toFixed(1)} kg
                      </span>
                    )}
                    <span style={{ fontSize: '1rem', opacity: 0.4 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Detalle expandible */}
                {isExpanded && (
                  <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    {/* Medidas antropométricas */}
                    {entry.measurements && Object.keys(entry.measurements).filter(k => !k.startsWith('_')).length > 0 && (
                      <div style={{ marginTop: '14px' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Medidas antropométricas (profesional)</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                          {Object.entries(entry.measurements)
                            .filter(([k]) => !k.startsWith('_'))
                            .map(([k, v]) => (
                              <div key={k} style={{ background: 'rgba(29,81,45,0.04)', borderRadius: '10px', padding: '8px 10px', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.6, fontWeight: '800' }}>{k}</p>
                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: 'var(--primary)' }}>{v} cm</p>
                              </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Datos autorreportados */}
                    {entry.measurements?._selfReported && Object.keys(entry.measurements._selfReported).length > 0 && (
                      <div style={{ marginTop: '12px', background: 'rgba(0,0,255,0.03)', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(0,0,255,0.07)' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.5, marginBottom: '6px', textTransform: 'uppercase' }}>⚠️ Datos autorreportados por el paciente (pendientes de validación)</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {Object.entries(entry.measurements._selfReported).map(([k, v]) => (
                            <span key={k} style={{ fontSize: '0.75rem', background: 'white', borderRadius: '8px', padding: '4px 8px', border: '1px solid rgba(0,0,0,0.08)' }}>
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fórmula dietética */}
                    {entry.dietForm && (entry.dietForm.rct || entry.dietForm.pctProt) && (
                      <div style={{ marginTop: '12px' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Fórmula dietética</p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {entry.dietForm.rct && <span style={{ fontSize: '0.78rem', fontWeight: '800', background: 'rgba(29,81,45,0.06)', borderRadius: '8px', padding: '4px 10px' }}>RCT: {parseFloat(entry.dietForm.rct).toFixed(0)} kcal</span>}
                          {entry.dietForm.pctProt && <span style={{ fontSize: '0.78rem', fontWeight: '800', background: 'rgba(29,81,45,0.06)', borderRadius: '8px', padding: '4px 10px' }}>Prot: {entry.dietForm.pctProt}%</span>}
                          {entry.dietForm.pctCho && <span style={{ fontSize: '0.78rem', fontWeight: '800', background: 'rgba(29,81,45,0.06)', borderRadius: '8px', padding: '4px 10px' }}>CHO: {entry.dietForm.pctCho}%</span>}
                        </div>
                      </div>
                    )}

                    {/* Notas */}
                    {entry.notes && (
                      <div style={{ marginTop: '12px', background: '#FFFDF0', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.07)' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.5, marginBottom: '4px', textTransform: 'uppercase' }}>Notas de consulta</p>
                        <p style={{ fontSize: '0.82rem', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' }}>{entry.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
