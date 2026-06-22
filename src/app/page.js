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
      padding: '20px'
    }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        {/* Logo Imagen */}
        <div style={{ marginBottom: '20px' }}>
          <img 
            src="/logo.png" 
            alt="Nutrimemi Logo" 
            style={{ width: '324px', height: 'auto' }}
          />
        </div>

        <h1 style={{ marginBottom: '8px', fontSize: '1.5rem' }}>Bienvenido</h1>
        <p style={{ marginBottom: '32px', opacity: 0.7 }}>Gestiona tu nutrición de forma experta</p>

        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Usuario" 
            className="input-field" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            className="input-field" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            Iniciar Sesión
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '0.9rem', opacity: 0.6 }}>
          ¿Olvidaste tu contraseña?
        </div>
      </div>
    </main>
  );
}
