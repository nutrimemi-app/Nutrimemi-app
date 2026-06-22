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
    { key: 'BRAZO', label: 'BRAZO', desc: 'mides la distancia entre el hombro y el codo, ese resultado lo divides entre 2, marcas para no perder la guía y ahí mides la circunferencia del brazo' },
    { key: 'TORSO', label: 'TORSO', desc: 'porción más ancha' },
    { key: 'CINTURA', label: 'CINTURA', desc: 'porción más delgada de la cintura' },
    { key: 'CADERA', label: 'CADERA', desc: 'porción más ancha' },
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

  return (
    <div style={{ padding: '40px 20px', color: '#1d512d', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '900', textAlign: 'center', marginBottom: '30px' }}>ANTROPOMETRÍA</h1>

      <div style={{ 
        background: '#1d512d', 
        borderRadius: '30px', 
        padding: '30px 20px', 
        color: 'white',
        marginBottom: '40px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: '800', opacity: 0.7, marginBottom: '20px', letterSpacing: '2px' }}>GUÍA DE MEDICIÓN</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {measurementGuides.map(guide => (
            <div key={guide.key} style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '15px', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: '900' }}>{guide.label}</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.8, lineHeight: '1.2' }}>{guide.desc}</p>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input 
                  type="number"
                  step="0.1"
                  value={measurements[guide.key]}
                  onChange={(e) => setMeasurements({...measurements, [guide.key]: e.target.value})}
                  style={{ 
                    width: '60px', 
                    background: 'rgba(255,255,255,0.2)', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    color: 'white',
                    padding: '8px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: '700'
                  }}
                />
                <span style={{ fontSize: '0.7rem', fontWeight: '800' }}>cm</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        style={{
          width: '100%',
          background: '#1d512d',
          color: 'white',
          padding: '20px',
          borderRadius: '16px',
          fontSize: '1.2rem',
          fontWeight: '900',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        SIGUIENTE PASO: FOTOS
      </button>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1d512d' }}>nutrimemi</p>
      </div>
    </div>
  );
}
