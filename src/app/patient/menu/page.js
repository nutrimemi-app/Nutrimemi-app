'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

import { ChefHat, BookOpen, CheckCircle, Info } from 'lucide-react';
import { usePatientByEmail } from '@/hooks/usePatient';
import { getMealTypes } from '@/utils/mealUtils';
import { useRouter } from 'next/navigation';

const FOOD_GROUPS = [
  { key: 'cereales',  name: 'Cereales',  color: '#E07B00', bg: '#FFF3E0', dot: '#FFA500' },
  { key: 'proteinas', name: 'Proteínas', color: '#B71C1C', bg: '#FFEBEE', dot: '#EF5350' },
  { key: 'vegetales', name: 'Vegetales', color: '#1B5E20', bg: '#E8F5E9', dot: '#43A047' },
  { key: 'frutas',    name: 'Frutas',    color: '#6A1B9A', bg: '#F3E5F5', dot: '#AB47BC' },
  { key: 'lacteos',   name: 'Lácteos',   color: '#0D47A1', bg: '#E3F2FD', dot: '#42A5F5' },
  { key: 'grasas',    name: 'Grasas',    color: '#827717', bg: '#FFFDE7', dot: '#D4AC0D' },
];

const EXCHANGE_EXAMPLES = {
  cereales:  '1 RACIÓN = 1/3 taza arroz / pasta; ½ taza papa; 1 rebanada pan; ½ arepa.',
  proteinas: '1 RACIÓN = 30 g pollo / carne / pescado / atún; 1 huevo; 1 rebanada queso.',
  vegetales: '1 RACIÓN = 1 taza crudo o ½ taza cocido.',
  frutas:    '1 RACIÓN = 1 unidad pequeña; 1 taza picada; ½ cambur grande.',
  lacteos:   '1 RACIÓN = 1 taza leche; ¾ taza yogurt; ½ taza yogurt griego.',
  grasas:    '1 RACIÓN = 1 cdta aceite; 30 g aguacate; 6 almendras; 1 cda maní.',
};

