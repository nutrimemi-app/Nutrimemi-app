'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, Plus, Search, ChevronRight, Activity, Calendar, MessageCircle, Trash2, Edit2, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { getPatients, deletePatient, updatePatient } from '@/lib/patients';
import { useUI } from '@/context/UIContext';

export default function NutriDashboard() {
  const { user, logout } = useAuth();
  const { showConfirm, showToast } = useUI();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('fichas'); // 'fichas' | 'directorio'
  const [editPatient, setEditPatient] = useState(null);

  useEffect(() => {
    const loadPatients = async () => {
      const data = await getPatients();
      setPatients(data);
      setIsLoading(false);
    };
    loadPatients();
  }, []);

  const getDietaryAnomalyCount = (patientId) => {
    try {
      const logs = JSON.parse(localStorage.getItem(`daily_log_${patientId}`) || '[]');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      let unusualCount = 0;
      logs.forEach(log => {
        const logDate = new Date(log.date + 'T00:00:00');
        if (logDate >= sevenDaysAgo) {
          const unusualInLog = (log.entries || []).filter(e => e.groupKey === 'no_habitual');
          unusualInLog.forEach(e => {
            unusualCount += (e.qty || 1);
          });
        }
      });
      return unusualCount;
    } catch (e) {
      return 0;
    }
  };

  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (p.name || '').toLowerCase().includes(term);
    const ciMatch = p.details?.ci ? p.details.ci.toLowerCase().includes(term) : false;
    return nameMatch || ciMatch;
  });

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!editPatient) return;
    try {
      await updatePatient(editPatient.id, { 
        name: editPatient.name,
        details: { ...editPatient.details, ci: editPatient.ci, email: editPatient.email, phone: editPatient.phone }
      });
      // Update local state so it reflects without reloading
      const updatedList = patients.map(p => {
        if (p.id === editPatient.id) {
          return {
            ...p,
            name: editPatient.name,
            details: { ...p.details, ci: editPatient.ci, email: editPatient.email, phone: editPatient.phone }
          };
        }
        return p;
      });
      setPatients(updatedList);
      showToast('Contacto actualizado', 'success');
      setEditPatient(null);
    } catch (err) {
      showToast('Error al actualizar', 'error');
    }
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '100px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '40px', width: 'auto' }} />
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '900' }}>Panel de Control</h2>
            <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>Hola, {user?.name || 'Nutricionista'}</p>
          </div>
        </div>
        <button onClick={logout} style={{ fontSize: '0.8rem', opacity: 0.6, border: 'none', background: 'none', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </header>

      {/* Barra de Búsqueda */}
      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
        <input 
          type="text" 
          placeholder="Buscar por Nombre o Cédula..." 
          className="input-field"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '48px', marginBottom: 0 }}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Tus Pacientes
        </h3>
        
        {/* Contenedor de Botones de Acción */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          overflowX: 'auto', 
          paddingBottom: '8px',
          scrollbarWidth: 'none', // Ocultar scroll en Firefox
          msOverflowStyle: 'none' // Ocultar scroll en IE/Edge
        }}>
          <Link href="/nutri/agenda" style={{ textDecoration: 'none' }}>
            <button className="glass-panel" style={{ 
              padding: '12px 16px', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'var(--card-yellow)', 
              color: 'white',
              border: 'none',
              fontWeight: '900',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap'
            }}>
              <Calendar size={18} /> Agenda
            </button>
          </Link>

          <Link href="/nutri/foods" style={{ textDecoration: 'none' }}>
            <button className="glass-panel" style={{ 
              padding: '12px 16px', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'white',
              fontWeight: '900',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
              border: '2px solid rgba(0,0,0,0.05)'
            }}>
               Mis Alimentos
            </button>
          </Link>

          <button 
            onClick={() => setActiveView(activeView === 'directorio' ? 'fichas' : 'directorio')}
            className="glass-panel" 
            style={{ 
              padding: '12px 16px', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: activeView === 'directorio' ? 'var(--text-primary)' : 'white',
              color: activeView === 'directorio' ? 'white' : 'var(--text-primary)',
              fontWeight: '900',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
              border: activeView === 'directorio' ? 'none' : '2px solid rgba(0,0,0,0.05)'
            }}
          >
             <FileText size={18} /> Directorio
          </button>
        </div>

        {/* Botón de Nuevo Paciente en su propia fila */}
        <Link href="/nutri/new-patient" style={{ textDecoration: 'none' }}>
          <button className="glass-panel" style={{ 
            width: '100%',
            marginTop: '12px',
            padding: '16px', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '12px', 
            background: 'var(--action)', 
            color: 'white',
            border: 'none',
            fontWeight: '900',
            fontSize: '1rem',
            boxShadow: '0 8px 20px rgba(253, 158, 20, 0.2)'
          }}>
            <Plus size={20} /> NUEVO PACIENTE
          </button>
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
            <Activity className="spin" size={40} style={{ margin: '0 auto 16px', color: 'var(--accent)' }} />
            <p style={{ fontWeight: '700' }}>Cargando pacientes...</p>
          </div>
        ) : activeView === 'directorio' ? (
          <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(0,0,0,0.05)' }}>
             <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                   <thead>
                      <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #eee' }}>
                         <th style={{ padding: '16px', textAlign: 'left', fontWeight: '900', fontSize: '0.85rem', color: '#666' }}>NOMBRE</th>
                         <th style={{ padding: '16px', textAlign: 'left', fontWeight: '900', fontSize: '0.85rem', color: '#666' }}>CÉDULA</th>
                         <th style={{ padding: '16px', textAlign: 'left', fontWeight: '900', fontSize: '0.85rem', color: '#666' }}>CONTACTO</th>
                         <th style={{ padding: '16px', textAlign: 'left', fontWeight: '900', fontSize: '0.85rem', color: '#666' }}>REGISTRO</th>
                         <th style={{ padding: '16px', textAlign: 'center', fontWeight: '900', fontSize: '0.85rem', color: '#666' }}>EDITAR</th>
                      </tr>
                   </thead>
                   <tbody>
                      {filteredPatients.map(p => {
                         const isComplete = p.onboardingAnswers && Object.keys(p.onboardingAnswers).length > 0 && p.measurements && Object.keys(p.measurements).length > 0;
                         return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                               <td style={{ padding: '16px', fontWeight: 'bold' }}>{p.name}</td>
                               <td style={{ padding: '16px', opacity: 0.8 }}>{p.details?.ci || '-'}</td>
                               <td style={{ padding: '16px', opacity: 0.8 }}>
                                  <div style={{ fontSize: '0.85rem' }}>{p.details?.email || '-'}</div>
                                  <div style={{ fontSize: '0.85rem' }}>{p.details?.phone || '-'}</div>
                               </td>
                               <td style={{ padding: '16px' }}>
                                  <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '4px' }}>
                                    {new Date(p.created_at || Date.now()).toLocaleDateString()}
                                  </div>
                                  {!isComplete && (
                                    <span style={{ background: '#FFF3E0', color: '#E65100', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                      Registro incompleto
                                    </span>
                                  )}
                               </td>
                               <td style={{ padding: '16px', textAlign: 'center' }}>
                                  <button onClick={() => setEditPatient({ id: p.id, name: p.name, ci: p.details?.ci || '', email: p.details?.email || '', phone: p.details?.phone || '' })} style={{ background: '#f0f0f0', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                                     <Edit2 size={16} color="#666" />
                                  </button>
                               </td>
                            </tr>
                         )
                      })}
                      {filteredPatients.length === 0 && (
                         <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', opacity: 0.5 }}>No hay pacientes encontrados.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>No se encontraron pacientes registrados.</p>
        ) : (
          filteredPatients.map((p) => (
            <div key={p.id} className="fade-in glass-panel" style={{ 
              padding: '16px', 
              borderRadius: '16px', 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: 'var(--shadow-subtle)'
            }}>
              <Link href={`/nutri/patient/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {(p.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontWeight: '600' }}>{p.name}</h4>
                  <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>CI: {p.details?.ci || 'N/A'}</p>
                  {(() => {
                    const anomalyCount = getDietaryAnomalyCount(p.id);
                    return anomalyCount > 5 ? (
                      <div style={{ 
                        marginTop: '6px', 
                        background: '#FFF8E1', 
                        color: '#FF6F00', 
                        border: '1px solid #FFE082',
                        borderRadius: '8px', 
                        fontSize: '0.65rem', 
                        fontWeight: '900', 
                        padding: '4px 8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ⚠️ Desviación del plan ({anomalyCount} comidas no hab. en 7d)
                      </div>
                    ) : null;
                  })()}
                </div>
              </Link>

              {/* Botones Aciones Rápidas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {p.details?.phone && (
                  <a href={`https://wa.me/${p.details.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageCircle size={20} />
                    </div>
                  </a>
                )}
                <Link href={`/nutri/patient/${p.id}/menu`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'rgba(29, 81, 45, 0.1)', color: 'var(--primary)', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={20} />
                  </div>
                </Link>
                <button 
                  onClick={() => {
                    showConfirm('¿Eliminar paciente?', `¿Seguro que deseas eliminar a ${p.name}? Esta acción no se puede deshacer.`, async () => {
                      const success = await deletePatient(p.id);
                      if (success) {
                        setPatients(patients.filter(pat => pat.id !== p.id));
                        showToast('Paciente eliminado');
                      } else {
                        showToast('Error al eliminar');
                      }
                    });
                  }}
                  style={{ background: '#FFEBEE', color: '#C62828', padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={20} />
                </button>
                <Link href={`/nutri/patient/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', opacity: 0.3, padding: '8px' }}>
                  <ChevronRight size={20} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Editar Contacto */}
      {editPatient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '24px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: '#1d512d' }}>Editar Contacto</h3>
              <button onClick={() => setEditPatient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#666" />
              </button>
            </div>
            
            <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>NOMBRE</label>
                <input required type="text" className="input-field" value={editPatient.name} onChange={e => setEditPatient({...editPatient, name: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>CÉDULA</label>
                <input required type="text" className="input-field" value={editPatient.ci} onChange={e => setEditPatient({...editPatient, ci: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>CORREO</label>
                <input type="email" className="input-field" value={editPatient.email} onChange={e => setEditPatient({...editPatient, email: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>TELÉFONO</label>
                <input type="tel" className="input-field" value={editPatient.phone} onChange={e => setEditPatient({...editPatient, phone: e.target.value})} />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
