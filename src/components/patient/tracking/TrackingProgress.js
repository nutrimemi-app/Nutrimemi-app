'use client';
import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, AlertCircle, Info, LineChart } from 'lucide-react';
import DataOriginBadge from './DataOriginBadge';
import { calculateClinicalData } from '@/utils/calculationUtils';

export default function TrackingProgress({ patient }) {
  const [period, setPeriod] = useState('all'); // '7d' | '1m' | '3m' | 'all'
  const [activeMetric, setActiveMetric] = useState('weight'); // 'weight' | 'waist' | 'hip' | 'neck' | 'fat'

  const currentDetails = patient?.details || {};

  // 1. Construir la serie histórica completa sin alterar registros previos
  const fullSeries = useMemo(() => {
    const list = [];
    const historyEntries = Array.isArray(patient?.history) ? patient.history : [];
    const details = patient?.details || {};

    // Entradas históricas validadas por el especialista
    historyEntries.forEach((h, index) => {
      const entryDate = h.date || h.created_at?.split('T')[0];
      if (!entryDate) return;

      const w = parseFloat(h.details?.weight ?? h.weight);
      const waist = parseFloat(h.measurements?.CINTURA ?? h.details?.waist ?? h.details?.CINTURA);
      const hip = parseFloat(h.measurements?.CADERA ?? h.details?.hip ?? h.details?.CADERA);
      const neck = parseFloat(h.measurements?.CUELLO ?? h.details?.neck ?? h.details?.CUELLO);
      const fat = parseFloat(h.measurements?.fat ?? h.clinical?.gc ?? h.details?.fat);

      list.push({
        id: `hist_${index}_${entryDate}`,
        date: entryDate,
        weight: !isNaN(w) && w > 0 ? w : null,
        waist: !isNaN(waist) && waist > 0 ? waist : null,
        hip: !isNaN(hip) && hip > 0 ? hip : null,
        neck: !isNaN(neck) && neck > 0 ? neck : null,
        fat: !isNaN(fat) && fat > 0 ? fat : null,
        origin: 'clinical'
      });
    });

    // Medición actual registrada en la ficha del paciente
    const curWeight = parseFloat(details.weight);
    const curWaist = parseFloat(patient?.measurements?.CINTURA ?? details.waist);
    const curHip = parseFloat(patient?.measurements?.CADERA ?? details.hip);
    const curNeck = parseFloat(patient?.measurements?.CUELLO ?? details.neck);
    const curFat = parseFloat(patient?.measurements?.fat ?? details.fat);
    const today = new Date().toISOString().split('T')[0];

    // Solo añadimos el registro actual si no existe ya para hoy en el historial
    const alreadyExists = list.some(item => item.date === today);
    if (!alreadyExists && !isNaN(curWeight) && curWeight > 0) {
      list.push({
        id: `current_${today}`,
        date: today,
        weight: curWeight,
        waist: !isNaN(curWaist) && curWaist > 0 ? curWaist : null,
        hip: !isNaN(curHip) && curHip > 0 ? curHip : null,
        neck: !isNaN(curNeck) && curNeck > 0 ? curNeck : null,
        fat: !isNaN(curFat) && curFat > 0 ? curFat : null,
        origin: 'clinical'
      });
    }

    // Ordenar cronológicamente (más antiguo primero para el gráfico)
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [patient?.history, patient?.details, patient?.measurements]);

  // 2. Filtrar por período seleccionado
  const filteredSeries = useMemo(() => {
    if (period === 'all') return fullSeries;

    const now = new Date().getTime();
    let daysToSubtract = 7;
    if (period === '1m') daysToSubtract = 30;
    if (period === '3m') daysToSubtract = 90;

    const threshold = now - (daysToSubtract * 24 * 60 * 60 * 1000);
    return fullSeries.filter(item => new Date(item.date).getTime() >= threshold);
  }, [fullSeries, period]);

  // 3. Puntos válidos para la métrica activa
  const points = useMemo(() => {
    return filteredSeries
      .filter(item => item[activeMetric] !== null && typeof item[activeMetric] === 'number')
      .map(item => ({ date: item.date, val: item[activeMetric], origin: item.origin }));
  }, [filteredSeries, activeMetric]);

  // 4. Balance neto
  const hasMultiplePoints = points.length >= 2;
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const diffVal = hasMultiplePoints ? (lastPoint.val - firstPoint.val).toFixed(1) : null;

  // 5. Configuración de unidades de métricas
  const metricConfigs = {
    weight: { label: 'Peso', unit: 'kg' },
    waist:  { label: 'Cintura', unit: 'cm' },
    hip:    { label: 'Cadera', unit: 'cm' },
    neck:   { label: 'Cuello', unit: 'cm' },
    fat:    { label: '% Grasa', unit: '%' }
  };

  const currentMetricCfg = metricConfigs[activeMetric] || metricConfigs.weight;

  // 6. Cálculo de escala SVG
  const svgWidth = 320;
  const svgHeight = 150;
  const paddingX = 28;
  const paddingY = 22;

  let minVal = 0;
  let maxVal = 100;
  let pointsCoords = [];

  if (hasMultiplePoints) {
    const vals = points.map(p => p.val);
    const rawMin = Math.min(...vals);
    const rawMax = Math.max(...vals);
    const range = rawMax - rawMin || 1;
    minVal = rawMin - range * 0.15;
    maxVal = rawMax + range * 0.15;

    pointsCoords = points.map((p, idx) => {
      const x = paddingX + (idx / (points.length - 1)) * (svgWidth - paddingX * 2);
      const y = svgHeight - paddingY - ((p.val - minVal) / (maxVal - minVal)) * (svgHeight - paddingY * 2);
      return { x, y, val: p.val, date: p.date };
    });
  }

  // 7. Referencia de Devine a título informativo (no objetivo clínico)
  const clinicalCalc = calculateClinicalData({
    weight: currentDetails.weight,
    height: currentDetails.height,
    sex: currentDetails.gender || 'female',
    manualPi: currentDetails.manualPi,
    manualPa: currentDetails.manualPa,
    manualPc: currentDetails.manualPc
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* ── SELECTOR DE PERÍODO ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '850', color: 'var(--text-primary)' }}>
          Período de consulta:
        </span>
        <div style={{
          display: 'inline-flex',
          gap: '3px',
          background: 'rgba(29, 81, 45, 0.08)',
          padding: '3px',
          borderRadius: '10px'
        }}>
          {[
            { id: '7d',  label: '7D' },
            { id: '1m',  label: '1M' },
            { id: '3m',  label: '3M' },
            { id: 'all', label: 'Todo' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                border: 'none',
                background: period === p.id ? '#FFFFFF' : 'transparent',
                color: period === p.id ? 'var(--text-primary)' : 'rgba(29, 81, 45, 0.6)',
                fontWeight: period === p.id ? '850' : '650',
                fontSize: '0.68rem',
                padding: '4px 8px',
                borderRadius: '7px',
                cursor: 'pointer',
                boxShadow: period === p.id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SELECTOR DE MÉTRICA ── */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {Object.entries(metricConfigs).map(([key, cfg]) => {
          const isSelected = activeMetric === key;
          return (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              style={{
                border: isSelected ? '1.5px solid var(--primary)' : '1px solid rgba(0,0,0,0.08)',
                background: isSelected ? 'rgba(29, 81, 45, 0.08)' : '#FFFFFF',
                color: isSelected ? 'var(--text-primary)' : 'rgba(0,0,0,0.6)',
                fontWeight: isSelected ? '850' : '650',
                fontSize: '0.7rem',
                padding: '6px 12px',
                borderRadius: '999px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* ── BALANCE NETO DEL PERÍODO ── */}
      {hasMultiplePoints && diffVal !== null && (
        <div className="glass-panel" style={{
          padding: '14px 16px',
          background: parseFloat(diffVal) <= 0 ? 'rgba(29, 81, 45, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: parseFloat(diffVal) <= 0 ? '1px solid rgba(29, 81, 45, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.6, textTransform: 'uppercase' }}>
              Variación en el período ({currentMetricCfg.label})
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
              <span style={{
                fontSize: '1.4rem',
                fontWeight: '900',
                color: parseFloat(diffVal) <= 0 ? 'var(--primary)' : '#DC2626'
              }}>
                {parseFloat(diffVal) > 0 ? `+${diffVal}` : diffVal}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', opacity: 0.7 }}>
                {currentMetricCfg.unit}
              </span>
            </div>
          </div>
          <div>
            {parseFloat(diffVal) <= 0 ? (
              <TrendingDown size={28} color="var(--primary)" />
            ) : (
              <TrendingUp size={28} color="#DC2626" />
            )}
          </div>
        </div>
      )}

      {/* ── GRÁFICO VECTORIAL SVG PURO (DATOS REALES EXCLUSIVOS) ── */}
      <section className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LineChart size={17} color="var(--primary)" />
            <h2 style={{ fontSize: '0.88rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
              Curva Histórica ({currentMetricCfg.label})
            </h2>
          </div>
          <DataOriginBadge type="clinical" label="Medición en consulta" />
        </div>

        {hasMultiplePoints ? (
          <div>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
            >
              {/* Líneas guía horizontales de referencia */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="rgba(0,0,0,0.05)" strokeDasharray="3 3" />
              <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="rgba(0,0,0,0.08)" />

              {/* Trazado de la curva continua */}
              <polyline
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsCoords.map(p => `${p.x},${p.y}`).join(' ')}
              />

              {/* Nodos de medición con valor y fecha */}
              {pointsCoords.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={idx === pointsCoords.length - 1 ? 5 : 3.5}
                    fill={idx === pointsCoords.length - 1 ? '#CBBC1E' : '#FFFFFF'}
                    stroke="var(--primary)"
                    strokeWidth="2"
                  />
                  {/* Etiqueta de valor sobre el punto */}
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="850"
                    fill="var(--text-primary)"
                  >
                    {p.val}
                  </text>
                  {/* Etiqueta de fecha bajo la línea */}
                  <text
                    x={p.x}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    fontSize="7.5"
                    fontWeight="650"
                    fill="rgba(0,0,0,0.45)"
                  >
                    {new Date(p.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div style={{
            padding: '30px 16px',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.02)',
            borderRadius: '12px'
          }}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: '#6B7280' }}>
              Registros insuficientes para graficar ({currentMetricCfg.label})
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.7rem', opacity: 0.55 }}>
              Se requieren al menos 2 consultas o controles clínicos en este período para trazar la curva.
            </p>
          </div>
        )}
      </section>

      {/* ── REFERENCIA CLÍNICA DE DEVINE (NO ES OBJETIVO CLÍNICO) ── */}
      <section className="glass-panel" style={{
        padding: '14px 16px',
        background: 'rgba(0,0,0,0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Info size={15} color="#4B5563" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: '850', color: 'var(--text-primary)' }}>
              Referencia Bioestadística (Fórmula de Devine)
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: '#4B5563', lineHeight: 1.35 }}>
              Peso ideal estimado de referencia: <strong>{clinicalCalc?.pi ? `${clinicalCalc.pi} kg` : 'Pendiente de talla'}</strong>.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.64rem', color: '#6B7280', fontStyle: 'italic', lineHeight: 1.3 }}>
              * Este valor es un índice estadístico general para cálculos de requerimientos. No constituye el objetivo terapéutico pactado con el especialista.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
