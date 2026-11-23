'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { updatePatient } from '@/lib/patients';
import { usePatient } from '@/hooks/usePatient';
import { useUI } from '@/context/UIContext';
import { 
  ArrowLeft, ArrowRight, Target, Utensils, Activity, 
  Droplets, AlertTriangle, Check, Heart, ShieldAlert, Sparkles 
} from 'lucide-react';

export default function QuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const { patient, status } = usePatient(params.id);
  
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [isSaving, setIsSaving] = useState(false);

  const [answers, setAnswers] = useState({
    goals: [],
    goalsOther: '',
    favFood: '',
    nonFavFood: '',
    mealCount: '',
    physicalActivity: '',
    allergies: '',
    clinicalConditions: '',
    waterGlasses: '',
    waterLiters: ''
  });

  useEffect(() => {
    if (patient && patient.onboardingAnswers) {
      setAnswers(prev => ({
        ...prev,
        ...patient.onboardingAnswers,
        goals: Array.isArray(patient.onboardingAnswers.goals) 
          ? patient.onboardingAnswers.goals 
          : (patient.onboardingAnswers.goals ? [patient.onboardingAnswers.goals] : [])
      }));
    }
  }, [patient]);

  // Las 5 opciones exactas aprobadas para distribución de comidas
  const exactMealOptions = [
    '2 comidas principales.',
    '3 comidas principales.',
    '3 comidas principales + 2 snacks.',
    '3 comidas principales + 3 snacks.',
    '2 comidas principales + 2 snacks.'
  ];

  // Lista de objetivos predeterminados (multiselección)
  const goalOptions = [
    { id: 'fat_loss', label: 'Bajar porcentaje de grasa / Definición' },
    { id: 'muscle_gain', label: 'Aumento de masa muscular' },
    { id: 'digestive_health', label: 'Mejorar salud digestiva y energía' },
    { id: 'sports_performance', label: 'Rendimiento físico y deportivo' },
    { id: 'healthy_habits', label: 'Aprender a comer saludable sin restricciones' }
  ];

  const toggleGoal = (label) => {
    setAnswers(prev => {
      const exists = prev.goals.includes(label);
      const updated = exists 
        ? prev.goals.filter(g => g !== label) 
        : [...prev.goals, label];
      return { ...prev, goals: updated };
    });
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Guardado final del cuestionario
      setIsSaving(true);
      try {
        const existingAnswers = patient?.onboardingAnswers || {};
        const now = new Date().toISOString();
        const payload = {
          ...existingAnswers,     // ← respuestas anteriores preservadas
          ...answers,             // ← respuestas actuales del formulario
          // Metadatos de trazabilidad autorreportada
          _origin:         'self_reported',
          _submittedAt:    now,
          _status:         'pending_review',
          // Estado de onboarding (se consolida en photos/page.js al finalizar)
          onboardingStatus: existingAnswers.onboardingStatus || 'in_progress',
          lastCompletedStep: 'questions',
          lastUpdatedAt:   now,
          source:          'patient_form'
        };

        const expectedUpdatedAt = patient?.updated_at;
        if (!expectedUpdatedAt) {
          showToast('Sincronizando con el servidor, por favor intenta en unos segundos.', 'warning');
          setIsSaving(false);
          return;
        }

        await updatePatient(params.id, {
          onboardingAnswers: payload,
          _expectedUpdatedAt: expectedUpdatedAt,
          _patientBase: patient
        });
        router.push(`/paciente/${params.id}/measurements`);
      } catch (err) {
        console.error('Error saving answers:', err);
        if (err.code === 'VERSION_CONFLICT' || err.code === 'CLINICAL_FIELD_CONFLICT') {
          showToast('El expediente fue actualizado concurrentemente. Por favor recarga.', 'error');
        } else {
          showToast('Error al guardar respuestas. Intenta nuevamente.', 'error');
        }
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push(`/paciente/${params.id}`);
    }
  };

  if (status === 'loading') {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-primary)' }}>
        <p style={{ fontWeight: '850', fontSize: '1.1rem' }}>Cargando tu cuestionario...</p>
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
          Este enlace no se encuentra disponible o ha expirado. Por favor, comunícate con tu nutricionista para recibir uno nuevo.
        </p>
      </div>
    );
  }

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
      
      {/* ── CABECERA Y BARRA DE PROGRESO ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <button
            onClick={handleBack}
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
            <ArrowLeft size={15} /> Regresar
          </button>

          <span style={{ fontSize: '0.75rem', fontWeight: '850', opacity: 0.65 }}>
            Paso {step} de {totalSteps}
          </span>
        </div>

        {/* Barra de Progreso Suave */}
        <div style={{ width: '100%', height: '6px', background: 'rgba(29, 81, 45, 0.1)', borderRadius: '999px', overflow: 'hidden', marginBottom: '22px' }}>
          <div 
            style={{ 
              width: `${(step / totalSteps) * 100}%`, 
              height: '100%', 
              background: 'var(--primary)', 
              borderRadius: '999px',
              transition: 'width 0.3s ease'
            }} 
          />
        </div>

        {/* ── CONTENIDO POR PASOS ── */}

        {/* PASO 1: OBJETIVOS PERSONALES */}
        {step === 1 && (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Target size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                Tus Objetivos Personales
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', opacity: 0.7, margin: '0 0 18px', lineHeight: '1.35' }}>
              Puedes seleccionar uno o varios objetivos principales que quieras alcanzar en tu plan.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {goalOptions.map(opt => {
                const isSelected = answers.goals.includes(opt.label);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleGoal(opt.label)}
                    style={{
                      background: isSelected ? 'rgba(29, 81, 45, 0.08)' : '#FFFFFF',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '16px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.88rem', fontWeight: isSelected ? '850' : '700', color: isSelected ? 'var(--primary)' : '#374151' }}>
                      {opt.label}
                    </span>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: isSelected ? 'none' : '2px solid rgba(0,0,0,0.2)',
                      background: isSelected ? 'var(--primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Opción Otro objetivo */}
            <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '6px' }}>
                ¿Tienes algún otro objetivo o detalle específico?
              </label>
              <textarea
                className="input-field"
                style={{ width: '100%', minHeight: '70px', padding: '12px', fontSize: '0.85rem', marginBottom: 0, borderRadius: '12px' }}
                value={answers.goalsOther}
                onChange={(e) => setAnswers({ ...answers, goalsOther: e.target.value })}
                placeholder="Escribe aquí cualquier meta particular o inquietud que tengas..."
              />
            </div>
          </div>
        )}

        {/* PASO 2: PREFERENCIAS DE ALIMENTACIÓN */}
        {step === 2 && (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Utensils size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                Tus Preferencias Alimentarias
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', opacity: 0.7, margin: '0 0 18px', lineHeight: '1.35' }}>
              Queremos que disfrutes tus comidas. Cuéntanos qué te encanta y qué prefieres evitar.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Comida favorita */}
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  1. Comida favorita
                </label>
                <p style={{ fontSize: '0.72rem', opacity: 0.65, margin: '0 0 8px' }}>
                  Platos, alimentos o preparaciones que más te gustan.
                </p>
                <textarea 
                  className="input-field"
                  style={{ width: '100%', minHeight: '75px', padding: '12px', fontSize: '0.86rem', marginBottom: 0, borderRadius: '12px' }}
                  value={answers.favFood}
                  onChange={(e) => setAnswers({ ...answers, favFood: e.target.value })}
                  placeholder="Ej. Arepas con queso blanco y aguacate, pasta con vegetales..."
                />
              </div>

              {/* Comida no favorita */}
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  2. Comida y alimentos NO favoritos
                </label>
                <p style={{ fontSize: '0.72rem', opacity: 0.65, margin: '0 0 8px' }}>
                  Alimentos que prefieres no incluir en tu pauta nutricional.
                </p>
                <textarea 
                  className="input-field"
                  style={{ width: '100%', minHeight: '75px', padding: '12px', fontSize: '0.86rem', marginBottom: 0, borderRadius: '12px' }}
                  value={answers.nonFavFood}
                  onChange={(e) => setAnswers({ ...answers, nonFavFood: e.target.value })}
                  placeholder="Ej. Hígado, berenjena, lácteos enteros..."
                />
              </div>

              {/* Distribución de comidas (Exactamente las 5 opciones) */}
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  3. ¿Cuántas comidas deseas realizar durante el día?
                </label>
                <p style={{ fontSize: '0.72rem', opacity: 0.65, margin: '0 0 12px' }}>
                  Selecciona la opción que mejor se ajuste a tu rutina diaria:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {exactMealOptions.map((opt) => {
                    const isSelected = answers.mealCount === opt;
                    return (
                      <div
                        key={opt}
                        onClick={() => setAnswers({ ...answers, mealCount: opt })}
                        style={{
                          background: isSelected ? 'rgba(29, 81, 45, 0.08)' : 'rgba(0,0,0,0.02)',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.06)',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? '850' : '700', color: isSelected ? 'var(--primary)' : '#374151' }}>
                          {opt}
                        </span>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '5px solid var(--primary)' : '2px solid rgba(0,0,0,0.25)',
                          background: '#FFFFFF',
                          flexShrink: 0
                        }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: ACTIVIDAD FÍSICA */}
        {step === 3 && (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Activity size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                Actividad Física y Rutina
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', opacity: 0.7, margin: '0 0 18px', lineHeight: '1.35' }}>
              Conocer tu nivel de movimiento diario nos permite calcular con precisión tus requerimientos de energía.
            </p>

            <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.08)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '6px' }}>
                4. Actividad física que realizas, ¿cuál y cuántas veces a la semana o al día?
              </label>
              <p style={{ fontSize: '0.74rem', opacity: 0.65, margin: '0 0 12px', lineHeight: '1.35' }}>
                Describe qué tipo de ejercicio haces (caminata, pesas, correr, natación, etc.), la duración de cada sesión y los días a la semana. Si actualmente no realizas ejercicio, indícalo también.
              </p>

              {/* Botones de sugerencia rápida */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {['Sedentario / Trabajo de oficina', 'Caminata 30-45 min (3-4 días)', 'Gimnasio / Pesas (4-5 días)', 'Entrenamiento funcional / Crossfit', 'Yoga / Pilates'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const current = answers.physicalActivity ? `${answers.physicalActivity}, ${tag}` : tag;
                      setAnswers({ ...answers, physicalActivity: current });
                    }}
                    style={{
                      background: 'rgba(29, 81, 45, 0.05)',
                      border: '1px solid rgba(29, 81, 45, 0.15)',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      fontWeight: '750',
                      color: 'var(--primary)',
                      cursor: 'pointer'
                    }}
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <textarea 
                className="input-field"
                style={{ width: '100%', minHeight: '110px', padding: '12px', fontSize: '0.86rem', marginBottom: 0, borderRadius: '12px' }}
                value={answers.physicalActivity}
                onChange={(e) => setAnswers({ ...answers, physicalActivity: e.target.value })}
                placeholder="Escribe aquí tu actividad física..."
              />
            </div>
          </div>
        )}

        {/* PASO 4: HIDRATACIÓN */}
        {step === 4 && (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Droplets size={20} color="#0284C7" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                Consumo Hídrico Diario
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', opacity: 0.7, margin: '0 0 18px', lineHeight: '1.35' }}>
              El agua es fundamental para tus procesos metabólicos y tu nivel de energía.
            </p>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize: '0.84rem', fontWeight: '850', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                5. ¿Cuánta agua consumes habitualmente al día?
              </p>
              <p style={{ fontSize: '0.72rem', opacity: 0.65, margin: '0 0 18px', lineHeight: '1.35' }}>
                Puedes ingresar tu consumo en vasos o en litros. Ambos campos se mantendrán sincronizados automáticamente (1 vaso = 240 ml).
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'center' }}>
                {/* Vasos */}
                <div style={{ 
                  background: 'rgba(2, 132, 199, 0.05)', 
                  padding: '16px 12px', 
                  borderRadius: '16px', 
                  border: '1.5px solid rgba(2, 132, 199, 0.2)', 
                  textAlign: 'center' 
                }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '6px' }}>🥛</span>
                  <label style={{ fontSize: '0.72rem', fontWeight: '850', color: '#0369A1', display: 'block', marginBottom: '6px' }}>
                    VASOS DE AGUA
                  </label>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    value={answers.waterGlasses}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseFloat(val);
                      if (!val) {
                        setAnswers({ ...answers, waterGlasses: '', waterLiters: '' });
                      } else if (!isNaN(parsed)) {
                        setAnswers({ 
                          ...answers, 
                          waterGlasses: val, 
                          waterLiters: (parsed * 0.24).toFixed(2).replace(/\.?0+$/, '') 
                        });
                      }
                    }}
                    placeholder="Ej. 8"
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      fontSize: '1.15rem', 
                      fontWeight: '900', 
                      border: '1.5px solid rgba(2, 132, 199, 0.4)', 
                      borderRadius: '10px', 
                      textAlign: 'center', 
                      outline: 'none',
                      color: '#0369A1',
                      background: '#FFFFFF'
                    }}
                  />
                  <span style={{ fontSize: '0.64rem', opacity: 0.65, marginTop: '4px', display: 'block' }}>
                    (1 vaso = 240 ml)
                  </span>
                </div>

                {/* Litros */}
                <div style={{ 
                  background: 'rgba(2, 132, 199, 0.05)', 
                  padding: '16px 12px', 
                  borderRadius: '16px', 
                  border: '1.5px solid rgba(2, 132, 199, 0.2)', 
                  textAlign: 'center' 
                }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '6px' }}>💧</span>
                  <label style={{ fontSize: '0.72rem', fontWeight: '850', color: '#0369A1', display: 'block', marginBottom: '6px' }}>
                    LITROS TOTALES
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    value={answers.waterLiters}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseFloat(val);
                      if (!val) {
                        setAnswers({ ...answers, waterGlasses: '', waterLiters: '' });
                      } else if (!isNaN(parsed)) {
                        setAnswers({ 
                          ...answers, 
                          waterGlasses: (parsed / 0.24).toFixed(1).replace(/\.?0+$/, ''), 
                          waterLiters: val 
                        });
                      }
                    }}
                    placeholder="Ej. 2.0"
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      fontSize: '1.15rem', 
                      fontWeight: '900', 
                      border: '1.5px solid rgba(2, 132, 199, 0.4)', 
                      borderRadius: '10px', 
                      textAlign: 'center', 
                      outline: 'none',
                      color: '#0369A1',
                      background: '#FFFFFF'
                    }}
                  />
                  <span style={{ fontSize: '0.64rem', opacity: 0.65, marginTop: '4px', display: 'block' }}>
                    (en litros)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 5: ALERGIAS Y SALUD */}
        {step === 5 && (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ShieldAlert size={20} color="#D97706" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                Alergias y Salud Clínica
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', opacity: 0.7, margin: '0 0 18px', lineHeight: '1.35' }}>
              Información de seguridad médica para asegurar que todas las recomendaciones de tu plan sean seguras.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Alergias e intolerancias */}
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  6. Intolerancia o alergia a algún alimento
                </label>
                <p style={{ fontSize: '0.72rem', opacity: 0.65, margin: '0 0 10px' }}>
                  Selecciona sugerencias rápidas o describe tus alergias:
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {['Ninguna alergia conocida', 'Lactosa', 'Gluten / Celíaco', 'Mariscos', 'Maní / Frutos secos', 'Huevo'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const current = answers.allergies ? `${answers.allergies}, ${tag}` : tag;
                        setAnswers({ ...answers, allergies: current });
                      }}
                      style={{
                        background: 'rgba(253, 158, 20, 0.08)',
                        border: '1px solid rgba(253, 158, 20, 0.25)',
                        borderRadius: '999px',
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        fontWeight: '750',
                        color: '#92400E',
                        cursor: 'pointer'
                      }}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <textarea 
                  className="input-field"
                  style={{ width: '100%', minHeight: '75px', padding: '12px', fontSize: '0.86rem', marginBottom: 0, borderRadius: '12px' }}
                  value={answers.allergies}
                  onChange={(e) => setAnswers({ ...answers, allergies: e.target.value })}
                  placeholder="Detalla cualquier intolerancia o alergia alimentaria..."
                />
              </div>

              {/* Condiciones clínicas autorreportadas */}
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  7. Condiciones médicas o medicamentos habituales (Opcional)
                </label>
                <p style={{ fontSize: '0.72rem', opacity: 0.65, margin: '0 0 8px' }}>
                  Diagnósticos médicos previos (ej. tiroides, hipertensión, resistencia a la insulina) o medicamentos regulares.
                </p>
                <textarea 
                  className="input-field"
                  style={{ width: '100%', minHeight: '75px', padding: '12px', fontSize: '0.86rem', marginBottom: 0, borderRadius: '12px' }}
                  value={answers.clinicalConditions}
                  onChange={(e) => setAnswers({ ...answers, clinicalConditions: e.target.value })}
                  placeholder="Escribe cualquier condición médica o medicación..."
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── BOTÓN DE NAVEGACIÓN INFERIOR (TÁCTIL Y GRANDE) ── */}
      <div style={{ marginTop: '24px' }}>
        <button 
          onClick={handleNext}
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
          <span>
            {isSaving ? 'Guardando respuestas...' : (step < totalSteps ? 'Siguiente pregunta' : 'Guardar y pasar a Medidas')}
          </span>
          <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
}
