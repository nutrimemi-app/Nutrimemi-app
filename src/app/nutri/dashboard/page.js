'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, Search, Activity, Calendar, 
  MessageCircle, Trash2, Edit2, X, FileText, UserPlus, 
  Send, CheckCircle2, Clock, AlertCircle, FolderOpen, 
  UtensilsCrossed, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { getPatients, deletePatient, updatePatient } from '@/lib/patients';
import { useUI } from '@/context/UIContext';

export default function NutriDashboard() {
  const { user, logout } = useAuth();
  const { showConfirm, showToast } = useUI();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('fichas'); // 'fichas' | 'directorio'
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos' | 'activos' | 'pendientes' | 'incompletos'
  const [editPatient, setEditPatient] = useState(null);

  useEffect(() => {
    const loadPatients = async () => {
      const data = await getPatients();
      setPatients(data);
      setIsLoading(false);
    };
    loadPatients();
  }, []);

  const getDietaryAnomalyCount = (patientId) => {
    try {
      const logs = JSON.parse(localStorage.getItem(`daily_log_${patientId}`) || '[]');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      let unusualCount = 0;
      logs.forEach(log => {
        const logDate = new Date(log.date + 'T00:00:00');
        if (logDate >= sevenDaysAgo) {
          const unusualInLog = (log.entries || []).filter(e => e.groupKey === 'no_habitual');
          unusualInLog.forEach(e => {
            unusualCount += (e.qty || 1);
          });
        }
      });
      return unusualCount;
    } catch (e) {
      return 0;
    }
  };

  // Helper para verificar el progreso de onboarding (datos básicos + medidas)
  const checkOnboardingComplete = (p) => {
    // 1. Indicador explícito del nuevo flujo de onboarding
    if (p.onboardingAnswers?.onboardingStatus === 'completed') {
      return true;
    }
    if (p.onboardingAnswers?.onboardingStatus === 'in_progress') {
      return false;
    }
    // 2. Compatibilidad con expedientes antiguos sin nuevos metadatos
    return Boolean(
      p.onboardingAnswers && 
      Object.keys(p.onboardingAnswers).length > 0 && 
      p.measurements && 
      Object.keys(p.measurements).length > 0
    );
  };

  // Helper para verificar si requiere revisión clínica (datos autorreportados o estatus de registro pendiente)
  const checkPendingReview = (p) => {
    // 1. Paciente con onboarding en progreso: está completando su información, no está listo para revisión
    if (p.onboardingAnswers?.onboardingStatus === 'in_progress') {
      return false;
    }

    // Identificar qué secciones contienen realmente información autorreportada
    const hasSelfReportedAnswers = Boolean(
      p.onboardingAnswers?.onboardingStatus === 'completed' ||
      p.onboardingAnswers?._origin === 'self_reported' ||
      p.onboardingAnswers?.source === 'patient_form' ||
      p.onboardingAnswers?.reviewStatus ||
      p.onboardingAnswers?._status === 'pending_review'
    );

    // Determinar si hay al menos un valor antropométrico real (ignorando metadatos y valores nulos/vacíos)
    const hasSelfReportedMeasurements = Boolean(
      p.measurements?._selfReported && 
      Object.entries(p.measurements._selfReported).some(([key, val]) => {
        if (key.startsWith('_')) return false; // Ignora metadatos: _recordedAt, _origin, _status
        if (val === null || val === undefined) return false;
        if (typeof val === 'string' && val.trim() === '') return false;
        return true;
      })
    );

    const hasModernMetadata = hasSelfReportedAnswers || hasSelfReportedMeasurements;

    // 2. Si existen secciones autorreportadas, evaluarlas con validación estricta
    if (hasModernMetadata) {
      let isAnySectionPending = false;

      // Evaluar cuestionario únicamente si el paciente autorreportó respuestas
      if (hasSelfReportedAnswers) {
        const answersStatus = p.onboardingAnswers?.reviewStatus || p.onboardingAnswers?._status;
        // Solo se considera revisado si es explícitamente 'reviewed'
        if (answersStatus !== 'reviewed') {
          isAnySectionPending = true;
        }
      }

      // Evaluar medidas corporales únicamente si el paciente las autorreportó
      if (hasSelfReportedMeasurements) {
        const measurementsStatus = p.measurements?._selfReported?._status;
        // Solo se considera revisado si es explícitamente 'reviewed'
        if (measurementsStatus !== 'reviewed') {
          isAnySectionPending = true;
        }
      }

      // Si alguna de las secciones autorreportadas existentes no ha sido validada explícitamente, permanece pendiente
      if (isAnySectionPending) {
        return true;
      }

      // Si todas las secciones que contienen información autorreportada están explícitamente 'reviewed',
      // el paciente está clínicamente al día, incluso si conserva status histórico 'Pendiente' o 'Registrado'
      return false;
    }

    // 3. Compatibilidad para pacientes históricos sin nuevos metadatos de revisión
    // A. Status administrativo histórico 'Pendiente' o 'Registrado'
    if (p.status === 'Pendiente' || p.status === 'Registrado') {
      return true;
    }

    // B. Respuestas históricas existentes sin medidas registradas
    if (
      p.onboardingAnswers && 
      Object.keys(p.onboardingAnswers).length > 0 && 
      (!p.measurements || Object.keys(p.measurements).length === 0)
    ) {
      return true;
    }

    return false;
  };

  // Pacientes con revisión clínica pendiente real
  const pendingReviewPatients = patients.filter(checkPendingReview);

  // Filtrado compuesto: Búsqueda de texto + Filtro por estado
  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (p.name || '').toLowerCase().includes(term);
    const ciMatch = p.details?.ci ? p.details.ci.toLowerCase().includes(term) : false;
    const emailMatch = p.details?.email ? p.details.email.toLowerCase().includes(term) : false;
    const matchesSearch = nameMatch || ciMatch || emailMatch;

    if (!matchesSearch) return false;

    if (statusFilter === 'activos') {
      return p.status === 'Activo' || !p.status;
    }
    if (statusFilter === 'pendientes') {
      return checkPendingReview(p);
    }
    if (statusFilter === 'incompletos') {
      return !checkOnboardingComplete(p);
    }
    return true; // 'todos'
  });

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!editPatient) return;
    try {
      const updated = await updatePatient(editPatient.id, { 
        name: editPatient.name,
        details: { ...editPatient.details, ci: editPatient.ci, email: editPatient.email, phone: editPatient.phone },
        _expectedUpdatedAt: editPatient.updated_at,
        _patientBase: editPatient
      });
      const updatedList = patients.map(p => {
        if (p.id === editPatient.id) {
          return {
            ...p,
            ...(updated || {}),
            name: editPatient.name,
            details: { ...p.details, ci: editPatient.ci, email: editPatient.email, phone: editPatient.phone }
          };
        }
        return p;
      });
      setPatients(updatedList);
      showToast('Contacto actualizado', 'success');
      setEditPatient(null);
    } catch (err) {
      if (err.code === 'VERSION_CONFLICT' || err.code === 'CLINICAL_FIELD_CONFLICT') {
        showToast('El contacto fue modificado por otra sesión. Recarga la página.', 'error');
      } else {
        showToast('Error al actualizar', 'error');
      }
    }
  };

  return (
    <div style={{ padding: '20px 20px 120px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* ── ENCABEZADO PRINCIPAL ── */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Nutrimemi Logo" style={{ height: '42px', width: 'auto' }} />
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
              Panel de Control
            </h2>
            <p style={{ opacity: 0.65, fontSize: '0.8rem', margin: '2px 0 0', fontWeight: '650' }}>
              Hola, {user?.name || 'Nutricionista'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Accesos Rápidos de Navegación Existentes */}
          <Link href="/nutri/agenda" style={{ textDecoration: 'none' }}>
            <button className="glass-panel" style={{
              padding: '8px 12px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              color: 'var(--text-primary)',
              border: '1px solid rgba(0,0,0,0.06)',
              fontSize: '0.78rem',
              fontWeight: '800',
              cursor: 'pointer'
            }}>
              <Calendar size={15} color="var(--primary)" />
              <span>Agenda</span>
            </button>
          </Link>

          <Link href="/nutri/foods" style={{ textDecoration: 'none' }}>
            <button className="glass-panel" style={{
              padding: '8px 12px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              color: 'var(--text-primary)',
              border: '1px solid rgba(0,0,0,0.06)',
              fontSize: '0.78rem',
              fontWeight: '800',
              cursor: 'pointer'
            }}>
              <UtensilsCrossed size={15} color="var(--primary)" />
              <span>Mis Alimentos</span>
            </button>
          </Link>

          <button 
            onClick={logout} 
            style={{ 
              fontSize: '0.78rem', 
              opacity: 0.65, 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer',
              fontWeight: '750',
              padding: '6px 8px'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* ── SECCIÓN: MIS PACIENTES ── */}
      <section style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
              Mis Pacientes
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', opacity: 0.65 }}>
              Gestión de expedientes clínicos y seguimiento profesional
            </p>
          </div>

          {/* Selector de Vista (Fichas vs Directorio) */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(29, 81, 45, 0.08)',
            padding: '3px',
            borderRadius: '12px',
            gap: '3px'
          }}>
            <button
              onClick={() => setActiveView('fichas')}
              style={{
                border: 'none',
                background: activeView === 'fichas' ? '#FFFFFF' : 'transparent',
                color: activeView === 'fichas' ? 'var(--text-primary)' : 'rgba(29, 81, 45, 0.65)',
                fontWeight: activeView === 'fichas' ? '850' : '650',
                fontSize: '0.74rem',
                padding: '6px 12px',
                borderRadius: '9px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: activeView === 'fichas' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <Users size={14} /> Fichas
            </button>
            <button
              onClick={() => setActiveView('directorio')}
              style={{
                border: 'none',
                background: activeView === 'directorio' ? '#FFFFFF' : 'transparent',
                color: activeView === 'directorio' ? 'var(--text-primary)' : 'rgba(29, 81, 45, 0.65)',
                fontWeight: activeView === 'directorio' ? '850' : '650',
                fontSize: '0.74rem',
                padding: '6px 12px',
                borderRadius: '9px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: activeView === 'directorio' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <FileText size={14} /> Directorio
            </button>
          </div>
        </div>

        {/* ── DOS ACCIONES PRINCIPALES (TARJETAS CON DESCRIPCIÓN) ── */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '14px', 
          marginBottom: '22px' 
        }}>
          {/* Botón 1: Registrar paciente */}
          <Link href="/nutri/new-patient" style={{ textDecoration: 'none' }}>
            <div className="glass-panel" style={{
              background: '#FFFFFF',
              border: '1.5px solid rgba(29, 81, 45, 0.15)',
              borderRadius: '18px',
              padding: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              cursor: 'pointer',
              height: '100%'
            }}>
              <div style={{
                background: 'rgba(29, 81, 45, 0.08)',
                color: 'var(--primary)',
                padding: '12px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <UserPlus size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                    Registrar paciente
                  </h3>
                  <ChevronRight size={16} color="var(--primary)" opacity={0.6} />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#4B5563', lineHeight: '1.35' }}>
                  Crea un expediente con los datos básicos directamente desde tu panel.
                </p>
              </div>
            </div>
          </Link>

          {/* Botón 2: Invitar paciente a registrarse */}
          <Link href="/nutri/new-patient?mode=invitar" style={{ textDecoration: 'none' }}>
            <div className="glass-panel" style={{
              background: '#FFFFFF',
              border: '1.5px solid rgba(253, 158, 20, 0.25)',
              borderRadius: '18px',
              padding: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              cursor: 'pointer',
              height: '100%'
            }}>
              <div style={{
                background: 'rgba(253, 158, 20, 0.12)',
                color: '#D97706',
                padding: '12px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Send size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>
                    Invitar paciente a registrarse
                  </h3>
                  <ChevronRight size={16} color="#D97706" opacity={0.6} />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#4B5563', lineHeight: '1.35' }}>
                  Envía un enlace para que el paciente complete sus propios datos.
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* ── INDICADOR / SECCIÓN: REGISTROS NUEVOS PENDIENTES DE REVISIÓN ── */}
        {pendingReviewPatients.length > 0 ? (
          <div className="glass-panel" style={{
            background: 'rgba(253, 158, 20, 0.08)',
            border: '1px solid rgba(253, 158, 20, 0.3)',
            borderRadius: '18px',
            padding: '16px',
            marginBottom: '22px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#D97706" />
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#92400E' }}>
                  Registros nuevos pendientes de revisión ({pendingReviewPatients.length})
                </h4>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: '800', background: '#D97706', color: '#FFFFFF', padding: '2px 8px', borderRadius: '999px' }}>
                Atención requerida
              </span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: '#78350F' }}>
              Pacientes con datos autorreportados o registros recientes pendientes de validación profesional.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingReviewPatients.slice(0, 3).map(p => (
                <div key={p.id} style={{
                  background: '#FFFFFF',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <span style={{ fontWeight: '850', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: '0.72rem', opacity: 0.65, marginLeft: '8px' }}>
                      C.I: {p.details?.ci || 'N/A'}
                    </span>
                  </div>
                  <Link href={`/nutri/patient/${p.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{
                      background: 'rgba(29, 81, 45, 0.08)',
                      border: 'none',
                      color: 'var(--primary)',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: '850',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <FolderOpen size={13} /> Revisar expediente
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(29, 81, 45, 0.03)',
            border: '1px dashed rgba(29, 81, 45, 0.15)',
            borderRadius: '14px',
            padding: '10px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="var(--primary)" opacity={0.7} />
            <span style={{ fontSize: '0.76rem', fontWeight: '750', color: 'var(--primary)', opacity: 0.8 }}>
              Expedientes al día · Sin registros pendientes de revisión clínica
            </span>
          </div>
        )}

        {/* ── BUSCADOR Y FILTROS POR ESTADO ── */}
        <div style={{ marginBottom: '18px' }}>
          {/* Buscador */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input 
              type="text" 
              placeholder="Buscar por Nombre, Cédula o Correo..." 
              className="input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '44px', marginBottom: 0, borderRadius: '14px', height: '44px' }}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filtros Segmentados */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'todos', label: 'Todos', count: patients.length },
              { id: 'activos', label: 'Activos', count: patients.filter(p => p.status === 'Activo' || !p.status).length },
              { id: 'pendientes', label: 'Pendientes de revisión', count: pendingReviewPatients.length },
              { id: 'incompletos', label: 'Incompletos', count: patients.filter(p => !checkOnboardingComplete(p)).length }
            ].map(f => {
              const isSelected = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid rgba(0,0,0,0.08)',
                    background: isSelected ? 'var(--primary)' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                    fontWeight: isSelected ? '850' : '650',
                    fontSize: '0.72rem',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{f.label}</span>
                  <span style={{
                    background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                    color: isSelected ? '#FFFFFF' : '#4B5563',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontSize: '0.64rem',
                    fontWeight: '800'
                  }}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </section>

      {/* ── LISTADO DE PACIENTES ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
            <Activity className="spin" size={40} style={{ margin: '0 auto 16px', color: 'var(--accent)' }} />
            <p style={{ fontWeight: '700' }}>Cargando pacientes...</p>
          </div>
        ) : activeView === 'directorio' ? (
          /* ── VISTA DIRECTORIO (CONTACTOS Y METADATOS) ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredPatients.map(p => {
              const isComplete = checkOnboardingComplete(p);
              const isPending = checkPendingReview(p);

              return (
                <div key={p.id} className="glass-panel" style={{ 
                  background: 'white', 
                  borderRadius: '16px', 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px', 
                  border: '1px solid rgba(0,0,0,0.06)' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                        {p.name}
                      </h4>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '2px' }}>
                        C.I: {p.details?.ci || 'N/A'}
                      </div>
                    </div>
                    <button 
                      onClick={() => setEditPatient({ id: p.id, name: p.name, ci: p.details?.ci || '', email: p.details?.email || '', phone: p.details?.phone || '' })} 
                      style={{ 
                        background: 'rgba(0,0,0,0.04)', 
                        border: 'none', 
                        padding: '6px 10px', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        fontSize: '0.74rem', 
                        fontWeight: '800',
                        color: '#4B5563'
                      }}
                    >
                      <Edit2 size={13} /> Editar
                    </button>
                  </div>
                  
                  {/* Fila de 3 Estados Claramente Separados */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.68rem' }}>
                    <span style={{
                      background: 'rgba(29, 81, 45, 0.08)',
                      color: 'var(--primary)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: '800'
                    }}>
                      Estado: {p.status || 'Activo'}
                    </span>
                    <span style={{
                      background: isComplete ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: isComplete ? '#047857' : '#B45309',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: '800'
                    }}>
                      Onboarding: {isComplete ? 'Completo' : 'Incompleto'}
                    </span>
                    <span style={{
                      background: isPending ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0,0,0,0.04)',
                      color: isPending ? '#B91C1C' : '#6B7280',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: '800'
                    }}>
                      Revisión: {isPending ? 'Pendiente' : 'Al día'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem' }}>
                    <div style={{ flex: '1 1 150px' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: '800', opacity: 0.5, marginBottom: '2px' }}>CONTACTO</div>
                      <div style={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>{p.details?.email || '-'}</div>
                      <div style={{ fontSize: '0.8rem' }}>{p.details?.phone || '-'}</div>
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: '800', opacity: 0.5, marginBottom: '2px' }}>REGISTRO</div>
                      <div style={{ fontSize: '0.8rem' }}>{new Date(p.created_at || Date.now()).toLocaleDateString('es-ES')}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredPatients.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', opacity: 0.5, background: 'white', borderRadius: '16px' }}>
                No hay pacientes con el filtro seleccionado.
              </div>
            )}
          </div>
        ) : filteredPatients.length === 0 ? (
          /* ── ESTADO VACÍO ── */
          <div style={{ 
            padding: '36px 20px', 
            textAlign: 'center', 
            background: '#FFFFFF', 
            borderRadius: '18px',
            border: '1px dashed rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: 0, fontWeight: '850', fontSize: '0.92rem', color: '#6B7280' }}>
              No se encontraron pacientes
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.74rem', opacity: 0.6 }}>
              {searchTerm ? 'Prueba con otro término de búsqueda o limpia los filtros.' : 'Comienza registrando tu primer paciente desde los botones superiores.'}
            </p>
          </div>
        ) : (
          /* ── VISTA FICHAS (TARJETAS MOBILE-FIRST REDISEÑADAS) ── */
          filteredPatients.map((p) => {
            const anomalyCount = getDietaryAnomalyCount(p.id);
            const isComplete = checkOnboardingComplete(p);
            const isPending = checkPendingReview(p);

            return (
              <div key={p.id} className="fade-in glass-panel" style={{ 
                padding: '16px', 
                borderRadius: '18px', 
                background: '#FFFFFF',
                boxShadow: 'var(--shadow-subtle)',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Fila 1: Avatar, Identificación y 3 Estados Claramente Separados */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '50%', 
                      background: 'var(--bg-primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: '850', 
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      border: '1.5px solid rgba(29, 81, 45, 0.15)',
                      flexShrink: 0
                    }}>
                      {(p.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '850', margin: 0, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                        {p.name}
                      </h4>
                      <p style={{ fontSize: '0.74rem', opacity: 0.65, margin: '2px 0 0' }}>
                        C.I: {p.details?.ci || 'N/A'} {p.details?.phone ? `· ${p.details.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Badges de 3 Dimensiones (Separadas explícitamente) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                    {/* 1. Estado administrativo */}
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '5px',
                      background: 'rgba(29, 81, 45, 0.08)',
                      color: 'var(--primary)'
                    }}>
                      Admin: {p.status || 'Activo'}
                    </span>
                    {/* 2. Progreso de Onboarding */}
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '5px',
                      background: isComplete ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: isComplete ? '#047857' : '#B45309'
                    }}>
                      Onboarding: {isComplete ? 'Completo' : 'Incompleto'}
                    </span>
                    {/* 3. Revisión clínica */}
                    {isPending && (
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: '850',
                        padding: '2px 6px',
                        borderRadius: '5px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#B91C1C'
                      }}>
                        Revisión: Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Fila 2: Alerta de anomalías si aplica */}
                {anomalyCount > 5 && (
                  <div style={{ 
                    background: '#FFF8E1', 
                    color: '#FF6F00', 
                    border: '1px solid #FFE082',
                    borderRadius: '8px', 
                    fontSize: '0.68rem', 
                    fontWeight: '850', 
                    padding: '4px 8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ⚠️ Desviación del plan ({anomalyCount} consumos ocasionales en 7d)
                  </div>
                )}

                {/* Fila 3: Acciones Visibles con «Abrir expediente» prominente */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(0,0,0,0.04)',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  {/* Botón Principal: Abrir expediente con texto explícito */}
                  <Link href={`/nutri/patient/${p.id}`} style={{ textDecoration: 'none', flex: 1, minWidth: '150px' }}>
                    <button style={{
                      width: '100%',
                      background: 'var(--primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '9px 14px',
                      borderRadius: '11px',
                      fontSize: '0.8rem',
                      fontWeight: '850',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(29, 81, 45, 0.2)'
                    }}>
                      <FolderOpen size={15} />
                      <span>Abrir expediente</span>
                    </button>
                  </Link>

                  {/* Acciones Secundarias Agrupadas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {p.details?.phone && (
                      <a 
                        href={`https://wa.me/${p.details.phone.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ textDecoration: 'none' }}
                        title="Enviar WhatsApp"
                      >
                        <div style={{ 
                          background: '#E8F5E9', 
                          color: '#2E7D32', 
                          padding: '8px', 
                          borderRadius: '10px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <MessageCircle size={17} />
                        </div>
                      </a>
                    )}

                    <Link href={`/nutri/patient/${p.id}/menu`} style={{ textDecoration: 'none' }} title="Plan nutricional">
                      <div style={{ 
                        background: 'rgba(29, 81, 45, 0.08)', 
                        color: 'var(--primary)', 
                        padding: '8px', 
                        borderRadius: '10px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Activity size={17} />
                      </div>
                    </Link>

                    <button 
                      onClick={() => setEditPatient({ id: p.id, name: p.name, ci: p.details?.ci || '', email: p.details?.email || '', phone: p.details?.phone || '' })}
                      style={{ 
                        background: 'rgba(0,0,0,0.04)', 
                        color: '#4B5563', 
                        padding: '8px', 
                        borderRadius: '10px', 
                        border: 'none', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                      title="Editar contacto"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button 
                      onClick={() => {
                        showConfirm('¿Eliminar paciente?', `¿Seguro que deseas eliminar a ${p.name}? Esta acción no se puede deshacer.`, async () => {
                          const success = await deletePatient(p.id);
                          if (success) {
                            setPatients(patients.filter(pat => pat.id !== p.id));
                            showToast('Paciente eliminado');
                          } else {
                            showToast('Error al eliminar');
                          }
                        });
                      }}
                      style={{ 
                        background: '#FFEBEE', 
                        color: '#C62828', 
                        padding: '8px', 
                        borderRadius: '10px', 
                        border: 'none', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                      title="Eliminar paciente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── MODAL: EDITAR CONTACTO (PRESERVADO INTACTO) ── */}
      {editPatient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '24px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)' }}>Editar Contacto</h3>
              <button onClick={() => setEditPatient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#666" />
              </button>
            </div>
            
            <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>NOMBRE</label>
                <input required type="text" className="input-field" value={editPatient.name} onChange={e => setEditPatient({...editPatient, name: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>CÉDULA</label>
                <input required type="text" className="input-field" value={editPatient.ci} onChange={e => setEditPatient({...editPatient, ci: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>CORREO</label>
                <input type="email" className="input-field" value={editPatient.email} onChange={e => setEditPatient({...editPatient, email: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', opacity: 0.6 }}>TELÉFONO</label>
                <input type="tel" className="input-field" value={editPatient.phone} onChange={e => setEditPatient({...editPatient, phone: e.target.value})} />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '8px', width: '100%', padding: '12px', borderRadius: '12px' }}>
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
