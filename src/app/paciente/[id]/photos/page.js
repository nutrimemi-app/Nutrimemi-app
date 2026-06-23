'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Camera, Upload, CheckCircle2, Bell } from 'lucide-react';
import { useUI } from '@/context/UIContext';

export default function PhotosPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const [success, setSuccess] = useState(false);
  const [photos, setPhotos] = useState({
    front: null,
    back: null,
    left: null,
    right: null
  });

  const photoLabels = [
    { key: 'front', label: 'Frente' },
    { key: 'back', label: 'Espalda' },
    { key: 'left', label: 'Lateral Izquierdo' },
    { key: 'right', label: 'Lateral Derecho' },
  ];

  const handleFileChange = (key, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos({ ...photos, [key]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const updated = saved.map(p => {
      if (p.id === parseInt(params.id)) {
        return { 
          ...p, 
          onboardingPhotos: photos,
          registrationComplete: true,
          status: 'Waiting Plan' 
        };
      }
      return p;
    });
    localStorage.setItem('nutri_patients', JSON.stringify(updated));
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="fade-in" style={{ 
        padding: '20px', 
        color: '#1d512d', 
        height: '100dvh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ padding: '40px', background: 'white', borderRadius: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', maxWidth: '350px' }}>
          <CheckCircle2 size={80} color="#1d512d" style={{ marginBottom: '20px' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '15px' }}>¡GRACIAS!</h1>
          <p style={{ fontSize: '1.1rem', fontWeight: '700', lineHeight: '1.4', marginBottom: '20px' }}>
            He recibido toda tu información correctamente.
          </p>
          <div style={{ background: 'rgba(253, 158, 20, 0.1)', padding: '20px', borderRadius: '20px', marginBottom: '25px', border: '1px dashed #fd9e14' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#cc7a00', marginBottom: '10px' }}>
              <Bell size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> ¡IMPORTANTE!
            </p>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#333' }}>
              Debes esperar hasta que se cargue tu plan de alimentación. ¡Activa las notificaciones para enterarte apenas esté listo!
            </p>
          </div>
          <button 
            onClick={() => router.push(`/paciente/${params.id}/dashboard`)}
            style={{
              width: '100%',
              background: '#1d512d',
              color: 'white',
              padding: '18px',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: '900',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            IR A MI PANEL
          </button>
        </div>
        <p style={{ marginTop: '30px', fontSize: '1.2rem', fontWeight: '900' }}>nutrimemi</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      color: '#1d512d', 
      height: '100dvh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'hidden'
    }}>
      <h1 style={{ fontSize: '2.1rem', fontWeight: '900', margin: '20px 0', textAlign: 'center' }}>REGISTRO FOTOGRÁFICO</h1>

      <div style={{ width: '100%', maxWidth: '380px', flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', padding: '10px' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.7)', 
          borderRadius: '20px', 
          padding: '15px', 
          fontSize: '0.8rem'
        }}>
          <p style={{ fontWeight: '900', marginBottom: '4px' }}>VESTIMENTA: <span style={{ fontWeight: '600' }}>ropa interior o traje de baño</span></p>
          <p style={{ fontWeight: '900', marginBottom: '4px' }}>CONDICIONES: <span style={{ fontWeight: '600' }}>a primera hora de la mañana</span></p>
          <p style={{ fontWeight: '900', color: '#cc0000' }}>IMPORTANTE: <span style={{ fontWeight: '600', color: '#333' }}>buena iluminación y cuerpo completo</span></p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px'
        }}>
          {photoLabels.map(item => (
            <div key={item.key} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: '800', marginBottom: '5px' }}>{item.label}</p>
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                aspectRatio: '0.9',
                background: photos[item.key] ? `url(${photos[item.key]})` : 'white',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '15px',
                cursor: 'pointer',
                border: photos[item.key] ? '2px solid #1d512d' : '2px dashed rgba(29, 81, 45, 0.2)',
                position: 'relative'
              }}>
                {!photos[item.key] && <Camera size={30} opacity={0.2} />}
                {photos[item.key] && (
                  <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'white', borderRadius: '50%' }}>
                      <CheckCircle2 size={16} color="#1d512d" />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(item.key, e)} style={{ display: 'none' }} />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '380px', paddingBottom: '20px' }}>
        <button 
          onClick={handleSubmit}
          style={{
            width: '100%',
            background: '#1d512d',
            color: 'white',
            padding: '18px',
            borderRadius: '50px',
            fontSize: '1rem',
            fontWeight: '900',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 15px rgba(29, 81, 45, 0.3)'
          }}
        >
          <Upload size={20} /> FINALIZAR PROCESO
        </button>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1d512d', margin: 0 }}>nutrimemi</p>
        </div>
      </div>
    </div>
  );
}
