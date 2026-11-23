'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePatientByEmail } from '@/hooks/usePatient';
import { Activity } from 'lucide-react';

import TrackingHeader from '@/components/patient/tracking/TrackingHeader';
import TrackingOverview from '@/components/patient/tracking/TrackingOverview';
import TrackingProgress from '@/components/patient/tracking/TrackingProgress';
import TrackingGoals from '@/components/patient/tracking/TrackingGoals';

export default function PatientEvolution() {
  const { user } = useAuth();
  const { patient, status } = usePatientByEmail(user?.email);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'progress' | 'goals'
  const [nextApp, setNextApp] = useState(null);
  const [todayLog, setTodayLog] = useState(null);

  // Cargar próxima cita y registro de hoy de forma segura en cliente
  useEffect(() => {
    if (patient?.id && typeof window !== 'undefined') {
      try {
        // 1. Próxima cita del paciente
        const apps = JSON.parse(localStorage.getItem('nutri_appointments') || '[]');
        const next = apps
          .filter(a => a.patientId == patient.id && new Date(a.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        setNextApp(next || null);

        // 2. Bitácora de alimentos de hoy
        const today = new Date().toISOString().split('T')[0];
        const logs = JSON.parse(localStorage.getItem(`daily_log_${patient.id}`) || '[]');
        const todayEntry = logs.find(l => l.date === today);
        setTodayLog(todayEntry || null);
      } catch (e) {
        console.error('Error recuperando datos auxiliares de seguimiento:', e);
      }
    }
  }, [patient?.id]);

  // Estados de carga y error adaptados al diseño Nutrimemi
  if (status === 'loading') {
    return (
      <div style={{
        padding: '60px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'var(--text-primary)'
      }}>
        <Activity className="spin" size={32} style={{ color: 'var(--accent)', marginBottom: '14px' }} />
        <p style={{ fontWeight: '800', fontSize: '0.9rem', opacity: 0.7 }}>
          Cargando tu seguimiento...
        </p>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-primary)' }}>
        <p style={{ fontSize: '1rem', fontWeight: '850', margin: 0 }}>
          No encontramos tu expediente clínico
        </p>
        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '6px' }}>
          Verifica tu inicio de sesión o consulta con tu nutricionista.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-primary)' }}>
        <p style={{ fontSize: '1rem', fontWeight: '850', margin: 0 }}>
          Hubo un problema al cargar tus datos
        </p>
        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '6px' }}>
          Por favor recarga la página o inténtalo nuevamente más tarde.
        </p>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div
      className="fade-in"
      style={{
        padding: '20px 16px',
        paddingBottom: '110px',
        maxWidth: '500px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      {/* Cabecera y control segmentado táctil */}
      <TrackingHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Vista A: Inicio (Dashboard de indicadores independientes) */}
      {activeTab === 'overview' && (
        <TrackingOverview patient={patient} nextApp={nextApp} todayLog={todayLog} />
      )}

      {/* Vista B: Mi progreso (Curvas históricas con datos reales) */}
      {activeTab === 'progress' && (
        <TrackingProgress patient={patient} />
      )}

      {/* Vista C: Mis objetivos (Metas acordadas y plazos de control) */}
      {activeTab === 'goals' && (
        <TrackingGoals patient={patient} nextApp={nextApp} />
      )}
    </div>
  );
}
