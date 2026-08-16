'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, Printer, Award } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { loadFoods } from '@/data/defaultFoods';
import { getPatientById } from '@/lib/patients';

export default function Recordatorio24H() {
  const params = useParams();
  const router = useRouter();
  const { showToast, showConfirm } = useUI();
  
  const [patient, setPatient] = useState(null);
  const [foods, setFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMeal, setActiveMeal] = useState('Desayuno');
  const [r24hNotes, setR24hNotes] = useState('');
  
  // Estructura del Recordatorio 24 Horas
  const [reminder, setReminder] = useState({
    Desayuno: [],
    'Merienda AM': [],
    Almuerzo: [],
    'Merienda PM': [],
    Cena: [],
    'Colación Nocturna': []
  });

  const meals = ['Desayuno', 'Merienda AM', 'Almuerzo', 'Merienda PM', 'Cena', 'Colación Nocturna'];

  // Equivalentes de macros por grupo de intercambio
  const groupMacros = {
    cereales: { kcal: 70, cho: 15, prot: 2, fat: 0 },
    proteinas: { kcal: 55, cho: 0, prot: 7, fat: 3 },
    vegetales: { kcal: 25, cho: 5, prot: 2, fat: 0 },
    frutas: { kcal: 60, cho: 15, prot: 0, fat: 0 },
    lacteos: { kcal: 100, cho: 12, prot: 8, fat: 2 },
    grasas: { kcal: 45, cho: 0, prot: 0, fat: 5 }
  };

  useEffect(() => {
    const loadPatient = async () => {
      const found = await getPatientById(params.id);
      if (found) {
        setPatient(found);
        // Cargar recordatorio anterior si existe
      const savedReminder = localStorage.getItem(`r24h_${found.id}`);
      if (savedReminder) {
        setReminder(JSON.parse(savedReminder));
      }
      const savedNotes = localStorage.getItem(`r24h_notes_${found.id}`);
      if (savedNotes) {
        setR24hNotes(savedNotes);
      }
    }
    };
    loadPatient();
    // Cargar alimentos disponibles
    setFoods(loadFoods());
  }, [params.id]);

  if (!patient) return <div style={{ padding: '20px' }}>Cargando paciente...</div>;

  const handleAddFood = (mealName, food) => {
    const defaultMac = groupMacros[food.groupKey] || { kcal: 0, cho: 0, prot: 0, fat: 0 };
    const newEntry = {
      id: 'e_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      foodId: food.id,
      name: food.name,
      portion: food.portion,
      groupKey: food.groupKey,
      portionsQty: 1, // Por defecto 1 porción
      kcal: defaultMac.kcal,
      cho: defaultMac.cho,
      prot: defaultMac.prot,
      fat: defaultMac.fat
    };

    setReminder(prev => ({
      ...prev,
      [mealName]: [...prev[mealName], newEntry]
    }));
    showToast(`${food.name} agregado a ${mealName}`, 'success');
  };

  const handleQuantityChange = (mealName, entryId, qty) => {
    const parsedQty = parseFloat(qty) || 0;
    setReminder(prev => {
      const updatedList = prev[mealName].map(entry => {
        if (entry.id === entryId) {
          const defaultMac = groupMacros[entry.groupKey] || { kcal: 0, cho: 0, prot: 0, fat: 0 };
          return {
            ...entry,
            portionsQty: parsedQty,
            kcal: defaultMac.kcal * parsedQty,
            cho: defaultMac.cho * parsedQty,
            prot: defaultMac.prot * parsedQty,
            fat: defaultMac.fat * parsedQty
          };
        }
        return entry;
      });
      return { ...prev, [mealName]: updatedList };
    });
  };

  const handleRemoveEntry = (mealName, entryId) => {
    setReminder(prev => ({
      ...prev,
      [mealName]: prev[mealName].filter(entry => entry.id !== entryId)
    }));
    showToast('Alimento removido', 'info');
  };

  // Totales
  const calculateTotals = () => {
    let kcal = 0, cho = 0, prot = 0, fat = 0;
    Object.values(reminder).forEach(mealEntries => {
      mealEntries.forEach(e => {
        kcal += e.kcal;
        cho += e.cho;
        prot += e.prot;
        fat += e.fat;
      });
    });
    return { kcal, cho, prot, fat };
  };

  const totals = calculateTotals();
  const targetKcal = parseFloat(patient.dietForm?.rct || 1700);

  const saveReminder = () => {
    localStorage.setItem(`r24h_${patient.id}`, JSON.stringify(reminder));
    localStorage.setItem(`r24h_notes_${patient.id}`, r24hNotes);
    
    // Guardar en el historial del paciente también para registrar la evaluación nutricional
    const savedPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const updatedPatients = savedPatients.map(p => {
      if (p.id === patient.id) {
        return {
          ...p,
          r24hTotals: totals,
          lastReminderDate: new Date().toISOString().split('T')[0]
        };
      }
      return p;
    });
    localStorage.setItem('nutri_patients', JSON.stringify(updatedPatients));
    showToast('¡Recordatorio 24 horas guardado con éxito!', 'success');
  };

  // Filtrado de alimentos para la búsqueda
  const filteredFoods = foods.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5); // Mostrar máximo 5 sugerencias rápidas

  return (
    <div style={{ padding: '20px', paddingBottom: '120px' }} className="fade-in">
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href={`/nutri/patient/${patient.id}`} style={{ color: 'var(--text-primary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-primary)' }}>Recordatorio 24h</h2>
          <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Evaluación dietética de {patient.name}</p>
        </div>
      </header>

      {/* Resumen de Ingesta vs Target */}
      <section className="glass-panel" style={{ 
        background: 'var(--card-green)', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '24px', 
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(29,81,45,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: '800', letterSpacing: '1px' }}>CONSUMO TOTAL ESTIMADO</p>
            <p style={{ fontSize: '2rem', fontWeight: '900', lineHeight: 1 }}>
              {totals.kcal.toFixed(0)} <span style={{ fontSize: '1rem', fontWeight: '750' }}>Kcal</span>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: '800', letterSpacing: '1px' }}>META PRESCRITA (RCT)</p>
            <p style={{ fontSize: '1.3rem', fontWeight: '900' }}>{targetKcal} Kcal</p>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', height: '8px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ 
            width: `${Math.min(100, (totals.kcal / targetKcal) * 100)}%`, 
            height: '100%', 
            background: totals.kcal > targetKcal * 1.1 ? '#EF5350' : 'var(--accent)', 
            borderRadius: '10px', 
            transition: 'width 0.4s' 
          }} />
        </div>

        {/* Tabla Básica de Macros Recolectados */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
          {[
            { label: 'CARBOHIDRATOS', val: totals.cho, color: '#FFA500' },
            { label: 'PROTEÍNAS', val: totals.prot, color: '#EF5350' },
            { label: 'LÍPIDOS / GRASAS', val: totals.fat, color: '#CBBC1E' }
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '14px' }}>
              <p style={{ fontSize: '0.55rem', fontWeight: '800', opacity: 0.8, color: m.color }}>{m.label}</p>
              <p style={{ fontSize: '1.2rem', fontWeight: '900', marginTop: '4px' }}>{m.val.toFixed(1)}<span style={{ fontSize: '0.65rem' }}>g</span></p>
              <p style={{ fontSize: '0.6rem', opacity: 0.6 }}>{m.val ? (m.val * (m.label.startsWith('LÍP') ? 9 : 4)).toFixed(0) : 0} kcal</p>
            </div>
          ))}
        </div>
      </section>

      {/* Buscador de Alimentos */}
      <section className="glass-panel" style={{ padding: '18px', background: 'white', marginBottom: '24px' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
          Buscar Alimento para añadir
        </p>
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Escribe el nombre del alimento (ej. Arepa, Pollo, Leche...)" 
            className="input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 0 }}
          />
          {searchTerm && (
            <div style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              background: 'white', 
              boxShadow: '0 6px 20px rgba(0,0,0,0.1)', 
              borderRadius: '12px', 
              zIndex: 10,
              marginTop: '4px',
              border: '1px solid rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}>
              {filteredFoods.length === 0 ? (
                <div style={{ padding: '12px', fontSize: '0.85rem', opacity: 0.5, textAlign: 'center' }}>
                  No se encontraron alimentos. Abre <Link href="/nutri/foods" style={{fontWeight: '700', color: 'var(--primary)'}}>Mis Alimentos</Link> para agregarlo.
                </div>
              ) : (
                filteredFoods.map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      handleAddFood(activeMeal, f);
                      setSearchTerm('');
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{f.name}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '8px' }}>({f.portion})</span>
                    </div>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      background: 'rgba(0,0,0,0.05)', 
                      padding: '2px 8px', 
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      fontWeight: '800'
                    }}>{f.groupKey}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* Tabs por Comida */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px', WebkitOverflowScrolling: 'touch' }}>
        {meals.map(m => (
          <button 
            key={m}
            onClick={() => setActiveMeal(m)}
            style={{
              padding: '10px 16px',
              borderRadius: '16px',
              border: 'none',
              background: activeMeal === m ? 'var(--primary)' : 'white',
              color: activeMeal === m ? 'white' : 'var(--text-primary)',
              fontWeight: '900',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {m}
            {reminder[m]?.length > 0 && (
              <span style={{ 
                background: activeMeal === m ? 'white' : 'var(--primary)', 
                color: activeMeal === m ? 'var(--primary)' : 'white', 
                borderRadius: '50%', 
                width: '18px', 
                height: '18px', 
                fontSize: '0.7rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                {reminder[m].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alimentos de la Comida Seleccionada */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '12px' }}>
        Detalle de {activeMeal}
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(!reminder[activeMeal] || reminder[activeMeal].length === 0) ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', background: 'rgba(0,0,0,0.01)', opacity: 0.5 }}>
            <p style={{ fontSize: '0.85rem' }}>No hay alimentos registrados en el {activeMeal}.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Búscalo arriba y añádelo con un click.</p>
          </div>
        ) : (
          reminder[activeMeal].map(entry => (
            <div key={entry.id} className="glass-panel" style={{ 
              padding: '16px', 
              background: 'white', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: 'var(--shadow-subtle)'
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '900', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{entry.name}</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Porción ref: {entry.portion}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.7rem', background: '#FFF3E0', color: '#E65100', padding: '2px 8px', borderRadius: '4px' }}>{entry.kcal.toFixed(0)} kcal</span>
                  <span style={{ fontSize: '0.7rem', background: '#ECEFF1', color: '#37474F', padding: '2px 8px', borderRadius: '4px' }}>C: {entry.cho.toFixed(0)}g</span>
                  <span style={{ fontSize: '0.7rem', background: '#ECEFF1', color: '#37474F', padding: '2px 8px', borderRadius: '4px' }}>P: {entry.prot.toFixed(0)}g</span>
                  <span style={{ fontSize: '0.7rem', background: '#ECEFF1', color: '#37474F', padding: '2px 8px', borderRadius: '4px' }}>G: {entry.fat.toFixed(0)}g</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.5, marginBottom: '2px' }}>RACIONES</span>
                  <input 
                    type="number" 
                    step="0.25"
                    min="0.25"
                    className="input-field"
                    value={entry.portionsQty}
                    onChange={(e) => handleQuantityChange(activeMeal, entry.id, e.target.value)}
                    style={{ width: '60px', padding: '6px', textAlign: 'center', fontSize: '0.9rem', marginBottom: 0, borderRadius: '8px' }}
                  />
                </div>
                <button 
                  onClick={() => handleRemoveEntry(activeMeal, entry.id)}
                  style={{ background: 'none', border: 'none', color: '#EF5350', cursor: 'pointer', padding: '8px' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notas Manuales del Recordatorio */}
      <section className="glass-panel" style={{ padding: '18px', background: 'white', marginTop: '24px', marginBottom: '24px' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
          Notas Manuales / Observaciones del Recordatorio
        </p>
        <textarea
          placeholder="Escribe aquí observaciones, hábitos o notas del recordatorio..."
          className="input-field"
          value={r24hNotes}
          onChange={(e) => setR24hNotes(e.target.value)}
          style={{ width: '100%', minHeight: '100px', padding: '12px', fontSize: '0.9rem', borderRadius: '12px', resize: 'vertical' }}
        />
      </section>

      {/* Botones de Guardar y Cerrar fijos en el footer */}
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
        zIndex: 100
      }}>
        <button 
          onClick={() => {
            saveReminder();
            router.push(`/nutri/patient/${patient.id}`);
          }}
          className="btn-accent" 
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '16px', fontWeight: '900' }}
        >
          <Save size={18} /> Guardar R24H
        </button>
      </div>

    </div>
  );
}
