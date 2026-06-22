'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, User, ShoppingBag } from 'lucide-react';

export default function TabBar() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Home', path: '/patient/home', icon: Home },
    { name: 'Menú', path: '/patient/menu', icon: Utensils },
    { name: 'Mercado', path: '/patient/shopping-list', icon: ShoppingBag },
    { name: 'Perfil', path: '/patient/profile', icon: User },
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
      zIndex: 100
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.path;
        return (
          <Link key={tab.path} href={tab.path} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--text-primary)' : 'rgba(29, 81, 45, 0.4)',
            transition: 'color 0.3s'
          }}>
            <Icon size={24} color={isActive ? 'var(--text-primary)' : 'rgba(29, 81, 45, 0.4)'} />
            <span style={{ fontSize: '12px', marginTop: '4px', fontWeight: isActive ? '600' : '400' }}>
              {tab.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
