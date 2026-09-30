const fs = require('fs');

let page2 = "src/app/nutri/patient/[id]/page.js";
let content2 = fs.readFileSync(page2, "utf8");

// Move "Caja de Ajustes de Peso" ABOVE "Tarjeta Antropometría"
const startAjustes = content2.indexOf('        {/* Caja de Ajustes de Peso */}');
const endAjustes = content2.indexOf('        {/* Notas del Nutricionista */}');
if (startAjustes !== -1 && endAjustes !== -1) {
    let ajustesBlock = content2.slice(startAjustes, endAjustes);
    content2 = content2.replace(ajustesBlock, '');
    const insertPos = content2.indexOf('      {/* Tarjeta Antropometría (Coral) */}');
    content2 = content2.slice(0, insertPos) + ajustesBlock + '\n' + content2.slice(insertPos);
}

// Replace the entire R24H summary block in page 2 with a simple editable textarea
const r24hFullStart = content2.indexOf('{/* Resumen del Recordatorio de 24 Horas (R24H) */}');
const r24hFullEnd = content2.indexOf('{/* Sección de Preguntas del Onboarding */}');

if (r24hFullStart !== -1 && r24hFullEnd !== -1) {
    const r24hFullBlock = content2.slice(r24hFullStart, r24hFullEnd);
    
    const newR24hBlock = `{/* Recordatorio de Hábitos (R24H) */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '20px', background: 'var(--card-yellow-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🍏 Hábitos Alimenticios (R24H)
          </h4>
        </div>
        
        <textarea 
          className="input-field" 
          placeholder="Anota aquí qué comió el paciente en las últimas 24 horas (hábitos, horarios, preferencias)..." 
          style={{ minHeight: '120px', paddingTop: '12px', marginBottom: '4px', width: '100%', fontSize: '0.9rem', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'white' }}
          value={savedR24hNotes}
          onChange={(e) => {
            setSavedR24hNotes(e.target.value);
            localStorage.setItem(\`r24h_notes_\${patient.id}\`, e.target.value);
          }}
        />
      </section>

      `;
    content2 = content2.replace(r24hFullBlock, newR24hBlock);
}

fs.writeFileSync(page2, content2, "utf8");
console.log("Updated patient/[id]/page.js");

// --- 2. Fix new-patient/page.js ---
let page1 = "src/app/nutri/new-patient/page.js";
let content1 = fs.readFileSync(page1, "utf8");

content1 = content1.replace("import R24H from '@/components/R24H';\n", "");

const r24hCompRegex = /<R24H[\s\S]*?\/>/;
const r24hReplacement = `          <textarea 
            className="input-field" 
            placeholder="Anota aquí qué comió el paciente en las últimas 24 horas (hábitos alimenticios, horarios, preferencias...)" 
            style={{ minHeight: '120px', paddingTop: '12px', marginBottom: '4px', width: '100%', fontSize: '0.9rem', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }}
            value={r24hNotes}
            onChange={(e) => setR24hNotes(e.target.value)}
          />`;
content1 = content1.replace(r24hCompRegex, r24hReplacement);

const reminderStateRegex = /const \[reminder, setReminder\] = useState\(\{[\s\S]*?\}\);/;
content1 = content1.replace(reminderStateRegex, "");

content1 = content1.replace(
    "const finalData = { ...formData, r24hTotals: totals, lastReminderDate: new Date().toISOString().split('T')[0] };",
    "const finalData = { ...formData, lastReminderDate: new Date().toISOString().split('T')[0] };"
);

content1 = content1.replace(
    "      localStorage.setItem(`r24h_${created.id}`, JSON.stringify(reminder));\n",
    ""
);

const totalsBlockRegex = /\/\/ Calcular los totales de R24H[\s\S]*?let totals[\s\S]*?\}\);/;
content1 = content1.replace(totalsBlockRegex, "");

fs.writeFileSync(page1, content1, "utf8");
console.log("Updated new-patient/page.js");
