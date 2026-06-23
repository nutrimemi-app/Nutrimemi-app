'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function MeasurementsPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [measurements, setMeasurements] = useState({
    CUELLO: '',
    BRAZO: '',
    TORSO: '',
    CINTURA: '',
    CADERA: '',
    GLÚTEOS: '',
    MUSLO: '',
    PANTORRILLA: ''
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const found = saved.find(p => p.id === parseInt(params.id));
    if (found) {
      setPatient(found);
      if (found.measurements) {
        setMeasurements({ ...measurements, ...found.measurements });
      }
    }
  }, [params.id]);

  const measurementGuides = [
    { key: 'CUELLO', label: 'CUELLO', desc: 'medir en el punto medio del cuello' },
    { key: 'BRAZO', label: 'BRAZO', desc: 'mides la distancia entre el hombro y el codo, divides entre 2 y ahí mides la circunferencia' },
    { key: 'TORSO', label: 'TORSO', desc: 'porción más ancha del torso' },
    { key: 'CINTURA', label: 'CINTURA', desc: 'porción más delgada de la cintura' },
    { key: 'CADERA', label: 'CADERA', desc: 'porción más ancha de la cadera' },
    { key: 'GLÚTEOS', label: 'GLÚTEOS', desc: 'porción más ancha de los glúteos' },
    { key: 'MUSLO', label: 'MUSLO', desc: 'punto medio entre cadera y rodilla derecha' },
    { key: 'PANTORRILLA', label: 'PANTORRILLA', desc: 'porción más ancha de la pantorrilla' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const updated = saved.map(p => {
      if (p.id === parseInt(params.id)) {
        return { ...p, measurements: measurements };
      }
      return p;
    });
    localStorage.setItem('nutri_patients', JSON.stringify(updated));
    router.push(`/paciente/${params.id}/photos`);
  };

  const isFemale = patient?.gender === 'Femenino';
  const themeColor = isFemale ? '#FF6B6B' : '#4D96FF'; // Rosa o Azul

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
      <h1 style={{ fontSize: '2.4rem', fontWeight: '900', margin: '20px 0' }}>ANTROPOMETRÍA</h1>

      <div style={{ 
        background: themeColor, 
        borderRadius: '25px', 
        padding: '20px', 
        color: 'white',
        width: '100%',
        maxWidth: '380px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        overflowY: 'auto' // Permite mini-scroll interno si hay muchos campos, pero el body no scrollea
      }}>
        <p style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: '900', opacity: 0.8, marginBottom: '15px', letterSpacing: '2px' }}>GUÍA DE MEDICIÓN</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {measurementGuides.map(guide => (
            <div key={guide.key} style={{ display: 'grid', gridTemplateColumns: '1fr 70px', gap: '10px', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: '900' }}>{guide.label}</p>
                <p style={{ fontSize: '0.65rem', opacity: 0.8, lineHeight: '1.2' }}>{guide.desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="number"
                  step="0.1"
                  value={measurements[guide.key]}
                  onChange={(e) => setMeasurements({...measurements, [guide.key]: e.target.value})}
                  style={{ 
                    width: '50px', 
                    background: 'rgba(255,255,255,0.2)', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    color: 'white',
                    padding: '6px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: '700',
                    fontSize: '0.8rem'
                  }}
                />
                <span style={{ fontSize: '0.6rem', fontWeight: '800' }}>cm</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '380px', padding: '20px 0' }}>
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
            boxShadow: '0 4px 15px rgba(29, 81, 45, 0.3)'
          }}
        >
          SIGUIENTE PASO: FOTOS
        </button>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1d512d', margin: 0 }}>nutrimemi</p>
        </div>
      </div>
    </div>
  );
}
