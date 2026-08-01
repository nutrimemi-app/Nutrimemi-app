'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft, ChefHat, CheckCircle } from 'lucide-react';
import { useUI } from '@/context/UIContext';

const FOOD_GROUPS = [
  { key: 'cereales',  name: 'CEREALES',  color: '#E07B00', bg: '#FFF3E0', dot: '#FFA500' },
  { key: 'proteinas', name: 'PROTEÍNAS', color: '#B71C1C', bg: '#FFEBEE', dot: '#EF5350' },
  { key: 'vegetales', name: 'VEGETALES', color: '#1B5E20', bg: '#E8F5E9', dot: '#43A047' },
  { key: 'frutas',    name: 'FRUTAS',    color: '#6A1B9A', bg: '#F3E5F5', dot: '#AB47BC' },
  { key: 'lacteos',   name: 'LÁCTEOS',   color: '#0D47A1', bg: '#E3F2FD', dot: '#42A5F5' },
  { key: 'grasas',    name: 'GRASAS',    color: '#827717', bg: '#FFFDE7', dot: '#D4AC0D' },
];

const EXCHANGE_EXAMPLES = {
  cereales:  '1 RACIÓN = 1/3 taza arroz / pasta; tortilla = ½ taza; pan = 1 rebana.',
  proteinas: '1 RACIÓN = 30 g (1 oz) pollo / carne / pescado; o 1 huevo.',
  vegetales: '1 RACIÓN = 1 taza crudo o ½ taza cocido. Todos los que desees.',
  frutas:    '1 RACIÓN = 1 unidad pequeña o ½ taza picada / ½ cambur grande.',
  lacteos:   '1 RACIÓN = 1 taza leche; yogurt griego = ¾ taza; quesillo = 100 g.',
  grasas:    '1 RACIÓN = 1 cda aceite / 30 g aguacate / 6 almendras.',
};

const MEAL_ORDER = [
  { key: 'desayuno',    label: 'DESAYUNO' },
  { key: 'meriendaAM', label: 'MERIENDA AM' },
  { key: 'almuerzo',   label: 'ALMUERZO' },
  { key: 'meriendaPM', label: 'MERIENDA PM' },
  { key: 'cena',       label: 'CENA' },
  { key: 'snackNoche', label: 'SNACK NOCHE' },
];

