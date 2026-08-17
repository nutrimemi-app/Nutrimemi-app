'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Activity } from 'lucide-react';

import TabBar from '@/components/patient/TabBar';

export default function PatientAppLayout({ children }) {
  const { user, mounted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (mounted && (!user || user.role !== 'Paciente')) {
      router.replace('/');
    }
  }, [user, mounted, router]);

  if (!mounted || !user || user.role !== 'Paciente') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <Activity className="spin" size={40} style={{ color: 'var(--accent)', marginBottom: '16px' }} />
        <p style={{ fontWeight: '700', opacity: 0.6 }}>Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      maxWidth: '500px',
      margin: '0 auto',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {children}
      <TabBar />
    </div>
  );
}
