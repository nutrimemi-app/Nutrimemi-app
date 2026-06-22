'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, Trash2, Plus, X, Search, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUI } from '@/context/UIContext';

export default function NutriAgenda() {
  const router = useRouter();
  const { showToast } = useUI();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    id: null,
    patientId: '',
    patientName: '',
    date: '',
    time: '',
    type: 'Control',
    notes: ''
  });

  useEffect(() => {
    // Cargar pacientes y citas de localStorage
    const savedPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const savedAppointments = JSON.parse(localStorage.getItem('nutri_appointments') || '[]');
    setPatients(savedPatients);
    setAppointments(savedAppointments.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time)));
  }, []);

  // Funciones de Calendario
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = (firstDayOfMonth(year, month) + 6) % 7; // Ajustar a Lunes inicio

    // Días vacíos inicio
    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} style={{ height: '50px' }}></div>);

    // Días del mes
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasApp = appointments.some(a => a.date === dateStr);
      const isSelected = selectedDate === dateStr;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div 
          key={d} 
          onClick={() => setSelectedDate(dateStr)}
          style={{ 
            height: '50px', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            borderRadius: '12px',
            background: isSelected ? 'var(--primary)' : isToday ? 'rgba(29, 81, 45, 0.1)' : 'white',
            color: isSelected ? 'white' : 'inherit',
            fontWeight: isSelected || isToday ? '900' : 'normal',
            position: 'relative',
            border: isToday ? '1px solid var(--primary)' : 'none'
          }}
        >
          {d}
          {hasApp && !isSelected && (
            <div style={{ position: 'absolute', bottom: '6px', width: '4px', height: '4px', background: 'var(--card-yellow)', borderRadius: '50%' }}></div>
          )}
        </div>
      );
    }
    return days;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.date || !formData.time) return showToast('Llene todos los campos', 'error');

    const patient = patients.find(p => p.id === parseInt(formData.patientId));
    const newAppointment = {
      ...formData,
      id: formData.id || Date.now(),
      patientName: patient?.name || 'Desconocido'
    };

    let updated;
    if (formData.id) {
      updated = appointments.map(a => a.id === formData.id ? newAppointment : a);
    } else {
      updated = [...appointments, newAppointment];
    }

    const sorted = updated.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    setAppointments(sorted);
    localStorage.setItem('nutri_appointments', JSON.stringify(sorted));
    setShowModal(false);
    resetForm();
  };

  const deleteAppointment = (id) => {
    showConfirm(
      "Eliminar Cita",
      "¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.",
      () => {
        const updated = appointments.filter(a => a.id !== id);
        setAppointments(updated);
        localStorage.setItem('nutri_appointments', JSON.stringify(updated));
        showToast("Cita eliminada correctamente", "success");
      }
    );
  };

  const openEdit = (app) => {
    setFormData(app);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      patientId: '',
      patientName: '',
      date: '',
      time: '',
      type: 'Control',
      notes: ''
    });
    setSearchTerm('');
  };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const displayAppointments = selectedDate 
    ? appointments.filter(a => a.date === selectedDate)
    : appointments;

  return (
    <div style={{ padding: '24px', paddingBottom: '120px' }}>
      <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>Agenda</h2>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary" 
          style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Nueva Cita
        </button>
      </header>

      {/* CALENDARIO VISUAL */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '32px', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: '900', textTransform: 'capitalize' }}>
            {viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
             <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} style={{ padding: '8px', border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>←</button>
             <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} style={{ padding: '8px', border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>→</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px', fontSize: '0.7rem', fontWeight: '800', opacity: 0.4 }}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {renderCalendar()}
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: '900' }}>
          {selectedDate ? `Citas para el ${selectedDate.split('-').reverse().join('/')}` : 'Próximas Citas'}
        </h3>
        {selectedDate && (
          <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '800', fontSize: '0.8rem' }}>Ver todas</button>
        )}
      </div>

      {displayAppointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.5 }}>
          <p>No hay citas agendadas para este periodo.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayAppointments.map(app => {
            const isToday = new Date(app.date).toDateString() === new Date().toDateString();
            return (
              <div key={app.id} className="glass-panel fade-in" style={{ 
                padding: '16px', 
                borderLeft: `6px solid ${isToday ? 'var(--primary)' : 'var(--card-yellow)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center', minWidth: '60px', padding: '8px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                     <p style={{ fontSize: '0.6rem', fontWeight: '900', opacity: 0.5 }}>{new Date(app.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</p>
                     <p style={{ fontSize: '1.2rem', fontWeight: '900' }}>{new Date(app.date + 'T00:00:00').getDate()}</p>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: '800', marginBottom: '4px' }}>{app.patientName}</h4>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', opacity: 0.6 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {app.time}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={12} /> {app.type}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(app)} className="btn-secondary" style={{ padding: '8px', borderRadius: '8px' }}>Editar</button>
                  <button onClick={() => deleteAppointment(app.id)} style={{ background: '#fff0f0', color: '#cc0000', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL NUEVA CITA */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ background: 'white', width: '100%', maxWidth: '450px', padding: '32px', borderRadius: '24px', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', opacity: 0.4 }}><X /></button>
            
            <h3 style={{ marginBottom: '24px', fontWeight: '900' }}>{formData.id ? 'Editar Cita' : 'Programar Cita'}</h3>
            
            <form onSubmit={handleSave}>
              <label style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.5, marginBottom: '8px', display: 'block' }}>PACIENTE</label>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="Escriba nombre o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
                <Search size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                
                {searchTerm.length > 0 && !formData.patientId && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    right: 0, 
                    background: 'white', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                    zIndex: 10,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => {
                            setFormData({...formData, patientId: p.id, patientName: p.name});
                            setSearchTerm(p.name);
                          }}
                          style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}
                        >
                          <p style={{ fontWeight: '700' }}>{p.name}</p>
                          <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>Doc: {p.details?.ci || 'N/A'}</p>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '12px 16px', fontSize: '0.9rem', opacity: 0.5 }}>No se encontró el paciente</div>
                    )}
                  </div>
                )}
                
                {formData.patientId && (
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(29, 81, 45, 0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>✔ Seleccionado: {formData.patientName}</span>
                    <button type="button" onClick={() => { setFormData({...formData, patientId: '', patientName: ''}); setSearchTerm(''); }} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: '0.75rem', cursor: 'pointer' }}>Cambiar</button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '10px', display: 'block' }}>📅 FECHA</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})} 
                    required 
                    style={{ marginBottom: 0, padding: '16px', borderRadius: '16px', fontSize: '1rem', background: '#f8f8f8' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '10px', display: 'block' }}>⌚ HORA</label>
                  <input 
                    type="time" 
                    className="input-field" 
                    value={formData.time} 
                    onChange={(e) => setFormData({...formData, time: e.target.value})} 
                    required 
                    style={{ marginBottom: 0, padding: '16px', borderRadius: '16px', fontSize: '1rem', background: '#f8f8f8' }} 
                  />
                </div>
              </div>

              <label style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.5, marginBottom: '8px', display: 'block' }}>TIPO DE CITA</label>
              <select className="input-field" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="Control">Control Mensual</option>
                <option value="Evaluación Inicial">Evaluación Inicial</option>
                <option value="Ajuste de Plan">Ajuste de Plan</option>
                <option value="Entrega de Resultados">Entrega de Resultados</option>
              </select>

              <label style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.5, marginBottom: '8px', display: 'block' }}>NOTAS</label>
              <textarea className="input-field" placeholder="Ej: Traer exámenes de sangre..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '16px', fontWeight: '900', marginTop: '16px' }}>
                {formData.id ? 'Guardar Cambios' : 'Confirmar Cita'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
