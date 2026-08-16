'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import TabBar from '@/components/patient/TabBar';
import { TrendingUp, TrendingDown, Scale, Ruler } from 'lucide-react';
import { getPatientByEmail } from '@/lib/patients';

export default function PatientEvolution() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [metric, setMetric] = useState('weight'); // 'weight' o 'height' para percentiles, u otras medidas

  useEffect(() => {
    async function load() {
      if (!user?.email) return;
      const found = await getPatientByEmail(user.email);
      if (found) setPatient(found);
    }
    load();
  }, [user]);

  const history = patient?.history || [];
  const current = patient?.details || {};

  // Construir serie de datos para gráficos y tabla
  const all = [
    ...history.map(h => ({
      date: h.date,
      weight: parseFloat(h.details?.weight || 0),
      height: parseFloat(h.details?.height || 0),
      waist: parseFloat(h.details?.waist || 0),
      hip: parseFloat(h.details?.hip || 0),
      neck: parseFloat(h.details?.neck || 0),
      fat: parseFloat(h.details?.fat || 0),
      imc: parseFloat(h.imc || 0),
      age: parseFloat(h.details?.age || patient?.details?.age || 0),
    })),
    {
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(current.weight || 0),
      height: parseFloat(current.height || 0),
      waist: parseFloat(current.waist || 0),
      hip: parseFloat(current.hip || 0),
      neck: parseFloat(current.neck || 0),
      fat: parseFloat(current.fat || 0),
      imc: (() => {
        const w = parseFloat(current.weight);
        const h = parseFloat(current.height) / 100;
        return w && h ? parseFloat((w / (h * h)).toFixed(1)) : 0;
      })(),
      age: parseFloat(current.age || 0),
    }
  ].filter(e => e.weight > 0);

  const getMetricVal = (entry) => entry[metric] || 0;
  const activeSeries = all.map(e => ({ date: e.date, val: getMetricVal(e) })).filter(e => e.val > 0);
  
  const maxV = activeSeries.length ? Math.max(...activeSeries.map(e => e.val), 1) : 1;
  const minV = activeSeries.length ? Math.min(...activeSeries.map(e => e.val)) * 0.92 : 0;

  const firstVal = activeSeries[0]?.val || 0;
  const lastVal  = activeSeries[activeSeries.length - 1]?.val || 0;
  const diff = firstVal > 0 ? (lastVal - firstVal).toFixed(1) : null;

  const hasWaist = all.some(e => e.waist > 0);
  const hasHip = all.some(e => e.hip > 0);
  const hasNeck = all.some(e => e.neck > 0);
  const hasFat = all.some(e => e.fat > 0);

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }} className="fade-in">
      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)' }}>Mi Evolución</h2>
        <p style={{ opacity: 0.55, fontSize: '0.85rem' }}>Historial de pesos y medidas en cada control</p>
      </header>

      {/* Resumen rápido */}
      {diff !== null && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', background: parseFloat(diff) <= 0 ? 'var(--card-green)' : 'var(--card-red)', color: 'white', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {parseFloat(diff) <= 0 ? <TrendingDown size={28} /> : <TrendingUp size={28} />}
            <div>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Variación total desde el inicio ({metric})</p>
              <p style={{ fontSize: '2rem', fontWeight: '900', lineHeight: 1 }}>
                {parseFloat(diff) > 0 ? '+' : ''}{diff} {metric === 'fat' ? '%' : (metric === 'weight' ? 'kg' : 'cm')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico Genérico de Medidas */}
      {!current.isPediatric && activeSeries.length > 1 && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.5, letterSpacing: '1px' }}>CURVA DE EVOLUCIÓN</p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            {[{id: 'weight', label: 'Peso'}, {id: 'waist', label: 'Cintura', show: hasWaist}, {id: 'hip', label: 'Cadera', show: hasHip}, {id: 'neck', label: 'Cuello', show: hasNeck}, {id: 'fat', label: '% Grasa', show: hasFat}]
              .filter(m => m.show !== false)
              .map(m => (
                <button key={m.id} onClick={() => setMetric(m.id)} style={{
                  padding: '6px 12px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer',
                  background: metric === m.id ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
                  color: metric === m.id ? 'white' : '#666'
                }}>
                  {m.label}
                </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px', paddingBottom: '24px', position: 'relative', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
            {activeSeries.map((e, i) => {
              const h = Math.max(8, ((e.val - minV) / (maxV - minV)) * 80);
              const isLast = i === activeSeries.length - 1;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: '900', color: isLast ? 'var(--text-primary)' : '#888', marginBottom: '2px' }}>{e.val}</span>
                  <div style={{ width: '100%', height: `${h}px`, background: isLast ? 'var(--card-green)' : 'rgba(29,81,45,0.2)', borderRadius: '4px 4px 0 0', minHeight: '8px', transition: 'height 0.4s' }} />
                  <span style={{ position: 'absolute', bottom: '-20px', fontSize: '0.5rem', opacity: 0.5, whiteSpace: 'nowrap' }}>
                    {new Date(e.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gráfico de Percentiles de Crecimiento (Solo Pediátricos) */}
      {current.isPediatric && (
        <div className="glass-panel text-primary" style={{ padding: '20px', marginBottom: '20px', background: 'white', borderRadius: '24px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-primary)', opacity: 0.6, letterSpacing: '1px' }}>
              CRECIMIENTO PEDIÁTRICO (OMS)
            </p>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '2px', borderRadius: '8px' }}>
              <button 
                onClick={() => setMetric('weight')}
                style={{
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: metric === 'weight' ? 'white' : 'transparent',
                  color: metric === 'weight' ? 'var(--primary)' : '#666',
                  cursor: 'pointer'
                }}
              >
                Peso
              </button>
              <button 
                onClick={() => setMetric('height')}
                style={{
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: metric === 'height' ? 'white' : 'transparent',
                  color: metric === 'height' ? 'var(--primary)' : '#666',
                  cursor: 'pointer'
                }}
              >
                Estatura
              </button>
            </div>
          </div>

          {/* Gráfico SVG */}
          {(() => {
            const paddingLeft = 35;
            const paddingRight = 45;
            const paddingTop = 15;
            const paddingBottom = 25;
            const w = 310;
            const h = 200;
            const chartW = w - paddingLeft - paddingRight;
            const chartH = h - paddingTop - paddingBottom;

            const minAge = 2;
            const maxAge = 15;
            const minVal = metric === 'weight' ? 5 : 70;
            const maxVal = metric === 'weight' ? 75 : 180;

            const getX = (ageVal) => {
              const safeAge = Math.max(minAge, Math.min(maxAge, ageVal));
              return paddingLeft + ((safeAge - minAge) / (maxAge - minAge)) * chartW;
            };

            const getY = (val) => {
              const safeVal = Math.max(minVal, Math.min(maxVal, val));
              return paddingTop + (1 - (safeVal - minVal) / (maxVal - minVal)) * chartH;
            };

            const whoData = metric === 'weight' ? [
              { age: 2, p15: 10.5, p50: 12.2, p85: 14.1 },
              { age: 4, p15: 14.1, p50: 16.3, p85: 19.0 },
              { age: 6, p15: 18.0, p50: 20.6, p85: 24.2 },
              { age: 8, p15: 22.4, p50: 25.6, p85: 31.0 },
              { age: 10, p15: 27.8, p50: 32.2, p85: 41.5 },
              { age: 12, p15: 34.8, p50: 41.2, p85: 53.0 },
              { age: 14, p15: 43.1, p50: 51.5, p85: 64.0 },
              { age: 15, p15: 47.0, p50: 56.0, p85: 69.0 },
            ] : [
              { age: 2, p15: 83, p50: 87, p85: 91 },
              { age: 4, p15: 98, p50: 102, p85: 107 },
              { age: 6, p15: 111, p50: 116, p85: 121 },
              { age: 8, p15: 122, p50: 127, p85: 133 },
              { age: 10, p15: 132, p50: 138, p85: 144 },
              { age: 12, p15: 143, p50: 149, p85: 156 },
              { age: 14, p15: 155, p50: 162, p85: 169 },
              { age: 15, p15: 160, p50: 167, p85: 174 },
            ];

            const gridLines = metric === 'weight' ? [15, 30, 45, 60] : [90, 110, 130, 150, 170];

            // Puntos del paciente actual
            const patientPoints = all.map(entry => ({
              age: entry.age || parseFloat(patient?.details?.age) || 8,
              val: metric === 'weight' ? entry.weight : entry.height
            })).sort((a,b) => a.age - b.age);

            const p15Path = whoData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.age)} ${getY(d.p15)}`).join(' ');
            const p50Path = whoData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.age)} ${getY(d.p50)}`).join(' ');
            const p85Path = whoData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.age)} ${getY(d.p85)}`).join(' ');
            const patientPath = patientPoints.length > 0 ? patientPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.age)} ${getY(d.val)}`).join(' ') : '';

            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
                  {gridLines.map(gl => (
                    <g key={gl}>
                      <line x1={paddingLeft} y1={getY(gl)} x2={w - paddingRight} y2={getY(gl)} stroke="#f0f0f0" strokeDasharray="3" />
                      <text x={paddingLeft - 6} y={getY(gl) + 3} fontSize="8" opacity="0.4" textAnchor="end">{gl}{metric === 'weight' ? 'kg' : 'cm'}</text>
                    </g>
                  ))}
                  {[2, 4, 6, 8, 10, 12, 14, 15].map(a => (
                    <text key={a} x={getX(a)} y={h - 10} fontSize="8" opacity="0.4" textAnchor="middle">{a}a</text>
                  ))}
                  <text x={paddingLeft + chartW / 2} y={h} fontSize="8" opacity="0.5" textAnchor="middle" fontWeight="bold">Edad del Paciente (Años)</text>

                  <path d={p15Path} fill="none" stroke="#FF8A65" strokeWidth="1.5" strokeDasharray="2 2" />
                  <path d={p50Path} fill="none" stroke="#81C784" strokeWidth="2" />
                  <path d={p85Path} fill="none" stroke="#E57373" strokeWidth="1.5" strokeDasharray="2 2" />

                  <text x={getX(15) + 4} y={getY(whoData[whoData.length - 1].p15) + 3} fontSize="7" fill="#FF8A65" fontWeight="bold">p15</text>
                  <text x={getX(15) + 4} y={getY(whoData[whoData.length - 1].p50) + 3} fontSize="7" fill="#81C784" fontWeight="bold">p50 (Med)</text>
                  <text x={getX(15) + 4} y={getY(whoData[whoData.length - 1].p85) + 3} fontSize="7" fill="#E57373" fontWeight="bold">p85</text>

                  {patientPath && <path d={patientPath} fill="none" stroke="var(--primary)" strokeWidth="2.5" />}
                  {patientPoints.map((pt, idx) => (
                    <circle key={idx} cx={getX(pt.age)} cy={getY(pt.val)} r="4" fill="var(--primary)" stroke="white" strokeWidth="1.5" />
                  ))}
                </svg>
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px', fontSize: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '3px', background: '#81C784' }} />
                    <span>Mediana OMS (p50)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '3px', background: 'var(--primary)' }} />
                    <span>Tus datos</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tabla de historial */}
      <div className="glass-panel" style={{ background: 'white', overflow: 'hidden' }}>
        <div style={{ background: 'var(--card-green)', padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Scale size={18} color="white" />
          <p style={{ fontWeight: '900', color: 'white', fontSize: '0.9rem', margin: 0 }}>HISTORIAL DE CONTROLES</p>
        </div>

        {all.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(29,81,45,0.05)' }}>
                  {['Fecha', 'Peso', 'Cintura', 'Cadera', 'Cuello', '% Grasa', 'IMC'].map(h => (
                    <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: '0.65rem', fontWeight: '900', opacity: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...all].reverse().map((e, i) => {
                  const isFirst = i === 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: isFirst ? 'rgba(29,81,45,0.04)' : 'white' }}>
                      <td style={{ padding: '12px 8px', fontWeight: isFirst ? '900' : '700', color: isFirst ? 'var(--text-primary)' : '#333', whiteSpace: 'nowrap' }}>
                        {new Date(e.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: '900' }}>{e.weight}</td>
                      <td style={{ padding: '12px 8px' }}>{e.waist || '--'}</td>
                      <td style={{ padding: '12px 8px' }}>{e.hip || '--'}</td>
                      <td style={{ padding: '12px 8px' }}>{e.neck || '--'}</td>
                      <td style={{ padding: '12px 8px' }}>{e.fat || '--'}</td>
                      <td style={{ padding: '12px 8px', fontWeight: '700' }}>{e.imc || '--'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>
            <Ruler size={36} style={{ marginBottom: '10px', margin: '0 auto' }} />
            <p style={{ fontWeight: '700' }}>Aún no hay controles registrados.</p>
            <p style={{ fontSize: '0.8rem' }}>Los datos aparecerán aquí después de cada consulta.</p>
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
}
