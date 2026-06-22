'use client';
import { useAuth } from '@/context/AuthContext';
import TabBar from '@/components/patient/TabBar';
import { MessageCircle, Settings, LogOut, Bell } from 'lucide-react';

export default function PatientProfile() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '24px', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ 
          width: '100px', 
          height: '100px', 
          borderRadius: '50%', 
          background: 'white', 
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          fontWeight: '700',
          boxShadow: 'var(--shadow-subtle)',
          border: '4px solid var(--accent)'
        }}>
          JP
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{user?.name}</h2>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Plan Personalizado de Nutrición</p>
      </header>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Soporte Directo</h3>
        <button className="glass-panel" style={{ 
          width: '100%', 
          padding: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer'
        }}>
          <div style={{ background: 'var(--accent)', padding: '10px', borderRadius: '12px' }}>
            <MessageCircle color="white" size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontWeight: '600' }}>Chat con Nutricionista</h4>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Responderá en menos de 2 horas</p>
          </div>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--action)' }}></div>
        </button>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button className="glass-panel" style={{ padding: '16px 20px', border: 'none', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', cursor: 'pointer' }}>
          <Bell size={18} opacity={0.6} /> Mis Notificaciones
        </button>
        <button className="glass-panel" style={{ padding: '16px 20px', border: 'none', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', cursor: 'pointer' }}>
          <Settings size={18} opacity={0.6} /> Configuración
        </button>
        <button 
          onClick={logout}
          className="glass-panel" 
          style={{ padding: '16px 20px', border: 'none', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', cursor: 'pointer', color: '#ff4d4d' }}
        >
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>

      <TabBar />
    </div>
  );
}
