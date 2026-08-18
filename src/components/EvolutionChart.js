import React from 'react';

export default function EvolutionChart({ history, currentWeight }) {
  if (!history || history.length === 0) return null;

  // Combinar historia con el peso actual si es distinto
  const data = history.map(h => ({
    date: h.date,
    weight: parseFloat(h.measurements?.weight || h.details?.weight || 0)
  })).filter(d => d.weight > 0);

  if (currentWeight) {
    data.push({
      date: 'Actual',
      weight: parseFloat(currentWeight)
    });
  }

  if (data.length < 2) return null;

  const width = 600;
  const height = 150;
  const padding = 30;

  const minWeight = Math.min(...data.map(d => d.weight)) - 5;
  const maxWeight = Math.max(...data.map(d => d.weight)) + 5;

  const scaleX = (index) => padding + (index * ((width - padding * 2) / (data.length - 1)));
  const scaleY = (weight) => height - padding - ((weight - minWeight) / (maxWeight - minWeight)) * (height - padding * 2);

  const points = data.map((d, i) => `${scaleX(i)},${scaleY(d.weight)}`).join(' ');

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '15px auto', background: 'rgba(29, 81, 45, 0.03)', borderRadius: '12px', padding: '15px' }}>
      <h4 style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '10px', textAlign: 'center' }}>GRÁFICO DE PROGRESIÓN (PESO KG)</h4>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        {/* Grid lines */}
        {[minWeight, (minWeight+maxWeight)/2, maxWeight].map((w, i) => (
          <line key={i} x1={padding} y1={scaleY(w)} x2={width-padding} y2={scaleY(w)} stroke="rgba(0,0,0,0.1)" strokeDasharray="4 4" />
        ))}
        {/* Line */}
        <polyline fill="none" stroke="var(--primary)" strokeWidth="3" points={points} />
        {/* Data points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={scaleX(i)} cy={scaleY(d.weight)} r="4" fill="var(--accent)" stroke="white" strokeWidth="2" />
            <text x={scaleX(i)} y={scaleY(d.weight) - 10} fontSize="12" fontWeight="bold" fill="var(--primary)" textAnchor="middle">
              {d.weight.toFixed(1)}
            </text>
            <text x={scaleX(i)} y={height - 10} fontSize="10" fill="#666" textAnchor="middle">
              {new Date(d.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
