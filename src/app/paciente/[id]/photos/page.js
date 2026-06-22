'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Camera, Upload, CheckCircle2 } from 'lucide-react';

export default function PhotosPage() {
  const params = useParams();
  const router = useRouter();
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
        return { ...p, onboardingPhotos: photos };
      }
      return p;
    });
    localStorage.setItem('nutri_patients', JSON.stringify(updated));
    alert('¡Proceso completado con éxito! Tu nutricionista revisará tu información pronto. Ya puedes ver tu plan personalizado.');
    router.push(`/paciente/${params.id}/dashboard`);
  };

  return (
    <div style={{ padding: '40px 20px', color: '#1d512d', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '900', textAlign: 'center', marginBottom: '30px' }}>REGISTRO FOTOGRÁFICO</h1>

      <div style={{ 
        background: 'rgba(255,255,255,0.7)', 
        borderRadius: '20px', 
        padding: '20px', 
        marginBottom: '30px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase' }}>VESTIMENTA:</p>
          <p style={{ fontSize: '1rem', fontWeight: '600' }}>ropa interior o traje de baño</p>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase' }}>CONDICIONES:</p>
          <p style={{ fontSize: '1rem', fontWeight: '600' }}>a primera hora de la mañana</p>
        </div>
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', color: '#cc0000' }}>IMPORTANTE:</p>
          <p style={{ fontSize: '1rem', fontWeight: '600' }}>tomar las fotos con buena iluminación y en donde se vea la mejor parte posible del cuerpo</p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        width: '100%', 
        maxWidth: '400px',
        marginBottom: '40px'
      }}>
        {photoLabels.map(item => (
          <div key={item.key} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: '800', marginBottom: '8px' }}>{item.label}</p>
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              aspectRatio: '1',
              background: photos[item.key] ? `url(${photos[item.key]})` : 'white',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '16px',
              cursor: 'pointer',
              border: photos[item.key] ? '2px solid #1d512d' : '2px dashed rgba(29, 81, 45, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {!photos[item.key] && <Camera size={40} opacity={0.3} />}
              {!photos[item.key] && <span style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.5 }}>Tocar para subir</span>}
              {photos[item.key] && (
                <div style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px'
                }}>
                    <CheckCircle2 size={18} color="#1d512d" />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(item.key, e)}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        ))}
      </div>

      <button 
        onClick={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#1d512d',
          color: 'white',
          padding: '20px',
          borderRadius: '16px',
          fontSize: '1.2rem',
          fontWeight: '900',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        <Upload size={24} /> FINALIZAR PROCESO
      </button>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1d512d' }}>nutrimemi</p>
      </div>
    </div>
  );
}
