const fs = require('fs');

const filepath = "src/app/nutri/patient/[id]/page.js";
let content = fs.readFileSync(filepath, "utf8");

// Ficha Clinica Editable
const fichaRegex = /(      \{\/\* Ficha Clínica Editable Horizontal \*\/\}.*?)(?=      \{\/\* Notas del Nutricionista \*\/\})/s;
let fichaMatch = content.match(fichaRegex);
let fichaBlock = fichaMatch ? fichaMatch[1] : "";
if (fichaBlock) content = content.replace(fichaBlock, "");

// Resumen del Recordatorio de 24 Horas
const r24hRegex = /(      \{\/\* Resumen del Recordatorio de 24 Horas \(R24H\) \*\/\}.*?)(?=      \{\/\* Tarjeta Fórmula Dietética Interactiva \*\/\})/s;
let r24hMatch = content.match(r24hRegex);
let r24hBlock = r24hMatch ? r24hMatch[1] : "";
if (r24hBlock) content = content.replace(r24hBlock, "");

// Respuestas del Paciente
const respRegex = /(      \{\/\* Sección de Preguntas del Onboarding \*\/\}.*?)(?=      \{\/\* PREVISUALIZACIÓN DEL DASHBOARD INTERACTIVO DEL PACIENTE \*\/\})/s;
let respMatch = content.match(respRegex);
let respBlock = respMatch ? respMatch[1] : "";
if (respBlock) content = content.replace(respBlock, "");

// Remove Previsualización
const previsualizacionRegex = /(      \{\/\* PREVISUALIZACIÓN DEL DASHBOARD INTERACTIVO DEL PACIENTE \*\/\}.*?)(?=      \{\/\* Historial y Evolución \*\/\})/s;
let previMatch = content.match(previsualizacionRegex);
if (previMatch) {
    content = content.replace(previMatch[1], "");
}

// Insert DATOS DE INGRESO
const footerPos = content.indexOf("      {/* Historial y Evolución */}");

const datosDeIngresoBlock = `
      {/* DATOS DE INGRESO */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '40px', marginBottom: '20px', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '10px' }}>DATOS DE INGRESO / HISTORIAL</h3>
${fichaBlock}
${r24hBlock}
${respBlock}

`;

if(footerPos !== -1) {
    content = content.slice(0, footerPos) + datosDeIngresoBlock + content.slice(footerPos);
}

// Add Distribución de Comida dropdown
const comidaDropdown = `
      {/* Selector de Distribución de Comidas */}
      <section className="glass-panel shadow-premium" style={{ padding: '24px', marginBottom: '20px', background: 'white', borderRadius: '24px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase' }}>🍽️ Distribución de Comidas al Día</h4>
        <select 
          value={patient.details?.mealPlan || '3+2 snacks'}
          onChange={(e) => {
             const updatedDetails = { ...patient.details, mealPlan: e.target.value };
             savePatientUpdate({ ...patient, details: updatedDetails });
          }}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9rem', fontWeight: '700', outline: 'none' }}
        >
          {MEAL_PLANS?.map(plan => (
            <option key={plan.key || plan.id} value={plan.key || plan.id}>{plan.name || plan.label} ({plan.meals?.length || 0} comidas)</option>
          ))}
        </select>
      </section>

`;

content = content.replace('      {/* Tarjeta Fórmula Dietética Interactiva */}', comidaDropdown + '      {/* Tarjeta Fórmula Dietética Interactiva */}');


// Fix Informes Guardados
const informesOld = `            {/* Expediente de Informes Guardados (Moviéndolo aquí para visibilidad) */}
            {patient.reports?.length > 0 && (
              <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.8, marginBottom: '10px' }}>HISTORIAL DE INFORMES</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[...patient.reports].reverse().slice(0, 4).map(report => (
                    <Link key={report.id} href={\`/nutri/patient/\${patient.id}/report?reportId=\${report.id}\`} style={{
                      textDecoration: 'none', background: 'rgba(255,255,255,0.15)', color: 'white',
                      padding: '10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800',
                      textAlign: 'center', border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      Copia {new Date(report.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </Link>
                  ))}
                </div>
              </div>
            )}`;

const informesNew = `            {/* Expediente de Informes Guardados (Estilo Carpetas) */}
            {patient.reports?.length > 0 && (
              <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.8, marginBottom: '10px' }}>HISTORIAL DE INFORMES</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                  {[...patient.reports].reverse().map(report => (
                    <Link key={report.id} href={\`/nutri/patient/\${patient.id}/report?reportId=\${report.id}\`} style={{
                      textDecoration: 'none', background: 'rgba(255,255,255,0.1)', color: 'white',
                      padding: '16px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800',
                      textAlign: 'center', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                    }} className="folder-hover">
                      <FileText size={28} opacity={0.9} />
                      <span>{new Date(report.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}`;

content = content.replace(informesOld, informesNew);

fs.writeFileSync(filepath, content, "utf8");
console.log("Done refactoring bottom sections.");
