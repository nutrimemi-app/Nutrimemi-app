'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Search, Plus, Trash2, Edit2, Apple, X } from 'lucide-react';
import Link from 'next/link';
import { loadFoods, saveFoods } from '@/data/defaultFoods';

export default function NutriFoods() {
  const [foods, setFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');

  // Modal para agregar/editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFood, setCurrentFood] = useState({ id: '', name: '', portion: '', groupKey: 'cereales' });

  const foodGroups = [
    { name: 'Todos', color: '#333', key: 'all' },
    { name: 'Cereales', color: '#FFA500', key: 'cereales' },
    { name: 'Proteínas', color: '#FF0000', key: 'proteinas' },
    { name: 'Vegetales', color: '#228B22', key: 'vegetales' },
    { name: 'Frutas', color: '#BA55D3', key: 'frutas' },
    { name: 'Lácteos', color: '#1E90FF', key: 'lacteos' },
    { name: 'Grasas', color: '#FFD700', key: 'grasas' }
  ];

  useEffect(() => {
    setFoods(loadFoods());
  }, []);

  const handleSaveFood = () => {
    if (!currentFood.name || !currentFood.portion) {
      alert("Por favor llena el nombre y la porción.");
      return;
    }

    let updatedFoods = [...foods];
    if (currentFood.id) {
      // Editar
      updatedFoods = updatedFoods.map(f => f.id === currentFood.id ? currentFood : f);
    } else {
      // Nuevo
      updatedFoods.push({ ...currentFood, id: 'f_' + Date.now().toString() });
    }

    setFoods(updatedFoods);
    saveFoods(updatedFoods);
    setIsModalOpen(false);
    setCurrentFood({ id: '', name: '', portion: '', groupKey: 'cereales' });
    alert("¡Alimento guardado con éxito en tu base de datos!");
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás segura de eliminar este alimento de tu base de datos?")) {
      const updatedFoods = foods.filter(f => f.id !== id);
      setFoods(updatedFoods);
      saveFoods(updatedFoods);
    }
  };

  const startEdit = (food) => {
    setCurrentFood(food);
    setIsModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredFoods = foods.filter(f => {
    const matchName = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGroup = filterGroup === 'all' || f.groupKey === filterGroup;
    return matchName && matchGroup;
  });

  return (
    <div style={{ padding: '24px', paddingBottom: '100px' }} className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/nutri/dashboard" style={{ color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
          </Link>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900' }}>Base de Alimentos</h2>
        </div>
      </header>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input 
            type="text" 
            placeholder="¿Qué alimento buscas?" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field" 
            style={{ paddingLeft: '48px', marginBottom: 0 }}
          />
        </div>
        <button 
          onClick={() => { 
            setCurrentFood({ id: '', name: '', portion: '', groupKey: 'cereales' }); 
            setIsModalOpen(true); 
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="btn-accent" 
          style={{ padding: '0 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, fontWeight: '900' }}
        >
          <Plus size={18} /> Nuevo
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '12px', WebkitOverflowScrolling: 'touch' }}>
        {foodGroups.map(g => (
          <button 
            key={g.key}
            onClick={() => setFilterGroup(g.key)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              background: filterGroup === g.key ? g.color : 'rgba(0,0,0,0.05)',
              color: filterGroup === g.key ? 'white' : 'inherit',
              fontWeight: filterGroup === g.key ? 'bold' : 'normal',
              whiteSpace: 'nowrap',
              fontSize: '0.8rem',
              transition: 'all 0.2s'
            }}
          >
            {g.name}
          </button>
        ))}
      </div>
 
       {/* Creador de Alimentos Integrado (Sin Overlay) */}
       {isModalOpen && (
         <div className="glass-panel fade-in" style={{ 
           background: 'white', 
           padding: '24px', 
           borderRadius: '24px', 
           marginBottom: '32px',
           border: '2px solid var(--primary)',
           boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
         }}>
           <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: '900', color: 'var(--primary)' }}>
             {currentFood.id ? 'Editar Alimento' : 'Agregar Nuevo Alimento'}
           </h3>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
             <div>
               <label style={{ fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, marginBottom: '8px', display: 'block' }}>Nombre:</label>
               <input type="text" className="input-field" placeholder="Ej: Arroz con Pollo" value={currentFood.name} onChange={e => setCurrentFood({...currentFood, name: e.target.value})} style={{ marginBottom: 0 }} />
             </div>
             <div>
               <label style={{ fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, marginBottom: '8px', display: 'block' }}>Porción:</label>
               <input type="text" className="input-field" placeholder="Ej: 1 plato" value={currentFood.portion} onChange={e => setCurrentFood({...currentFood, portion: e.target.value})} style={{ marginBottom: 0 }} />
             </div>
           </div>
 
           <label style={{ fontSize: '0.75rem', fontWeight: '800', opacity: 0.5, marginBottom: '8px', display: 'block' }}>Grupo Alimenticio:</label>
           <select className="input-field" value={currentFood.groupKey} onChange={e => setCurrentFood({...currentFood, groupKey: e.target.value})}>
             {foodGroups.filter(g => g.key !== 'all').map(g => (
               <option key={g.key} value={g.key}>{g.name}</option>
             ))}
           </select>
 
           <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
             <button className="btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '800' }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
             <button className="btn-primary" style={{ flex: 2, padding: '14px', borderRadius: '12px', fontWeight: '900' }} onClick={handleSaveFood}>Guardar en la Base</button>
           </div>
         </div>
       )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredFoods.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>No hay alimentos que coincidan.</p>}
        {filteredFoods.map(food => {
          const groupColor = foodGroups.find(g => g.key === food.groupKey)?.color || '#333';
          return (
            <div key={food.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${groupColor}` }}>
              <div>
                <p style={{ fontWeight: '700', fontSize: '1rem', color: groupColor }}>{food.name}</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Porción: {food.portion}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => startEdit(food)} style={{ background: 'none', border: 'none', opacity: 0.5, padding: '8px', cursor: 'pointer' }}>
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(food.id)} style={{ background: 'none', border: 'none', color: '#ff4444', opacity: 0.7, padding: '8px', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>


    </div>
  );
}
