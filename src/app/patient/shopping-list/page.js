'use client';
import { useState } from 'react';
import TabBar from '@/components/patient/TabBar';
import { ShoppingBag, CheckCircle2, ChevronRight, Calculator, Calendar } from 'lucide-react';

export default function ShoppingList() {
  const [step, setStep] = useState(1); // 1: Duration, 2: Selection, 3: Summary
  const [duration, setDuration] = useState(1); // weeks
  const [selections, setSelections] = useState({});

  const groups = [
    { 
      id: 'proteinas', 
      name: 'Proteínas', 
      color: '#FF0000',
      rule: 'Escoge 3 (2 para cocinar, 1 sin cocción)',
      needed: 3,
      subtypes: [
        { label: 'Para cocinar', count: 2, examples: ['Pollo', 'Pescado', 'Carne Molida', 'Lomo de cerdo'] },
        { label: 'Sin cocción', count: 1, examples: ['Jamón de pavo', 'Huevo duro', 'Atún en lata'] }
      ]
    },
    { 
      id: 'cereales', 
      name: 'Cereales', 
      color: '#FFA500',
      rule: 'Escoge 3 (2 para cocinar, 1 sin cocción)',
      needed: 3,
      subtypes: [
        { label: 'Para cocinar', count: 2, examples: ['Arroz', 'Batata', 'Pasta Integral', 'Quinoa'] },
        { label: 'Sin cocción', count: 1, examples: ['Pan integral', 'Tortillas de maíz', 'Cereal sin azúcar'] }
      ]
    },
    { 
      id: 'vegetales', 
      name: 'Vegetales', 
      color: '#228B22',
      rule: 'Escoge 3 (1 cocinar, 1 sin cocción, 1 verde)',
      needed: 3,
      subtypes: [
        { label: 'Para cocinar', count: 1, examples: ['Pimentón', 'Zanahoria', 'Calabacín'] },
        { label: 'Sin cocción', count: 1, examples: ['Cebolla', 'Tomate', 'Pepino'] },
        { label: 'Verde', count: 1, examples: ['Rúcula', 'Espinaca', 'Lechuga'] }
      ]
    },
    { 
      id: 'grasas', 
      name: 'Grasas', 
      color: '#FFD700',
      rule: 'Escoge 2 (1 para preparar, 1 rápida)',
      needed: 2,
      subtypes: [
        { label: 'Para preparar', count: 1, examples: ['Aguacate', 'Aceite de oliva', 'Mantequilla de maní'] },
        { label: 'Rápida', count: 1, examples: ['Frutos secos', 'Aceitunas', 'Semillas'] }
      ]
    },
    { 
      id: 'frutas', 
      name: 'Frutas', 
      color: '#BA55D3',
      rule: 'Escoge 3 (2 para picar, 1 rápida)',
      needed: 3,
      subtypes: [
        { label: 'Para picar', count: 2, examples: ['Piña', 'Melón', 'Kiwi', 'Lechosa'] },
        { label: 'Rápida', count: 1, examples: ['Manzana', 'Banana', 'Mandarina'] }
      ]
    },
    { 
      id: 'snacks', 
      name: 'Snacks', 
      color: '#708090',
      rule: 'Escoge 2 (1 dulce, 1 salada)',
      needed: 2,
      subtypes: [
        { label: 'Dulce', count: 1, examples: ['Yogurt Griego', 'Chocolate oscuro', 'Gelatina light'] },
        { label: 'Salada', count: 1, examples: ['Granola', 'Galletas de maíz', 'Frutos secos salados'] }
      ]
    }
  ];

  const handleToggle = (groupPath, item) => {
    const current = selections[groupPath] || [];
    if (current.includes(item)) {
      setSelections({ ...selections, [groupPath]: current.filter(i => i !== item) });
    } else {
      setSelections({ ...selections, [groupPath]: [...current, item] });
    }
  };

  const renderStep1 = () => (
    <div className="fade-in">
      <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', textAlign: 'center' }}>¿Para cuánto tiempo quieres planear?</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { label: '1 Semana', val: 1 },
          { label: '2 Semanas', val: 2 },
          { label: '1 Mes', val: 4 }
        ].map((d) => (
          <button 
            key={d.val}
            onClick={() => { setDuration(d.val); setStep(2); }}
            style={{ 
              padding: '24px', 
              borderRadius: '20px', 
              border: duration === d.val ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.1)',
              background: duration === d.val ? 'var(--card-green-light)' : 'white',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar size={24} color="var(--primary)" />
              {d.label}
            </div>
            <ChevronRight size={20} opacity={0.3} />
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="fade-in">
      <header style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem' }}>Arma tu Lista</h2>
        <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>Selecciona tus opciones favoritas según las reglas</p>
      </header>

      {groups.map((group) => (
        <section key={group.id} className="glass-panel shadow-premium" style={{ marginBottom: '24px', overflow: 'hidden' }}>
          <div style={{ background: group.color, color: 'white', padding: '12px 20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{group.name.toUpperCase()}</h3>
            <p style={{ fontSize: '0.7rem', opacity: 0.9 }}>{group.rule}</p>
          </div>
          
          <div style={{ padding: '16px' }}>
            {group.subtypes.map((sub) => {
              const path = `${group.id}_${sub.label}`;
              const selectedCount = (selections[path] || []).length;
              const isDone = selectedCount >= sub.count;

              return (
                <div key={sub.label} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>{sub.label} ({selectedCount}/{sub.count})</p>
                    {isDone && <CheckCircle2 size={16} color="var(--primary)" />}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {sub.examples.map(item => {
                      const isSel = (selections[path] || []).includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => handleToggle(path, item)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            border: isSel ? 'none' : '1px solid rgba(0,0,0,0.1)',
                            background: isSel ? group.color : 'rgba(0,0,0,0.03)',
                            color: isSel ? 'white' : 'inherit',
                            boxShadow: isSel ? `0 2px 8px ${group.color}44` : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <button 
        onClick={() => setStep(3)}
        style={{ 
          width: '100%', 
          padding: '18px', 
          background: 'var(--primary)', 
          color: 'white', 
          borderRadius: '16px', 
          fontSize: '1.1rem', 
          fontWeight: '900',
          boxShadow: '0 4px 14px rgba(29,81,45,0.3)',
          marginBottom: '40px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Generar Lista de Compras
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="fade-in">
      <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center' }}>Tu Lista de Mercado</h2>
      <p style={{ textAlign: 'center', opacity: 0.6, marginBottom: '24px' }}>Calculada para {duration} {duration === 1 ? 'semana' : 'semanas'}</p>

      <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow-premium)', marginBottom: '32px', color: 'black' }}>
        {groups.map(group => {
          const allSelected = group.subtypes.flatMap(sub => selections[`${group.id}_${sub.label}`] || []);
          if (allSelected.length === 0) return null;

          return (
            <div key={group.id} style={{ marginBottom: '24px' }}>
              <h3 style={{ borderBottom: `2px solid ${group.color}`, paddingBottom: '4px', marginBottom: '12px', fontSize: '1rem', color: group.color, fontWeight: '800' }}>
                {group.name}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {allSelected.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', fontSize: '1rem', color: '#333', fontWeight: '500' }}>
                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(0,0,0,0.2)', borderRadius: '4px' }}></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <button 
        onClick={() => window.print()}
        style={{
          width: '100%',
          padding: '18px',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          fontSize: '1rem',
          fontWeight: '900',
          marginBottom: '12px',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(29,81,45,0.3)'
        }}
      >
        Imprimir / Guardar PDF
      </button>

      <button 
        onClick={() => { setStep(1); setSelections({}); }}
        style={{ width: '100%', padding: '12px', background: 'none', border: 'none', opacity: 0.5, fontSize: '0.9rem' }}
      >
        Empezar de nuevo
      </button>
    </div>
  );

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', background: 'var(--card-yellow)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShoppingBag color="white" size={20} />
        </div>
        <h1 style={{ fontSize: '1.4rem', color: 'var(--primary)', fontWeight: '800' }}>Mercado Nutrimemi</h1>
      </header>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      <TabBar />
    </div>
  );
}
