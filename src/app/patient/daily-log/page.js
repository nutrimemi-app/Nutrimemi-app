'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import TabBar from '@/components/patient/TabBar';
import { Plus, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';

// ──────────────────────────────────────────────
// BASE DE DATOS COMIDAS NO HABITUALES
// ──────────────────────────────────────────────
const UNUSUAL_FOODS = {
  pizza: {
    label: 'Pizza (por porción/rebanada)',
    icon: '🍕',
    items: [
      { id: 'p1', name: 'Margarita / Queso simple', kcal: 250, prot: 11, cho: 30, fat: 9.5 },
      { id: 'p2', name: 'Pepperoni / Jamón',         kcal: 315, prot: 13.5, cho: 32, fat: 13.5 },
      { id: 'p3', name: 'Vegetariana',                kcal: 220, prot: 10, cho: 30, fat: 7.5 },
      { id: 'p4', name: 'Fugazza / Cebolla',          kcal: 235, prot: 9, cho: 32.5, fat: 8.5 },
      { id: 'p5', name: 'Masa gruesa / Pan pizza',    kcal: 375, prot: 14, cho: 44, fat: 16 },
    ]
  },
  slides: {
    label: 'Slides / Hamburguesas mini',
    icon: '🍔',
    items: [
      { id: 's1', name: 'Slide de Pollo — pequeño',  kcal: 220, prot: 14, cho: 22, fat: 8  },
      { id: 's2', name: 'Slide de Pollo — mediano',  kcal: 310, prot: 19, cho: 28, fat: 11 },
      { id: 's3', name: 'Slide de Pollo — grande',   kcal: 410, prot: 26, cho: 35, fat: 14 },
      { id: 's4', name: 'Slide de Carne — pequeño',  kcal: 260, prot: 15, cho: 22, fat: 12 },
      { id: 's5', name: 'Slide de Carne — mediano',  kcal: 360, prot: 20, cho: 28, fat: 16 },
      { id: 's6', name: 'Slide de Carne — grande',   kcal: 470, prot: 26, cho: 35, fat: 21 },
    ]
  },
  papas: {
    label: 'Papas Fritas',
    icon: '🍟',
    items: [
      { id: 'f1', name: 'Papas fritas — porción pequeña', kcal: 230, prot: 3, cho: 29, fat: 11 },
      { id: 'f2', name: 'Papas fritas — porción mediana', kcal: 360, prot: 4.5, cho: 45, fat: 17 },
    ]
  },
  hotdog: {
    label: 'Perro Caliente / Hot Dog',
    icon: '🌭',
    items: [
      { id: 'h1', name: 'Perro caliente clásico',      kcal: 290, prot: 12, cho: 24, fat: 17 },
      { id: 'h2', name: 'Perro caliente con papas',    kcal: 380, prot: 13, cho: 38, fat: 20 },
    ]
  },
  hamburguesa: {
    label: 'Hamburguesa',
    icon: '🍔',
    items: [
      { id: 'hb1', name: 'Hamburguesa simple',          kcal: 360, prot: 20, cho: 30, fat: 16 },
      { id: 'hb2', name: 'Hamburguesa doble carne',     kcal: 530, prot: 30, cho: 32, fat: 28 },
      { id: 'hb3', name: 'Hamburguesa de pollo',        kcal: 320, prot: 22, cho: 30, fat: 11 },
    ]
  },
  sushi: {
    label: 'Sushi (por pieza / roll 6 piezas)',
    icon: '🍱',
    items: [
      { id: 'su1', name: 'Maki / Rolls de vegetales (6 pzs)', kcal: 200, prot: 5, cho: 40, fat: 2  },
      { id: 'su2', name: 'Maki de salmón / atún (6 pzs)',     kcal: 240, prot: 12, cho: 36, fat: 5 },
      { id: 'su3', name: 'California roll (6 pzs)',            kcal: 260, prot: 9, cho: 38, fat: 7  },
    ]
  },
  helado: {
    label: 'Helado',
    icon: '🍦',
    items: [
      { id: 'ic1', name: 'Helado de crema — 1 bola (100 g)',  kcal: 200, prot: 3, cho: 23, fat: 11 },
      { id: 'ic2', name: 'Helado de agua / paleta (80 g)',    kcal: 70,  prot: 0, cho: 18, fat: 0  },
      { id: 'ic3', name: 'Helado de yogurt — 1 bola (100 g)',kcal: 140, prot: 4, cho: 24, fat: 3.5 },
    ]
  },
  bebidas: {
    label: 'Refrescos, Jugos & Bebidas',
    icon: '🥤',
    items: [
      { id: 'b1', name: 'Refresco gaseoso — lata 355 ml',    kcal: 142, prot: 0, cho: 39, fat: 0 },
      { id: 'b2', name: 'Jugo de naranja natural — 1 vaso',  kcal: 110, prot: 2, cho: 26, fat: 0 },
      { id: 'b3', name: 'Jugo artificial — vaso 300 ml',     kcal: 120, prot: 0, cho: 30, fat: 0 },
    ]
  },
  empanadas: {
    label: 'Empanadas',
    icon: '🫔',
    items: [
      { id: 'e1', name: 'Empanada de pollo / carne (1 ud)',  kcal: 250, prot: 10, cho: 28, fat: 11 },
      { id: 'e2', name: 'Empanada de queso (1 ud)',           kcal: 230, prot: 8, cho: 26, fat: 11 },
      { id: 'e3', name: 'Empanada mini (canapé)',             kcal: 90,  prot: 3, cho: 10, fat: 4  },
    ]
  },
};

const FOOD_GROUPS = [
  { key: 'cereales',  name: 'Cereales',  color: '#E07B00', bg: '#FFF3E0' },
  { key: 'proteinas', name: 'Proteínas', color: '#B71C1C', bg: '#FFEBEE' },
  { key: 'vegetales', name: 'Vegetales', color: '#1B5E20', bg: '#E8F5E9' },
  { key: 'frutas',    name: 'Frutas',    color: '#6A1B9A', bg: '#F3E5F5' },
  { key: 'lacteos',   name: 'Lácteos',   color: '#0D47A1', bg: '#E3F2FD' },
  { key: 'grasas',    name: 'Grasas',    color: '#827717', bg: '#FFFDE7' },
];

const EXCHANGE_VALUES = {
  cereales:  { prot: 2, fat: 0,  cho: 15, kcal: 70  },
  proteinas: { prot: 7, fat: 3,  cho: 0,  kcal: 55  },
  vegetales: { prot: 2, fat: 0,  cho: 5,  kcal: 25  },
  frutas:    { prot: 0, fat: 0,  cho: 15, kcal: 60  },
  lacteos:   { prot: 8, fat: 5,  cho: 12, kcal: 120 },
  grasas:    { prot: 0, fat: 5,  cho: 0,  kcal: 45  },
};

export default function DailyLog() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [tab, setTab] = useState('standard'); // 'standard' | 'unusual'
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [openCategory, setOpenCategory] = useState(null);
  const [qty, setQty] = useState({});
  const [foodDB, setFoodDB] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const storageKey = patient ? `daily_log_${patient.id}` : null;

  // Cargar base de datos de alimentos de forma segura en el cliente (evita SSR Crash)
  useEffect(() => {
    try {
      const db = JSON.parse(localStorage.getItem('nutri_foods') || '[]');
      setFoodDB(db);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    try {
      const patients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
      const found = patients.find(p => p.email === user.email);
      if (found) {
        setPatient(found);
        const key = `daily_log_${found.id}`;
        const logs = JSON.parse(localStorage.getItem(key) || '[]');
        const todayEntry = logs.find(l => l.date === today);
        if (todayEntry) setEntries(todayEntry.entries || []);
      }
    } catch (e) {}
  }, [user, today]);

  const saveEntries = (newEntries) => {
    if (!storageKey) return;
    const logs = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = logs.filter(l => l.date !== today);
    const totals = calcTotals(newEntries);
    updated.push({ date: today, entries: newEntries, ...totals });
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const calcTotals = (ents) => {
    return ents.reduce((acc, e) => {
      acc.totalKcal += e.kcal * e.qty;
      acc.totalProt += e.prot * e.qty;
      acc.totalCho  += e.cho  * e.qty;
      acc.totalFat  += e.fat  * e.qty;
      return acc;
    }, { totalKcal: 0, totalProt: 0, totalCho: 0, totalFat: 0 });
  };

  const addEntry = (food) => {
    const q = parseFloat(qty[food.id] || 1);
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const entry = { ...food, qty: q, entryId: Date.now(), time };
    const next = [...entries, entry];
    setEntries(next);
    saveEntries(next);
    setQty({ ...qty, [food.id]: 1 });
  };

  const [manualText, setManualText] = useState('');
  const addManualEntry = () => {
    if (!manualText.trim()) return;
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const entry = {
      id: 'manual-' + Date.now(),
      name: manualText.trim(),
      qty: 1,
      unit: 'porción',
      groupKey: 'manual',
      kcal: 0, prot: 0, cho: 0, fat: 0,
      entryId: Date.now(),
      time
    };
    const next = [...entries, entry];
    setEntries(next);
    saveEntries(next);
    setManualText('');
  };

  const removeEntry = (entryId) => {
    const next = entries.filter(e => e.entryId !== entryId);
    setEntries(next);
    saveEntries(next);
  };

  const totals = calcTotals(entries);

  // Alimentos estándares del menú del paciente
  const filteredFoods = foodDB.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // Para comidas estándares, calcular kcal desde valores de intercambio
  const getFoodMacros = (food) => {
    const ev = EXCHANGE_VALUES[food.groupKey] || {};
    return {
      kcal: ev.kcal || 0,
      prot: ev.prot || 0,
      cho:  ev.cho  || 0,
      fat:  ev.fat  || 0,
    };
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }} className="fade-in">
      <header style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)' }}>Registro del Día</h2>
        <p style={{ opacity: 0.55, fontSize: '0.85rem' }}>
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </header>

      {/* Totales del día */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', background: 'var(--card-green)', color: 'white', borderRadius: '20px' }}>
        <p style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: '900', letterSpacing: '1px', marginBottom: '10px' }}>RESUMEN DEL DÍA</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center' }}>
          {[
            { label: 'KCAL', value: totals.totalKcal.toFixed(0) },
            { label: 'CHO g', value: totals.totalCho.toFixed(0) },
            { label: 'PROT g', value: totals.totalProt.toFixed(0) },
            { label: 'LÍP g', value: totals.totalFat.toFixed(0) },
          ].map(m => (
            <div key={m.label}>
              <p style={{ fontSize: '0.55rem', opacity: 0.7, fontWeight: '800' }}>{m.label}</p>
              <p style={{ fontSize: '1.3rem', fontWeight: '900' }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs de tipo de comida */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', background: 'rgba(0,0,0,0.04)', borderRadius: '14px', padding: '4px' }}>
        {[
          { id: 'standard', label: 'Comidas estándares' },
          { id: 'unusual',  label: 'Comidas no habituales' },
          { id: 'manual',   label: 'Escribir manual' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '9px 6px', border: 'none', borderRadius: '10px', cursor: 'pointer',
            background: tab === t.id ? 'var(--text-primary)' : 'transparent',
            color: tab === t.id ? 'white' : 'var(--text-primary)',
            fontWeight: '800', fontSize: '0.75rem', transition: 'all 0.2s'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════ COMIDAS ESTÁNDARES ═══════ */}
      {tab === 'standard' && (
        <div className="fade-in">
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input
              type="text" placeholder="Buscar alimento…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9rem', outline: 'none', background: 'white' }}
            />
          </div>

          {filteredFoods.length > 0 && search.length > 0 && (
            <div className="glass-panel" style={{ background: 'white', marginBottom: '16px', overflow: 'hidden' }}>
              {filteredFoods.slice(0, 10).map(food => {
                const m = getFoodMacros(food);
                const g = FOOD_GROUPS.find(g => g.key === food.groupKey);
                return (
                  <div key={food.id} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, background: g?.bg || '#f5f5f5', padding: '6px 10px', borderRadius: '10px', borderLeft: `3px solid ${g?.color || '#ccc'}` }}>
                      <p style={{ fontWeight: '800', fontSize: '0.85rem', color: g?.color }}>{food.name}</p>
                      <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>{food.portion} · {m.kcal} kcal · CHO {m.cho}g · PROT {m.prot}g</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number" min="0.5" step="0.5"
                        value={qty[food.id] || 1}
                        onChange={e => setQty({ ...qty, [food.id]: e.target.value })}
                        style={{ width: '40px', padding: '4px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center', fontSize: '0.8rem' }}
                      />
                      <button onClick={() => addEntry({ ...food, ...m })} style={{ background: 'var(--text-primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: '900', fontSize: '0.8rem' }}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grupos de alimentos sin búsqueda */}
          {search.length === 0 && FOOD_GROUPS.map(g => {
            const groupFoods = foodDB.filter(f => f.groupKey === g.key);
            if (groupFoods.length === 0) return null;
            return (
              <div key={g.key} className="glass-panel" style={{ marginBottom: '10px', overflow: 'hidden', background: 'white' }}>
                <button onClick={() => setOpenCategory(openCategory === g.key ? null : g.key)} style={{
                  width: '100%', padding: '12px 16px', background: g.bg, border: 'none', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${g.color}`
                }}>
                  <span style={{ fontWeight: '900', color: g.color, fontSize: '0.9rem' }}>{g.name}</span>
                  {openCategory === g.key ? <ChevronUp size={18} color={g.color} /> : <ChevronDown size={18} color={g.color} />}
                </button>
                {openCategory === g.key && groupFoods.map(food => {
                  const m = getFoodMacros(food);
                  return (
                    <div key={food.id} style={{ padding: '8px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '700', fontSize: '0.82rem' }}>{food.name}</p>
                        <p style={{ fontSize: '0.68rem', opacity: 0.55 }}>{food.portion} · {m.kcal} kcal</p>
                      </div>
                      <input
                        type="number" min="0.5" step="0.5"
                        value={qty[food.id] || 1}
                        onChange={e => setQty({ ...qty, [food.id]: e.target.value })}
                        style={{ width: '36px', padding: '3px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center', fontSize: '0.8rem' }}
                      />
                      <button onClick={() => addEntry({ ...food, ...m })} style={{ background: g.color, color: 'white', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontWeight: '900', fontSize: '0.8rem' }}>+</button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════ COMIDAS NO HABITUALES ═══════ */}
      {tab === 'unusual' && (
        <div className="fade-in">
          {Object.entries(UNUSUAL_FOODS).map(([catKey, cat]) => (
            <div key={catKey} className="glass-panel" style={{ marginBottom: '10px', overflow: 'hidden', background: 'white' }}>
              <button onClick={() => setOpenCategory(openCategory === catKey ? null : catKey)} style={{
                width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.03)', border: 'none',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontWeight: '900', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{cat.icon}</span> {cat.label}
                </span>
                {openCategory === catKey ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {openCategory === catKey && cat.items.map(food => (
                <div key={food.id} style={{ padding: '8px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '700', fontSize: '0.82rem' }}>{food.name}</p>
                    <p style={{ fontSize: '0.68rem', opacity: 0.55 }}>
                      {food.kcal} kcal · CHO {food.cho}g · PROT {food.prot}g · LÍP {food.fat}g
                    </p>
                  </div>
                  <input
                    type="number" min="1" step="1"
                    value={qty[food.id] || 1}
                    onChange={e => setQty({ ...qty, [food.id]: e.target.value })}
                    style={{ width: '36px', padding: '3px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center', fontSize: '0.8rem' }}
                  />
                  <button onClick={() => addEntry({ ...food, groupKey: 'no_habitual' })} style={{ background: '#FF5E5E', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontWeight: '900', fontSize: '0.8rem' }}>+</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ═══════ ESCRITURA MANUAL ═══════ */}
      {tab === 'manual' && (
        <div className="fade-in">
          <div className="glass-panel" style={{ padding: '20px', background: 'white' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px' }}>Escribe lo que comiste</h3>
            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '16px' }}>Si no encuentras el alimento, descríbelo aquí y se guardará con la hora actual.</p>
            
            <input
              type="text"
              placeholder="Ej. Una empanada de queso y un café"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid rgba(0,0,0,0.05)',
                fontSize: '0.9rem', background: 'rgba(0,0,0,0.02)', outline: 'none', marginBottom: '12px'
              }}
            />
            
            <button
              onClick={addManualEntry}
              disabled={!manualText.trim()}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: manualText.trim() ? 'var(--card-green)' : '#ccc', color: 'white',
                fontWeight: '900', cursor: manualText.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
              }}
            >
              Agregar registro manual
            </button>
          </div>
        </div>
      )}

      {/* ═══════ LISTA DE LO CONSUMIDO HOY ═══════ */}
      {entries.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.5, letterSpacing: '1px', marginBottom: '10px' }}>REGISTRADO HOY</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {entries.map(e => {
              const g = FOOD_GROUPS.find(g => g.key === e.groupKey);
              return (
                <div key={e.entryId} style={{
                  background: g?.bg || '#fff0f0', borderRadius: '14px', padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  borderLeft: `3px solid ${g?.color || '#FF5E5E'}`
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '800', fontSize: '0.85rem', color: g?.color || '#333' }}>{e.name}</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                      {e.groupKey !== 'manual' ? `×${e.qty} · ${(e.kcal * e.qty).toFixed(0)} kcal` : 'Registro manual'} 
                      {e.time ? ` · 🕒 ${e.time}` : ''}
                    </p>
                  </div>
                  <button onClick={() => removeEntry(e.entryId)} style={{ background: 'rgba(255,94,94,0.1)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#FF5E5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TabBar />
    </div>
  );
}