export default function PatientMenu() {
  const router = useRouter();
  const { user } = useAuth();
  const { patient, status } = usePatientByEmail(user?.email);
  const [tab, setTab] = useState('plan'); // 'plan' | 'menu'
  const [dayTab, setDayTab] = useState('DÍA 1');

  const menu = patient?.menu || {};
  const mealPlanKey = patient?.details?.mealPlan || '3+2 snacks';
  const currentMeals = getMealTypes(mealPlanKey);

  const mealsWithData = currentMeals.filter(m => {
    const d = menu[m.key];
    if (!d) return false;
    return d.selectedFoods?.length > 0 || Object.values(d.portions || {}).some(v => parseFloat(v) > 0);
  });

  if (status === 'loading') return <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>Cargando menú...</div>;
  if (status === 'not-found') return <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>No se encontraron tus datos.</div>;
  if (status === 'error') return <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>Hubo un error cargando tu menú.</div>;
  if (!patient) return null;

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }} className="fade-in">
      {/* HEADER */}
      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)' }}>Ver mi plan nutricional</h2>
        <p style={{ opacity: 0.55, fontSize: '0.85rem' }}>Plan elaborado por tu nutricionista</p>
      </header>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(0,0,0,0.04)', borderRadius: '14px', padding: '4px' }}>
        {[
          { id: 'plan',  label: '📋 Seguir tu plan' },
          { id: 'menu',  label: '🍽️ Menú ejemplo' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer',
            background: tab === t.id ? 'var(--text-primary)' : 'transparent',
            color: tab === t.id ? 'white' : 'var(--text-primary)',
            fontWeight: '800', fontSize: '0.8rem', transition: 'all 0.2s'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════ TAB: SEGUIR TU PLAN ═══════ */}
      {tab === 'plan' && (
        <div className="fade-in">
          {/* Guía de intercambio */}
          <div className="glass-panel" style={{ padding: '20px', background: 'white', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <BookOpen size={20} color="var(--text-primary)" />
              <h3 style={{ fontWeight: '900', fontSize: '1rem' }}>Guía de Raciones</h3>
            </div>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '14px', lineHeight: '1.4' }}>
              Cada ración equivale a la porción de referencia indicada. Puedes combinar alimentos del mismo grupo libremente.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FOOD_GROUPS.map(g => (
                <div key={g.key} style={{
                  display: 'flex', gap: '10px', padding: '10px', borderRadius: '12px',
                  background: g.bg, borderLeft: `4px solid ${g.dot}`
                }}>
                  <div style={{ minWidth: '70px', fontWeight: '900', color: g.color, fontSize: '0.8rem' }}>{g.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#555', lineHeight: '1.3' }}>{EXCHANGE_EXAMPLES[g.key]}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(29,81,45,0.05)', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
              <strong>💡 Recuerda:</strong> Todos los cereales aportan <strong>15 g de carbohidratos</strong> por ración. Coordina con tu nutricionista cualquier ajuste.
            </div>
          </div>

          {/* Porciones del plan por tiempo de comida */}
          {mealsWithData.length > 0 ? mealsWithData.map(meal => {
            const d = menu[meal.key];
            const portions = d?.portions || {};
            return (
              <div key={meal.key} className="glass-panel" style={{ marginBottom: '12px', overflow: 'hidden', background: 'white' }}>
                <div style={{ background: 'var(--card-green)', color: 'white', padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ fontWeight: '900', fontSize: '0.95rem', margin: 0 }}>{meal.label}</h3>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{d?.time || ''}</span>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {FOOD_GROUPS.map(g => {
                    const val = parseFloat(portions[g.key] || 0);
                    if (!val) return null;
                    return (
                      <div key={g.key} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: g.bg, borderRadius: '20px', padding: '5px 12px',
                        border: `1px solid ${g.dot}30`
                      }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: g.dot }} />
                        <span style={{ fontWeight: '900', color: g.color, fontSize: '0.85rem' }}>{val}</span>
                        <span style={{ fontSize: '0.75rem', color: g.color }}>{g.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>
              <ChefHat size={40} style={{ marginBottom: '12px' }} />
              <p style={{ fontWeight: '700' }}>Tu nutricionista aún no ha cargado tu plan.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════ TAB: MENÚ EJEMPLO ═══════ */}
      {tab === 'menu' && (
        <div className="fade-in">
          {/* Sub-tabs para Días */}
          {(() => {
            const daysSet = new Set();
            mealsWithData.forEach(m => {
              (menu[m.key]?.selectedFoods || []).forEach(f => {
                const match = f.name.match(/^\[(DÍA\s+\d+)\]/i);
                daysSet.add(match ? match[1].toUpperCase() : 'DÍA 1');
              });
            });
            const availableDays = Array.from(daysSet).sort();
            if (availableDays.length === 0) availableDays.push('DÍA 1');
            
            // Only show subtabs if there's more than 1 day
            if (availableDays.length > 1) {
              return (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {availableDays.map(d => (
                    <button key={d} onClick={() => setDayTab(d)} style={{
                      padding: '8px 16px', border: 'none', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap',
                      background: dayTab === d ? 'var(--card-green)' : 'rgba(29,81,45,0.08)',
                      color: dayTab === d ? 'white' : 'var(--card-green)',
                      fontWeight: '800', fontSize: '0.8rem', transition: 'all 0.2s'
                    }}>
                      {d}
                    </button>
                  ))}
                </div>
              );
            }
            return null;
          })()}

          {mealsWithData.length > 0 ? mealsWithData.map(meal => {
            const d = menu[meal.key];
            const allFoods = d?.selectedFoods || [];
            
            const filteredFoods = allFoods.filter(f => {
              const match = f.name.match(/^\[(DÍA\s+\d+)\]/i);
              const itemDay = match ? match[1].toUpperCase() : 'DÍA 1';
              return itemDay === dayTab;
            });
            
            const portions = d?.portions || {};
            
            // Si el meal no tiene raciones ni alimentos para este día específico, lo saltamos (opcional). 
            // Si quieres mostrarlo igual para indicar que no hay comida de ese tipo hoy, lo dejamos.
            
            return (
              <div key={meal.key} className="glass-panel" style={{ marginBottom: '12px', overflow: 'hidden', background: 'white' }}>
                <div style={{ background: 'var(--card-green)', color: 'white', padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ fontWeight: '900', fontSize: '0.95rem', margin: 0 }}>{meal.label}</h3>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{d?.time || ''}</span>
                </div>

                {/* Badges de porciones */}
                {Object.values(portions).some(v => parseFloat(v) > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '8px 14px', background: 'rgba(29,81,45,0.04)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    {FOOD_GROUPS.map(g => {
                      const val = parseFloat(portions[g.key] || 0);
                      if (!val) return null;
                      return (
                        <span key={g.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: g.bg, color: g.color, fontSize: '0.72rem', fontWeight: '900', padding: '2px 8px', borderRadius: '20px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: g.dot, display: 'inline-block' }}></span>
                          {val} {g.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Alimentos */}
                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {filteredFoods.length > 0 ? filteredFoods.map(item => {
                    const g = FOOD_GROUPS.find(g => g.key === item.groupKey) || FOOD_GROUPS[0];
                    const cleanName = item.name.replace(/^\[DÍA\s+\d+\]\s*/i, '');
                    return (
                      <div key={item.instanceId || item.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '6px 10px', borderRadius: '10px',
                        background: g.bg, borderLeft: `3px solid ${g.dot}`
                      }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: g.dot }} />
                        <span style={{ fontWeight: '900', color: g.color, fontSize: '0.82rem' }}>{item.qty} {item.unit}</span>
                        <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#333' }}>{cleanName}</span>
                      </div>
                    );
                  }) : (
                    <p style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic', padding: '4px' }}>
                      Sigue las raciones recomendadas para este tiempo de comida.
                    </p>
                  )}
                </div>
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>
              <ChefHat size={40} style={{ marginBottom: '12px' }} />
              <p style={{ fontWeight: '700' }}>Tu nutricionista aún no ha creado tu menú ejemplo.</p>
            </div>
          )}

          {/* Nota del especialista */}
          {patient.details?.notes && (
            <div style={{ padding: '16px', background: 'rgba(203,188,30,0.08)', border: '1px dashed var(--accent)', borderRadius: '16px', marginTop: '4px' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--accent)', marginBottom: '6px', letterSpacing: '1px' }}>INDICACIONES</p>
              <p style={{ fontSize: '0.85rem', color: '#444', lineHeight: '1.5' }}>{patient.details.notes}</p>
            </div>
          )}
        </div>
      )}


    </div>
  );
}
