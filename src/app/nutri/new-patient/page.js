'use client';
import { useState } from 'react';
import { ArrowLeft, UserPlus, Link as LinkIcon, Check, Copy } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUI } from '@/context/UIContext';
import { createPatient } from '@/lib/patients';
import R24H from '@/components/R24H';

export default function NewPatient() {
  const { showToast } = useUI();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    ci: '',
    phone: '',
    birthDate: '',
    gender: 'female',
    height: '',
    weight: '',
    clinicalHistory: '',
    medications: '',
    notas: '',
    isPediatric: false,
    tutorName: '',
    tutorPhone: '',
    mealPlan: '3+2 snacks',
    tags: [],
    onboardingAnswers: {
      favFood: '',
      nonFavFood: '',
      mealCount: '',
      physicalActivity: '',
      allergies: '',
      waterGlasses: '',
      waterLiters: ''
    }
  });
  
  const [reminder, setReminder] = useState({
    Desayuno: [],
    'Merienda AM': [],
    Almuerzo: [],
    'Merienda PM': [],
    Cena: [],
    'Colación Nocturna': []
  });
  const [r24hNotes, setR24hNotes] = useState('');

  const [currentTag, setCurrentTag] = useState('');
  const [linkGenerated, setLinkGenerated] = useState(null);
  const router = useRouter();

  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag] });
      setCurrentTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  // Cálculo de edad automático
  const calculateAge = (dateString) => {
    if (!dateString) return '';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const age = calculateAge(formData.birthDate);

  const savePatient = async (e, mode) => {
    e.preventDefault();
    if (!formData.name || formData.name.trim() === '') {
      showToast('El nombre del paciente es obligatorio', 'error');
      return;
    }
    try {
      // Calcular los totales de R24H para el historial
      let kcal = 0, cho = 0, prot = 0, fat = 0;
      Object.values(reminder).forEach(mealEntries => {
        mealEntries.forEach(e => {
          kcal += e.kcal || 0; cho += e.cho || 0; prot += e.prot || 0; fat += e.fat || 0;
        });
      });
      const totals = { kcal, cho, prot, fat };
      const finalData = { ...formData, r24hTotals: totals, lastReminderDate: new Date().toISOString().split('T')[0] };
      
      const created = await createPatient(finalData);
      
      localStorage.setItem(`r24h_${created.id}`, JSON.stringify(reminder));
      localStorage.setItem(`r24h_notes_${created.id}`, r24hNotes);

      if (mode === 'presencial') {
        router.push(`/nutri/patient/${created.id}`);
      } else {
        setLinkGenerated(`${window.location.origin}/paciente/${created.id}`);
      }
    } catch (err) {
      showToast('Error al crear paciente. Asegúrate de tener conexión a internet.', 'error');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(linkGenerated);
    showToast('Enlace copiado al portapapeles', 'success');
  };

  return (
    <div style={{ padding: '20px 20px 140px' }}>
      <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/nutri/dashboard" style={{ color: 'var(--text-primary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '900' }}>Nuevo Paciente</h2>
      </header>

      <div className="fade-in">
        <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '20px' }}>
          <h4 style={{ marginBottom: '16px', opacity: 0.5, fontSize: '0.8rem', fontWeight: '800' }}>DATOS BÁSICOS</h4>
          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Nombre Completo</label>
          <input 
            type="text" 
            placeholder="Nombre y Apellido" 
            className="input-field"
            style={{ marginBottom: '4px' }}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />

          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Correo Electrónico</label>
          <input 
            type="email" 
            placeholder="ejemplo@correo.com" 
            className="input-field"
            style={{ marginBottom: '4px' }}
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Cédula</label>
              <input 
                type="text" 
                placeholder="V-00000000" 
                className="input-field"
                style={{ marginBottom: '4px' }}
                value={formData.ci}
                onChange={(e) => setFormData({...formData, ci: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Género</label>
              <select 
                className="input-field"
                style={{ marginBottom: '4px' }}
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                required
              >
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Tipo de Paciente</label>
              <select 
                className="input-field"
                style={{ marginBottom: '4px' }}
                value={formData.isPediatric ? 'si' : 'no'}
                onChange={(e) => setFormData({...formData, isPediatric: e.target.value === 'si'})}
                required
              >
                <option value="no">Adulto</option>
                <option value="si">Pediátrico</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Teléfono de Contacto</label>
              <input 
                type="text" 
                placeholder="Teléfono del paciente" 
                className="input-field"
                style={{ marginBottom: '4px' }}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          {formData.isPediatric && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', background: 'rgba(29, 81, 45, 0.05)', padding: '16px', borderRadius: '16px', border: '1px dashed var(--primary)' }}>
              <div>
                <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Nombre Representante / Tutor</label>
                <input 
                  type="text" 
                  placeholder="Madre, Padre, Representante" 
                  className="input-field"
                  style={{ marginBottom: 0 }}
                  value={formData.tutorName}
                  onChange={(e) => setFormData({...formData, tutorName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Tlf. Representante / Tutor</label>
                <input 
                  type="text" 
                  placeholder="Ej: +58 412..." 
                  className="input-field"
                  style={{ marginBottom: 0 }}
                  value={formData.tutorPhone}
                  onChange={(e) => setFormData({...formData, tutorPhone: e.target.value})}
                  required
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Fecha de Nacimiento</label>
              <input 
                type="date" 
                className="input-field"
                style={{ marginBottom: '4px' }}
                value={formData.birthDate}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Edad</label>
              <input 
                type="text" 
                className="input-field" 
                style={{ background: '#eee', marginBottom: '4px' }}
                value={age ? `${age} años` : ''} 
                readOnly 
              />
            </div>
          </div>


        </section>

        <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '20px' }}>
          <h4 style={{ marginBottom: '16px', opacity: 0.5, fontSize: '0.8rem', fontWeight: '800' }}>FICHA CLÍNICA Y ANTECEDENTES</h4>
          
          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Etiquetas / Patologías</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {formData.tags.map(tag => (
              <span key={tag} style={{ background: '#1D512D', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {tag} <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Ej: Diabetes, Hiperplasia..." 
              className="input-field" 
              style={{ marginBottom: '4px' }}
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button type="button" onClick={addTag} className="btn-secondary" style={{ padding: '0 20px', borderRadius: '12px', fontWeight: '800', height: '54px' }}>Añadir</button>
          </div>

          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Antecedentes Médicos / Enfermedades</label>
          <textarea 
            className="input-field" 
            placeholder="Escribe antecedentes aquí..." 
            style={{ minHeight: '80px', paddingTop: '12px', marginBottom: '4px' }}
            value={formData.clinicalHistory}
            onChange={(e) => setFormData({...formData, clinicalHistory: e.target.value})}
          />

          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Medicamentos actuales</label>
          <textarea 
            className="input-field" 
            placeholder="losartan, lipitor, aspirina" 
            style={{ minHeight: '60px', paddingTop: '12px', marginBottom: '4px' }}
            value={formData.medications}
            onChange={(e) => setFormData({...formData, medications: e.target.value})}
          />

          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block', marginTop: '12px' }}>Notas Adicionales (Exámenes, Recordatorios...)</label>
          <textarea 
            className="input-field" 
            placeholder="Cualquier nota extra para ver si sale todo el contenido" 
            style={{ minHeight: '60px', paddingTop: '12px', marginBottom: '4px' }}
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </section>

        <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '20px' }}>
          <h4 style={{ marginBottom: '16px', opacity: 0.5, fontSize: '0.8rem', fontWeight: '800' }}>RECORDATORIO 24 HORAS (Ingreso)</h4>
          <R24H 
            reminder={reminder} 
            setReminder={setReminder} 
            r24hNotes={r24hNotes} 
            setR24hNotes={setR24hNotes} 
          />
        </section>

        <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderRadius: '20px' }}>
          <h4 style={{ marginBottom: '16px', opacity: 0.5, fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)' }}>GUSTOS Y PREFERENCIAS</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              { q: "1. Comida favorita", key: "favFood" },
              { q: "2. Comida y alimento NO favorito", key: "nonFavFood" },
              { q: "3. Comidas que desea realizar", key: "mealCount" },
              { q: "4. Actividad física", key: "physicalActivity" },
              { q: "5. Intolerancia o alergia", key: "allergies" },
              { q: "6. Consumo Hídrico (Agua al día)", key: "waterGlasses", isWater: true }
            ].map((item) => (
              <div key={item.key} style={{ background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '10px', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ fontWeight: '800', fontSize: '0.8rem', opacity: 0.6, marginBottom: '8px', textTransform: 'uppercase' }}>{item.q}</p>
                {item.isWater ? (
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', opacity: 0.5, display: 'block', fontWeight: '800' }}>VASOS DE AGUA:</span>
                      <input 
                        type="number" 
                        step="0.5" 
                        className="input-field"
                        value={formData.onboardingAnswers?.waterGlasses || ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = parseFloat(val);
                          setFormData({
                            ...formData,
                            onboardingAnswers: {
                              ...formData.onboardingAnswers,
                              waterGlasses: val,
                              waterLiters: val ? (parsed * 0.24).toFixed(2).replace(/\.?0+$/, '') : ''
                            }
                          });
                        }}
                        style={{ padding: '6px', fontSize: '0.9rem', width: '90px', marginBottom: 0 }} 
                      />
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--primary)' }}>=</div>
                    <div>
                      <span style={{ fontSize: '0.65rem', opacity: 0.5, display: 'block', fontWeight: '800' }}>LITROS DE AGUA:</span>
                      <input 
                        type="number" 
                        step="0.1" 
                        className="input-field"
                        value={formData.onboardingAnswers?.waterLiters || ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = parseFloat(val);
                          setFormData({
                            ...formData,
                            onboardingAnswers: {
                              ...formData.onboardingAnswers,
                              waterLiters: val,
                              waterGlasses: val ? (parsed / 0.24).toFixed(1).replace(/\.?0+$/, '') : ''
                            }
                          });
                        }}
                        style={{ padding: '6px', fontSize: '0.9rem', width: '90px', marginBottom: 0 }} 
                      />
                    </div>
                  </div>
                ) : (
                  <textarea 
                    className="input-field"
                    style={{ width: '100%', minHeight: '60px', padding: '10px', fontSize: '0.9rem', marginBottom: 0 }}
                    value={formData.onboardingAnswers?.[item.key] || ''}
                    placeholder={`Escribe aquí la respuesta...`}
                    onChange={(e) => setFormData({
                      ...formData,
                      onboardingAnswers: { ...formData.onboardingAnswers, [item.key]: e.target.value }
                    })}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {!linkGenerated ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <button 
              onClick={(e) => savePatient(e, 'presencial')} 
              className="btn-accent" 
              style={{ width: '100%', padding: '18px', borderRadius: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <UserPlus size={20} /> Crear Perfil (Presencial)
            </button>
            <button 
              onClick={(e) => savePatient(e, 'virtual')} 
              className="btn-primary" 
              style={{ width: '100%', padding: '18px', borderRadius: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <LinkIcon size={20} /> Generar Link (Virtual)
            </button>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', marginTop: '20px', background: 'var(--card-green)', color: 'white' }}>
            <Check size={40} style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px', fontWeight: '900' }}>¡Paciente Registrado!</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '20px' }}>Envía este link al paciente para que inicie su proceso:</p>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', wordBreak: 'break-all', marginBottom: '16px' }}>
              {linkGenerated}
            </div>
            <button type="button" onClick={copyLink} className="btn-accent" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', padding: '14px' }}>
              <LinkIcon size={18} /> Copiar Enlace
            </button>
            <a 
              href={`https://wa.me/${formData.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`¡Hola ${formData.name}! Bienvenido a Nutrimemi. Para completar tu perfil, por favor regístrate en este enlace: ${linkGenerated}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', background: '#25D366', marginBottom: '12px', padding: '14px' }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enviar por WhatsApp
            </a>
            <Link href={`/nutri/patient/${linkGenerated.split('/').pop()}`} className="btn-accent" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', background: 'var(--text-primary)', padding: '14px', borderRadius: '16px' }}>
               Ir a Ficha y Medidas
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
