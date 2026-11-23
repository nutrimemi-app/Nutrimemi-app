'use client';
import React from 'react';
import { Target, Calendar, CheckCircle2, Clock, Sparkles, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import DataOriginBadge from './DataOriginBadge';

export default function TrackingGoals({ patient, nextApp }) {
  const currentDetails = patient?.details || {};
  
  // 1. Objetivo clínico principal
  const rawGoal = patient?.goal;
  const hasCustomGoal = rawGoal && rawGoal.trim() !== '' && rawGoal !== 'Nuevo Paciente';

  // 2. Esquema de comidas asignado
  const mealPlanName = currentDetails.mealPlan || '3+2 snacks';

  // 3. Meta de hidratación asignada por especialista
  const waterGoal = parseFloat(currentDetails.waterGoal || patient?.formulas?.waterGoal);
  const hasWaterGoal = !isNaN(waterGoal) && waterGoal > 0;

  // 4. Plazo / Próximo control de objetivos
  const nextControlDate = nextApp?.date ? new Date(nextApp.date + 'T00:00:00') : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* ── TARJETA: OBJETIVO CLÍNICO PRINCIPAL ── */}
      <section className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(203, 188, 30, 0.15)', padding: '6px', borderRadius: '10px', color: '#827717' }}>
              <Target size={18} />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
              Objetivo Principal
            </h2>
          </div>
          {hasCustomGoal ? (
            <DataOriginBadge type="professional" label="Pactado en consulta" />
          ) : (
            <DataOriginBadge type="pending" label="Pendiente de definir" />
          )}
        </div>

        {hasCustomGoal ? (
          <div style={{
            background: 'rgba(29, 81, 45, 0.05)',
            borderLeft: '4px solid var(--primary)',
            padding: '12px 14px',
            borderRadius: '0 12px 12px 0',
            marginTop: '6px'
          }}>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '850', color: 'var(--text-primary)', lineHeight: 1.35 }}>
              «{rawGoal}»
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '0.68rem', color: '#6B7280' }}>
              Acordado con tu nutricionista como pauta directriz del tratamiento.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'rgba(0,0,0,0.02)',
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'center',
            marginTop: '6px'
          }}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: '#6B7280' }}>
              Objetivo clínico no definido aún
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.7rem', opacity: 0.6 }}>
              Tu nutricionista definirá junto a ti las metas terapéuticas en tu próxima consulta.
            </p>
          </div>
        )}
      </section>

      {/* ── TARJETA: PLAN DE COMIDAS Y HÁBITOS PRESCRITOS ── */}
      <section className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(29, 81, 45, 0.1)', padding: '6px', borderRadius: '10px', color: 'var(--primary)' }}>
              <ShieldCheck size={18} />
            </div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
              Pautas Terapéuticas
            </h2>
          </div>
          <DataOriginBadge type="professional" label="Prescripción clínica" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          {/* Distribución de Comidas */}
          <div style={{
            background: 'rgba(0,0,0,0.02)',
            padding: '11px 13px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.62rem', fontWeight: '750', opacity: 0.5, textTransform: 'uppercase' }}>
                Estructura de comidas al día
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '0.88rem', fontWeight: '850', color: 'var(--text-primary)' }}>
                {mealPlanName}
              </p>
            </div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: '800',
              color: 'var(--primary)',
              background: 'rgba(29, 81, 45, 0.08)',
              padding: '4px 8px',
              borderRadius: '8px'
            }}>
              Activo
            </span>
          </div>

          {/* Meta de Hidratación */}
          <div style={{
            background: 'rgba(0,0,0,0.02)',
            padding: '11px 13px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.62rem', fontWeight: '750', opacity: 0.5, textTransform: 'uppercase' }}>
                Prescripción de hidratación diaria
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '0.88rem', fontWeight: '850', color: hasWaterGoal ? 'var(--text-primary)' : '#9CA3AF' }}>
                {hasWaterGoal ? `${waterGoal} L / día` : 'Pendiente de prescripción'}
              </p>
            </div>
            {!hasWaterGoal && (
              <span style={{
                fontSize: '0.62rem',
                fontWeight: '750',
                color: '#6B7280',
                background: 'rgba(0, 0, 0, 0.05)',
                padding: '3px 7px',
                borderRadius: '6px'
              }}>
                En evaluación
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── TARJETA: PRÓXIMA CONSULTA DE SEGUIMIENTO ── */}
      <section className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', borderRadius: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ background: 'rgba(253, 158, 20, 0.1)', padding: '6px', borderRadius: '10px', color: '#D97706' }}>
            <Calendar size={18} />
          </div>
          <h2 style={{ fontSize: '0.9rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
            Próxima Consulta de Seguimiento
          </h2>
        </div>

        {nextControlDate ? (
          <div style={{
            background: 'rgba(29, 81, 45, 0.05)',
            padding: '12px',
            borderRadius: '12px',
            marginTop: '6px'
          }}>
            <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: '750', opacity: 0.6 }}>
              Fecha de consulta programada:
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)' }}>
              {nextControlDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '0.66rem', color: '#6B7280' }}>
              Consulta programada con tu nutricionista
            </p>
          </div>
        ) : (
          <div style={{
            background: 'rgba(0,0,0,0.02)',
            padding: '12px',
            borderRadius: '12px',
            marginTop: '6px'
          }}>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '750', color: '#6B7280' }}>
              Sin consulta próxima programada
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '0.68rem', opacity: 0.55 }}>
              La evolución y ajuste de tus metas se realiza periódicamente en cada consulta clínica.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
