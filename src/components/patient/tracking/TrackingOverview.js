'use client';
import React, { useState, useEffect } from 'react';
import { Scale, Droplets, Flame, Calendar, Activity, UtensilsCrossed, Plus, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import DataOriginBadge from './DataOriginBadge';

export default function TrackingOverview({ patient, nextApp, todayLog }) {
  const currentDetails = patient?.details || {};
  const today = new Date().toISOString().split('T')[0];
  const hydrKey = patient?.id ? `hydration_${patient.id}_${today}` : null;

  const [glasses, setGlasses] = useState(0);

  useEffect(() => {
    if (hydrKey && typeof window !== 'undefined') {
      try {
        const val = parseInt(localStorage.getItem(hydrKey) || '0', 10);
        setGlasses(isNaN(val) ? 0 : val);
      } catch (e) {
        setGlasses(0);
      }
    }
  }, [hydrKey]);

  const addGlass = () => {
    if (!hydrKey || typeof window === 'undefined') return;
    const next = glasses + 1;
    setGlasses(next);
    try {
      localStorage.setItem(hydrKey, next.toString());
    } catch (e) {}
  };

  // 1. Verificación de peso actual validado
  const weightVal = parseFloat(currentDetails.weight);
  const hasValidWeight = !isNaN(weightVal) && weightVal > 0;

  // 2. Verificación etaria e IMC
  const heightVal = parseFloat(currentDetails.height);
  const heightM = !isNaN(heightVal) && heightVal > 0 ? heightVal / 100 : null;
  const rawAge = parseInt(currentDetails.age, 10);
  const hasReliableAge = !isNaN(rawAge) && rawAge > 0;
  const isPediatric = currentDetails.isPediatric === true || (hasReliableAge && rawAge < 18);

  let imcValue = null;
  let imcClassification = null;
  let imcMessage = null;

  if (hasValidWeight && heightM) {
    imcValue = (weightVal / (heightM * heightM)).toFixed(1);
    if (!hasReliableAge) {
      imcMessage = 'Edad no confirmada. Requiere validación por el especialista para clasificar.';
    } else if (isPediatric) {
      imcMessage = 'En menores de edad, el IMC requiere evaluación por tablas de percentiles (P/E o IMC/E). No aplican rangos de adultos.';
    } else {
      const imcNum = parseFloat(imcValue);
      if (imcNum < 18.5) imcClassification = { label: 'Bajo peso', color: '#D97706' };
      else if (imcNum < 25) imcClassification = { label: 'Normopeso', color: '#1D512D' };
      else if (imcNum < 30) imcClassification = { label: 'Sobrepeso', color: '#D97706' };
      else if (imcNum < 35) imcClassification = { label: 'Obesidad Grado I', color: '#DC2626' };
      else if (imcNum < 40) imcClassification = { label: 'Obesidad Grado II', color: '#DC2626' };
      else imcClassification = { label: 'Obesidad Grado III', color: '#991B1B' };
    }
  }

  // 3. Meta prescrita de calorías (RCT)
  const targetKcal = parseFloat(patient?.formulas?.kcal || patient?.dietForm?.rct);
  const hasTargetKcal = !isNaN(targetKcal) && targetKcal > 0;
  const consumedKcal = parseFloat(todayLog?.totalKcal || 0);

  // 4. Conteo de comidas del día y anomalías
  const todayEntries = Array.isArray(todayLog?.entries) ? todayLog.entries : [];
  const unusualCount = todayEntries.filter(e => e.groupKey === 'no_habitual').length;
  const regularCount = todayEntries.filter(e => e.groupKey !== 'no_habitual').length;

  // 5. Meta de Hidratación individual
  const individualWaterGoal = parseFloat(currentDetails.waterGoal || patient?.formulas?.waterGoal);
  const hasWaterGoal = !isNaN(individualWaterGoal) && individualWaterGoal > 0;

  // 6. Actividad Física declarada
  const activityLevel = patient?.onboardingAnswers?.physicalActivity;

  // 7. Última fecha de medición verificada
  const lastRecordedDate = patient?.history?.length > 0
    ? patient.history[0]?.date
    : currentDetails.birthDate ? 'Evaluación de ingreso' : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* ── TARJETA: ESTADO PONDERAL E IMC ── */}
      <section className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(29, 81, 45, 0.1)', padding: '6px', borderRadius: '10px', color: 'var(--primary)' }}>
              <Scale size={18} />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
              Antropometría Clínica
            </h2>
          </div>
          <DataOriginBadge type="clinical" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
          {/* Peso */}
          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 12px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '750', opacity: 0.5, textTransform: 'uppercase' }}>
              Peso actual
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
              {hasValidWeight ? (
                <>
                  <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {weightVal.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', opacity: 0.6 }}>kg</span>
                </>
              ) : (
                <span style={{ fontSize: '0.85rem', fontWeight: '750', color: '#6B7280' }}>Pendiente</span>
              )}
            </div>
            {lastRecordedDate && (
              <p style={{ margin: '4px 0 0', fontSize: '0.6rem', opacity: 0.5 }}>
                Reg.: {lastRecordedDate}
              </p>
            )}
          </div>

          {/* IMC */}
          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 12px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '750', opacity: 0.5, textTransform: 'uppercase' }}>
              IMC
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
              {imcValue ? (
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {imcValue}
                </span>
              ) : (
                <span style={{ fontSize: '0.85rem', fontWeight: '750', color: '#6B7280' }}>Pendiente</span>
              )}
            </div>
            {imcClassification && (
              <span style={{
                display: 'inline-block',
                marginTop: '4px',
                fontSize: '0.65rem',
                fontWeight: '800',
                color: imcClassification.color
              }}>
                {imcClassification.label}
              </span>
            )}
          </div>
        </div>

        {/* Advertencia clínica si corresponde a edad pediátrica o sin edad */}
        {imcMessage && (
          <div style={{
            marginTop: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            background: 'rgba(253, 158, 20, 0.08)',
            padding: '8px 10px',
            borderRadius: '10px',
            border: '1px solid rgba(253, 158, 20, 0.2)'
          }}>
            <AlertCircle size={14} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.68rem', color: '#92400E', lineHeight: 1.35, fontWeight: '650' }}>
              {imcMessage}
            </p>
          </div>
        )}
      </section>

      {/* ── TARJETA: PLAN ALIMENTARIO Y CONSUMO DEL DÍA ── */}
      <section className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(203, 188, 30, 0.15)', padding: '6px', borderRadius: '10px', color: '#827717' }}>
              <Flame size={18} />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
              Plan Alimentario de Hoy
            </h2>
          </div>
          {hasTargetKcal ? (
            <DataOriginBadge type="professional" label="Meta prescrita" />
          ) : (
            <DataOriginBadge type="pending" label="Sin RCT fijado" />
          )}
        </div>

        {/* Desglose calórico independiente */}
        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '12px', marginTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: '750', opacity: 0.5, textTransform: 'uppercase' }}>
                Energía registrada hoy
              </span>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                {consumedKcal.toFixed(0)}{' '}
                <span style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.6 }}>kcal</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '750', opacity: 0.5, textTransform: 'uppercase' }}>
                Meta prescrita
              </span>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '850', color: hasTargetKcal ? 'var(--text-primary)' : '#9CA3AF' }}>
                {hasTargetKcal ? `${targetKcal.toFixed(0)} kcal` : 'No asignada'}
              </p>
            </div>
          </div>

          {/* Barra de progreso calórico sin invención */}
          {hasTargetKcal && (
            <div style={{ width: '100%', height: '7px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (consumedKcal / targetKcal) * 100)}%`,
                  height: '100%',
                  background: consumedKcal > targetKcal * 1.1 ? '#DC2626' : 'var(--primary)',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          )}
        </div>

        {/* Alimentos habituales vs consumos ocasionales */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
          <div style={{ background: 'rgba(29, 81, 45, 0.04)', padding: '9px 11px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: '750', color: 'var(--primary)' }}>
              Alimentos habituales registrados
            </span>
            <p style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: '900', color: 'var(--primary)' }}>
              {regularCount}
            </p>
          </div>
          <div style={{ background: unusualCount > 0 ? 'rgba(217, 119, 6, 0.08)' : 'rgba(0,0,0,0.02)', padding: '9px 11px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: '750', color: unusualCount > 0 ? '#92400E' : '#6B7280' }}>
              Consumos ocasionales registrados
            </span>
            <p style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: '900', color: unusualCount > 0 ? '#92400E' : '#6B7280' }}>
              {unusualCount}
            </p>
          </div>
        </div>
      </section>

      {/* ── TARJETA: HIDRATACIÓN INDIVIDUAL ── */}
      <section className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(30, 144, 255, 0.1)', padding: '6px', borderRadius: '10px', color: '#1E90FF' }}>
              <Droplets size={18} />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
              Hidratación
            </h2>
          </div>
          {hasWaterGoal ? (
            <DataOriginBadge type="professional" label="Meta prescrita" />
          ) : (
            <DataOriginBadge type="pending" label="Meta no fijada" />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1E90FF', lineHeight: 1.1 }}>
                {glasses}
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: '750', opacity: 0.6 }}>
                vasos ({ (glasses * 0.25).toFixed(2) } L aprox.)
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: '#6B7280' }}>
              {hasWaterGoal
                ? `Meta asignada por el especialista: ${individualWaterGoal} L/día`
                : 'Meta individual pendiente de prescripción por el nutricionista'}
            </p>
          </div>

          <button
            onClick={addGlass}
            aria-label="Registrar un vaso de agua"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#1E90FF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '8px 12px',
              fontSize: '0.75rem',
              fontWeight: '850',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(30, 144, 255, 0.25)'
            }}
          >
            <Plus size={14} strokeWidth={3} />
            <span>+1 vaso</span>
          </button>
        </div>

        <div style={{ marginTop: '10px' }}>
          <DataOriginBadge type="self_reported" label="Registro en este dispositivo" />
        </div>
      </section>

      {/* ── TARJETA: ACTIVIDAD FÍSICA (ALCANCE LOCAL Y CLÍNICO) ── */}
      <section className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(253, 158, 20, 0.1)', padding: '6px', borderRadius: '10px', color: '#D97706' }}>
              <Activity size={18} />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
              Actividad Física
            </h2>
          </div>
          <DataOriginBadge type="clinical" label="Declarada en consulta" />
        </div>

        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 12px', borderRadius: '12px', marginTop: '6px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: '750', opacity: 0.5, textTransform: 'uppercase' }}>
            Nivel de actividad registrado
          </span>
          <p style={{ margin: '2px 0 0', fontSize: '0.92rem', fontWeight: '850', color: 'var(--text-primary)' }}>
            {activityLevel || 'No especificado en el expediente clínico'}
          </p>
        </div>

        <div style={{
          marginTop: '10px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          background: 'rgba(0,0,0,0.02)',
          padding: '8px 10px',
          borderRadius: '10px'
        }}>
          <Info size={14} color="#6B7280" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '0.67rem', color: '#6B7280', lineHeight: 1.35 }}>
            Los registros diarios de ejercicio guardados en el navegador son locales a este dispositivo y no sustituyen la pauta acordada con el especialista.
          </p>
        </div>
      </section>

      {/* ── TARJETA: PRÓXIMA CONSULTA Y TAREAS RELEVANTES ── */}
      <section className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(29, 81, 45, 0.1)', padding: '6px', borderRadius: '10px', color: 'var(--primary)' }}>
              <Calendar size={18} />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
              Próxima Consulta
            </h2>
          </div>
          <DataOriginBadge type="professional" label="Agenda oficial" />
        </div>

        {nextApp ? (
          <div style={{
            background: 'rgba(29, 81, 45, 0.05)',
            border: '1px solid rgba(29, 81, 45, 0.15)',
            padding: '12px',
            borderRadius: '12px'
          }}>
            <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase' }}>
              {nextApp.type || 'Consulta de control'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-primary)' }}>
              {new Date(nextApp.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {nextApp.time && (
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', fontWeight: '750', color: 'var(--primary)' }}>
                Hora: {nextApp.time}
              </p>
            )}
            {nextApp.notes && (
              <p style={{ margin: '6px 0 0', fontSize: '0.7rem', opacity: 0.7 }}>
                Nota: {nextApp.notes}
              </p>
            )}
          </div>
        ) : (
          <div style={{
            background: 'rgba(0,0,0,0.02)',
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '750', color: '#6B7280' }}>
              No tienes citas próximas agendadas
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.68rem', opacity: 0.55 }}>
              Comunícate con tu nutricionista para programar tu siguiente control.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
