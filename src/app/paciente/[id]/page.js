'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePatient } from '@/hooks/usePatient';
import { Sparkles, ArrowRight, Heart } from 'lucide-react';

export default function WelcomePage() {
  const params = useParams();
  const router = useRouter();
  const { patient, status } = usePatient(params.id);

  const firstName = patient?.name ? patient.name.trim().split(' ')[0] : '';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: '100dvh',
      padding: '24px 20px',
      textAlign: 'center',
      color: 'var(--text-primary)',
      backgroundColor: 'var(--bg-primary)',
      maxWidth: '520px',
      margin: '0 auto'
    }}>
      {/* ── LOGO SUPERIOR ── */}
      <header style={{ paddingTop: '12px' }}>
        <img 
          src="/logo.png" 
          alt="Nutrimemi Logo" 
          style={{ height: '46px', width: 'auto', display: 'block', margin: '0 auto' }} 
        />
      </header>

      {/* ── TARJETA PRINCIPAL DE BIENVENIDA ── */}
      <main className="fade-in" style={{
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '26px',
        padding: '32px 24px',
        boxShadow: 'var(--shadow-premium)',
        border: '1.5px solid rgba(29, 81, 45, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '18px',
        margin: '20px 0'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(203, 188, 30, 0.2)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sparkles size={28} color="var(--primary)" />
        </div>

        <div>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: '850',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#D97706',
            background: 'rgba(253, 158, 20, 0.12)',
            padding: '4px 12px',
            borderRadius: '999px',
            display: 'inline-block',
            marginBottom: '8px'
          }}>
            Paso inicial
          </span>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '900', 
            margin: 0,
            color: 'var(--text-primary)',
            lineHeight: '1.15'
          }}>
            {firstName ? `¡Hola, ${firstName}!` : '¡Hola!'}
          </h1>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '14px',
          fontSize: '0.94rem',
          lineHeight: '1.45',
          color: '#374151',
          textAlign: 'center'
        }}>
          <p style={{ fontWeight: '800', color: 'var(--text-primary)', margin: 0, fontSize: '1.02rem' }}>
            Gracias por elegirme para acompañarte en este reto
          </p>

          <div style={{
            background: 'rgba(29, 81, 45, 0.05)',
            padding: '12px 16px',
            borderRadius: '16px',
            border: '1px solid rgba(29, 81, 45, 0.1)'
          }}>
            <p style={{ fontWeight: '900', color: 'var(--primary)', margin: 0, fontSize: '0.96rem' }}>
              Recuerda que ¡no existe pregunta tonta!
            </p>
          </div>

          <p style={{ fontWeight: '650', margin: 0 }}>
            Mi objetivo siempre será que logres aprender a comer de una forma fácil y sin verlo como un reto.
          </p>

          <p style={{ fontSize: '0.86rem', opacity: 0.8, margin: 0, lineHeight: '1.4' }}>
            A continuación voy a necesitar que me respondas una serie de preguntas para armar tu plan especializado y sigas los pasos que te dejaré más adelante.
          </p>
        </div>

        <button 
          onClick={() => router.push(`/paciente/${params.id}/questions`)}
          style={{
            marginTop: '10px',
            width: '100%',
            background: 'var(--primary)',
            border: 'none',
            padding: '16px 24px',
            borderRadius: '16px',
            fontSize: '1.05rem',
            fontWeight: '900',
            color: '#FFFFFF',
            cursor: 'pointer',
            letterSpacing: '0.5px',
            boxShadow: '0 8px 20px rgba(29, 81, 45, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '52px'
          }}
        >
          <span>¡EMPECEMOS!</span>
          <ArrowRight size={20} />
        </button>
      </main>

      {/* ── PIE DE PÁGINA ── */}
      <footer style={{ paddingBottom: '8px', opacity: 0.7 }}>
        <p style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
          Nutrimemi · Acompañamiento Nutricional
        </p>
      </footer>
    </div>
  );
}
