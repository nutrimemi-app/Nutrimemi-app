'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      login(email, password);
    }
  };

  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      width: '100vw',
      padding: '24px',
      background: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      <div className="fade-in" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        textAlign: 'center'
      }}>
        {/* Logo Imagen */}
        <div style={{ marginBottom: '48px' }}>
          <img 
            src="/logo.png" 
            alt="Nutrimemi Logo" 
            style={{ width: '100%', maxWidth: '280px', height: 'auto' }}
          />
        </div>

        <h1 style={{ 
          marginBottom: '8px', 
          fontSize: '2rem', 
          fontWeight: '900',
          color: 'var(--text-primary)',
          fontFamily: 'Belinda, sans-serif'
        }}>
          Bienvenido
        </h1>
        <p style={{ 
          marginBottom: '48px', 
          opacity: 0.6, 
          fontWeight: '800',
          fontSize: '0.9rem' 
        }}>
          Gestiona tu nutrición de forma experta
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Usuario" 
            className="input-field" 
            style={{ margin: 0, padding: '20px', borderRadius: '18px', border: '1.5px solid rgba(0,0,0,0.05)', fontSize: '1rem', background: 'rgba(255,255,255,0.8)' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            className="input-field" 
            style={{ margin: 0, padding: '20px', borderRadius: '18px', border: '1.5px solid rgba(0,0,0,0.05)', fontSize: '1rem', background: 'rgba(255,255,255,0.8)' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              marginTop: '12px',
              padding: '20px',
              borderRadius: '18px',
              fontSize: '1rem',
              fontWeight: '900',
              background: 'var(--action)',
              boxShadow: '0 10px 25px rgba(253, 158, 20, 0.3)',
              border: 'none',
              color: 'white'
            }}
          >
            Iniciar Sesión
          </button>
        </form>

        <div style={{ marginTop: '32px', fontSize: '0.85rem', opacity: 0.5, fontWeight: '700' }}>
          ¿Olvidaste tu contraseña?
        </div>
      </div>
    </main>
  );
}
