'use client';
import { useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUI } from '@/context/UIContext';
import { createPatient } from '@/lib/patients';

export default function PatientSelfRegister() {
  const { showToast } = useUI();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    ci: '',
    phone: '',
    birthDate: '',
    gender: 'female'
  });

  const [loading, setLoading] = useState(false);

  const calculateAge = (dateString) => {
    if (!dateString) return '';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const age = calculateAge(formData.birthDate);
      const dataToSubmit = { ...formData, age };
      
      const created = await createPatient(dataToSubmit);
      showToast('¡Cuenta creada! Vamos a configurar tu perfil.', 'success');
      
      // Redirect to the onboarding flow for this new patient
      router.push(`/paciente/${created.id}`);
    } catch (err) {
      showToast('Error al crear tu cuenta. Intenta nuevamente.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px 20px 140px' }}>
      <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" style={{ color: 'var(--text-primary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)' }}>Crear Cuenta</h2>
      </header>

      <div className="fade-in" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '120px', margin: '0 auto' }} />
          <p style={{ marginTop: '16px', opacity: 0.7, fontSize: '0.9rem', fontWeight: '700' }}>
            Ingresa tus datos para comenzar tu plan de nutrición.
          </p>
        </div>

        <form onSubmit={handleRegister} className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          
          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Nombre Completo</label>
          <input 
            type="text" 
            placeholder="Nombre y Apellido" 
            className="input-field"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />

          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Correo Electrónico</label>
          <input 
            type="email" 
            placeholder="ejemplo@correo.com" 
            className="input-field"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Cédula</label>
              <input 
                type="text" 
                placeholder="V-00000000" 
                className="input-field"
                value={formData.ci}
                onChange={(e) => setFormData({...formData, ci: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Teléfono</label>
              <input 
                type="text" 
                placeholder="Ej: 0412..." 
                className="input-field"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Fecha de Nac.</label>
              <input 
                type="date" 
                className="input-field"
                value={formData.birthDate}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Género</label>
              <select 
                className="input-field"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                required
              >
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ 
              width: '100%', 
              padding: '18px', 
              borderRadius: '16px', 
              fontSize: '1rem', 
              fontWeight: '900', 
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creando perfil...' : (
              <>
                <UserPlus size={20} /> Empezar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
