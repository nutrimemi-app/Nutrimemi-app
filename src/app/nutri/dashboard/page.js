'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, Plus, Search, ChevronRight, Activity, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function NutriDashboard() {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const savedPatients = localStorage.getItem('nutri_patients');
    if (savedPatients) {
      const parsed = JSON.parse(savedPatients);
      // Evitar duplicados si ya están en el estado inicial
      setPatients(prev => {
        const existingIds = prev.map(p => p.id);
        const uniqueNext = parsed.filter(p => !existingIds.includes(p.id));
        return [...prev, ...uniqueNext];
      });
    }
  }, []);

  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(term);
    const ciMatch = p.details?.ci ? p.details.ci.toLowerCase().includes(term) : false;
    return nameMatch || ciMatch;
  });

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
        {filteredPatients.length === 0 ? (
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
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontWeight: '600' }}>{p.name}</h4>
                  <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>CI: {p.details?.ci || 'N/A'}</p>
                </div>
              </Link>

              {/* Botones Aciones Rápidas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link href={`/nutri/patient/${p.id}/menu`} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    background: 'rgba(29, 81, 45, 0.1)', 
                    color: 'var(--primary)', 
                    padding: '8px', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Activity size={20} />
                  </div>
                </Link>
                <Link href={`/nutri/patient/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', opacity: 0.3, padding: '8px' }}>
                  <ChevronRight size={20} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
