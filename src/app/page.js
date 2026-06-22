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
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--bg-primary)',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="fade-in" style={{ 
        width: '100%', 
        maxWidth: '380px', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Logo Imagen */}
        <div style={{ marginBottom: '40px', width: '100%' }}>
          <img 
            src="/logo.png" 
            alt="Nutrimemi Logo" 
            style={{ width: '100%', maxWidth: '240px', height: 'auto', margin: '0 auto', display: 'block' }}
          />
        </div>

        <h1 style={{ 
          marginBottom: '12px', 
          fontSize: '2.2rem', 
          fontWeight: '900',
          color: 'var(--text-primary)',
          fontFamily: 'Belinda, sans-serif'
        }}>
          Bienvenido
        </h1>
        <p style={{ 
          marginBottom: '40px', 
          opacity: 0.8, 
          fontWeight: '700',
          fontSize: '1rem',
          color: 'var(--text-primary)',
          lineHeight: '1.4'
        }}>
          Gestiona tu nutrición de forma experta
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Usuario" 
            style={{ 
              width: '100%',
              padding: '20px', 
              borderRadius: '20px', 
              border: '1.5px solid rgba(29, 81, 45, 0.1)', 
              fontSize: '1rem', 
              background: 'white',
              outline: 'none',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
              boxShadow: 'var(--shadow-subtle)'
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            style={{ 
              width: '100%',
              padding: '20px', 
              borderRadius: '20px', 
              border: '1.5px solid rgba(29, 81, 45, 0.1)', 
              fontSize: '1rem', 
              background: 'white',
              outline: 'none',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
              boxShadow: 'var(--shadow-subtle)'
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              marginTop: '8px',
              padding: '20px',
              borderRadius: '20px',
              fontSize: '1.1rem',
              fontWeight: '900',
              background: 'var(--action)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(253, 158, 20, 0.3)',
              transition: 'transform 0.2s'
            }}
          >
            Iniciar Sesión
          </button>
        </form>

        <div style={{ marginTop: '40px', fontSize: '0.9rem', opacity: 0.6, fontWeight: '700', color: 'var(--text-primary)' }}>
          ¿Olvidaste tu contraseña?
        </div>
      </div>
    </main>
  );
}
