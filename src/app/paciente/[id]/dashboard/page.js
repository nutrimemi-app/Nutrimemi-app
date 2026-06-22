'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Activity, Calendar, User, History } from 'lucide-react';

export default function PatientDashboard() {
  const params = useParams();
  const [patient, setPatient] = useState(null);

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
