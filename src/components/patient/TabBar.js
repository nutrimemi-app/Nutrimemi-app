'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, ClipboardList, TrendingUp, User } from 'lucide-react';

export default function TabBar() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Inicio',    path: '/patient/home',      icon: Home },
    { name: 'Mi Plan',   path: '/patient/menu',       icon: Utensils },
    { name: 'Registro',  path: '/patient/daily-log',  icon: ClipboardList },
    { name: 'Evolución', path: '/patient/evolution',  icon: TrendingUp },
    { name: 'Perfil',    path: '/patient/profile',    icon: User },
  ];

  return (
    <nav className="glass-tab-bar" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '80px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: '20px',
      zIndex: 1000
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname.startsWith(tab.path);
        return (
          <Link key={tab.path} href={tab.path} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--text-primary)' : 'rgba(29,81,45,0.35)',
            transition: 'color 0.2s',
            gap: '2px'
          }}>
            <div style={{
              background: isActive ? 'rgba(29,81,45,0.1)' : 'transparent',
              borderRadius: '12px',
              padding: '4px 10px',
              transition: 'background 0.2s'
            }}>
              <Icon size={22} color={isActive ? 'var(--text-primary)' : 'rgba(29,81,45,0.35)'} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: isActive ? '800' : '500' }}>
              {tab.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
