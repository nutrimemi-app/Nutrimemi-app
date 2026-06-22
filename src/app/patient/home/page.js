'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import TabBar from '@/components/patient/TabBar';
import { Ruler, Activity, Coffee, ShoppingBag, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function PatientHome() {
  const { user } = useAuth();
  const [patientData, setPatientData] = useState(null);

  const [nextAppointment, setNextAppointment] = useState(null);

  useEffect(() => {
    if (user?.email) {
      const savedPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
      const found = savedPatients.find(p => p.email === user.email);
      if (found) {
        setPatientData(found);
        
        // Buscar próxima cita
        const appointments = JSON.parse(localStorage.getItem('nutri_appointments') || '[]');
        const today = new Date();
        const myNext = appointments
          .filter(a => a.patientId == found.id && new Date(a.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        
        setNextAppointment(myNext);
      }
    }
  }, [user]);

  const calculateIMC = () => {
    if (!patientData?.details) return null;
    const weight = parseFloat(patientData.details.weight);
    const heightM = parseFloat(patientData.details.height) / 100;
    if (!weight || !heightM) return null;
    return (weight / (heightM * heightM)).toFixed(1);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px' }}>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Bienvenido de nuevo,</p>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{user?.name || 'Paciente'}</h2>
      </header>

      {/* Tarjeta Resumen Nutricional */}
      <section className="glass-panel fade-in" style={{ 
        background: 'var(--card-green)', 
        color: 'white', 
        padding: '24px', 
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Tu Meta Diaria</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: '800' }}>
              {patientData?.dietForm?.rct || '1700 Kcal'}
            </p>
          </div>
          <Activity size={40} opacity={0.3} />
        </div>
      </section>

      {/* Grid de Macronutrientes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ background: 'var(--card-yellow)', color: 'white', padding: '16px' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8 }}>Proteínas</p>
          <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>{patientData?.dietForm?.prot?.split('/')[1] || '75g'}</p>
        </div>
        <div className="glass-panel" style={{ background: 'var(--card-red)', color: 'white', padding: '16px' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8 }}>Grasas</p>
          <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>{patientData?.dietForm?.lip?.split('/')[1] || '60g'}</p>
        </div>
      </div>

      {/* Estado Físico */}
      <section className="glass-panel shadow-premium" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Ruler size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem' }}>Mi Estado Físico</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Peso</p>
            <p style={{ fontWeight: '700' }}>{patientData?.details?.weight}kg</p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Talla</p>
            <p style={{ fontWeight: '700' }}>{patientData?.details?.height}cm</p>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>IMC</p>
            <p style={{ fontWeight: '700' }}>{calculateIMC() || '--'}</p>
          </div>
        </div>
      </section>

      {/* Próxima Cita */}
      <section className="fade-in" style={{ animationDelay: '0.05s', marginBottom: '24px' }}>
        <div style={{ 
          background: 'white', 
          padding: '24px', 
          borderRadius: '24px', 
          boxShadow: 'var(--shadow-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          border: '1px solid var(--card-yellow-light)'
        }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: 'var(--card-yellow-light)', 
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar color="var(--accent)" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontWeight: '700' }}>{nextAppointment ? 'Próxima Cita' : 'Sin citas pendientes'}</h4>
            {nextAppointment ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>
                {nextAppointment.date.split('-').reverse().join('/')} a las {nextAppointment.time}
                <span style={{ display: 'block', opacity: 0.5, fontWeight: 'normal' }}>Motivo: {nextAppointment.type}</span>
              </p>
            ) : (
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Tu nutricionista te informará pronto.</p>
            )}
          </div>
        </div>
      </section>

      {/* Atajo al Menú */}
      <section className="fade-in" style={{ animationDelay: '0.1s', marginBottom: '20px' }}>
        <Link href="/patient/menu" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ 
            background: 'white', 
            padding: '24px', 
            borderRadius: '24px', 
            boxShadow: 'var(--shadow-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            cursor: 'pointer'
          }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: 'var(--card-green-light)', 
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Coffee color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: '700' }}>Seguir mi Plan</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Ver mi menú personalizado del día</p>
            </div>
            <div style={{ fontSize: '1.5rem', opacity: 0.3 }}>→</div>
          </div>
        </Link>
      </section>

      {/* Atajo a Lista de Mercado */}
      <section className="fade-in" style={{ animationDelay: '0.2s' }}>
        <Link href="/patient/shopping-list" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ 
            background: 'white', 
            padding: '24px', 
            borderRadius: '24px', 
            boxShadow: 'var(--shadow-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            cursor: 'pointer'
          }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: 'var(--card-yellow-light)', 
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag color="var(--accent)" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: '700' }}>Lista de Mercado</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Organiza tus compras por semana</p>
            </div>
            <div style={{ fontSize: '1.5rem', opacity: 0.3 }}>→</div>
          </div>
        </Link>
      </section>

      <TabBar />
    </div>
  );
}
