'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePatient } from '@/hooks/usePatient';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { updatePatient } from '@/lib/patients';
import { Sparkles, ArrowRight, Lock, Mail, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

export default function WelcomePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const { user, login, setSessionUser } = useAuth();
  const { patient, status } = usePatient(params.id);

  // Formulario de activación de cuenta (primera vez)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login para paciente recurrente
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (patient) {
      const existingEmail = patient.details?.email || patient.email || '';
      setEmail(existingEmail);
    }
  }, [patient]);

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <Activity className="spin" size={36} color="var(--primary)" style={{ marginBottom: '16px' }} />
        <p style={{ fontWeight: '800', fontSize: '1rem' }}>Cargando tu invitación...</p>
      </div>
    );
  }

  if (status === 'not-found' || status === 'error' || !patient) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '32px 24px',
          maxWidth: '420px',
          boxShadow: 'var(--shadow-premium)',
          border: '1.5px solid rgba(220, 38, 38, 0.2)'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#DC2626', marginBottom: '12px' }}>
            Enlace no disponible
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: '1.45', margin: 0 }}>
            Este enlace de invitación no es válido o ha expirado. Por favor, solicita a tu nutricionista un nuevo enlace personal.
          </p>
        </div>
      </div>
    );
  }

  const firstName = patient.name ? patient.name.trim().split(' ')[0] : '';
  const hasAccount = Boolean(patient.password);
  const onboardingStatus = patient.onboardingAnswers?.onboardingStatus;
  const isCompleted = onboardingStatus === 'completed';
  const lastStep = patient.onboardingAnswers?.lastCompletedStep;

  // Determinar la siguiente ruta pendiente
  const nextRoute = lastStep === 'measurements' 
    ? `/paciente/${params.id}/photos`
    : lastStep === 'questions'
    ? `/paciente/${params.id}/measurements`
    : `/paciente/${params.id}/questions`;

  const isCurrentSessionActive = user && (user.email === patient.email || user.id === patient.id);

  // ── MANEJADOR DE ACTIVACIÓN DE CUENTA ──
  const handleActivateAccount = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      showToast('Por favor ingresa un correo electrónico', 'warning');
      return;
    }
    if (cleanPass.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }
    if (cleanPass !== confirmPassword.trim()) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const expectedUpdatedAt = patient.updated_at;
      const updatedDetails = {
        ...(patient.details || {}),
        email: cleanEmail
      };

      await updatePatient(params.id, {
        email: cleanEmail,
        password: cleanPass,
        details: updatedDetails,
        _expectedUpdatedAt: expectedUpdatedAt,
        _patientBase: patient
      });

      // Iniciar sesión inmediatamente
      const userData = {
        id: patient.id,
        email: cleanEmail,
        role: 'Paciente',
        name: patient.name
      };
      if (setSessionUser) {
        setSessionUser(userData);
      } else {
        localStorage.setItem('nutri_user', JSON.stringify(userData));
      }

      showToast('¡Cuenta creada y vinculada con éxito!', 'success');
      router.push(nextRoute);
    } catch (err) {
      console.error('Error al activar cuenta:', err);
      showToast('No se pudo activar la cuenta. Intenta nuevamente.', 'error');
      setIsSubmitting(false);
    }
  };

  // ── MANEJADOR DE INICIO DE SESIÓN PARA PACIENTE YA REGISTRADO ──
  const handlePatientLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      if (login) {
        await login(patient.email || email, loginPassword);
      }
    } catch (err) {
      console.error(err);
      showToast('Error al iniciar sesión', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

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

      {/* ── CASO 1: ONBOARDING YA COMPLETADO ── */}
      {isCompleted ? (
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
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(29, 81, 45, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={32} color="var(--primary)" />
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
            ¡Hola de nuevo, {firstName}!
          </h1>

          <p style={{ fontSize: '0.94rem', color: '#4B5563', lineHeight: '1.45', margin: 0 }}>
            Ya completaste tu registro inicial. Tu expediente clínico está en revisión y tu portal personal está activo.
          </p>

          <button
            onClick={() => {
              if (!isCurrentSessionActive && setSessionUser) {
                setSessionUser({
                  id: patient.id,
                  email: patient.email,
                  role: 'Paciente',
                  name: patient.name
                });
              }
              router.push('/patient/home');
            }}
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
              boxShadow: '0 8px 20px rgba(29, 81, 45, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '52px'
            }}
          >
            <span>ENTRAR A MI PORTAL</span>
            <ArrowRight size={20} />
          </button>
        </main>
      ) : hasAccount ? (
        /* ── CASO 2: CUENTA YA ACTIVADA, ONBOARDING EN PROGRESO ── */
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
              Continuar registro
            </span>
            <h1 style={{ fontSize: '1.9rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
              ¡Hola, {firstName}!
            </h1>
          </div>

          <p style={{ fontSize: '0.94rem', color: '#4B5563', lineHeight: '1.45', margin: 0 }}>
            Tu cuenta ya está activada. Puedes continuar tu registro en la etapa donde quedaste.
          </p>

          {isCurrentSessionActive ? (
            <button
              onClick={() => router.push(nextRoute)}
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
                boxShadow: '0 8px 20px rgba(29, 81, 45, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '52px'
              }}
            >
              <span>CONTINUAR REGISTRO</span>
              <ArrowRight size={20} />
            </button>
          ) : (
            <form onSubmit={handlePatientLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '850', marginBottom: '6px' }}>
                  Ingresa tu contraseña para continuar:
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                  <input
                    type="password"
                    placeholder="Tu contraseña"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '14px',
                      border: '1.5px solid rgba(0,0,0,0.1)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                style={{
                  width: '100%',
                  background: 'var(--primary)',
                  border: 'none',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  fontSize: '1rem',
                  fontWeight: '900',
                  color: '#FFFFFF',
                  cursor: isLoggingIn ? 'wait' : 'pointer',
                  boxShadow: '0 6px 18px rgba(29, 81, 45, 0.25)',
                  minHeight: '50px'
                }}
              >
                {isLoggingIn ? 'Verificando...' : 'Acceder y Continuar'}
              </button>
            </form>
          )}
        </main>
      ) : (
        /* ── CASO 3: PRIMERA VEZ — ACTIVACIÓN Y CREACIÓN DE CONTRASEÑA ── */
        <main className="fade-in" style={{
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '26px',
          padding: '30px 22px',
          boxShadow: 'var(--shadow-premium)',
          border: '1.5px solid rgba(29, 81, 45, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          margin: '16px 0'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(203, 188, 30, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={28} color="var(--primary)" />
          </div>

          <div>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: '850',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#D97706',
              background: 'rgba(253, 158, 20, 0.12)',
              padding: '4px 12px',
              borderRadius: '999px',
              display: 'inline-block',
              marginBottom: '6px'
            }}>
              Paso 1: Activa tu cuenta
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', lineHeight: '1.15' }}>
              {firstName ? `¡Hola, ${firstName}!` : '¡Hola!'}
            </h1>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#4B5563', lineHeight: '1.4', margin: 0 }}>
            Tu expediente clínico ha sido creado por tu nutricionista. Crea tu contraseña personal para acceder de forma segura y comenzar tu registro.
          </p>

          <form onSubmit={handleActivateAccount} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '850', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Correo electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(0,0,0,0.1)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '850', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Crea tu contraseña (mínimo 6 caracteres)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  minLength={6}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(0,0,0,0.1)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '850', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Confirma tu contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  minLength={6}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(0,0,0,0.1)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '8px',
                width: '100%',
                background: 'var(--primary)',
                border: 'none',
                padding: '15px 20px',
                borderRadius: '14px',
                fontSize: '1rem',
                fontWeight: '900',
                color: '#FFFFFF',
                cursor: isSubmitting ? 'wait' : 'pointer',
                letterSpacing: '0.5px',
                boxShadow: '0 8px 20px rgba(29, 81, 45, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '52px',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <span>{isSubmitting ? 'Activando...' : 'ACTIVAR CUENTA Y COMENZAR'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </main>
      )}

      {/* ── PIE DE PÁGINA ── */}
      <footer style={{ paddingBottom: '8px', opacity: 0.7 }}>
        <p style={{ fontSize: '0.78rem', fontWeight: '850', color: 'var(--text-primary)', margin: 0 }}>
          Nutrimemi · Acompañamiento Nutricional
        </p>
      </footer>
    </div>
  );
}
