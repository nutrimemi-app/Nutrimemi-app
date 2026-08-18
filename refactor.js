const fs = require('fs');

const filepath = "src/app/nutri/patient/[id]/page.js";
let content = fs.readFileSync(filepath, "utf8");

// Locate Antropometría
const antroRegex = /(      \{\/\* Tarjeta Antropometría \(Coral\) \*\/\}.*?)(?=      \{\/\* Sección de Preguntas del Onboarding \*\/\})/s;
const antroMatch = content.match(antroRegex);

if (antroMatch) {
    const antroBlock = antroMatch[1];
    content = content.replace(antroBlock, "");
    content = content.replace('      {/* Etiquetas / Patologías */}', antroBlock + '\n      {/* Etiquetas / Patologías */}');
}

// Remove P. REF (PC)
const p_ref_1 = `            <div>
              <p style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.5, marginBottom: '4px' }}>P. REF (PC)</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '900', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{clinical.pc} kg</p>
            </div>`;
content = content.replace(p_ref_1, "");

const p_ref_2 = `              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.6, display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>P. REFERENCIA (PC)</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '2px 8px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={patient.details?.manualPc || ''}
                    placeholder={clinical.suggestedPc}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updatedDetails = { ...patient.details, manualPc: val };
                      const updatedPatient = { ...patient, details: updatedDetails };
                      savePatientUpdate(updatedPatient);
                    }}
                    style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: '800', padding: '8px 2px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.5 }}>kg</span>
                </div>
              </div>`;
content = content.replace(p_ref_2, "");

const p_ref_3 = `          <span style={{ fontSize: '0.7rem', fontWeight: '805', background: 'var(--card-green-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px' }}>
            Peso Ref (PC): {clinical.pc} kg
          </span>`;
content = content.replace(p_ref_3, "");

// Replace RCT
const rct_input_block = `        {/* Input de RCT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.02)', padding: '12px 16px', borderRadius: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.6, display: 'block', marginBottom: '3px' }}>REQUERIMIENTO CALÓRICO TOTAL (RCT)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={patient.dietForm?.rct || '1700'}
                onChange={(e) => {
                  const val = e.target.value;
                  const updatedDietForm = { ...patient.dietForm, rct: val };
                  const updatedPatient = { ...patient, dietForm: updatedDietForm };
                  savePatientUpdate(updatedPatient);
                }}
                style={{ width: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--text-primary)' }}>Kcal / día</span>
            </div>
          </div>`;

const rct_replacement = `        {/* Input de RCT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.6, display: 'block', marginBottom: '6px' }}>REFERENCIA DE PESO</label>
              <select 
                value={patient.dietForm?.weightRef || 'PI'}
                onChange={(e) => {
                  const val = e.target.value;
                  const updatedDietForm = { ...patient.dietForm, weightRef: val };
                  const weightToUse = val === 'PI' ? (patient.details?.manualPi || clinical.pi) : (patient.details?.manualPa || clinical.pa);
                  const rct = (parseFloat(weightToUse) || 0) * (parseFloat(updatedDietForm.kcalPerKg) || 0);
                  if (rct > 0) updatedDietForm.rct = rct.toFixed(0);
                  savePatientUpdate({ ...patient, dietForm: updatedDietForm });
                }}
                className="input-field" style={{ margin: 0, padding: '8px', fontSize: '0.9rem' }}
              >
                <option value="PI">Peso Ideal (PI)</option>
                <option value="PA">Peso Ajustado (PA)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.6, display: 'block', marginBottom: '6px' }}>KCAL X KG</label>
              <input
                type="number"
                value={patient.dietForm?.kcalPerKg || ''}
                placeholder="ej. 25"
                onChange={(e) => {
                  const val = e.target.value;
                  const updatedDietForm = { ...patient.dietForm, kcalPerKg: val };
                  const weightToUse = updatedDietForm.weightRef === 'PA' ? (patient.details?.manualPa || clinical.pa) : (patient.details?.manualPi || clinical.pi);
                  const rct = (parseFloat(weightToUse) || 0) * (parseFloat(val) || 0);
                  if (rct > 0) updatedDietForm.rct = rct.toFixed(0);
                  savePatientUpdate({ ...patient, dietForm: updatedDietForm });
                }}
                className="input-field" style={{ margin: 0, padding: '8px', fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.55rem', opacity: 0.7, marginTop: '4px', display: 'block' }}>Ref: Déficit 20-25 | Mant. 25-30 | Superávit 30-35</span>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: '850', opacity: 0.6, display: 'block', marginBottom: '6px' }}>RCT CALCULADO</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  value={patient.dietForm?.rct || ''}
                  onChange={(e) => {
                    const updatedDietForm = { ...patient.dietForm, rct: e.target.value };
                    savePatientUpdate({ ...patient, dietForm: updatedDietForm });
                  }}
                  style={{ width: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)', background: '#fff' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--text-primary)' }}>Kcal/día</span>
              </div>
            </div>
          </div>`;

content = content.replace(rct_input_block, rct_replacement);

fs.writeFileSync(filepath, content, "utf8");
console.log("Done");
