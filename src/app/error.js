'use client';
export default function Error({ error, reset }) {
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <p>Algo salió mal cargando esta pantalla.</p>
      <button onClick={() => reset()} style={{ padding: '10px 20px', background: 'var(--card-yellow)', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Reintentar</button>
    </div>
  );
}
