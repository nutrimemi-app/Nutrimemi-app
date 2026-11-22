'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { updatePatient } from '@/lib/patients';
import { usePatient } from '@/hooks/usePatient';
import { useUI } from '@/context/UIContext';
import { ArrowLeft, ArrowRight, Ruler, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MeasurementsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const { patient, status } = usePatient(params.id);

  const [activeZone, setActiveZone] = useState('CINTURA');
  const [isSaving, setIsSaving] = useState(false);

  const [measurements, setMeasurements] = useState({
    PESO: '',
    ESTATURA: '',
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
    if (patient) {
      const curMeas = patient.measurements || {};
      const curDet = patient.details || {};
      setMeasurements(prev => ({
        ...prev,
        ...curMeas,
        PESO: curMeas.PESO || curDet.weight || '',
        ESTATURA: curMeas.ESTATURA || curDet.height || ''
      }));
    }
  }, [patient]);

  // Las 8 medidas anatómicas de Nutrimemi con descripción clínica clara
  const measurementGuides = [
    { key: 'CUELLO', label: 'Cuello', desc: 'Punto medio del cuello, justo debajo de la manzana de Adán.' },
    { key: 'BRAZO', label: 'Brazo', desc: 'Punto medio entre el hombro y el codo, con el brazo relajado.' },
    { key: 'TORSO', label: 'Torso / Tórax', desc: 'Porción más ancha del tórax a la altura de los pezones.' },
    { key: 'CINTURA', label: 'Cintura', desc: 'Porción más estrecha del abdomen, por encima del ombligo.' },
    { key: 'CADERA', label: 'Cadera', desc: 'Porción de mayor circunferencia a nivel de la pelvis.' },
    { key: 'GLÚTEOS', label: 'Glúteos', desc: 'Porción de mayor prominencia posterior de los glúteos.' },
    { key: 'MUSLO', label: 'Muslo', desc: 'Punto medio entre la cadera y la rodilla derecha.' },
    { key: 'PANTORRILLA', label: 'Pantorrilla', desc: 'Porción de mayor circunferencia del músculo gemelo.' },
  ];

  const isFemale = patient?.details?.gender === 'female' || patient?.gender === 'female' || patient?.gender === 'Femenino';
  const silhouetteSrc = isFemale 
    ? '/ICONO ANTROPOMETRIA FEMENINO/FEMENINO_NORMOPESO.svg' 
    : '/ICONO ANTROPOMETRIA MASCULINO/MASCULINO_NORMO PESO.svg';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // ── Separación estricta: medidas autorreportadas van SOLO a _selfReported ──
      // No se tocan las columnas profesionales weight/height ni las claves del
      // objeto measurements que la nutricionista haya registrado.
      const existingMeasurements = patient?.measurements || {};

      // Preservamos la capa profesional intacta y solo actualizamos _selfReported
      const selfReported = {
        PESO:        measurements.PESO        || null,
        ESTATURA:    measurements.ESTATURA    || null,
        CUELLO:      measurements.CUELLO      || null,
        BRAZO:       measurements.BRAZO       || null,
        TORSO:       measurements.TORSO       || null,
        CINTURA:     measurements.CINTURA     || null,
        CADERA:      measurements.CADERA      || null,
        GLÚTEOS:     measurements.GLÚTEOS     || null,
        MUSLO:       measurements.MUSLO       || null,
        PANTORRILLA: measurements.PANTORRILLA || null,
        _recordedAt: new Date().toISOString(),
        _origin:     'self_reported',
        _status:     'pending_review'
      };

      const payloadMeasurements = {
        ...existingMeasurements,          // ← datos profesionales previos intactos
        _selfReported: selfReported       // ← datos del paciente en espacio propio
      };

      const expectedUpdatedAt = patient?.updated_at;
      if (!expectedUpdatedAt) {
        showToast('Sincronizando con el servidor, por favor intenta en unos segundos.', 'warning');
        setIsSaving(false);
        return;
      }

      // No se pasa `details` para no tocar patients.weight ni patients.height
      await updatePatient(params.id, {
        measurements: payloadMeasurements,
        _expectedUpdatedAt: expectedUpdatedAt,
        _patientBase: patient
      });

      router.push(`/paciente/${params.id}/photos`);
    } catch (err) {
      console.error('Error saving measurements:', err);
      if (err.code === 'VERSION_CONFLICT' || err.code === 'CLINICAL_FIELD_CONFLICT') {
        showToast('El expediente fue actualizado concurrentemente. Por favor recarga.', 'error');
      } else {
        showToast('Error al guardar medidas. Intenta nuevamente.', 'error');
      }
      setIsSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-primary)' }}>
        <p style={{ fontWeight: '850', fontSize: '1.1rem' }}>Cargando ficha de medidas...</p>
      </div>
    );
  }

  if (status === 'not-found' || status === 'error') {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#B91C1C', marginBottom: '12px' }}>
          Enlace no disponible
        </h2>
        <p style={{ fontSize: '0.88rem', opacity: 0.8, lineHeight: '1.4' }}>
          Este enlace no se encuentra disponible o ha expirado. Por favor, comunícate con tu nutricionista.
        </p>
      </div>
    );
  }

  const activeGuideObj = measurementGuides.find(g => g.key === activeZone);

  return (
    <div style={{ 
      padding: '16px 20px 100px', 
      color: 'var(--text-primary)', 
      minHeight: '100dvh', 
      maxWidth: '520px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      
      <div>
        {/* ── CABECERA ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <button
            onClick={() => router.push(`/paciente/${params.id}/questions`)}
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '12px',
              padding: '8px 12px',
              fontSize: '0.78rem',
              fontWeight: '800',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={15} /> Volver a preguntas
          </button>

          <span style={{ fontSize: '0.75rem', fontWeight: '850', opacity: 0.65 }}>
            Paso 2: Antropometría
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Ruler size={22} color="var(--primary)" />
          <h1 style={{ fontSize: '1.35rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
            Medidas Corporales
          </h1>
        </div>
        <p style={{ fontSize: '0.82rem', opacity: 0.7, margin: '0 0 16px', lineHeight: '1.35' }}>
          Ingresa tus datos con cinta métrica flexible. Si no tienes cinta para alguna medida, puedes dejarla vacía.
        </p>

        {/* ── TARJETA: PESO Y ESTATURA BÁSICOS ── */}
        <div style={{ 
          background: '#FFFFFF', 
          borderRadius: '18px', 
          padding: '16px', 
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: '850', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Mediciones básicas
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '850', marginBottom: '4px' }}>
                Peso actual (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                inputMode="decimal"
                value={measurements.PESO}
                onChange={(e) => setMeasurements({ ...measurements, PESO: e.target.value })}
                placeholder="Ej. 65.5"
                className="input-field"
                style={{ padding: '10px 12px', fontSize: '1rem', fontWeight: '850', marginBottom: 0, borderRadius: '10px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '850', marginBottom: '4px' }}>
                Estatura (cm)
              </label>
              <input
                type="number"
                step="0.5"
                min="50"
                max="250"
                inputMode="numeric"
                value={measurements.ESTATURA}
                onChange={(e) => setMeasurements({ ...measurements, ESTATURA: e.target.value })}
                placeholder="Ej. 165"
                className="input-field"
                style={{ padding: '10px 12px', fontSize: '1rem', fontWeight: '850', marginBottom: 0, borderRadius: '10px' }}
              />
            </div>
          </div>
        </div>

        {/* ── GUÍA ANATÓMICA CON SILUETA SVG DE NUTRIMEMI ── */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '16px',
          border: '1.5px solid rgba(29, 81, 45, 0.12)',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '850', color: 'var(--primary)', textTransform: 'uppercase' }}>
              Guía Anatómica de Circunferencias
            </span>
            <span style={{ fontSize: '0.66rem', opacity: 0.6, fontWeight: '750' }}>
              (en centímetros)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
            {/* Silueta SVG oficial de Nutrimemi */}
            <div style={{
              width: '100px',
              height: '160px',
              background: 'rgba(29, 81, 45, 0.03)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              flexShrink: 0,
              border: '1px solid rgba(29, 81, 45, 0.08)'
            }}>
              <img 
                src={silhouetteSrc} 
                alt="Silueta Anatómica Nutrimemi" 
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Zona activa y consejo clínico */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: '850', color: '#D97706', textTransform: 'uppercase' }}>
                Zona seleccionada:
              </span>
              <p style={{ margin: '2px 0 4px', fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                {activeGuideObj?.label || activeZone}
              </p>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#4B5563', lineHeight: '1.35' }}>
                {activeGuideObj?.desc}
              </p>
            </div>
          </div>

          {/* Lista de las 8 Medidas con selector interactivo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {measurementGuides.map(guide => {
              const isActive = activeZone === guide.key;
              return (
                <div
                  key={guide.key}
                  onClick={() => setActiveZone(guide.key)}
                  style={{
                    background: isActive ? 'rgba(29, 81, 45, 0.06)' : 'rgba(0,0,0,0.02)',
                    border: isActive ? '1.5px solid var(--primary)' : '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: isActive ? '850' : '750', color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {guide.label}
                    </span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.6, display: 'block' }}>
                      {guide.desc}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <input
                      type="number"
                      step="0.1"
                      min="10"
                      max="250"
                      inputMode="decimal"
                      value={measurements[guide.key]}
                      onFocus={() => setActiveZone(guide.key)}
                      onChange={(e) => setMeasurements({ ...measurements, [guide.key]: e.target.value })}
                      placeholder="0.0"
                      style={{
                        width: '70px',
                        padding: '6px 8px',
                        fontSize: '0.92rem',
                        fontWeight: '850',
                        border: '1px solid rgba(0,0,0,0.15)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        outline: 'none',
                        background: '#FFFFFF',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <span style={{ fontSize: '0.72rem', fontWeight: '750', opacity: 0.6 }}>cm</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── BOTÓN DE GUARDAR Y AVANZAR ── */}
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: '16px',
            fontWeight: '900',
            fontSize: '0.98rem',
            background: 'var(--primary)',
            color: '#FFFFFF',
            border: 'none',
            cursor: isSaving ? 'wait' : 'pointer',
            boxShadow: '0 6px 18px rgba(29, 81, 45, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '52px',
            opacity: isSaving ? 0.7 : 1
          }}
        >
          <span>{isSaving ? 'Guardando medidas...' : 'Guardar y pasar a Fotografías'}</span>
          <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
}
