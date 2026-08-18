'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Activity, Calendar, User, History, Camera, Upload } from 'lucide-react';
import { updatePatient } from '@/lib/patients';
import { usePatient } from '@/hooks/usePatient';

import { getMealTypes, MEAL_PLANS } from '@/utils/mealUtils';

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
  const { patient, status, setPatient } = usePatient(params.id);
  const [activeTip, setActiveTip] = useState(null);
  const [activeTool, setActiveTool] = useState(null); // 'palma', 'tazas', 'cucharas'
  const [selectedExchangeMeal, setSelectedExchangeMeal] = useState('');
  const [activeDay, setActiveDay] = useState('day1'); // 'day1' o 'day2'
  
  // Estados para la carga de fotos del paciente
  const [photoFile, setPhotoFile] = useState(null);
  const [photoLabel, setPhotoLabel] = useState('Frente');

  const handlePatientPhotoUpload = (e) => {
    e.preventDefault();
    if (!photoFile) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Str = reader.result;
      
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        const todayStr = new Date().toISOString().split('T')[0];
        
        const newPhotoItem = {
          id: `pat-${Date.now()}`,
          date: todayStr,
          uploadedBy: 'Paciente',
          label: photoLabel,
          url: compressedBase64,
          folder: `Sesión ${todayStr}`
        };
        
        const updatedGallery = [...(patient.photosGallery || []), newPhotoItem];
        const updatedPatient = { ...patient, photosGallery: updatedGallery };
        
        updatePatient(patient.id, { photosGallery: updatedGallery }).then(() => {
          setPatient(updatedPatient);
          setPhotoFile(null);
          alert('Foto subida con éxito');
        }).catch(err => {
          console.error('Error uploading photo:', err);
          alert('Error al subir foto');
        });
        
        const fileInput = document.getElementById('patient-photo-input');
        if (fileInput) fileInput.value = '';
      };
    };
    reader.readAsDataURL(photoFile);
  };

  const mealPlanKey = patient?.details?.mealPlan || '3+2 snacks';
  const currentMeals = getMealTypes(mealPlanKey);

  useEffect(() => {
    if (patient) {
      const keys = currentMeals.map(m => m.key);
      if (!selectedExchangeMeal || !keys.includes(selectedExchangeMeal)) {
        setSelectedExchangeMeal(keys[0] || 'desayuno');
      }
    }
  }, [patient, mealPlanKey, currentMeals]);

  const foodGroups = {
    cereales: { color: '#FFA500', name: 'Almidones' },
    proteinas: { color: '#FF0000', name: 'Proteínas' },
    vegetales: { color: '#228B22', name: 'Veg' },
    frutas: { color: '#BA55D3', name: 'Frutas' },
    lacteos: { color: '#1E90FF', name: 'Lácteos' },
    grasas: { color: '#FFD700', name: 'Grasas' }
  };

  const activeMenu = patient ? (patient.menus?.[activeDay] || (activeDay === 'day1' ? patient.menu : {})) : {};

  const activeDayKey = activeDay === 'day1' ? 'Menú Día 1' : 'Menú Día 2';

  if (status === 'loading') return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando tu plan...</div>;
  if (status === 'not-found' || status === 'error') return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1d512d', marginBottom: '16px' }}>Link Inválido</h2>
      <p style={{ opacity: 0.8 }}>Este link ya no es válido, no existe o ha expirado. Por favor, contacta a tu nutricionista.</p>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#1d512d' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '40px' }}>
         <h1 style={{ fontSize: '2.5rem', fontWeight: '900' }}>¡Hola, {patient.name.split(' ')[0]}!</h1>
         <p style={{ fontSize: '1.1rem', fontWeight: '700', opacity: 0.8 }}>Tu Plan Nutricional Personalizado</p>
      </header>

      {/* Selector de Día (☀️ / 🌙) */}
      {(patient.menus || patient.menu) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          {[
            { id: 'day1', label: '☀️ DÍA 1', activeColor: '#1d512d', bgColor: 'rgba(29, 81, 45, 0.1)' },
            { id: 'day2', label: '🌙 DÍA 2', activeColor: '#827717', bgColor: '#F9FBE7' }
          ].map(day => (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id)}
              style={{
                padding: '10px 24px',
                borderRadius: '16px',
                border: activeDay === day.id ? `2px solid ${day.activeColor}` : '1.5px solid rgba(0,0,0,0.08)',
                background: activeDay === day.id ? day.bgColor : 'white',
                color: activeDay === day.id ? day.activeColor : '#666',
                fontWeight: '900',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeDay === day.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {day.label}
            </button>
          ))}
        </div>
      )}

      {/* Tabla de Menú */}
      <section style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', border: '2px solid #1d512d', marginBottom: '40px' }}>
         <h3 style={{ background: '#1d512d', color: 'white', padding: '15px', textAlign: 'center', fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>
           MI MENÚ SEMANAL - {activeDay === 'day1' ? '☀️ DÍA 1' : '🌙 DÍA 2'}
         </h3>
         
         <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                   <tr style={{ background: '#f5f5f5' }}>
                      {currentMeals.map((meal, idx) => (
                        <th key={idx} style={{ padding: '15px 10px', fontSize: '0.8rem', fontWeight: '900', border: '1px solid #1d512d', textTransform: 'uppercase' }}>{meal.name}</th>
                      ))}
                   </tr>
                </thead>
                <tbody>
                   {Array.from({ length: Math.max(...Object.values(activeMenu || {}).map(m => m.selectedFoods?.length || 0), 1) }).map((_, rowIdx) => (
                      <tr key={rowIdx}>
                         {currentMeals.map(meal => {
                            const food = activeMenu?.[meal.key]?.selectedFoods?.[rowIdx];
                            const group = food ? foodGroups[food.groupKey] : null;
                            return (
                               <td key={meal.key} style={{ padding: '15px 10px', border: '1px solid #eee', verticalAlign: 'top', height: '120px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
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
              {currentMeals.map(m => {
                const isActive = selectedExchangeMeal === m.key;
                const mealPortions = activeMenu?.[m.key]?.portions || {};
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
              📋 TABLA DE INTERCAMBIOS PARA: <span style={{ textTransform: 'uppercase', color: '#1d512d', fontWeight: '950' }}>{currentMeals.find(em => em.key === selectedExchangeMeal)?.name}</span>
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(EXCHANGE_GUIDE_DB).map(([groupKey, groupMeta]) => {
                const targetVal = parseFloat(activeMenu?.[selectedExchangeMeal]?.portions?.[groupKey]) || 0;
                
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

      {/* Galería de Evolución Corporal */}
      <section className="glass-panel" style={{ 
        background: 'white', 
        borderRadius: '24px', 
        padding: '24px', 
        border: '2px solid #1D512D', 
        boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
        marginBottom: '40px'
      }}>
         <h3 style={{ color: '#1D512D', fontSize: '1.2rem', fontWeight: '900', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px' }}>
           📸 MI EVOLUCIÓN CORPORAL (FOTOS)
         </h3>
         
         <div style={{ background: 'rgba(29, 81, 45, 0.03)', padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
           <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: '800' }}>Cargar Nueva Foto de Evolución</p>
           <form onSubmit={handlePatientPhotoUpload} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
             <div>
               <label style={{ fontSize: '0.65rem', fontWeight: '800', display: 'block', marginBottom: '3px', opacity: 0.7 }}>POSE / TOMA</label>
               <select
                 value={photoLabel}
                 onChange={(e) => setPhotoLabel(e.target.value)}
                 style={{ padding: '6px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.15)', background: 'white' }}
               >
                 <option value="Frente">Frente</option>
                 <option value="Espalda">Espalda</option>
                 <option value="Lat. Izquierdo">Lat. Izquierdo</option>
                 <option value="Lat. Derecho">Lat. Derecho</option>
                 <option value="Otra">Otra</option>
               </select>
             </div>
             
             <div style={{ flex: 1, minWidth: '160px' }}>
               <label style={{ fontSize: '0.65rem', fontWeight: '800', display: 'block', marginBottom: '3px', opacity: 0.7 }}>SELECCIONAR ARCHIVO</label>
               <input
                 type="file"
                 id="patient-photo-input"
                 accept="image/*"
                 onChange={(e) => setPhotoFile(e.target.files[0])}
                 style={{ fontSize: '0.75rem' }}
               />
             </div>
             
             <button
               type="submit"
               style={{
                 alignSelf: 'flex-end',
                 padding: '8px 16px',
                 fontSize: '0.8rem',
                 fontWeight: '800',
                 borderRadius: '8px',
                 border: 'none',
                 background: '#1D512D',
                 color: 'white',
                 cursor: 'pointer'
               }}
             >
               Subir Foto
             </button>
           </form>
         </div>

         {patient.photosGallery && patient.photosGallery.length > 0 ? (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
             {patient.photosGallery.map(photo => (
               <div
                 key={photo.id}
                 style={{
                   background: '#f9f9f9',
                   borderRadius: '12px',
                   overflow: 'hidden',
                   border: '1px solid rgba(0,0,0,0.06)',
                   display: 'flex',
                   flexDirection: 'column'
                 }}
               >
                 <div style={{ position: 'relative', width: '100%', aspectRatio: '0.85', background: '#e0e0e0' }}>
                   <img src={photo.url} alt={photo.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   <div style={{
                     position: 'absolute',
                     top: '4px',
                     left: '4px',
                     background: 'rgba(29, 81, 45, 0.85)',
                     color: 'white',
                     padding: '2px 6px',
                     borderRadius: '4px',
                     fontSize: '0.55rem',
                     fontWeight: '800'
                   }}>
                     {photo.label}
                   </div>
                 </div>
                 
                 <div style={{ padding: '8px', fontSize: '0.65rem', opacity: 0.7 }}>
                   <p style={{ margin: 0 }}>Fecha: {photo.date}</p>
                   <p style={{ margin: 0, fontWeight: '700' }}>Cargado por: {photo.uploadedBy}</p>
                 </div>
               </div>
             ))}
           </div>
         ) : (
           <div style={{ textAlign: 'center', padding: '30px 0', opacity: 0.5 }}>
             <Camera size={36} style={{ margin: '0 auto 8px', color: '#1D512D' }} />
             <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>Aún no hay fotos en tu galería de evolución.</p>
           </div>
         )}
      </section>

      <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
        <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1D512D' }}>nutrimemi</p>
      </div>
    </div>
  );
}
