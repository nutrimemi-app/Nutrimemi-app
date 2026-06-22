'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function WelcomePage() {
  const params = useParams();
  const router = useRouter();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '40px 20px',
      textAlign: 'center',
      color: '#1d512d'
    }}>
      <h1 style={{ 
        fontSize: '4.5rem', 
        fontWeight: '900', 
        marginBottom: '40px',
        color: '#1d512d'
      }}>Hello!</h1>

      <div style={{ maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: '700', lineHeight: '1.3' }}>
          Gracias por elegirme para acompañarte en este reto
        </p>

        <p style={{ fontSize: '1.2rem', fontWeight: '700', lineHeight: '1.3' }}>
          Recuerda que no existe pregunta gafa!
        </p>

        <p style={{ fontSize: '1.2rem', fontWeight: '700', lineHeight: '1.3' }}>
          Mi objetivo siempre será que logres aprender a comer de una forma fácil y sin verlo como un reto
        </p>

        <p style={{ fontSize: '1.2rem', fontWeight: '700', lineHeight: '1.3' }}>
          A continuación voy a necesitar que me respondas una serie de preguntas para armar tu plan especializados y sigas los pasos que te dejaré más adelante.
        </p>
      </div>

      <button 
        onClick={() => router.push(`/paciente/${params.id}/questions`)}
        style={{
          marginTop: '50px',
          background: 'none',
          border: 'none',
          fontSize: '1.4rem',
          fontWeight: '900',
          color: '#1d512d',
          cursor: 'pointer',
          letterSpacing: '1px'
        }}
      >
        ¡EMPECEMOS!
      </button>

      <div style={{ marginTop: 'auto', paddingTop: '60px' }}>
        <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1d512d' }}>nutrimemi</p>
      </div>
    </div>
  );
}
