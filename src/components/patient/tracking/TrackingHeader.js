'use client';
import React from 'react';
import { LayoutDashboard, TrendingUp, Target } from 'lucide-react';

export default function TrackingHeader({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'overview', label: 'Inicio', icon: LayoutDashboard },
    { id: 'progress', label: 'Mi progreso', icon: TrendingUp },
    { id: 'goals', label: 'Mis objetivos', icon: Target },
  ];

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Título de la sección */}
      <div style={{ marginBottom: '14px' }}>
        <h1 style={{
          fontSize: '1.45rem',
          fontWeight: '900',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: 0,
          lineHeight: 1.2
        }}>
          Seguimiento y Adherencia
        </h1>
        <p style={{
          fontSize: '0.78rem',
          color: 'var(--text-primary)',
          opacity: 0.65,
          marginTop: '3px',
          marginBottom: 0
        }}>
          Monitorización clínica y metas personalizadas
        </p>
      </div>

      {/* Control segmentado táctil mobile-first */}
      <div
        role="tablist"
        aria-label="Vistas de seguimiento"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px',
          background: 'rgba(29, 81, 45, 0.08)',
          padding: '4px',
          borderRadius: '14px',
          position: 'relative'
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 6px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'rgba(29, 81, 45, 0.6)',
                fontWeight: isActive ? '850' : '650',
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none',
                minHeight: '38px',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
