'use client';
import { useState } from 'react';
import { ArrowLeft, UserPlus, Link as LinkIcon, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewPatient() {
  const [formData, setFormData] = useState({
    name: '',
    ci: '',
    phone: '',
    birthDate: '',
    gender: 'female',
    height: '',
    weight: '',
    clinicalHistory: '',
    medications: '',
    notes: '',
    tags: []
  });
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

  const age = calculateAge(formData.birthDate);  const savePatient = (e, mode) => {
    e.preventDefault();
    const patientId = Math.floor(Math.random() * 10000);
    
    const newPatient = {
      id: patientId,
      name: formData.name,
      goal: 'Nuevo Paciente',
      status: 'Activo',
      lastSeen: 'Hoy',
      details: { ...formData, age },
      history: [],
      reports: [],
      measurements: {},
      menu: {}
    };

    const existingPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    localStorage.setItem('nutri_patients', JSON.stringify([...existingPatients, newPatient]));

    if (mode === 'presencial') {
      router.push(`/nutri/patient/${patientId}`);
    } else {
      setLinkGenerated(`${window.location.origin}/paciente/${patientId}`);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(linkGenerated);
    alert('Enlace copiado al portapapeles');
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '120px' }}>
      <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/nutri/dashboard" style={{ color: 'var(--text-primary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '900' }}>Nuevo Paciente</h2>
      </header>

      <div className="fade-in">
        <section className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '16px', opacity: 0.5, fontSize: '0.8rem', fontWeight: '800' }}>DATOS BÁSICOS</h4>
          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Nombre Completo</label>
          <input 
            type="text" 
            placeholder="Santiago Rios" 
            className="input-field"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Cédula</label>
              <input 
                type="text" 
                placeholder="4.395.964" 
                className="input-field"
                value={formData.ci}
                onChange={(e) => setFormData({...formData, ci: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Género</label>
              <select 
                className="input-field"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                required
              >
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Fecha de Nacimiento</label>
              <input 
                type="date" 
                className="input-field"
                value={formData.birthDate}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Edad</label>
              <input 
                type="text" 
                className="input-field" 
                value={age ? `${age} años` : ''} 
                readOnly 
                style={{ background: '#eee' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Altura (cm)</label>
              <input 
                type="number" 
                placeholder="163" 
                className="input-field"
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Peso Inicial (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                placeholder="90" 
                className="input-field"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                required
              />
            </div>
          </div>
        </section>

        <section className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '16px', opacity: 0.5, fontSize: '0.8rem', fontWeight: '800' }}>FICHA CLÍNICA Y ANTECEDENTES</h4>
          
          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Etiquetas / Patologías</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {formData.tags.map(tag => (
              <span key={tag} style={{ background: '#1D512D', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {tag} <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Ej: Diabetes, Hiperplasia..." 
              className="input-field" 
              style={{ marginBottom: 0 }}
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button type="button" onClick={addTag} className="btn-secondary" style={{ padding: '0 20px', borderRadius: '12px', fontWeight: '800' }}>Añadir</button>
          </div>

          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Antecedentes Médicos / Enfermedades</label>
          <textarea 
            className="input-field" 
            placeholder="su mama y toda su familia era hipertensa" 
            style={{ minHeight: '80px', paddingTop: '12px' }}
            value={formData.clinicalHistory}
            onChange={(e) => setFormData({...formData, clinicalHistory: e.target.value})}
          />

          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Medicamentos actuales</label>
          <textarea 
            className="input-field" 
            placeholder="losartan, lipitor, aspirina" 
            style={{ minHeight: '60px', paddingTop: '12px' }}
            value={formData.medications}
            onChange={(e) => setFormData({...formData, medications: e.target.value})}
          />

          <label style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px', display: 'block' }}>Notas Adicionales (Exámenes, Recordatorios...)</label>
          <textarea 
            className="input-field" 
            placeholder="Cualquier nota extra para ver si sale todo el contenido" 
            style={{ minHeight: '60px', paddingTop: '12px' }}
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </section>

        {!linkGenerated ? (
          <div style={{ display: 'flex', gap: '15px' }}>
             <button 
              onClick={(e) => savePatient(e, 'presencial')} 
              className="btn-accent" 
              style={{ flex: 1, padding: '18px', borderRadius: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <UserPlus size={20} /> Crear Perfil (Presencial)
            </button>
            <button 
              onClick={(e) => savePatient(e, 'virtual')} 
              className="btn-primary" 
              style={{ flex: 1, padding: '18px', borderRadius: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
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