export default function MenuCard() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();

  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const found = saved.find(p => p.id === parseInt(params.id));
    if (found) setPatient(found);
  }, [params.id]);

  if (!patient) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>
      Cargando menú...
    </div>
  );

  const menu = patient.menu || {};
  const mealsWithData = MEAL_ORDER.filter(m => {
    const d = menu[m.key];
    if (!d) return false;
    const hasFoods = d.selectedFoods?.length > 0;
    const hasPortions = Object.values(d.portions || {}).some(v => parseFloat(v) > 0);
    return hasFoods || hasPortions;
  });

  /* ——— Tabla de intercambio global (suma por grupo) ——— */
  const globalPortions = {};
  FOOD_GROUPS.forEach(g => {
    globalPortions[g.key] = 0;
    Object.values(menu).forEach(m => {
      globalPortions[g.key] += parseFloat(m?.portions?.[g.key] || 0);
    });
  });

  const KCAL = { cereales: 70, proteinas: 55, vegetales: 25, frutas: 60, lacteos: 120, grasas: 45 };
  const MACRO = {
    cereales:  { prot: 2,  fat: 0,  cho: 15 },
    proteinas: { prot: 7,  fat: 3,  cho: 0  },
    vegetales: { prot: 2,  fat: 0,  cho: 5  },
    frutas:    { prot: 0,  fat: 0,  cho: 15 },
    lacteos:   { prot: 8,  fat: 5,  cho: 12 },
    grasas:    { prot: 0,  fat: 5,  cho: 0  },
  };

  let totalKcal = 0, totalProt = 0, totalCho = 0, totalFat = 0;
  FOOD_GROUPS.forEach(g => {
    const n = globalPortions[g.key];
    totalKcal += n * KCAL[g.key];
    totalProt += n * MACRO[g.key].prot;
    totalCho  += n * MACRO[g.key].cho;
    totalFat  += n * MACRO[g.key].fat;
  });

  return (
    <div className="menu-card-root">
      {/* ── Estilos de impresión ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .menu-card-root { font-family: 'Belinda','Outfit','Inter',sans-serif; background: var(--bg-primary); min-height:100vh; }
        .no-print { }
        @media print {
          .no-print { display:none !important; }
          body { background: white !important; margin:0 !important; padding:0 !important; }
          .menu-card-root { background: white !important; padding: 0 !important; }
          .card-shell {
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          .page-break { page-break-before: always; }
          @page { size: A4 portrait; margin: 1cm; }
        }
        .badge { display:inline-flex; align-items:center; gap:5px; font-size:0.8rem; font-weight:900; padding:3px 10px; border-radius:20px; }
      ` }} />

      {/* ── Barra de acciones (no imprime) ── */}
      <div className="no-print" style={{
        position:'sticky', top:0, zIndex:9999,
        background:'rgba(246,244,223,0.95)', backdropFilter:'blur(12px)',
        borderBottom:'1px solid rgba(0,0,0,0.08)',
        padding:'12px 20px', display:'flex', gap:'12px', alignItems:'center'
      }}>
        <button
          onClick={() => router.back()}
          style={{ background:'none', border:'none', color:'var(--text-primary)', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontWeight:'700', fontSize:'0.9rem' }}
        >
          <ArrowLeft size={20} /> Volver
        </button>
        <div style={{ flex:1, textAlign:'center', fontWeight:'900', fontSize:'1rem', color:'var(--text-primary)' }}>
          Carta de Menú — {patient.name}
        </div>
        <button
          onClick={() => window.print()}
          style={{ background:'var(--action)', color:'white', border:'none', borderRadius:'12px', padding:'10px 20px', fontWeight:'900', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontSize:'0.9rem', boxShadow:'0 4px 12px rgba(253,158,20,0.3)' }}
        >
          <Printer size={18} /> Imprimir / PDF
        </button>
      </div>

      {/* ══════════════════════════════════════
              CARTA DE MENÚ — VISUAL CARD
         ══════════════════════════════════════ */}
      <div style={{ maxWidth:'500px', margin:'0 auto', padding:'20px 16px 100px' }}>

        {/* ── Header de la carta ── */}
        <div className="card-shell" style={{
          background:'var(--card-green)', color:'white',
          borderRadius:'24px', padding:'24px', marginBottom:'16px',
          textAlign:'center', boxShadow:'0 8px 24px rgba(29,81,45,0.25)'
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'8px' }}>
            <ChefHat size={28} />
            <h1 style={{ fontSize:'1.8rem', fontWeight:'900', margin:0 }}>Menú</h1>
          </div>
          <p style={{ opacity:0.8, fontSize:'0.9rem', margin:0 }}>{patient.name}</p>
          <p style={{ opacity:0.6, fontSize:'0.75rem', margin:'4px 0 0' }}>
            Plan generado por Nutrimemi · {new Date().toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>

        {/* ── Tabla lista de intercambio ── */}
        <div className="card-shell" style={{
          background:'white', borderRadius:'20px', padding:'16px', marginBottom:'16px',
          boxShadow:'0 4px 16px rgba(0,0,0,0.07)', border:'1px solid rgba(0,0,0,0.06)'
        }}>
          <p style={{ fontSize:'0.65rem', fontWeight:'900', opacity:0.5, marginBottom:'10px', letterSpacing:'1px' }}>LISTA DE INTERCAMBIO — TOTALES DEL DÍA</p>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.8rem' }}>
            <thead>
              <tr style={{ background:'var(--text-primary)', color:'white' }}>
                {['GRUPO','N°','PROT (g)','LIP (g)','CHO (g)','KCAL'].map(h => (
                  <th key={h} style={{ padding:'6px 4px', fontWeight:'900', fontSize:'0.65rem', textAlign:'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FOOD_GROUPS.map((g, i) => {
                const n = globalPortions[g.key];
                if (n === 0) return null;
                return (
                  <tr key={g.key} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={{ padding:'6px 4px', fontWeight:'800', color: g.color, borderLeft:`4px solid ${g.dot}`, paddingLeft:'8px' }}>{g.name}</td>
                    <td style={{ padding:'6px 4px', textAlign:'center', fontWeight:'900' }}>{n}</td>
                    <td style={{ padding:'6px 4px', textAlign:'center' }}>{(n * MACRO[g.key].prot).toFixed(0)}</td>
                    <td style={{ padding:'6px 4px', textAlign:'center' }}>{(n * MACRO[g.key].fat).toFixed(0)}</td>
                    <td style={{ padding:'6px 4px', textAlign:'center' }}>{(n * MACRO[g.key].cho).toFixed(0)}</td>
                    <td style={{ padding:'6px 4px', textAlign:'center' }}>{(n * KCAL[g.key]).toFixed(0)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:'var(--card-green)', color:'white' }}>
                <td style={{ padding:'8px 4px 8px 8px', fontWeight:'900', fontSize:'0.8rem' }}>TOTAL</td>
                <td></td>
                <td style={{ padding:'8px 4px', textAlign:'center', fontWeight:'900' }}>{totalProt.toFixed(0)}</td>
                <td style={{ padding:'8px 4px', textAlign:'center', fontWeight:'900' }}>{totalFat.toFixed(0)}</td>
                <td style={{ padding:'8px 4px', textAlign:'center', fontWeight:'900' }}>{totalCho.toFixed(0)}</td>
                <td style={{ padding:'8px 4px', textAlign:'center', fontWeight:'900' }}>{totalKcal.toFixed(0)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Fórmula de kcal */}
          <div style={{ marginTop:'10px', padding:'10px', background:'rgba(29,81,45,0.04)', borderRadius:'10px', fontSize:'0.72rem', color:'var(--text-primary)' }}>
            <strong>Fórmula energética:</strong> CHO {totalCho.toFixed(0)}g × 4 = <strong>{(totalCho * 4).toFixed(0)} kcal</strong> · PROT {totalProt.toFixed(0)}g × 4 = <strong>{(totalProt * 4).toFixed(0)} kcal</strong> · LIP {totalFat.toFixed(0)}g × 9 = <strong>{(totalFat * 9).toFixed(0)} kcal</strong>
          </div>
        </div>

        {/* ── Tarjetas por tiempo de comida (estilo cuaderno colorido) ── */}
        {mealsWithData.map(meal => {
          const d = menu[meal.key];
          const portions = d?.portions || {};
          const foods = d?.selectedFoods || [];

          return (
            <div key={meal.key} className="card-shell" style={{
              borderRadius:'20px', overflow:'hidden',
              marginBottom:'12px',
              boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
            }}>
              {/* Header de la comida */}
              <div style={{
                background:'var(--card-green)', color:'white',
                padding:'10px 16px',
                display:'flex', justifyContent:'space-between', alignItems:'center'
              }}>
                <h3 style={{ fontWeight:'900', fontSize:'1rem', margin:0 }}>{meal.label}</h3>
                <span style={{ fontSize:'0.7rem', opacity:0.7 }}>{d?.time || ''}</span>
              </div>

              {/* Porciones asignadas por grupo */}
              {Object.values(portions).some(v => parseFloat(v) > 0) && (
                <div style={{
                  display:'flex', flexWrap:'wrap', gap:'6px',
                  padding:'10px 14px',
                  background:'rgba(29,81,45,0.04)',
                  borderBottom:'1px solid rgba(0,0,0,0.06)'
                }}>
                  {FOOD_GROUPS.map(g => {
                    const val = parseFloat(portions[g.key] || 0);
                    if (!val) return null;
                    return (
                      <span key={g.key} className="badge" style={{ background: g.bg, color: g.color, border:`1px solid ${g.dot}30` }}>
                        <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: g.dot, display:'inline-block' }}></span>
                        {val} {g.name}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Alimentos ejemplo */}
              {foods.length > 0 && (
                <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'6px' }}>
                  {foods.map(item => {
                    const g = FOOD_GROUPS.find(g => g.key === item.groupKey) || FOOD_GROUPS[0];
                    const total = parseFloat(item.portion?.split(' ')[0] || 1) * (item.qty || 1);
                    const unit  = item.portion?.split(' ').slice(1).join(' ') || '';
                    return (
                      <div key={item.instanceId || item.id} style={{
                        display:'flex', alignItems:'center', gap:'10px',
                        padding:'6px 10px', borderRadius:'10px',
                        background: g.bg, borderLeft:`4px solid ${g.dot}`
                      }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: g.dot, flexShrink:0 }}></div>
                        <div style={{ flex:1 }}>
                          <span style={{ fontWeight:'900', color: g.color, fontSize:'0.85rem' }}>
                            {item.qty > 1 ? `${total.toFixed(1).replace('.0','')} ${unit}` : item.portion}
                          </span>
                          <span style={{ color:'#333', fontSize:'0.85rem', fontWeight:'700' }}> {item.name}</span>
                          {item.qty > 1 && (
                            <span style={{ fontSize:'0.65rem', opacity:0.5, display:'block' }}>
                              ({item.qty} raciones de {item.portion})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Si sólo hay porciones sin ejemplos: mostrar equivalencia */}
              {foods.length === 0 && Object.values(portions).some(v => parseFloat(v) > 0) && (
                <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:'5px' }}>
                  {FOOD_GROUPS.map(g => {
                    const val = parseFloat(portions[g.key] || 0);
                    if (!val) return null;
                    return (
                      <div key={g.key} style={{
                        display:'flex', alignItems:'flex-start', gap:'10px',
                        padding:'6px 10px', borderRadius:'10px',
                        background: g.bg, borderLeft:`4px solid ${g.dot}`,
                        fontSize:'0.78rem'
                      }}>
                        <span style={{ fontWeight:'900', color: g.color, minWidth:'80px' }}>{val} {g.name}</span>
                        <span style={{ color:'#555', fontStyle:'italic' }}>{EXCHANGE_EXAMPLES[g.key]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Nota de la nutricionista ── */}
        {patient.details?.notes && (
          <div style={{
            background:'white', borderRadius:'16px', padding:'16px',
            border:'1px dashed var(--accent)', marginBottom:'12px'
          }}>
            <p style={{ fontSize:'0.65rem', fontWeight:'900', color:'var(--accent)', marginBottom:'6px', letterSpacing:'1px' }}>INDICACIONES DEL ESPECIALISTA</p>
            <p style={{ fontSize:'0.85rem', color:'#444', lineHeight:'1.5' }}>{patient.details.notes}</p>
          </div>
        )}

        {/* ── Pie de la carta ── */}
        <div style={{
          textAlign:'center', padding:'16px',
          color:'var(--text-primary)', opacity:0.5, fontSize:'0.7rem'
        }}>
          <CheckCircle size={14} style={{ verticalAlign:'middle', marginRight:'4px' }} />
          Plan elaborado por Nutrimemi · nutrimemi.app
        </div>

        {mealsWithData.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px', opacity:0.4 }}>
            <ChefHat size={48} style={{ marginBottom:'16px' }} />
            <p style={{ fontWeight:'700' }}>Aún no se ha creado el menú para este paciente.</p>
            <p style={{ fontSize:'0.85rem' }}>Ve al Planificador de Menú para comenzar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
