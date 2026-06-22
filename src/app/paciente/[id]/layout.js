'use client';
import React from 'react';

export default function PatientLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundImage: 'url("/NUTRIMEMI%20FONDO.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Overlay to ensure readability if needed, though the image might be enough */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        width: '100%',
        paddingBottom: '40px'
      }}>
        {children}
      </div>
    </div>
  );
}
