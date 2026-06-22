'use client';
import { useState } from 'react';
import { ShieldCheck, Mail, Lock, CheckCircle, Info } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useUI } from '@/context/UIContext';

export default function PatientRegistration() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    pin: ''
  });

  const handleRegister = (e) => {
    e.preventDefault();
    if (formData.pin.length !== 4 || isNaN(formData.pin)) {
      showToast('El PIN debe ser de 4 dígitos numéricos', 'error');
      return;
    }
    setStep(2);
    setTimeout(() => {
      router.push('/patient/home');
    }, 2000);
  };

  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div className="fade-in" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px', color: 'var(--text-primary)' }}>
           <img src="/logo.png" alt="Logo" style={{ width: '180px', margin: '0 auto' }} />
        </div>

        {step === 1 ? (
          <>
            <h2 style={{ marginBottom: '12px' }}>Completa tu Registro</h2>
            <p style={{ opacity: 0.6, marginBottom: '32px', fontSize: '0.9rem' }}>
              Configura tus credenciales para acceder a tu plan de nutrición.
            </p>

            <form onSubmit={handleRegister}>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="email" 
                  placeholder="Tu correo electrónico" 
                  className="input-field"
                  style={{ paddingLeft: '48px', marginBottom: 0 }}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div style={{ position: 'relative', marginBottom: '32px' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="password" 
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="PIN de 4 números" 
                  className="input-field"
                  style={{ paddingLeft: '48px', marginBottom: 0 }}
                  value={formData.pin}
                  onChange={(e) => setFormData({...formData, pin: e.target.value})}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Activar mi Cuenta
              </button>
            </form>
          </>
        ) : (
          <div className="fade-in" style={{ padding: '40px 0' }}>
            <CheckCircle size={64} color="var(--card-green)" style={{ marginBottom: '24px' }} />
            <h2 style={{ marginBottom: '12px' }}>¡Todo Listo!</h2>
            <p style={{ opacity: 0.6 }}>Redirigiéndote a tu dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
