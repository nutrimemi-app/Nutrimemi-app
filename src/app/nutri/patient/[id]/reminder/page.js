'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, Printer, Award } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { loadFoods } from '@/data/defaultFoods';
import { getPatientById } from '@/lib/patients';
import R24H from '@/components/R24H';

export default function Recordatorio24H() {
  const params = useParams();
  const router = useRouter();
  const { showToast, showConfirm } = useUI();
  
  const [patient, setPatient] = useState(null);
  const [foods, setFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMeal, setActiveMeal] = useState('Desayuno');
  const [r24hNotes, setR24hNotes] = useState('');
  
  // Estructura del Recordatorio 24 Horas
  const [reminder, setReminder] = useState({
    Desayuno: [],
    'Merienda AM': [],
    Almuerzo: [],
    'Merienda PM': [],
    Cena: [],
    'Colación Nocturna': []
  });

  const meals = ['Desayuno', 'Merienda AM', 'Almuerzo', 'Merienda PM', 'Cena', 'Colación Nocturna'];

  // Equivalentes de macros por grupo de intercambio
  const groupMacros = {
    cereales: { kcal: 70, cho: 15, prot: 2, fat: 0 },
    proteinas: { kcal: 55, cho: 0, prot: 7, fat: 3 },
    vegetales: { kcal: 25, cho: 5, prot: 2, fat: 0 },
    frutas: { kcal: 60, cho: 15, prot: 0, fat: 0 },
    lacteos: { kcal: 100, cho: 12, prot: 8, fat: 2 },
    grasas: { kcal: 45, cho: 0, prot: 0, fat: 5 }
  };

  useEffect(() => {
    const loadPatient = async () => {
      const found = await getPatientById(params.id);
      if (found) {
        setPatient(found);
        // Cargar recordatorio anterior si existe
      const savedReminder = localStorage.getItem(`r24h_${found.id}`);
      if (savedReminder) {
        setReminder(JSON.parse(savedReminder));
      }
      const savedNotes = localStorage.getItem(`r24h_notes_${found.id}`);
      if (savedNotes) {
        setR24hNotes(savedNotes);
      }
    }
    };
    loadPatient();
    // Cargar alimentos disponibles
    setFoods(loadFoods());
  }, [params.id]);

  if (!patient) return <div style={{ padding: '20px' }}>Cargando paciente...</div>;

  const handleAddFood = (mealName, food) => {
    const defaultMac = groupMacros[food.groupKey] || { kcal: 0, cho: 0, prot: 0, fat: 0 };
    const newEntry = {
      id: 'e_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      foodId: food.id,
      name: food.name,
      portion: food.portion,
      groupKey: food.groupKey,
      portionsQty: 1, // Por defecto 1 porción
      kcal: defaultMac.kcal,
      cho: defaultMac.cho,
      prot: defaultMac.prot,
      fat: defaultMac.fat
    };

    setReminder(prev => ({
      ...prev,
      [mealName]: [...prev[mealName], newEntry]
    }));
    showToast(`${food.name} agregado a ${mealName}`, 'success');
  };

  const handleQuantityChange = (mealName, entryId, qty) => {
    const parsedQty = parseFloat(qty) || 0;
    setReminder(prev => {
      const updatedList = prev[mealName].map(entry => {
        if (entry.id === entryId) {
          const defaultMac = groupMacros[entry.groupKey] || { kcal: 0, cho: 0, prot: 0, fat: 0 };
          return {
            ...entry,
            portionsQty: parsedQty,
            kcal: defaultMac.kcal * parsedQty,
            cho: defaultMac.cho * parsedQty,
            prot: defaultMac.prot * parsedQty,
            fat: defaultMac.fat * parsedQty
          };
        }
        return entry;
      });
      return { ...prev, [mealName]: updatedList };
    });
  };

  const handleRemoveEntry = (mealName, entryId) => {
    setReminder(prev => ({
      ...prev,
      [mealName]: prev[mealName].filter(entry => entry.id !== entryId)
    }));
    showToast('Alimento removido', 'info');
  };

  // Totales
  const calculateTotals = () => {
    let kcal = 0, cho = 0, prot = 0, fat = 0;
    Object.values(reminder).forEach(mealEntries => {
      mealEntries.forEach(e => {
        kcal += e.kcal;
        cho += e.cho;
        prot += e.prot;
        fat += e.fat;
      });
    });
    return { kcal, cho, prot, fat };
  };

  const totals = calculateTotals();
  const targetKcal = parseFloat(patient.dietForm?.rct || 1700);

  const saveReminder = () => {
    localStorage.setItem(`r24h_${patient.id}`, JSON.stringify(reminder));
    localStorage.setItem(`r24h_notes_${patient.id}`, r24hNotes);
    
    // Guardar en el historial del paciente también para registrar la evaluación nutricional
    const savedPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const updatedPatients = savedPatients.map(p => {
      if (p.id === patient.id) {
        return {
          ...p,
          r24hTotals: totals,
          lastReminderDate: new Date().toISOString().split('T')[0]
        };
      }
      return p;
    });
    localStorage.setItem('nutri_patients', JSON.stringify(updatedPatients));
    showToast('¡Recordatorio 24 horas guardado con éxito!', 'success');
  };

  // Filtrado de alimentos para la búsqueda
  const filteredFoods = foods.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5); // Mostrar máximo 5 sugerencias rápidas

  return (
    <div style={{ padding: '20px', paddingBottom: '120px' }} className="fade-in">
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href={`/nutri/patient/${patient.id}`} style={{ color: 'var(--text-primary)' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-primary)' }}>Recordatorio 24h</h2>
          <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Evaluación dietética de {patient.name}</p>
        </div>
      </header>

      <R24H 
        reminder={reminder} 
        setReminder={setReminder} 
        r24hNotes={r24hNotes} 
        setR24hNotes={setR24hNotes} 
        targetKcal={targetKcal} 
      />

      {/* Botones de Guardar y Cerrar fijos en el footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(15px)',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        gap: '12px',
        zIndex: 100
      }}>
        <button 
          onClick={() => {
            saveReminder();
            router.push(`/nutri/patient/${patient.id}`);
          }}
          className="btn-accent" 
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '16px', fontWeight: '900' }}
        >
          <Save size={18} /> Guardar R24H
        </button>
      </div>

    </div>
  );
}
