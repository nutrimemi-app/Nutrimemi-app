'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Activity, Search, Clock, SaveAll, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useUI } from '@/context/UIContext';
import { loadFoods } from '@/data/defaultFoods';
import { calculateClinicalData, DISTRIBUTION_TEMPLATES } from '@/utils/calculationUtils';

const EXCHANGE_VALUES = {
  cereales: { prot: 2, fat: 0, cho: 15, kcal: 70 },
  proteinas: { prot: 7, fat: 3, cho: 0, kcal: 55 },
  vegetales: { prot: 2, fat: 0, cho: 5, kcal: 25 },
  frutas: { prot: 0, fat: 0, cho: 15, kcal: 60 },
  lacteos: { prot: 8, fat: 5, cho: 12, kcal: 120 },
  grasas: { prot: 0, fat: 5, cho: 0, kcal: 45 }
};

export default function ManageMenu() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const [patient, setPatient] = useState(null);
  const [foodDB, setFoodDB] = useState([]);
  const [step, setStep] = useState(1); // 1: Porciones, 2: Ejemplos de Menú
  const [formulas, setFormulas] = useState({ kcal: '', prot: '', cho: '', fat: '' });
  const [mealCalculators, setMealCalculators] = useState({});
  const [menu, setMenu] = useState({
    desayuno: { time: '08:00', selectedFoods: [], portions: {} },
    meriendaAM: { time: '10:30', selectedFoods: [], portions: {} },
    almuerzo: { time: '13:00', selectedFoods: [], portions: {} },
    meriendaPM: { time: '16:30', selectedFoods: [], portions: {} },
    cena: { time: '19:30', selectedFoods: [], portions: {} },
    snackNoche: { time: '21:00', selectedFoods: [], portions: {} }
  });
  const [searchTerms, setSearchTerms] = useState({});

  useEffect(() => {
    setFoodDB(loadFoods());
    const savedPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const found = savedPatients.find(p => p.id === parseInt(params.id));
    if (found) {
      setPatient(found);
      if (found.menu) setMenu(prev => ({ ...prev, ...found.menu }));
      if (found.formulas) setFormulas(found.formulas);
    }
  }, [params.id]);

  const clinical = patient ? calculateClinicalData({
    weight: patient.details?.weight,
    height: patient.details?.height,
    sex: patient.details?.gender || 'female'
  }) : null;

  const evalFormula = (str) => {
    if (!str) return 0;
    try { return eval(str.replace(/[^0-9+*/().-]/g, '')) || 0; } catch { return 0; }
  };

  const applyTemplate = (key) => {
    const t = DISTRIBUTION_TEMPLATES[key];
    const rct = evalFormula(formulas.kcal) || 1700;
    setFormulas({
      kcal: rct.toString(),
      prot: `(${rct} * ${t.prot / 100}) / 4`,
      cho: `(${rct} * ${t.cho / 100}) / 4`,
      fat: `(${rct} * ${t.fat / 100}) / 9`
    });
  };

  const updatePortion = (mealKey, groupKey, value) => {
    setMenu(prev => ({
      ...prev,
      [mealKey]: {
        ...prev[mealKey],
        portions: { ...prev[mealKey].portions, [groupKey]: value }
      }
    }));
  };

  const autoFillPortions = (mealKey, targets) => {
    let { kcal, prot, cho, fat } = targets;
    const newPortions = { cereales: 0, proteinas: 0, vegetales: 0, frutas: 0, lacteos: 0, grasas: 0 };
    if (prot > 0) newPortions.proteinas = Math.floor(prot / EXCHANGE_VALUES.proteinas.prot);
    if (cho > 0) {
      newPortions.cereales = Math.floor((cho * 0.7) / EXCHANGE_VALUES.cereales.cho);
      newPortions.frutas = Math.floor((cho * 0.3) / EXCHANGE_VALUES.frutas.cho);
    }
    if (fat > 0) newPortions.grasas = Math.floor(fat / EXCHANGE_VALUES.grasas.fat);
    newPortions.vegetales = 1;

    Object.entries(newPortions).forEach(([group, val]) => {
      updatePortion(mealKey, group, val.toString());
    });
    setMealCalculators({...mealCalculators, [mealKey]: null});
  };

  const getPlannedTotals = () => {
    let kcal = 0, prot = 0, cho = 0, fat = 0;
    Object.values(menu).forEach(m => {
      Object.entries(m.portions || {}).forEach(([group, amount]) => {
        const a = parseFloat(amount) || 0;
        if (EXCHANGE_VALUES[group]) {
          kcal += a * EXCHANGE_VALUES[group].kcal;
          prot += a * EXCHANGE_VALUES[group].prot;
          cho += a * EXCHANGE_VALUES[group].cho;
          fat += a * EXCHANGE_VALUES[group].fat;
        }
      });
    });
    return { kcal, prot, cho, fat };
  };

  const totals = getPlannedTotals();

  const handleSave = () => {
    if (!patient) return showToast('Paciente no cargado correctamente.', 'error');
    const savedPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const updated = savedPatients.map(p => p.id === patient.id ? { ...p, menu, formulas } : p);
    localStorage.setItem('nutri_patients', JSON.stringify(updated));
    showToast('Plan nutricional guardado con éxito', 'success');
    router.back();
  };

  const handleItemPortionChange = (mealKey, instanceId, newValue) => {
    setMenu(prev => {
      const meal = prev[mealKey];
      const updatedFoods = meal.selectedFoods.map(f => 
        f.instanceId === instanceId ? { ...f, portion: newValue } : f
      );
      return { ...prev, [mealKey]: { ...meal, selectedFoods: updatedFoods } };
    });
  };

  const getUsedPortionsInMeal = (mealKey) => {
    const meal = menu[mealKey];
    const used = { cereales: 0, proteinas: 0, vegetales: 0, frutas: 0, lacteos: 0, grasas: 0 };
    meal.selectedFoods?.forEach(f => {
      if (used[f.groupKey] !== undefined) {
         // Intentamos extraer el número de la porción (ej: "1 taza" -> 1)
         const num = parseFloat(f.portion.split(' ')[0]) || 0;
         used[f.groupKey] += num;
      }
    });
    return used;
  };

  const MEAL_PLANS = {
    '2 comidas': [
      { title: 'Almuerzo', key: 'almuerzo' },
      { title: 'Cena', key: 'cena' },
    ],
    '3 comidas': [
      { title: 'Desayuno', key: 'desayuno' },
      { title: 'Almuerzo', key: 'almuerzo' },
      { title: 'Cena', key: 'cena' },
    ],
    '3+2 snacks': [
      { title: 'Desayuno', key: 'desayuno' },
      { title: 'Merienda AM', key: 'meriendaAM' },
      { title: 'Almuerzo', key: 'almuerzo' },
      { title: 'Merienda PM', key: 'meriendaPM' },
      { title: 'Cena', key: 'cena' },
    ],
    '3+3 snacks': [
      { title: 'Desayuno', key: 'desayuno' },
      { title: 'Merienda AM', key: 'meriendaAM' },
      { title: 'Almuerzo', key: 'almuerzo' },
      { title: 'Merienda PM', key: 'meriendaPM' },
      { title: 'Cena', key: 'cena' },
      { title: 'Snack Nocturno', key: 'snackNoche' },
    ],
    '2+2 snacks': [
      { title: 'Desayuno', key: 'desayuno' },
      { title: 'Merienda AM', key: 'meriendaAM' },
      { title: 'Almuerzo', key: 'almuerzo' },
      { title: 'Cena', key: 'cena' },
    ],
  };

  const mealPlanKey = patient?.details?.mealPlan || '3+2 snacks';
  const mealTypes = MEAL_PLANS[mealPlanKey] || MEAL_PLANS['3+2 snacks'];

  const foodGroups = [
    { name: 'Cereales', color: '#FFA500', key: 'cereales' },
    { name: 'Proteínas', color: '#FF0000', key: 'proteinas' },
    { name: 'Vegetales', color: '#228B22', key: 'vegetales' },
    { name: 'Frutas', color: '#BA55D3', key: 'frutas' },
    { name: 'Lácteos', color: '#1E90FF', key: 'lacteos' },
    { name: 'Grasas', color: '#FFD700', key: 'grasas' }
  ];

  if (!patient) return <div style={{ padding: '20px' }}>Cargando datos del paciente...</div>;

  return (
    <div style={{ padding: '20px', paddingBottom: '140px' }} className="fade-in">
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <button onClick={() => step === 2 ? setStep(1) : router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900' }}>{step === 1 ? 'Paso 1: Definir Porciones' : 'Paso 2: Crear Menú Ejemplo'}</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', paddingLeft: '40px' }}>
          <div style={{ padding: '6px 14px', background: step === 1 ? 'var(--primary)' : '#eee', color: step === 1 ? 'white' : '#888', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '900' }}>1. CALCULO</div>
          <div style={{ padding: '6px 14px', background: step === 2 ? 'var(--primary)' : '#eee', color: step === 2 ? 'white' : '#888', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '900' }}>2. MENU</div>
        </div>
      </header>

      {step === 1 && (
        <div className="fade-in">
          {/* Molécula Calórica Paso 1 */}
          <section className="glass-panel" style={{ padding: '24px', background: 'white', marginBottom: '24px', border: '1px solid rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h4 style={{ fontWeight: '900', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} /> Requerimientos del Día</h4>
              <div style={{ display: 'flex', gap: '6px' }}>
                {Object.keys(DISTRIBUTION_TEMPLATES).map(k => (
                  <button key={k} onClick={() => applyTemplate(k)} className="btn-secondary" style={{ fontSize: '0.6rem', padding: '4px 8px', borderRadius: '8px' }}>{DISTRIBUTION_TEMPLATES[k].name.split('/')[0]}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'CALORÍAS', key: 'kcal' },
                { label: 'PROT (g)', key: 'prot' },
                { label: 'CHO (g)', key: 'cho' },
                { label: 'GRASA (g)', key: 'fat' }
              ].map(m => (
                <div key={m.key} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.55rem', fontWeight: '900', opacity: 0.5, marginBottom: '4px' }}>{m.label}</p>
                  <input type="text" value={formulas[m.key]} onChange={e => setFormulas({...formulas, [m.key]: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center', fontSize: '0.8rem', fontWeight: '900' }} />
                  <p style={{ fontSize: '1rem', fontWeight: '900', marginTop: '6px' }}>
                    {totals[m.key].toFixed(0)} <span style={{ opacity: 0.3, fontSize: '0.6rem' }}>/ {evalFormula(formulas[m.key]).toFixed(0)}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Grid de Porciones por Comida */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mealTypes.map(meal => (
              <div key={meal.key} className="glass-panel" style={{ padding: '16px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--primary)' }}>{meal.title}</h3>
                  <button onClick={() => setMealCalculators({...mealCalculators, [meal.key]: mealCalculators[meal.key] ? null : { kcal: '', prot: '', cho: '', fat: '' }})} style={{ background: 'var(--card-green-light)', border: 'none', color: 'var(--primary)', fontSize: '0.65rem', padding: '4px 10px', borderRadius: '6px', fontWeight: '900' }}>+ Fórmula Local</button>
                </div>
                
                {mealCalculators[meal.key] && (
                  <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {['kcal', 'prot', 'cho', 'fat'].map(f => (
                      <input key={f} type="text" placeholder={f.toUpperCase()} value={mealCalculators[meal.key][f]} onChange={e => setMealCalculators({...mealCalculators, [meal.key]: {...mealCalculators[meal.key], [f]: e.target.value}})} style={{ width: '100%', padding: '4px', fontSize: '0.65rem', borderRadius: '4px', border: '1px solid #ddd' }} />
                    ))}
                    <button onClick={() => autoFillPortions(meal.key, { kcal: evalFormula(mealCalculators[meal.key].kcal), prot: evalFormula(mealCalculators[meal.key].prot), cho: evalFormula(mealCalculators[meal.key].cho), fat: evalFormula(mealCalculators[meal.key].fat) })} style={{ gridColumn: 'span 4', background: 'var(--primary)', color: 'white', border: 'none', padding: '6px', fontSize: '0.7rem', fontWeight: '900', borderRadius: '4px' }}>Distribuir Porciones</button>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                  {foodGroups.map(group => (
                    <div key={group.key} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.5rem', fontWeight: '900', opacity: 0.4, marginBottom: '2px' }}>{group.name.substring(0,3).toUpperCase()}</p>
                      <input type="number" step="0.5" value={menu[meal.key].portions?.[group.key] || ''} onChange={e => updatePortion(meal.key, group.key, e.target.value)} style={{ width: '100%', textAlign: 'center', fontSize: '0.9rem', fontWeight: '900', border: '1px solid #eee', borderRadius: '6px', padding: '4px' }} placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '24px', background: 'white', borderTop: '1px solid #eee', zIndex: 100 }}>
             <button onClick={() => setStep(2)} className="btn-primary" style={{ width: '100%', padding: '18px', borderRadius: '16px', fontWeight: '900', fontSize: '1.1rem' }}>
               Continuar a Creación de Menú →
             </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in">
          <section className="glass-panel" style={{ padding: '20px', background: 'var(--card-yellow-light)', marginBottom: '24px', border: '1.5px dashed var(--accent)', borderRadius: '16px' }}>
             <h4 style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '900', marginBottom: '10px' }}>📊 SEGUIMIENTO DE RACIONES</h4>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {foodGroups.map(g => {
                   let defined = 0;
                   let used = 0;
                   Object.keys(menu).forEach(mKey => {
                      defined += parseFloat(menu[mKey].portions?.[g.key]) || 0;
                      menu[mKey].selectedFoods?.forEach(f => {
                         if (f.groupKey === g.key) used += parseFloat(f.portion.split(' ')[0]) || 0;
                      });
                   });
                   const isOver = used > defined;
                   return (
                     <div key={g.key} style={{ textAlign: 'center', background: 'white', padding: '8px', borderRadius: '8px', border: isOver ? '1.5px solid #ff4444' : '1px solid #eee' }}>
                        <p style={{ fontSize: '0.5rem', fontWeight: '900', color: g.color }}>{g.name.substring(0,4)}</p>
                        <p style={{ fontSize: '0.8rem', fontWeight: '900', color: isOver ? '#ff4444' : '#333' }}>
                           {used} <span style={{ opacity: 0.3, fontSize: '0.6rem' }}>/ {defined}</span>
                        </p>
                        {isOver && <div style={{ width: '6px', height: '6px', background: '#ff4444', borderRadius: '50%', margin: '4px auto 0' }} />}
                     </div>
                   );
                })}
             </div>
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {mealTypes.map(meal => {
              const mealData = menu[meal.key];
              return (
                <div key={meal.key} className="glass-panel" style={{ padding: '20px', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: '900', color: 'var(--primary)' }}>{meal.title}</h3>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {foodGroups.map(g => mealData.portions?.[g.key] > 0 && (
                        <div key={g.key} style={{ fontSize: '0.6rem', fontWeight: '900', padding: '2px 6px', background: `${g.color}15`, color: g.color, borderRadius: '4px' }}>
                          {g.name}: {mealData.portions[g.key]}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buscador de Alimentos para el Menú */}
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#f9f9f9', borderRadius: '12px', padding: '0 12px', border: '1px solid #eee' }}>
                      <Search size={16} opacity={0.3} />
                      <input type="text" placeholder={`¿Qué comerá en el ${meal.title}?`} value={searchTerms[meal.key] || ''} onChange={e => setSearchTerms({...searchTerms, [meal.key]: e.target.value})} style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', fontSize: '0.85rem', background: 'none' }} />
                    </div>
                    
                    {searchTerms[meal.key] && (
                       <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zInterval: 1000, maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', marginTop: '4px' }}>
                         {foodDB.filter(f => f.name.toLowerCase().includes(searchTerms[meal.key].toLowerCase())).map(food => (
                            <div key={food.id} onClick={() => {
                              const updatedFoods = [...(mealData.selectedFoods || []), { ...food, instanceId: Date.now() }];
                              setMenu({...menu, [meal.key]: { ...mealData, selectedFoods: updatedFoods }});
                              setSearchTerms({...searchTerms, [meal.key]: ''});
                            }} style={{ padding: '12px 16px', borderBottom: '1px solid #f9f9f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: '700', color: foodGroups.find(g => g.key === food.groupKey)?.color }}>{food.name}</span>
                              <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{food.portion}</span>
                            </div>
                         ))}
                       </div>
                    )}
                  </div>

                  {/* Visualización del Menú Ejemplo con edición de porción */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {mealData.selectedFoods?.map(item => {
                       const group = foodGroups.find(g => g.key === item.groupKey);
                       return (
                        <div key={item.instanceId} style={{ background: 'white', border: `1px solid ${group.color}30`, padding: '6px 14px', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: group.color }}></div>
                          <input 
                             type="text" 
                             value={item.portion} 
                             onChange={(e) => handleItemPortionChange(meal.key, item.instanceId, e.target.value)}
                             style={{ width: '80px', border: '1px solid #eee', background: '#f9f9f9', borderRadius: '4px', fontSize: '0.75rem', padding: '2px 4px', fontWeight: '800', color: group.color }}
                          />
                          <span style={{ flex: 1, fontWeight: '700', color: group.color }}>de {item.name}</span>
                          <button onClick={() => {
                            const updatedFoods = mealData.selectedFoods.filter(f => f.instanceId !== item.instanceId);
                            setMenu({...menu, [meal.key]: { ...mealData, selectedFoods: updatedFoods }});
                          }} style={{ background: 'none', border: 'none', opacity: 0.3, cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                       );
                     })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista Previa del Menú en Tabla (Live - Mejorada para Celular) */}
          <section style={{ 
            marginTop: '40px', 
            marginRight: '-20px', 
            marginLeft: '-20px', 
            padding: '20px',
            background: 'white', 
            borderTop: '3px solid var(--primary)',
            borderBottom: '3px solid var(--primary)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase' }}>VISTA PREVIA DEL INFORME</h4>
                <div style={{ fontSize: '0.65rem', fontWeight: '800', background: 'var(--card-green-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '10px' }}>
                  Desliza para ver todo →
                </div>
             </div>

             <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '950px', tableLayout: 'fixed' }}>
                    <thead>
                      <tr style={{ background: 'var(--primary)', color: 'white' }}>
                          {mealTypes.map(m => (
                            <th key={m.key} style={{ padding: '15px 10px', fontSize: '0.85rem', fontWeight: '900', border: '1px solid white', textAlign: 'center' }}>{m.title.toUpperCase()}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.max(...Object.values(menu).map(m => m.selectedFoods?.length || 0), 1) }).map((_, rowIdx) => (
                          <tr key={rowIdx}>
                            {mealTypes.map(meal => {
                                const food = menu[meal.key].selectedFoods?.[rowIdx];
                                const group = foodGroups.find(g => g.key === food?.groupKey);
                                return (
                                  <td key={meal.key} style={{ padding: '15px 12px', border: '1px solid #eee', verticalAlign: 'top', height: '140px' }}>
                                      {food ? (
                                        <div style={{ fontSize: '0.9rem', borderLeft: `5px solid ${group.color}`, paddingLeft: '10px' }}>
                                            <p style={{ margin: '0 0 4px 0', fontWeight: '900', color: group.color, fontSize: '1rem' }}>{food.portion}</p>
                                            <p style={{ margin: 0, fontWeight: '700', color: '#111' }}>{food.name}</p>
                                        </div>
                                      ) : <div style={{ opacity: 0.1, fontSize: '0.8rem', textAlign: 'center', paddingTop: '40px' }}>-</div>}
                                  </td>
                                );
                            })}
                          </tr>
                      ))}
                    </tbody>
                </table>
             </div>
          </section>

          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '24px', background: 'white', borderTop: '1px solid #eee', zIndex: 100, display: 'flex', gap: '12px' }}>
             <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, padding: '18px', borderRadius: '16px', fontWeight: '900' }}>← Volver</button>
             <button onClick={handleSave} className="btn-primary" style={{ flex: 2, padding: '18px', borderRadius: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
               <SaveAll size={20} /> Finalizar y Guardar Plan
             </button>
          </div>
        </div>
      )}
    </div>
  );
}


