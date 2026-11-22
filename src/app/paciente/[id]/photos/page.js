'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Camera, Upload, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, Info, X } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { updatePatient } from '@/lib/patients';
import { usePatient } from '@/hooks/usePatient';

export default function PhotosPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const { patient, status } = usePatient(params.id);

  const [consentGranted, setConsentGranted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Las 4 vistas fotográficas requeridas
  const [photos, setPhotos] = useState({
    front: null,
    back: null,
    left: null,
    right: null
  });

  const photoViews = [
    { key: 'front', label: 'Frente', tip: 'De pie, brazos ligeramente separados' },
    { key: 'back', label: 'Espalda', tip: 'Postura natural, hombros relajados' },
    { key: 'left', label: 'Perfil Izquierdo', tip: 'Brazos al costado o cruzados al frente' },
    { key: 'right', label: 'Perfil Derecho', tip: 'Brazos al costado o cruzados al frente' }
  ];

  const handleFileChange = (key, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        showToast('La imagen supera el tamaño máximo de 8MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        // En memoria del componente para envío seguro (sin almacenar en localStorage)
        setPhotos(prev => ({ ...prev, [key]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (key) => {
    setPhotos(prev => ({ ...prev, [key]: null }));
  };

  const handleFinish = async (skipPhotos = false) => {
    setIsSaving(true);
    try {
      const hasUploadedAny = !skipPhotos && Object.values(photos).some(Boolean);
      // El consentimiento solo es verdadero si el paciente marcó la casilla
      // explícitamente Y tiene al menos una foto seleccionada.
      // Al omitir el paso no se registra consentimiento.
      const explicitConsent = hasUploadedAny && consentGranted;

      // ── FOTOGRAFÍAS ──────────────────────────────────────────────────────────
      // Las imágenes Base64/DataURL NO se envían a Supabase.
      // No existe aún infraestructura de Storage autorizada para este proyecto.
      // El registro del consentimiento y la finalización del onboarding
      // se persisten dentro de onboardingAnswers (campo ya mapeado en updatePatient).
      // ─────────────────────────────────────────────────────────────────────────

      const existingAnswers = patient?.onboardingAnswers || {};

      const onboardingCompletion = {
        onboardingStatus:   'completed',
        completedAt:        new Date().toISOString(),
        lastUpdatedAt:      new Date().toISOString(),
        source:             'self_reported',
        reviewStatus:       'pending_review',
        // Metadatos de fotografías — sin binarios
        photosStep: {
          skipped:         !hasUploadedAny,
          photosUploaded:  hasUploadedAny ? uploadedCount : 0,
          consentGranted:  explicitConsent,
          // Si el paciente subió fotos localmente, dejamos constancia de que
          // existen pero que aún no hay almacenamiento aprobado.
          storagePending:  hasUploadedAny
        }
      };

      const expectedUpdatedAt = patient?.updated_at;
      if (!expectedUpdatedAt) {
        showToast('Sincronizando con el servidor, por favor intenta en unos segundos.', 'warning');
        setIsSaving(false);
        return;
      }

      // Merge conservador: no sobrescribe respuestas previas del cuestionario
      await updatePatient(params.id, {
        onboardingAnswers: {
          ...existingAnswers,
          ...onboardingCompletion
        },
        _expectedUpdatedAt: expectedUpdatedAt,
        _patientBase: patient
        // ← Sin `status`, sin `onboardingPhotos`, sin Base64
      });

      setSuccess(true);
    } catch (err) {
      console.error('Error al finalizar registro:', err);
      if (err.code === 'VERSION_CONFLICT' || err.code === 'CLINICAL_FIELD_CONFLICT') {
        showToast('El expediente fue actualizado concurrentemente. Por favor recarga.', 'error');
      } else {
        showToast('Error al enviar la información. Por favor intenta de nuevo.', 'error');
      }
      setIsSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-primary)' }}>
        <p style={{ fontWeight: '850', fontSize: '1.1rem' }}>Cargando...</p>
      </div>
    );
  }

  // ── PANTALLA FINAL DE CONFIRMACIÓN (SOLO TRAS RESPUESTA REAL EXITOSA) ──
  if (success) {
    return (
      <div className="fade-in" style={{ 
        padding: '24px 20px', 
        color: 'var(--text-primary)', 
        minHeight: '100dvh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        maxWidth: '460px',
        margin: '0 auto'
      }}>
        <div style={{ 
          padding: '36px 24px', 
          background: '#FFFFFF', 
          borderRadius: '28px', 
          boxShadow: 'var(--shadow-premium)', 
          border: '1.5px solid rgba(29, 81, 45, 0.1)',
          width: '100%'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(29, 81, 45, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <CheckCircle2 size={46} color="var(--primary)" />
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 10px', color: 'var(--text-primary)' }}>
            ¡Registro completado!
          </h1>
          <p style={{ fontSize: '0.94rem', fontWeight: '700', lineHeight: '1.4', margin: '0 0 20px', color: '#374151' }}>
            Tus respuestas y medidas han sido guardadas en tu expediente. Tu nutricionista las revisará para estructurar tu plan.
          </p>

          <div style={{ 
            background: 'rgba(253, 158, 20, 0.08)', 
            padding: '16px', 
            borderRadius: '16px', 
            marginBottom: '16px', 
            border: '1px solid rgba(253, 158, 20, 0.25)',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '0.82rem', fontWeight: '850', color: '#92400E', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={16} /> Próximo paso:
            </p>
            <p style={{ fontSize: '0.78rem', color: '#78350F', margin: 0, lineHeight: '1.35' }}>
              Tu nutricionista revisará tus datos autorreportados para estructurar tu plan alimentario personalizado.
            </p>
          </div>

          {/* Aviso honesto sobre fotografías */}
          <div style={{ 
            background: 'rgba(2, 132, 199, 0.06)', 
            padding: '14px 16px', 
            borderRadius: '14px', 
            marginBottom: '24px', 
            border: '1px solid rgba(2, 132, 199, 0.18)',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '0.76rem', color: '#0369A1', margin: 0, lineHeight: '1.4' }}>
              <strong>Fotografías:</strong> Este paso es opcional. Cuando esté disponible la funcionalidad de carga segura, podrás adjuntarlas desde tu portal o consultando directamente a tu nutricionista.
            </p>
          </div>

          <button 
            onClick={() => router.push(`/paciente/${params.id}/dashboard`)}
            style={{
              width: '100%',
              background: 'var(--primary)',
              color: '#FFFFFF',
              padding: '16px 24px',
              borderRadius: '16px',
              fontSize: '0.98rem',
              fontWeight: '900',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(29, 81, 45, 0.25)',
              minHeight: '52px'
            }}
          >
            Ir a mi portal
          </button>
        </div>

        <p style={{ marginTop: '24px', fontSize: '0.78rem', fontWeight: '800', opacity: 0.6 }}>
          Nutrimemi · Gestión Nutricional
        </p>
      </div>
    );
  }

  const uploadedCount = Object.values(photos).filter(Boolean).length;

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
            onClick={() => router.push(`/paciente/${params.id}/measurements`)}
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
            <ArrowLeft size={15} /> Volver a medidas
          </button>

          <span style={{ fontSize: '0.75rem', fontWeight: '850', opacity: 0.65 }}>
            Paso 3: Fotografías (Opcional)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Camera size={22} color="var(--primary)" />
          <h1 style={{ fontSize: '1.35rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
            Fotografías de Seguimiento
          </h1>
        </div>
        <p style={{ fontSize: '0.82rem', opacity: 0.7, margin: '0 0 16px', lineHeight: '1.35' }}>
          Este paso es completamente voluntario. Ayuda a valorar cambios posturales y de composición corporal a lo largo de tu tratamiento.
        </p>

        {/* ── CUADRO DE FINALIDAD Y CONSENTIMIENTO EXPLÍCITO ── */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '18px',
          padding: '16px',
          border: '1.5px solid rgba(253, 158, 20, 0.3)',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={18} color="#D97706" />
            <span style={{ fontSize: '0.8rem', fontWeight: '850', color: '#92400E' }}>
              Finalidad médica y consentimiento
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: '#4B5563', lineHeight: '1.4', margin: '0 0 12px' }}>
            Las fotografías se solicitan exclusivamente con fines clínicos para acompañar tu proceso nutricional. El acceso a este material está restringido a tu profesional tratante. Si prefieres no tomarlas ahora, puedes omitir este paso en cualquier momento.
          </p>

          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.78rem',
            fontWeight: '800',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '8px',
            background: 'rgba(29, 81, 45, 0.04)',
            borderRadius: '10px'
          }}>
            <input
              type="checkbox"
              checked={consentGranted}
              onChange={(e) => setConsentGranted(e.target.checked)}
              style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--primary)' }}
            />
            <span>
              Autorizo adjuntar estas fotografías para la valoración exclusiva de mi nutricionista.
            </span>
          </label>
        </div>

        {/* ── LAS 4 VISTAS FOTOGRÁFICAS ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '18px',
          opacity: consentGranted ? 1 : 0.45,
          pointerEvents: consentGranted ? 'auto' : 'none',
          transition: 'opacity 0.2s ease'
        }}>
          {photoViews.map((view) => {
            const hasPhoto = Boolean(photos[view.key]);
            return (
              <div 
                key={view.key}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '12px',
                  border: hasPhoto ? '2px solid var(--primary)' : '1px dashed rgba(0,0,0,0.15)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '140px',
                  position: 'relative'
                }}
              >
                {hasPhoto ? (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img
                      src={photos[view.key]}
                      alt={view.label}
                      style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px' }}
                    />
                    <button
                      onClick={() => removePhoto(view.key)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Eliminar foto"
                    >
                      <X size={14} />
                    </button>
                    <span style={{ fontSize: '0.72rem', fontWeight: '850', marginTop: '4px', display: 'block', color: 'var(--primary)' }}>
                      ✓ {view.label}
                    </span>
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(view.key, e)}
                      style={{ display: 'none' }}
                      disabled={!consentGranted}
                    />
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(29, 81, 45, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '6px'
                    }}>
                      <Camera size={18} color="var(--primary)" />
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: '850', color: 'var(--text-primary)' }}>
                      {view.label}
                    </span>
                    <span style={{ fontSize: '0.64rem', opacity: 0.6, marginTop: '2px', lineHeight: '1.2' }}>
                      {view.tip}
                    </span>
                  </label>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* ── BOTONES DE FINALIZACIÓN ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {/* Botón principal (si cargó fotos) */}
        {consentGranted && uploadedCount > 0 ? (
          <button
            onClick={() => handleFinish(false)}
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
            <span>{isSaving ? 'Guardando expediente...' : `Finalizar registro (${uploadedCount} foto${uploadedCount > 1 ? 's' : ''} seleccionada${uploadedCount > 1 ? 's' : ''})`}</span>
            <ArrowRight size={18} />
          </button>
        ) : null}

        {/* Botón explícito para omitir */}
        <button
          onClick={() => handleFinish(true)}
          disabled={isSaving}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '16px',
            fontWeight: '850',
            fontSize: '0.88rem',
            background: consentGranted && uploadedCount > 0 ? 'transparent' : 'var(--primary)',
            color: consentGranted && uploadedCount > 0 ? '#4B5563' : '#FFFFFF',
            border: consentGranted && uploadedCount > 0 ? '1.5px solid rgba(0,0,0,0.1)' : 'none',
            cursor: isSaving ? 'wait' : 'pointer',
            minHeight: '50px'
          }}
        >
          {consentGranted && uploadedCount > 0 
            ? 'Omitir fotos y finalizar de todas formas' 
            : (isSaving ? 'Finalizando registro...' : 'Omitir fotografías y finalizar')}
        </button>
      </div>

    </div>
  );
}
