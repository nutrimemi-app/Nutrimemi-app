import { useState } from 'react';
import { X, ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import { getMealTypes, MEAL_PLANS } from '@/utils/mealUtils';

export default function MealCustomizerModal({ currentPlan, onClose, onSave }) {
  const [meals, setMeals] = useState(() => getMealTypes(currentPlan));
  
  const moveUp = (idx) => {
    if (idx === 0) return;
    const newMeals = [...meals];
    [newMeals[idx - 1], newMeals[idx]] = [newMeals[idx], newMeals[idx - 1]];
    setMeals(newMeals);
  };

  const moveDown = (idx) => {
    if (idx === meals.length - 1) return;
    const newMeals = [...meals];
    [newMeals[idx + 1], newMeals[idx]] = [newMeals[idx], newMeals[idx + 1]];
    setMeals(newMeals);
  };

  const removeMeal = (idx) => {
    setMeals(meals.filter((_, i) => i !== idx));
  };

  const addMeal = () => {
    const key = `custom_${Date.now()}`;
    setMeals([...meals, { title: 'Nueva Comida', key, label: 'NUEVA COMIDA' }]);
  };

  const updateTitle = (idx, newTitle) => {
    const newMeals = [...meals];
    newMeals[idx].title = newTitle;
    newMeals[idx].label = newTitle.toUpperCase();
    setMeals(newMeals);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontWeight: '900', color: 'var(--primary)' }}>Personalizar Comidas</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {meals.map((m, i) => (
            <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button onClick={() => moveUp(i)} disabled={i === 0} style={{ border: 'none', background: 'none', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1 }}><ArrowUp size={16} /></button>
                <button onClick={() => moveDown(i)} disabled={i === meals.length - 1} style={{ border: 'none', background: 'none', cursor: i === meals.length - 1 ? 'default' : 'pointer', opacity: i === meals.length - 1 ? 0.3 : 1 }}><ArrowDown size={16} /></button>
              </div>
              <input 
                type="text" 
                value={m.title} 
                onChange={(e) => updateTitle(i, e.target.value)} 
                style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold' }} 
              />
              <button onClick={() => removeMeal(i)} style={{ border: 'none', background: '#ffebee', color: '#d32f2f', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={addMeal} style={{ width: '100%', padding: '12px', background: 'var(--card-green-light)', color: 'var(--primary)', border: 'none', borderRadius: '8px', fontWeight: '900', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
          <Plus size={18} /> Añadir Comida
        </button>

        <button onClick={() => onSave('custom:' + JSON.stringify(meals))} style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '1rem' }}>
          Guardar Plan
        </button>
      </div>
    </div>
  );
}
