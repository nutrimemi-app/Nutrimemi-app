'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Activity } from 'lucide-react';

export default function NutriLayout({ children }) {
  const { user, mounted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (mounted && (!user || user.role !== 'Nutricionista')) {
      router.replace('/');
    }
  }, [user, mounted, router]);

  if (!mounted || !user || user.role !== 'Nutricionista') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <Activity className="spin" size={40} style={{ color: 'var(--accent)', marginBottom: '16px' }} />
        <p style={{ fontWeight: '700', opacity: 0.6 }}>Verificando sesión...</p>
      </div>
    );
  }

  return children;
}
