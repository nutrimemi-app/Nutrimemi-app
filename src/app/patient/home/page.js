'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

import { Activity, Calendar, ChefHat, Droplets, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import { usePatientByEmail } from '@/hooks/usePatient';
import { calculateClinicalData } from '@/utils/calculationUtils';
import { getAnthropometricIconSrc } from '@/utils/anthropometricIcon';

function PieChart({ cho, prot, fat, total }) {
  const size = 140;
  const r = 52;
  const cx = size / 2;
  const cy = size / 2;

  const segments = [
    { value: cho * 4,  color: '#FFA500', label: 'CHO' },
    { value: prot * 4, color: '#EF5350', label: 'PROT' },
    { value: fat * 9,  color: '#CBBC1E', label: 'LÍP' },
  ];

  const sum = segments.reduce((a, s) => a + s.value, 0) || 1;
  let cumulative = 0;

  const paths = segments.map(seg => {
    const pct = seg.value / sum;
    const start = cumulative;
    cumulative += pct;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle   = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = pct > 0.5 ? 1 : 0;
    return { ...seg, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <svg width={size} height={size}>
        {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
        <circle cx={cx} cy={cy} r={r * 0.5} fill="var(--card-green)" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="10" fontWeight="900">
          {total.toFixed(0)}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="white" fontSize="8" opacity="0.8">kcal</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[
          { label: 'CHO',  val: cho,  unit: 'g', color: '#FFA500', kcal: cho * 4 },
          { label: 'PROT', val: prot, unit: 'g', color: '#EF5350', kcal: prot * 4 },
          { label: 'LÍP',  val: fat,  unit: 'g', color: '#CBBC1E', kcal: fat * 9 },
        ].map(m => (
          <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.color }} />
            <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#333' }}>{m.label}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#333' }}>{m.val.toFixed(0)}{m.unit}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.6, color: '#333' }}>{m.kcal.toFixed(0)} kcal</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PatientHome() {
  const { user } = useAuth();
  const { patient: data, status } = usePatientByEmail(user?.email);
  const [nextApp, setNextApp] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [glasses, setGlasses] = useState(0);

  const hydrKey = `hydration_${data?.id}_${new Date().toISOString().split('T')[0]}`;

  useEffect(() => {
    if (data?.id) {
      const g = parseInt(localStorage.getItem(hydrKey) || '0');
      setGlasses(g);
    }
  }, [data?.id, hydrKey]);

  useEffect(() => {
    if (data) {
      // Próxima cita
      const apps = JSON.parse(localStorage.getItem('nutri_appointments') || '[]');
      const next = apps
        .filter(a => a.patientId == data.id && new Date(a.date) >= new Date(new Date().setHours(0,0,0,0)))
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      setNextApp(next || null);
      // Log de hoy
      const today = new Date().toISOString().split('T')[0];
      const logs = JSON.parse(localStorage.getItem(`daily_log_${data.id}`) || '[]');
      const todayEntry = logs.find(l => l.date === today);
      setTodayLog(todayEntry || null);
    }
  }, [data]);

  if (status === 'loading') return <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>Cargando tus datos...</div>;
  if (status === 'not-found') return <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>No se encontró tu perfil.</div>;
  if (status === 'error') return <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>Error cargando tus datos.</div>;
  if (!data) return null;

  // Macros del plan
  const rct  = parseFloat(data?.formulas?.kcal || data?.dietForm?.rct || 1700);
  const protG = parseFloat(data?.formulas?.prot || 0);
  const choG  = parseFloat(data?.formulas?.cho  || 0);
  const fatG  = parseFloat(data?.formulas?.fat  || 0);

  // Macros consumidos hoy
  const todayCho  = todayLog?.totalCho  || 0;
  const todayProt = todayLog?.totalProt || 0;
  const todayFat  = todayLog?.totalFat  || 0;
  const todayKcal = todayLog?.totalKcal || 0;

  const pct = rct > 0 ? Math.min(100, (todayKcal / rct) * 100) : 0;

  const imc = (() => {
    if (!data?.details) return null;
    const w = parseFloat(data.details.weight);
    const h = parseFloat(data.details.height) / 100;
    if (!w || !h) return null;
    return (w / (h * h)).toFixed(1);
  })();

  // Consumo hídrico hoy


  const addGlass = () => {
    const next = glasses + 1;
    setGlasses(next);
    localStorage.setItem(hydrKey, next.toString());
  };

  const renderCountdown = () => {
    if (!nextApp) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
          <Calendar size={16} />
          <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Sin citas programadas</span>
        </div>
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appDate = new Date(nextApp.date);
    // Para compensar la zona horaria al parsear YYYY-MM-DD
    appDate.setMinutes(appDate.getMinutes() + appDate.getTimezoneOffset());
    
    const diffTime = Math.abs(appDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return (
        <div style={{ background: '#FFEBEE', color: '#B71C1C', padding: '6px 12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', display: 'inline-flex' }}>
          <Clock size={16} />
          <span style={{ fontSize: '0.8rem', fontWeight: '900' }}>¡Tu cita es Hoy a las {nextApp.time}!</span>
        </div>
      );
    }
    
    return (
      <div style={{ background: 'rgba(203,188,30,0.1)', color: 'var(--accent)', padding: '6px 12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', display: 'inline-flex' }}>
        <Calendar size={16} />
        <span style={{ fontSize: '0.8rem', fontWeight: '900' }}>Faltan {diffDays} {diffDays === 1 ? 'día' : 'días'} para tu control</span>
      </div>
    );
  };

  const getClinicalProfile = () => {
    if (!data?.details?.weight || !data?.details?.height) return null;
    const clinical = calculateClinicalData(
      parseFloat(data.details.weight),
      parseFloat(data.details.height) / 100,
      parseFloat(data.details.waist || 0),
      parseFloat(data.details.hip || 0),
      parseFloat(data.details.neck || 0),
      data.details.gender,
      data.details.age
    );
    return clinical;
  };

  const clinicalData = getClinicalProfile();
  const avatarSrc = clinicalData ? getAnthropometricIconSrc(data?.details?.gender, clinicalData.profile) : null;

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }} className="fade-in">
      {/* HEADER */}
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ opacity: 0.55, fontSize: '0.85rem', fontWeight: '700' }}>Bienvenido de nuevo,</p>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: '900', marginBottom: '8px' }}>
            {data?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Paciente'}
          </h2>
          {renderCountdown()}
        </div>
        <img src="/logo.png" alt="Logo" style={{ height: '96px', opacity: 0.9, objectFit: 'contain', margin: '-10px 0' }} />
      </header>

      {/* META DIARIA + AVATAR + ESTADO FÍSICO */}
      <section className="glass-panel" style={{
        background: data?.details?.gender === 'female' ? '#FFF0F5' : '#E6F2FF',
        color: '#333',
        padding: '24px', marginBottom: '16px', borderRadius: '24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
          
          <div style={{ flex: '1 1 200px' }}>
            <p style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: '800', letterSpacing: '1px', color: 'var(--card-green)' }}>TU META DIARIA</p>
            <p style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: 1, marginBottom: '16px', color: 'var(--text-primary)' }}>{rct.toFixed(0)} <span style={{ fontSize: '1rem' }}>Kcal</span></p>

            {/* Gráfica de torta de macros del plan */}
            {(protG > 0 || choG > 0 || fatG > 0) ? (
              <PieChart cho={choG} prot={protG} fat={fatG} total={rct} />
            ) : (
              <p style={{ fontSize: '0.8rem', opacity: 0.6, padding: '10px 0' }}>
                Fórmula no cargada.
              </p>
            )}

            {/* Barra de progreso de kcal consumidas hoy */}
            {todayKcal > 0 && (
              <div style={{ marginTop: '16px', maxWidth: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: '700' }}>Consumido</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: '700' }}>{todayKcal.toFixed(0)} / {rct.toFixed(0)}</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct > 90 ? '#EF5350' : 'var(--accent)', borderRadius: '10px', transition: 'width 0.5s' }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ width: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {avatarSrc && <img src={avatarSrc} alt="Avatar" style={{ width: '100%', objectFit: 'contain' }} />}
          </div>

        </div>

        {/* ESTADO FÍSICO */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '16px', marginTop: '8px' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: '900', opacity: 0.5, letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' }}>PROGRESO DE MEDIDAS</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', gap: '8px' }}>
            {[
              { label: 'Peso', value: data?.details?.weight ? `${data.details.weight} kg` : '--' },
              { label: 'IMC', value: imc || '--' },
              { label: 'M. Magra', value: clinicalData?.muscleMass ? `${clinicalData.muscleMass.toFixed(1)} kg` : '--' },
            ].map(i => (
              <div key={i.label} style={{ background: 'rgba(255,255,255,0.6)', padding: '10px 4px', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: '800' }}>{i.label}</p>
                <p style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)' }}>{i.value}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* CONSUMO HÍDRICO RÁPIDO */}
      <section className="glass-panel" style={{ padding: '18px', marginBottom: '16px', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Droplets size={20} color="#1E90FF" />
            <div>
              <p style={{ fontWeight: '900', fontSize: '0.9rem' }}>Consumo Hídrico</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{glasses} vasos · {(glasses * 0.24).toFixed(2)} L hoy</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < glasses ? '#1E90FF' : 'rgba(0,0,0,0.1)' }} />
            ))}
            <button onClick={addGlass} style={{
              marginLeft: '6px', background: '#E3F2FD', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', cursor: 'pointer', fontWeight: '900', color: '#0D47A1', fontSize: '1.2rem'
            }}>+</button>
          </div>
        </div>
      </section>

      {/* ATAJOS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[
          { href: '/patient/menu',      icon: ChefHat,    title: 'Ver mi plan nutricional', sub: 'Menú ejemplo y seguimiento', color: 'var(--card-green)', textColor: 'white' },
          { href: '/patient/daily-log', icon: Activity,   title: 'Registrar lo que comí',   sub: 'Comidas del día de hoy',     color: 'var(--action)',    textColor: 'white' },
          { href: '/patient/evolution', icon: TrendingUp, title: 'Mi Evolución',            sub: 'Pesos, tallas e historial',  color: 'white',            textColor: 'var(--text-primary)' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div className="glass-panel" style={{
                padding: '16px 20px', background: item.color, borderRadius: '20px',
                display: 'flex', alignItems: 'center', gap: '16px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
              }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={item.textColor} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '900', color: item.textColor, fontSize: '0.95rem' }}>{item.title}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.7, color: item.textColor }}>{item.sub}</p>
                </div>
                <span style={{ color: item.textColor, opacity: 0.4, fontSize: '1.2rem' }}>›</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* PRÓXIMA CITA - Removida porque se pasó arriba */}


    </div>
  );
}
