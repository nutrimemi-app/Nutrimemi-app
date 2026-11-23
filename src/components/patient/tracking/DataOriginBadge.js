'use client';
import React from 'react';
import { ShieldCheck, UserCheck, Smartphone, Clock } from 'lucide-react';

/**
 * DataOriginBadge
 * Distingue explícitamente el origen metodológico de cada métrica o registro:
 * - 'clinical': Medición clínica verificada en consulta por el nutricionista.
 * - 'professional': Objetivo o prescripción fijada por el nutricionista.
 * - 'self_reported': Registro diario anotado por el paciente (local a este dispositivo).
 * - 'pending': Dato no configurado o pendiente de evaluación clínica.
 */
export default function DataOriginBadge({ type, label, style = {} }) {
  const configs = {
    clinical: {
      icon: ShieldCheck,
      text: label || 'Verificado en consulta',
      bg: 'rgba(29, 81, 45, 0.1)',
      color: '#1D512D',
      border: '1px solid rgba(29, 81, 45, 0.25)'
    },
    professional: {
      icon: UserCheck,
      text: label || 'Objetivo profesional',
      bg: 'rgba(203, 188, 30, 0.15)',
      color: '#827717',
      border: '1px solid rgba(203, 188, 30, 0.35)'
    },
    self_reported: {
      icon: Smartphone,
      text: label || 'Autorreportado (Dispositivo local)',
      bg: 'rgba(253, 158, 20, 0.1)',
      color: '#D97706',
      border: '1px solid rgba(253, 158, 20, 0.25)'
    },
    pending: {
      icon: Clock,
      text: label || 'Pendiente de prescripción',
      bg: 'rgba(0, 0, 0, 0.04)',
      color: '#6B7280',
      border: '1px solid rgba(0, 0, 0, 0.08)'
    }
  };

  const current = configs[type] || configs.pending;
  const Icon = current.icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '999px',
        fontSize: '0.65rem',
        fontWeight: '700',
        background: current.bg,
        color: current.color,
        border: current.border,
        lineHeight: 1.2,
        letterSpacing: '0.01em',
        ...style
      }}
    >
      <Icon size={11} strokeWidth={2.4} />
      <span>{current.text}</span>
    </span>
  );
}
