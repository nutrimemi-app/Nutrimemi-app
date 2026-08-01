'use client';
export default function PatientAppLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      maxWidth: '500px',
      margin: '0 auto',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {children}
    </div>
  );
}
