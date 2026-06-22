'use client';
import { Home, Users, User, ClipboardList, Info } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const isNutri = pathname.includes('/nutri');
  
  const nutriLinks = [
    { href: '/nutri/dashboard', icon: <Users size={24} />, label: 'Pacientes' },
    { href: '/nutri/agenda', icon: <ClipboardList size={24} />, label: 'Agenda' },
    { href: '/nutri/profile', icon: <User size={24} />, label: 'Perfil' },
  ];

  const patientLinks = [
    { href: '/patient/home', icon: <Home size={24} />, label: 'Inicio' },
    { href: '/patient/plan', icon: <ClipboardList size={24} />, label: 'Mi Dieta' },
    { href: '/patient/profile', icon: <User size={24} />, label: 'Perfil' },
  ];

  const links = isNutri ? nutriLinks : patientLinks;

  if (pathname === '/' || pathname.includes('/paciente')) return null; // No nav on login or onboarding

  return (
    <nav className="glass-tab-bar" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '70px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom)',
      borderTop: '1px solid rgba(255,255,255,0.3)'
    }}>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link 
            key={link.href} 
            href={link.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : 'rgba(29, 81, 45, 0.4)',
              transition: 'all 0.2s',
              transform: isActive ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {link.icon}
            <span style={{ fontSize: '0.65rem', marginTop: '4px', fontWeight: isActive ? '700' : '400' }}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
