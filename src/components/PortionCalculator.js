import React from 'react';

const EXCHANGE_RATES = {
  lacteos: { name: 'LÁCTEOS', prot: 8, lip: 2.4, cho: 12 },
  vegetales: { name: 'VEGETALES', prot: 2, lip: 0, cho: 5 },
  frutas: { name: 'FRUTAS', prot: 0, lip: 0, cho: 15 },
  cereales: { name: 'CEREALES', prot: 0, lip: 0, cho: 15 },
  proteinas: { name: 'CARNES', prot: 7, lip: 3, cho: 0 },
  grasas: { name: 'GRASAS', prot: 0, lip: 7.5, cho: 0 }
};

export default function PortionCalculator({ portions, onChange, targetProt, targetCho, targetLip }) {
  const groups = ['lacteos', 'vegetales', 'frutas', 'cereales', 'proteinas', 'grasas'];

  let totalProt = 0;
  let totalLip = 0;
  let totalCho = 0;

  return (
    <div style={{ background: '#F9FBE7', border: '2px solid #AFB42B', borderRadius: '16px', padding: '16px', overflowX: 'auto' }}>
      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: '900', color: '#1d512d', textTransform: 'uppercase' }}>
        ✨ Tabla de Intercambio (Raciones)
      </h5>
      <p style={{ margin: '0 0 12px 0', fontSize: '0.7rem', opacity: 0.8, color: '#1d512d' }}>
        Ajusta el NUMERO de raciones. La tabla calculará los macros aportados.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.8rem', minWidth: '300px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #AFB42B' }}>
            <th style={{ padding: '6px', textAlign: 'left', color: '#1d512d' }}>GRUPO</th>
            <th style={{ padding: '6px', color: '#1d512d' }}>NÚMERO</th>
            <th style={{ padding: '6px', color: '#1d512d' }}>PROT</th>
            <th style={{ padding: '6px', color: '#1d512d' }}>LIP</th>
            <th style={{ padding: '6px', color: '#1d512d' }}>CHO</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(key => {
            const num = portions[key] || 0;
            const rate = EXCHANGE_RATES[key];
            const p = num * rate.prot;
            const l = num * rate.lip;
            const c = num * rate.cho;
            
            totalProt += p;
            totalLip += l;
            totalCho += c;

            return (
              <tr key={key} style={{ borderBottom: '1px solid rgba(175, 180, 43, 0.3)' }}>
                <td style={{ padding: '6px', textAlign: 'left', fontWeight: '800', color: '#1d512d' }}>{rate.name}</td>
                <td style={{ padding: '6px' }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={num === 0 ? '' : num}
                    placeholder="0"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onChange({ ...portions, [key]: val });
                    }}
                    style={{ width: '45px', textAlign: 'center', border: '1px solid #AFB42B', borderRadius: '4px', fontWeight: 'bold' }}
                  />
                </td>
                <td style={{ padding: '6px', fontWeight: '600' }}>{p > 0 ? p.toFixed(1) : '-'}</td>
                <td style={{ padding: '6px', fontWeight: '600' }}>{l > 0 ? l.toFixed(1) : '-'}</td>
                <td style={{ padding: '6px', fontWeight: '600' }}>{c > 0 ? c.toFixed(1) : '-'}</td>
              </tr>
            );
          })}
          
          <tr style={{ background: 'rgba(175, 180, 43, 0.2)', fontWeight: '900', color: '#1d512d' }}>
            <td style={{ padding: '8px', textAlign: 'left' }}>TOTAL APORTADO</td>
            <td style={{ padding: '8px' }}>-</td>
            <td style={{ padding: '8px' }}>{totalProt.toFixed(1)}g</td>
            <td style={{ padding: '8px' }}>{totalLip.toFixed(1)}g</td>
            <td style={{ padding: '8px' }}>{totalCho.toFixed(1)}g</td>
          </tr>
          <tr style={{ fontWeight: '900', color: '#666', borderTop: '2px dashed rgba(0,0,0,0.1)' }}>
            <td style={{ padding: '8px', textAlign: 'left' }}>META (FÓRMULA)</td>
            <td style={{ padding: '8px' }}>-</td>
            <td style={{ padding: '8px' }}>{targetProt.toFixed(1)}g</td>
            <td style={{ padding: '8px' }}>{targetLip.toFixed(1)}g</td>
            <td style={{ padding: '8px' }}>{targetCho.toFixed(1)}g</td>
          </tr>
          <tr style={{ fontWeight: '900', fontSize: '0.75rem' }}>
            <td style={{ padding: '8px', textAlign: 'left' }}>DIFERENCIA</td>
            <td style={{ padding: '8px' }}>-</td>
            <td style={{ padding: '8px', color: Math.abs(targetProt - totalProt) > 5 ? '#EF5350' : '#4CAF50' }}>
              {(totalProt - targetProt).toFixed(1)}g
            </td>
            <td style={{ padding: '8px', color: Math.abs(targetLip - totalLip) > 5 ? '#EF5350' : '#4CAF50' }}>
              {(totalLip - targetLip).toFixed(1)}g
            </td>
            <td style={{ padding: '8px', color: Math.abs(targetCho - totalCho) > 10 ? '#EF5350' : '#4CAF50' }}>
              {(totalCho - targetCho).toFixed(1)}g
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
