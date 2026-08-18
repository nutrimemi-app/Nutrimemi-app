const fs = require('fs');

const filepath = "src/app/nutri/patient/[id]/page.js";
let content = fs.readFileSync(filepath, "utf8");

// 1. Remove R24H button from quick actions
const r24hButtonOld = `            <Link href={\`/nutri/patient/\${patient.id}/reminder\`} style={{ textDecoration: 'none', background: 'var(--card-yellow-light)', border: '1.5px solid var(--accent)', color: 'var(--text-primary)', padding: '12px 8px', borderRadius: '16px', fontWeight: '900', fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <History size={16} /> R24H
            </Link>`;

content = content.replace(r24hButtonOld, '');

// 2. Change the Chuleta in Formula Dietetica
const chuletaOld = `<span style={{ fontSize: '0.55rem', opacity: 0.7, marginTop: '4px', display: 'block' }}>Ref: Déficit 20-25 | Mant. 25-30 | Superávit 30-35</span>`;
const chuletaNew = `<span style={{ fontSize: '0.55rem', opacity: 0.7, marginTop: '4px', display: 'block', lineHeight: '1.3' }}>Hipocalórico: 20-24 kcal/kg · Normocalórico: 25-30 kcal/kg · Hipercalórico: &gt;30 kcal/kg</span>`;
content = content.replace(chuletaOld, chuletaNew);


// 3. Move Distribución de Comidas to be right after Antropometría
const distrRegex = /(      \{\/\* Selector de Distribución de Comidas \*\/\}.*?<\/section>\n\n)/s;
let distrMatch = content.match(distrRegex);
if (distrMatch) {
    let distrBlock = distrMatch[1];
    // remove from current position
    content = content.replace(distrBlock, '');
    
    // Find end of Antropometría
    const antroEndStr = `          {/* Tracker de Evolución */}
          {patient.history?.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: '900', opacity: 0.5 }}>ULTIMA CITA VS HOY:</p>
              {(() => {
                const last = patient.history[patient.history.length - 1];
                const dWeight = (parseFloat(patient.details.weight) - parseFloat(last.details.weight)).toFixed(1);
                const dImc = (parseFloat(clinical.imc) - parseFloat(last.imc)).toFixed(1);
                return (
                  <div style={{ display: 'flex', gap: '25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '900', color: dWeight <= 0 ? '#1D512D' : '#cc0000' }}>{dWeight > 0 ? \`+\${dWeight}\` : dWeight} <span style={{fontSize: '0.6rem'}}>kg</span></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '900', color: dImc <= 0 ? '#1D512D' : '#cc0000' }}>{dImc > 0 ? \`+\${dImc}\` : dImc} <span style={{fontSize: '0.6rem'}}>IMC</span></span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </section>`;
    
    // Insert immediately after Antropometria ends
    content = content.replace(antroEndStr, antroEndStr + "\n\n" + distrBlock);
}

fs.writeFileSync(filepath, content, "utf8");
console.log("Refactor 3 applied successfully.");
