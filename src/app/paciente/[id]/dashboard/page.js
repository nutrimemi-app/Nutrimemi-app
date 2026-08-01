'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Activity, Calendar, User, History } from 'lucide-react';

const exchangeMeals = [
  { key: 'desayuno', name: 'Desayuno' },
  { key: 'meriendaAM', name: 'Merienda AM' },
  { key: 'almuerzo', name: 'Almuerzo' },
  { key: 'meriendaPM', name: 'Merienda PM' },
  { key: 'cena', name: 'Cena' }
];

const EXCHANGE_GUIDE_DB = {
  cereales: {
    name: 'CEREALES',
    color: '#FFA500',
    textColor: 'white',
    foods: [
      { name: 'Granos / Batata / Papa / Arroz / Yuca / Puré', base: 0.5, unit: 'taza' },
      { name: 'Tortilla de yuca / pan integral (tostado)', base: 1, unit: 'unidad' },
      { name: 'Plátano', base: 0.25, unit: 'plátano' },
      { name: 'Avena / Harina de maíz / Harina de yuca / Harina de avena', base: 2, unit: 'cucharadas', alt: 15 },
      { name: 'Miel', base: 1, unit: 'cucharada', alt: 15 }
    ]
  },
  proteinas: {
    name: 'CARNES / PROTEÍNA',
    color: '#FF0000',
    textColor: 'white',
    foods: [
      { name: 'Atún en lata / Carne / Pollo / Salmón / Camarones', base: 0.25, unit: 'taza', alt: 120 },
      { name: 'Queso paisa / Jamón de pavo', base: 2, unit: 'rebanadas finas', alt: 15 },
      { name: 'Guayanés / Ricotta / Cuajada / Palmita / Palmizulia', base: 0.25, unit: 'taza', alt: 120 },
      { name: 'Huevo', base: 1, unit: 'unidad' },
      { name: 'Claras de huevo', base: 2, unit: 'unidades', alt: 30 }
    ]
  },
  vegetales: {
    name: 'VEGETALES',
    color: '#228B22',
    textColor: 'white',
    foods: [
      { name: 'Vegetales crudos', base: 1, unit: 'taza' },
      { name: 'Vegetales cocidos', base: 0.5, unit: 'taza' },
      { name: 'Los vegetales que desees', base: null, unit: 'Libre' }
    ]
  },
  frutas: {
    name: 'FRUTAS',
    color: '#BA55D3',
    textColor: 'white',
    foods: [
      { name: 'Fruta pequeña/mediana o picada', base: 1, unit: 'unidad o 1 taza' },
      { name: 'Las frutas que desees menos cítricas', base: null, unit: 'Libre' }
    ]
  },
  lacteos: {
    name: 'LÁCTEOS',
    color: '#1E90FF',
    textColor: 'white',
    foods: [
      { name: 'Yogurt griego', base: 0.75, unit: 'taza' },
      { name: 'Requesón', base: 30, unit: 'g' },
      { name: 'Leche descremada', base: 1, unit: 'taza' }
    ]
  },
  grasas: {
    name: 'GRASAS',
    color: '#FFD700',
    textColor: '#1d512d',
    foods: [
      { name: 'Queso mozzarella / Tocineta / Aguacate', base: 2, unit: 'rebanadas', alt: 15 },
      { name: 'Queso crema / salsas', base: 1, unit: 'cucharada' },
      { name: 'Mantequilla / aceites / mantequilla de frutos secos', base: 2, unit: 'cucharaditas' },
      { name: 'Frutos secos', base: 10, unit: 'unidades' },
      { name: 'Leche vegetal', base: 1, unit: 'taza' },
      { name: 'Harina de almendra', base: 20, unit: 'g' }
    ]
  }
};

