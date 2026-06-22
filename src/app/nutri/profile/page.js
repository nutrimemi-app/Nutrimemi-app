'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { User, Mail, Shield, LogOut, Settings, Award, Users, Calendar, ArrowLeft, Camera, Share2, Save, Edit2 } from 'lucide-react';
import Link from 'next/link';

export default function NutriProfile() {
  const { user, logout } = useAuth();
  const { showToast } = useUI();
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({ patients: 0, appointments: 0 });
  
  // Datos editables de la Nutricionista
  const [profile, setProfile] = useState({
    name: 'Dra. Salomé',
    specialty: 'NUTRICIONISTA CLÍNICO & DEPORTIVO',
    photo: '/SALOME.png',
    instagram: '@nutrimemi',
    whatsapp: '+58 412 000 0000',
    location: 'Sede Principal, Nutrimemi'
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem('nutri_profile_data');
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    const savedPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const savedAppointments = JSON.parse(localStorage.getItem('nutri_appointments') || '[]');
    setStats({
      patients: savedPatients.length,
      appointments: savedAppointments.length
    });
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    localStorage.setItem('nutri_profile_data', JSON.stringify(profile));
    setIsEditing(false);
    showToast('Perfil actualizado correctamente', 'success');
  };

  const shareVirtualCard = () => {
    const text = `🌟 *Nutrimemi - Tarjeta Virtual* 🌟\n\n👩‍⚕️ *${profile.name}*\n📍 ${profile.specialty}\n\n📱 Contacto: ${profile.whatsapp}\n📸 Instagram: ${profile.instagram}\n\n_Gestiono tu nutrición de forma experta._`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '120px' }} className="fade-in">
      <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/nutri/dashboard" style={{ color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
            </Link>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900' }}>Mi Perfil</h2>
        </div>
        <button 
          onClick={isEditing ? saveProfile : () => setIsEditing(true)}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
        >
          {isEditing ? <Save size={24} /> : <Edit2 size={24} />}
        </button>
      </header>

      {/* Hero Profile Card */}
      <section className="glass-panel" style={{ 
        padding: '30px', 
        textAlign: 'center', 
        marginBottom: '24px',
        position: 'relative'
      }}>
        {/* Foto de Perfil Circular */}
        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 16px' }}>
            <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            background: profile.photo ? `url(${profile.photo})` : 'var(--primary)', 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '4px solid white',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            overflow: 'hidden'
            }}>
            {!profile.photo && <User size={60} color="white" />}
            </div>
            <label style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                background: 'var(--action)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '2px solid white'
            }}>
                <Camera size={18} color="white" />
                <input type="file" hidden onChange={handlePhotoChange} accept="image/*" />
            </label>
        </div>

        {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                    className="input-field" 
                    value={profile.name} 
                    onChange={e => setProfile({...profile, name: e.target.value})} 
                    style={{ textAlign: 'center', marginBottom: 0, fontWeight: '900' }}
                />
                <input 
                    className="input-field" 
                    value={profile.specialty} 
                    onChange={e => setProfile({...profile, specialty: e.target.value})} 
                    style={{ textAlign: 'center', fontSize: '0.8rem', marginBottom: 0 }}
                />
            </div>
        ) : (
            <>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {profile.name}
                </h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: '800', marginBottom: '16px' }}>
                    {profile.specialty}
                </p>
            </>
        )}

        <button 
            onClick={shareVirtualCard}
            style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '100px',
                fontSize: '0.8rem',
                fontWeight: '900',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '16px',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(29, 81, 45, 0.2)'
            }}
        >
            <Share2 size={16} /> COMPARTIR TARJETA VIRTUAL
        </button>
      </section>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <Users size={24} color="var(--primary)" style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>{stats.patients}</p>
              <p style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: '700' }}>PACIENTES</p>
          </div>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <Calendar size={24} color="var(--primary)" style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>{stats.appointments}</p>
              <p style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: '700' }}>CITAS</p>
          </div>
      </div>

      {/* Contact Info (Editable) */}
      <section className="glass-panel" style={{ padding: '16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '900', opacity: 0.5 }}>TELÉFONO / WHATSAPP</label>
                  {isEditing ? (
                      <input className="input-field" value={profile.whatsapp} onChange={e => setProfile({...profile, whatsapp: e.target.value})} style={{ marginBottom: 0 }} />
                  ) : (
                      <p style={{ fontWeight: '700' }}>{profile.whatsapp}</p>
                  )}
              </div>
              <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '900', opacity: 0.5 }}>INSTAGRAM</label>
                  {isEditing ? (
                      <input className="input-field" value={profile.instagram} onChange={e => setProfile({...profile, instagram: e.target.value})} style={{ marginBottom: 0 }} />
                  ) : (
                      <p style={{ fontWeight: '700' }}>{profile.instagram}</p>
                  )}
              </div>
              <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '900', opacity: 0.5 }}>SEDE / DIRECCIÓN</label>
                  {isEditing ? (
                      <input className="input-field" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} style={{ marginBottom: 0 }} />
                  ) : (
                      <p style={{ fontWeight: '700' }}>{profile.location}</p>
                  )}
              </div>
          </div>
      </section>

      {/* Danger Zone */}
      {!isEditing && (
        <button 
            onClick={handleLogout}
            style={{
            width: '100%',
            padding: '20px',
            borderRadius: '20px',
            background: 'rgba(255, 94, 94, 0.1)',
            color: '#ff5e5e',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontWeight: '900',
            cursor: 'pointer'
            }}
        >
            <LogOut size={20} /> CERRAR SESIÓN
        </button>
      )}

      <div style={{ textAlign: 'center', marginTop: '32px', opacity: 0.4 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: '800' }}>NUTRIMEMI PWA v1.0.5</p>
          <p style={{ fontSize: '0.6rem' }}>Design & Card Technology</p>
      </div>
    </div>
  );
}
