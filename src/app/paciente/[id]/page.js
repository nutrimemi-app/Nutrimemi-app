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
      height: '100dvh',
      padding: '20px',
      textAlign: 'center',
      color: '#1d512d',
      overflow: 'hidden'
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <h1 style={{ 
          fontSize: '4.5rem', 
          fontWeight: '900', 
          margin: 0,
          color: '#1d512d',
          lineHeight: '1'
        }}>Hello!</h1>

        <div style={{ maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <p style={{ fontSize: '1rem', fontWeight: '800', lineHeight: '1.2' }}>
            Gracias por elegirme para acompañarte en este reto
          </p>

          <p style={{ fontSize: '1rem', fontWeight: '800', lineHeight: '1.2' }}>
            Recuerda que no existe pregunta gafa!
          </p>

          <p style={{ fontSize: '1rem', fontWeight: '800', lineHeight: '1.2' }}>
            Mi objetivo siempre será que logres aprender a comer de una forma fácil y sin verlo como un reto
          </p>

          <p style={{ fontSize: '0.9rem', fontWeight: '700', lineHeight: '1.2', opacity: 0.9 }}>
            A continuación voy a necesitar que me respondas una serie de preguntas para armar tu plan especializados y sigas los pasos que te dejaré más adelante.
          </p>
        </div>

        <button 
          onClick={() => router.push(`/paciente/${params.id}/questions`)}
          style={{
            marginTop: '20px',
            background: 'white',
            border: '2px solid #1d512d',
            padding: '16px 40px',
            borderRadius: '50px',
            fontSize: '1.2rem',
            fontWeight: '900',
            color: '#1d512d',
            cursor: 'pointer',
            letterSpacing: '1px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}
        >
          ¡EMPECEMOS!
        </button>
      </div>

      <div style={{ paddingBottom: '20px' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1d512d', margin: 0 }}>nutrimemi</p>
      </div>
    </div>
  );
}