const displayCalculatedPortion = (food, targetVal) => {
  if (targetVal === 0 || isNaN(targetVal)) {
    if (food.base === null) return food.unit;
    return `1 Ración = ${food.base} ${food.unit}${food.alt ? ` (${food.alt * 1}g)` : ''}`;
  }
  if (food.base === null) return `${food.unit} (Libre)`;
  const totalVal = food.base * targetVal;
  
  const formatValue = (v) => {
    if (v % 1 === 0) return v.toString();
    if (v === 0.25) return '1/4';
    if (v === 0.5) return '1/2';
    if (v === 0.75) return '3/4';
    if (v === 1.25) return '1 y 1/4';
    if (v === 1.5) return '1 y 1/2';
    if (v === 1.75) return '1 y 3/4';
    return v.toFixed(1).replace('.0', '');
  };
  
  return `${targetVal} ración${targetVal > 1 ? 'es' : ''} = ${formatValue(totalVal)} ${food.unit}${food.alt ? ` (${food.alt * targetVal}g)` : ''}`;
};

export default function PatientDashboard() {
  const params = useParams();
  const [patient, setPatient] = useState(null);
  const [activeTip, setActiveTip] = useState(null);
  const [activeTool, setActiveTool] = useState(null); // 'palma', 'tazas', 'cucharas'
  const [selectedExchangeMeal, setSelectedExchangeMeal] = useState('desayuno');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const found = saved.find(p => p.id === parseInt(params.id));
    if (found) setPatient(found);
  }, [params.id]);

  const foodGroups = {
    cereales: { color: '#FFA500', name: 'Almidones' },
    proteinas: { color: '#FF0000', name: 'Proteínas' },
    vegetales: { color: '#228B22', name: 'Veg' },
    frutas: { color: '#BA55D3', name: 'Frutas' },
    lacteos: { color: '#1E90FF', name: 'Lácteos' },
    grasas: { color: '#FFD700', name: 'Grasas' }
  };

  if (!patient) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando tu plan...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#1d512d' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '40px' }}>
         <h1 style={{ fontSize: '2.5rem', fontWeight: '900' }}>¡Hola, {patient.name.split(' ')[0]}!</h1>
         <p style={{ fontSize: '1.1rem', fontWeight: '700', opacity: 0.8 }}>Tu Plan Nutricional Personalizado</p>
      </header>

      {/* Tabla de Menú */}
      <section style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', border: '2px solid #1d512d', marginBottom: '40px' }}>
         <h3 style={{ background: '#1d512d', color: 'white', padding: '15px', textAlign: 'center', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>MI MENÚ SEMANAL</h3>
         
         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                   <tr style={{ background: '#f5f5f5' }}>
                      {['DESAYUNO', 'MERIENDA', 'ALMUERZO', 'MERIENDA', 'CENA'].map((label, idx) => (
                        <th key={idx} style={{ padding: '15px 10px', fontSize: '0.8rem', fontWeight: '900', border: '1px solid #1d512d' }}>{label}</th>
                      ))}
                   </tr>
                </thead>
                <tbody>
                   {Array.from({ length: Math.max(...Object.values(patient.menu || {}).map(m => m.selectedFoods?.length || 0), 1) }).map((_, rowIdx) => (
                      <tr key={rowIdx}>
                         {['desayuno', 'meriendaAM', 'almuerzo', 'meriendaPM', 'cena'].map(mealKey => {
                            const food = patient.menu?.[mealKey]?.selectedFoods?.[rowIdx];
                            const group = food ? foodGroups[food.groupKey] : null;
                            return (
                               <td key={mealKey} style={{ padding: '15px 10px', border: '1px solid #eee', verticalAlign: 'top', height: '120px' }}>
                                  {food ? (
                                     <div style={{ fontSize: '0.8rem', borderLeft: `4px solid ${group.color}`, paddingLeft: '8px' }}>
                                        <p style={{ margin: '0 0 4px 0', fontWeight: '900', color: group.color }}>{food.portion}</p>
                                        <p style={{ margin: 0, fontWeight: '700', color: '#1d512d' }}>{food.name}</p>
                                     </div>
                                  ) : <div style={{ opacity: 0.1, fontSize: '0.7rem', textAlign: 'center' }}>-</div>}
                               </td>
                            );
                         })}
                      </tr>
                   ))}
                </tbody>
            </table>
         </div>
      </section>

      {/* SECCIÓN INTERACTIVA: MENÚ DÍA E INTERCAMBIOS (COMO EL EJEMPLO DE LA INFOGRAFÍA) */}
      <section className="glass-panel" style={{ 
        background: 'white', 
        borderRadius: '24px', 
        padding: '24px', 
        border: '2px solid #1d512d', 
        boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
        marginBottom: '40px'
      }}>
        <h3 style={{ 
          color: '#1d512d', 
          fontSize: '1.3rem', 
          fontWeight: '900', 
          margin: '0 0 8px 0',
          textAlign: 'center' 
        }}>
          🥑 MENÚ DINÁMICO E INTERCAMBIOS
        </h3>
        <p style={{ 
          fontSize: '0.85rem', 
          fontWeight: '700', 
          opacity: 0.7, 
          textAlign: 'center', 
          margin: '0 0 24px 0' 
        }}>
          Selecciona un plato para ver las porciones asignadas y se auto-rellenarán las cantidades de intercambio automáticamente.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* LADO IZQUIERDO: MENÚ (Amarillo-Mostaza estilo la guía) */}
          <div style={{ 
            background: '#F9FBE7', 
            border: '2.5px solid #AFB42B', 
            borderRadius: '20px', 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            alignSelf: 'start'
          }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '950', margin: '0 0 10px 0', color: '#1d512d', textAlign: 'center', borderBottom: '2.5px solid #AFB42B', paddingBottom: '8px' }}>
              DISTRIBUCIÓN
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {exchangeMeals.map(m => {
                const isActive = selectedExchangeMeal === m.key;
                const mealPortions = patient.menu?.[m.key]?.portions || {};
                const hasPortions = Object.values(mealPortions).some(val => parseFloat(val) > 0);
                
                return (
                  <div 
                    key={m.key} 
                    onClick={() => setSelectedExchangeMeal(m.key)}
                    style={{ 
                      padding: '12px 14px', 
                      borderRadius: '12px',
                      background: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                      border: isActive ? '2px solid #AFB42B' : '2px solid transparent',
                      boxShadow: isActive ? '0 8px 20px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <p style={{ margin: '0 0 6px 0', fontWeight: '950', fontSize: '0.85rem', textTransform: 'uppercase', color: isActive ? '#1d512d' : '#555' }}>
                      {m.name}
                    </p>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {Object.keys(EXCHANGE_GUIDE_DB).map(groupKey => {
                        const target = parseFloat(mealPortions[groupKey]) || 0;
                        if (target === 0) return null;
                        const groupMeta = EXCHANGE_GUIDE_DB[groupKey];
                        return (
                          <div key={groupKey} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '800', color: '#1d512d' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: groupMeta.color, display: 'inline-block' }}></span>
                            <span>{groupMeta.name.split('/')[0].split(' ')[0]}: {target}</span>
                          </div>
                        );
                      })}
                      {!hasPortions && (
                        <span style={{ fontSize: '0.65rem', opacity: 0.5, fontStyle: 'italic', color: '#555' }}>Sin porciones objetivo</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LADO DERECHO: INTERCAMBIOS AUTO-RELLENADOS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '900', margin: '0 0 4px 0', color: '#1d512d' }}>
              📋 TABLA DE INTERCAMBIOS PARA: <span style={{ textTransform: 'uppercase', color: '#1d512d', fontWeight: '950' }}>{exchangeMeals.find(em => em.key === selectedExchangeMeal)?.name}</span>
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(EXCHANGE_GUIDE_DB).map(([groupKey, groupMeta]) => {
                const targetVal = parseFloat(patient.menu?.[selectedExchangeMeal]?.portions?.[groupKey]) || 0;
                
                return (
                  <div key={groupKey} style={{ border: `1.5px solid ${groupMeta.color}`, borderRadius: '16px', overflow: 'hidden' }}>
                    {/* Header del Grupo */}
                    <div style={{ 
                      background: groupMeta.color, 
                      color: groupMeta.textColor, 
                      padding: '10px 14px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontWeight: '950',
                      fontSize: '0.85rem'
                    }}>
                      <span>{groupMeta.name}</span>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem' }}>
                        Meta: {targetVal} ración{targetVal !== 1 ? 'es' : ''}
                      </span>
                    </div>
                    
                    {/* Lista de Alimentos con Cálculo de Porciones */}
                    <div style={{ background: '#fafafa', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {groupMeta.foods.map((food, idx) => (
                        <div key={idx} style={{ 
                          borderBottom: idx < groupMeta.foods.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                          paddingBottom: idx < groupMeta.foods.length - 1 ? '6px' : 0,
                          fontSize: '0.8rem',
                          fontWeight: '700'
                        }}>
                          <p style={{ margin: '0 0 3px 0', color: '#333' }}>{food.name}</p>
                          <p style={{ margin: 0, color: groupMeta.color === '#FFD700' ? '#b59c00' : groupMeta.color, fontSize: '0.75rem', fontWeight: '900' }}>
                            👉 {displayCalculatedPortion(food, targetVal)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN INTERACTIVA: TIPS DE MEDICIÓN NUTRIMEMI */}
      <section className="glass-panel" style={{ 
        background: 'white', 
        borderRadius: '24px', 
        padding: '24px', 
        border: '2px solid #1d512d', 
        boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
        marginBottom: '40px'
      }}>
        <h3 style={{ 
          color: '#1d512d', 
          fontSize: '1.3rem', 
          fontWeight: '900', 
          margin: '0 0 8px 0',
          textAlign: 'center' 
        }}>
          💡 GUÍA INTERACTIVA DE PORCIONES
        </h3>
        <p style={{ 
          fontSize: '0.85rem', 
          fontWeight: '700', 
          opacity: 0.7, 
          textAlign: 'center', 
          margin: '0 0 24px 0' 
        }}>
          Haz clic en cualquier elemento o tip para aprender a medir correctamente.
        </p>

        {/* CONTENEDOR DE HERRAMIENTAS VISUALES */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
          gap: '16px', 
          marginBottom: '28px' 
        }}>
          {/* Tarjeta de la Palma */}
          <div 
            onClick={() => setActiveTool(activeTool === 'palma' ? null : 'palma')}
            style={{ 
              background: activeTool === 'palma' ? 'rgba(29, 81, 45, 0.08)' : 'rgba(0,0,0,0.02)',
              border: activeTool === 'palma' ? '2px solid #1d512d' : '2px dashed rgba(29, 81, 45, 0.2)',
              borderRadius: '16px',
              padding: '16px 8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              transform: activeTool === 'palma' ? 'scale(1.02)' : 'none'
            }}
          >
            <svg viewBox="0 0 100 120" style={{ width: '60px', height: '70px', margin: '0 auto 10px auto' }}>
              <path d="M30,110 C30,90 20,80 15,60 C12,50 15,40 20,40 C23,40 26,45 28,50 L28,25 C28,20 32,20 34,25 L34,15 C34,10 38,10 40,15 L40,10 C40,5 44,5 46,10 L46,20 C46,15 50,15 52,20 L52,55 C55,50 63,55 60,65 C58,75 52,90 52,110 Z" fill="#FFE0B2" stroke="#E0A96D" strokeWidth="1.5" />
              <circle cx="39" cy="65" r="14" fill="none" stroke="#FF5252" strokeWidth="2" strokeDasharray="3,1" />
            </svg>
            <p style={{ fontSize: '0.75rem', fontWeight: '900', margin: 0 }}>PALMA DE LA MANO</p>
            <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#1d512d', opacity: 0.6 }}>Proteínas</span>
          </div>

          {/* Tarjeta de Tazas Medidoras */}
          <div 
            onClick={() => setActiveTool(activeTool === 'tazas' ? null : 'tazas')}
            style={{ 
              background: activeTool === 'tazas' ? 'rgba(29, 81, 45, 0.08)' : 'rgba(0,0,0,0.02)',
              border: activeTool === 'tazas' ? '2px solid #1d512d' : '2px dashed rgba(29, 81, 45, 0.2)',
              borderRadius: '16px',
              padding: '16px 8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              transform: activeTool === 'tazas' ? 'scale(1.02)' : 'none'
            }}
          >
            <svg viewBox="0 0 100 80" style={{ width: '70px', height: '70px', margin: '0 auto 10px auto' }}>
              <ellipse cx="40" cy="50" rx="30" ry="12" fill="#E8F5E9" stroke="#1d512d" strokeWidth="2" />
              <path d="M10,50 L10,65 C10,72 70,72 70,65 L70,50" fill="#C8E6C9" stroke="#1d512d" strokeWidth="2" />
              <line x1="70" y1="58" x2="90" y2="58" stroke="#1d512d" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: '0.75rem', fontWeight: '900', margin: 0 }}>TAZAS MEDIDORAS</p>
            <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#1d512d', opacity: 0.6 }}>No de café</span>
          </div>

          {/* Tarjeta de Cucharas Medidoras */}
          <div 
            onClick={() => setActiveTool(activeTool === 'cucharas' ? null : 'cucharas')}
            style={{ 
              background: activeTool === 'cucharas' ? 'rgba(29, 81, 45, 0.08)' : 'rgba(0,0,0,0.02)',
              border: activeTool === 'cucharas' ? '2px solid #1d512d' : '2px dashed rgba(29, 81, 45, 0.2)',
              borderRadius: '16px',
              padding: '16px 8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              transform: activeTool === 'cucharas' ? 'scale(1.02)' : 'none'
            }}
          >
            <svg viewBox="0 0 100 80" style={{ width: '70px', height: '70px', margin: '0 auto 10px auto' }}>
              <circle cx="30" cy="40" r="16" fill="#FFF3E0" stroke="#E65100" strokeWidth="2" />
              <line x1="46" y1="40" x2="85" y2="40" stroke="#E65100" strokeWidth="3" />
              <circle cx="45" cy="50" r="10" fill="#E0F7FA" stroke="#006064" strokeWidth="2" />
              <line x1="55" y1="50" x2="85" y2="50" stroke="#006064" strokeWidth="2" />
            </svg>
            <p style={{ fontSize: '0.75rem', fontWeight: '900', margin: 0 }}>CUCHARAS MEDIDORAS</p>
            <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#1d512d', opacity: 0.6 }}>Al ras</span>
          </div>
        </div>

        {/* DETALLE DE HERRAMIENTA SELECCIONADA */}
        {activeTool && (
          <div style={{ 
            background: 'rgba(29, 81, 45, 0.05)', 
            borderLeft: '4px solid #1d512d', 
            padding: '16px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            animation: 'fadeIn 0.3s ease'
          }}>
            {activeTool === 'palma' && (
              <>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: '900' }}>✋ Del tamaño de la palma de tu mano</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', lineHeight: 1.4, opacity: 0.85 }}>
                  Usa el grosor y diámetro de tu propia palma como referencia visual (excluyendo los dedos) para calcular tu porción diaria de proteínas (carnes magras, pollo o pescado). Es tu medidor personal inmediato e intransferible.
                </p>
              </>
            )}
            {activeTool === 'tazas' && (
              <>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: '900' }}>☕ Tazas Medidoras (Standard)</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', lineHeight: 1.4, opacity: 0.85 }}>
                  Las tazas para medir porciones indicadas en tu plan son <strong>tazas medidoras de repostería</strong> (equivalentes a 240 ml). No utilices tazas de té, mug de café ni vasos ordinarios, ya que sus capacidades varían notablemente y pueden descarrilar tu control alimenticio.
                </p>
              </>
            )}
            {activeTool === 'cucharas' && (
              <>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: '900' }}>🥄 Cucharas Medidoras</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', lineHeight: 1.4, opacity: 0.85 }}>
                  Utiliza cucharadas dosificadoras (al ras) para aceites, mantequilla de maní, etc. Evita las cucharadas colmadas o copadas, ya que pueden triplicar el volumen calórico recomendado por porción.
                </p>
              </>
            )}
          </div>
        )}

        {/* ACORDEÓN DE TIPS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            {
              num: 1,
              title: "🥩 Proteínas Cocidas",
              desc: "Todos los gramos especificados para las proteínas en tu menú corresponden al alimento ya cocinado, no crudo. La proteína pierde peso y volumen durante la cocción, así que pésala o mídelas después de prepararla."
            },
            {
              num: 2,
              title: "☕ Tazas de Medición",
              desc: "Las tazas referidas son estrictamente tazas medidoras reposteras. Descarta tazas domésticas de café o té."
            },
            {
              num: 3,
              title: "🥄 Cucharadas Standard",
              desc: "Utiliza siempre cucharas medidoras de cocina oficiales. Una cuchara clásica de mesa no garantiza la porción exacta."
            },
            {
              num: 4,
              title: "💧 Hidratación Diaria",
              desc: "Consumiremos entre 2 y 2.5 litros de agua pura al día para asegurar el óptimo funcionamiento celular y digestivo."
            },
            {
              num: 5,
              title: "🧀 Tipo de Queso",
              desc: "Regla Nutrimemi: Todo queso que se derrita al calor cuenta como Grasa. Los quesos que posean mayor consistencia al calentarse (sin derretirse, como tipo paisa/blanco duro) cuentan como Proteína."
            },
            {
              num: 6,
              title: "🏃‍♂️ Ejercicio y Movimiento",
              desc: "Haz ejercicio un mínimo de 3 veces por semana. Una caminata de 30 minutos a paso sostenido es perfectamente válida y cuenta para tu plan."
            },
            {
              num: 7,
              title: "⚖️ Control de Peso Corporal",
              desc: "NO te peses a diario. El peso fluctúa constantemente por líquidos retenidos, hormonas o digestión y esto causa estrés y obsesión innecesaria."
            },
            {
              num: 8,
              title: "💬 Confianza y Dudas",
              desc: "Consúltame cualquier duda que se te ocurra directamente en nuestra consulta o expediente. Recuerda siempre la regla de oro: ¡Ninguna pregunta es obvia ni tonta!"
            }
          ].map(tip => {
            const isExpanded = activeTip === tip.num;
            return (
              <div 
                key={tip.num}
                style={{ 
                  borderRadius: '12px',
                  background: isExpanded ? 'rgba(29, 81, 45, 0.04)' : 'rgba(0,0,0,0.01)',
                  border: isExpanded ? '1px solid #1d512d' : '1px solid rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                  transition: 'all 0.2s'
                }}
              >
                <button 
                  onClick={() => setActiveTip(isExpanded ? null : tip.num)}
                  style={{ 
                    width: '100%',
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    color: '#1d512d',
                    fontWeight: '900',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>{tip.num}. {tip.title}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{isExpanded ? '▲' : '▼'}</span>
                </button>
                
                {isExpanded && (
                  <div style={{ 
                    padding: '0 18px 14px 18px', 
                    fontSize: '0.85rem', 
                    fontWeight: '700', 
                    opacity: 0.85, 
                    lineHeight: 1.4,
                    color: '#1d512d',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    {tip.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Notas y Observaciones */}
      {patient.details?.notes && (
        <section style={{ background: 'rgba(255,255,255,0.8)', padding: '24px', borderRadius: '20px', border: '1.5px dashed #1d512d', marginBottom: '40px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '900', marginBottom: '10px' }}>RECOMENDACIONES:</h4>
            <p style={{ fontSize: '1rem', lineHeight: '1.5', fontWeight: '600' }}>{patient.details.notes}</p>
        </section>
      )}

      <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
        <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1d512d' }}>nutrimemi</p>
      </div>
    </div>
  );
}
