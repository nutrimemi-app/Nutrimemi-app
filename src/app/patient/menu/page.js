'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import TabBar from '@/components/patient/TabBar';
import { Clock, ChefHat, Info } from 'lucide-react';

export default function PatientMenu() {
  const { user } = useAuth();
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    if (user?.email) {
      const savedPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
      const found = savedPatients.find(p => p.email === user.email);
      if (found && found.menu) {
        setMenu(found.menu);
      }
    }
  }, [user]);

  const mealTypes = [
    { title: 'Desayuno', key: 'desayuno' },
    { title: 'Merienda AM', key: 'meriendaAM' },
    { title: 'Almuerzo', key: 'almuerzo' },
    { title: 'Merienda PM', key: 'meriendaPM' },
    { title: 'Cena', key: 'cena' }
  ];

  const foodGroups = [
    { name: 'Cereales', color: '#FFA500', key: 'cereales' },
    { name: 'Proteínas', color: '#FF0000', key: 'proteinas' },
    { name: 'Vegetales', color: '#228B22', key: 'vegetales' },
    { name: 'Frutas', color: '#BA55D3', key: 'frutas' },
    { name: 'Lácteos', color: '#1E90FF', key: 'lacteos' },
    { name: 'Grasas', color: '#FFD700', key: 'grasas' }
  ];

  if (!menu) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <ChefHat size={48} opacity={0.2} style={{ marginBottom: '16px' }} />
        <h3>Tu nutricionista aún no ha cargado tu menú.</h3>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Vuelve pronto para ver tu plan personalizado.</p>
        <TabBar />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }} className="fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '8px' }}>Mi Menú</h2>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Plan personalizado por la Dra. Salomé</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '48px' }}>
        {mealTypes.map((meal) => {
          const mealData = menu[meal.key];
          if (!mealData) return null;

          return (
            <div key={meal.key} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Clock size={16} opacity={0.4} />
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: mealData.isFreeTime ? '#888' : 'var(--primary)' }}>
                  {mealData.isFreeTime ? 'Horario Libre' : (mealData.time || '--:--')}
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', marginLeft: '12px', letterSpacing: '-0.5px' }}>{meal.title}</h3>
              </div>

              <div className="glass-panel shadow-premium" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start', background: 'white', borderRadius: '24px' }}>
                
                {/* Cuadro de Porciones Recomendadas (Pequeño, a un lado) */}
                {!mealData.isFreeFill && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderRight: '2px solid #f0f0f0', paddingRight: '20px', minWidth: '100px' }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.4, marginBottom: '4px' }}>RACIONES</p>
                    {foodGroups.map(group => {
                      const val = mealData.portions?.[group.key];
                      if (!val || val === '0') return null;
                      return (
                        <div key={group.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: group.color }}></div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '900', color: 'black' }}>{val}</span>
                          <span style={{ fontSize: '0.65rem', fontWeight: '700', opacity: 0.5 }}>{group.name.charAt(0)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* El Menú Visual (Los alimentos con colores) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {mealData.selectedFoods && mealData.selectedFoods.length > 0 ? (
                    mealData.selectedFoods.map((item, idx) => {
                      const color = foodGroups.find(g => g.key === item.groupKey)?.color || 'black';
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0, alignSelf: 'center' }}></div>
                          <p style={{ fontSize: '1rem', fontWeight: '800', color: color, lineHeight: '1.3' }}>
                            {item.portion} <span style={{ fontWeight: '600', opacity: 0.9 }}>de {item.name}</span>
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ fontSize: '0.95rem', opacity: 0.8, whiteSpace: 'pre-wrap', lineHeight: '1.5', fontStyle: mealData.food ? 'normal' : 'italic' }}>
                      {mealData.food || "Sigue tus raciones recomendadas para este tiempo de comida."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guía de Intercambio (Equivalencias) */}
      <section className="glass-panel" style={{ padding: '24px', background: '#fcfcfc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Info size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Guía de Equivalencias</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { group: 'Cereales', color: '#FFA500', eq: '1 Ración = 1/2 taza arroz/pasta u 1 unidad de pan/tortilla.' },
            { group: 'Proteínas', color: '#FF0000', eq: '1 Ración = 30g de pollo, carne o pescado o 1 huevo.' },
            { group: 'Vegetales', color: '#228B22', eq: '1 Ración = 1 taza crudos o 1/2 taza cocidos.' },
            { group: 'Frutas', color: '#BA55D3', eq: '1 Ración = 1 unidad pequeña o 1 taza picada.' },
            { group: 'Lácteos', color: '#1E90FF', eq: '1 Ración = 1 taza de leche o 3/4 taza de yogurt.' },
            { group: 'Grasas', color: '#FFD700', eq: '1 Ración = 1 cdta de aceite o 2 cdas de frutos secos.' },
          ].map(item => (
            <div key={item.group} style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '4px', background: item.color, borderRadius: '2px', flexShrink: 0 }}></div>
              <div>
                <p style={{ fontWeight: '700', fontSize: '0.85rem', color: item.color }}>{item.group}</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>{item.eq}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <TabBar />
    </div>
  );
}
