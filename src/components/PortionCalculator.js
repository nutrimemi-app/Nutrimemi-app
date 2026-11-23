import React from 'react';

const EXCHANGE_RATES = {
  lacteos: { name: 'LÁCTEOS', prot: 8, lip: 2.4, cho: 12 },
  vegetales: { name: 'VEGETALES', prot: 2, lip: 0, cho: 5 },
  frutas: { name: 'FRUTAS', prot: 0, lip: 0, cho: 15 },
  cereales: { name: 'CEREALES', prot: 0, lip: 0, cho: 15 },
  proteinas: { name: 'CARNES', prot: 7, lip: 3, cho: 0 },
  grasas: { name: 'GRASAS', prot: 0, lip: 5, cho: 0 }
};

export default function PortionCalculator({ portions, onChange, targetProt, targetCho, targetLip }) {
  const groups = ['lacteos', 'vegetales', 'frutas', 'cereales', 'proteinas', 'grasas'];

  let totalProt = 0;
  let totalLip = 0;
  let totalCho = 0;

  return (
    <div style={{ background: '#F9FBE7', border: '2px solid #AFB42B', borderRadius: '16px', padding: '16px', overflowX: 'auto' }}>
      <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: '900', color: '#1d512d', textTransform: 'uppercase' }}>
        ✨ Tabla de Intercambio (Raciones)
      </h5>
      <p style={{ margin: '0 0 12px 0', fontSize: '0.72rem', opacity: 0.85, color: '#1d512d' }}>
        Ajusta el número de raciones (admite fracciones como 0.5 o 0.25). La tabla calcula la energía y macronutrientes aportados a precisión completa.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.82rem', minWidth: '360px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #AFB42B' }}>
            <th style={{ padding: '6px', textAlign: 'left', color: '#1d512d' }}>GRUPO</th>
            <th style={{ padding: '6px', color: '#1d512d' }}>RACIONES</th>
            <th style={{ padding: '6px', color: '#1d512d' }}>PROT (g)</th>
            <th style={{ padding: '6px', color: '#1d512d' }}>LIP (g)</th>
            <th style={{ padding: '6px', color: '#1d512d' }}>CHO (g)</th>
            <th style={{ padding: '6px', color: '#1d512d' }}>KCAL</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(key => {
            const num = parseFloat(portions[key]) || 0;
            const rate = EXCHANGE_RATES[key];
            const p = num * rate.prot;
            const l = num * rate.lip;
            const c = num * rate.cho;
            const kcal = (p * 4) + (l * 9) + (c * 4);
            
            totalProt += p;
            totalLip += l;
            totalCho += c;

            return (
              <tr key={key} style={{ borderBottom: '1px solid rgba(175, 180, 43, 0.3)' }}>
                <td style={{ padding: '6px', textAlign: 'left', fontWeight: '850', color: '#1d512d' }}>{rate.name}</td>
                <td style={{ padding: '6px' }}>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={num === 0 ? '' : num}
                    placeholder="0"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onChange({ ...portions, [key]: val });
                    }}
                    style={{ width: '55px', padding: '3px', textAlign: 'center', border: '1px solid #AFB42B', borderRadius: '4px', fontWeight: '850', fontSize: '0.85rem' }}
                  />
                </td>
                <td style={{ padding: '6px', fontWeight: '700' }}>{p > 0 ? p.toFixed(2) : '—'}</td>
                <td style={{ padding: '6px', fontWeight: '700' }}>{l > 0 ? l.toFixed(2) : '—'}</td>
                <td style={{ padding: '6px', fontWeight: '700' }}>{c > 0 ? c.toFixed(2) : '—'}</td>
                <td style={{ padding: '6px', fontWeight: '750', color: '#1d512d' }}>{kcal > 0 ? kcal.toFixed(2) : '—'}</td>
              </tr>
            );
          })}
          
          {(() => {
            const totalKcal = (totalProt * 4) + (totalLip * 9) + (totalCho * 4);
            const targetKcal = (targetProt * 4) + (targetLip * 9) + (targetCho * 4);
            const diffProt = totalProt - targetProt;
            const diffLip = totalLip - targetLip;
            const diffCho = totalCho - targetCho;
            const diffKcal = totalKcal - targetKcal;

            return (
              <>
                <tr style={{ background: 'rgba(175, 180, 43, 0.25)', fontWeight: '900', color: '#1d512d' }}>
                  <td style={{ padding: '8px', textAlign: 'left' }}>TOTAL APORTADO</td>
                  <td style={{ padding: '8px' }}>—</td>
                  <td style={{ padding: '8px' }}>{totalProt.toFixed(2)} g</td>
                  <td style={{ padding: '8px' }}>{totalLip.toFixed(2)} g</td>
                  <td style={{ padding: '8px' }}>{totalCho.toFixed(2)} g</td>
                  <td style={{ padding: '8px' }}>{totalKcal.toFixed(2)} kcal</td>
                </tr>
                <tr style={{ fontWeight: '850', color: '#555', borderTop: '1px dashed rgba(0,0,0,0.15)' }}>
                  <td style={{ padding: '8px', textAlign: 'left' }}>META (FÓRMULA)</td>
                  <td style={{ padding: '8px' }}>—</td>
                  <td style={{ padding: '8px' }}>{targetProt.toFixed(2)} g</td>
                  <td style={{ padding: '8px' }}>{targetLip.toFixed(2)} g</td>
                  <td style={{ padding: '8px' }}>{targetCho.toFixed(2)} g</td>
                  <td style={{ padding: '8px' }}>{targetKcal.toFixed(2)} kcal</td>
                </tr>
                <tr style={{ fontWeight: '900', fontSize: '0.78rem', background: '#FFFFFF' }}>
                  <td style={{ padding: '8px', textAlign: 'left' }}>DIFERENCIA</td>
                  <td style={{ padding: '8px' }}>—</td>
                  <td style={{ padding: '8px', color: Math.abs(diffProt) > 3 ? '#DC2626' : '#16A34A' }}>
                    {diffProt > 0 ? `+${diffProt.toFixed(2)}` : diffProt.toFixed(2)} g
                  </td>
                  <td style={{ padding: '8px', color: Math.abs(diffLip) > 3 ? '#DC2626' : '#16A34A' }}>
                    {diffLip > 0 ? `+${diffLip.toFixed(2)}` : diffLip.toFixed(2)} g
                  </td>
                  <td style={{ padding: '8px', color: Math.abs(diffCho) > 5 ? '#DC2626' : '#16A34A' }}>
                    {diffCho > 0 ? `+${diffCho.toFixed(2)}` : diffCho.toFixed(2)} g
                  </td>
                  <td style={{ padding: '8px', color: Math.abs(diffKcal) > 50 ? '#DC2626' : '#16A34A' }}>
                    {diffKcal > 0 ? `+${diffKcal.toFixed(2)}` : diffKcal.toFixed(2)} kcal
                  </td>
                </tr>
              </>
            );
          })()}
        </tbody>
      </table>
    </div>
  );
}
