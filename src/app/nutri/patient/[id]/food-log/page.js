'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Pizza, Flame } from 'lucide-react';
import { getPatientById } from '@/lib/patients';

export default function PatientFoodLog() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const loadPatient = async () => {
      const found = await getPatientById(params.id);
      if (found) {
        setPatient(found);
        const allLogs = JSON.parse(localStorage.getItem(`daily_log_${found.id}`) || '[]');
        setLogs(allLogs.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    };
    loadPatient();
  }, [params.id]);

  const unusualEntries = logs.flatMap(log =>
    (log.entries || [])
      .filter(e => e.groupKey === 'no_habitual')
      .map(e => ({ ...e, date: log.date }))
  );

  const allEntries = logs.flatMap(log =>
    (log.entries || []).map(e => ({ ...e, date: log.date }))
  );

  if (!patient) return <div style={{ padding: '20px' }}>Cargando...</div>;

  return (
    <div style={{ padding: '20px', paddingBottom: '60px' }} className="fade-in">
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 style={{ fontWeight: '900', fontSize: '1.2rem' }}>Bitácora de Alimentos</h2>
          <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>{patient.name}</p>
        </div>
      </header>

      {/* Resumen de comidas no habituales */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '20px', background: 'var(--card-red)', color: 'white', borderRadius: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Pizza size={22} />
          <h3 style={{ fontWeight: '900', fontSize: '1rem', margin: 0 }}>Comidas no habituales</h3>
        </div>

        {unusualEntries.length === 0 ? (
          <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>El paciente no ha registrado comidas no habituales.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unusualEntries.map((e, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: '900', fontSize: '0.85rem' }}>{e.name}</p>
                  <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    {new Date(e.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} · ×{e.qty} unid.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '900', fontSize: '0.9rem' }}>{(e.kcal * e.qty).toFixed(0)} kcal</p>
                  <p style={{ fontSize: '0.65rem', opacity: 0.8 }}>CH {(e.cho * e.qty).toFixed(0)}g · P {(e.prot * e.qty).toFixed(0)}g · G {(e.fat * e.qty).toFixed(0)}g</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Historial completo por día */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <BookOpen size={20} color="var(--text-primary)" />
          <h3 style={{ fontWeight: '900', fontSize: '1rem' }}>Historial por día</h3>
        </div>

        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>
            <p style={{ fontWeight: '700' }}>El paciente aún no ha registrado ningún alimento.</p>
          </div>
        ) : logs.map(log => (
          <div key={log.date} className="glass-panel" style={{ marginBottom: '12px', background: 'white', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(29,81,45,0.06)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontWeight: '900', fontSize: '0.85rem' }}>
                {new Date(log.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', fontWeight: '800' }}>
                <span style={{ color: 'var(--text-primary)' }}>{(log.totalKcal || 0).toFixed(0)} kcal</span>
                <span style={{ color: '#FFA500' }}>CH {(log.totalCho || 0).toFixed(0)}g</span>
                <span style={{ color: '#EF5350' }}>P {(log.totalProt || 0).toFixed(0)}g</span>
              </div>
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(log.entries || []).map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <span style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {e.groupKey === 'no_habitual' && <span style={{ fontSize: '0.6rem', background: '#FFEBEE', color: '#B71C1C', padding: '1px 5px', borderRadius: '6px', fontWeight: '900' }}>NO HAB.</span>}
                    {e.name}
                    {e.qty > 1 && <span style={{ opacity: 0.5 }}>×{e.qty}</span>}
                  </span>
                  <span style={{ opacity: 0.6, fontWeight: '700' }}>{(e.kcal * e.qty).toFixed(0)} kcal</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
