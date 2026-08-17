import { useState, useEffect } from 'react';
import { getPatientById, getPatientByEmail } from '@/lib/patients';

export function usePatient(id) {
  const [patient, setPatient] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | not-found

  useEffect(() => {
    let active = true;
    if (!id) {
      setStatus('not-found');
      return;
    }

    setStatus('loading');
    getPatientById(id)
      .then(found => {
        if (!active) return;
        if (found) {
          setPatient(found);
          setStatus('ready');
        } else {
          setStatus('not-found');
        }
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [id]);

  return { patient, setPatient, status, setStatus };
}

export function usePatientByEmail(email) {
  const [patient, setPatient] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | not-found

  useEffect(() => {
    let active = true;
    if (!email) {
      setStatus('not-found');
      return;
    }

    setStatus('loading');
    
    if (email === 'paciente') {
      const mockPatient = {
        id: 'test-patient-id',
        name: 'Paciente de Prueba',
        email: 'paciente',
        details: { gender: 'female', weight: 65, height: 165 },
        formulas: { kcal: 1800, prot: 100, cho: 180, fat: 75 },
        dietForm: {},
        measurements: {},
        menu: {
          desayuno: {
            portions: { cereales: 2, proteinas: 1, frutas: 1 },
            selectedFoods: [
              { id: '1', name: '[DÍA 1] Pan integral tostado', qty: 2, unit: 'rebanadas', groupKey: 'cereales' },
              { id: '2', name: '[DÍA 1] Huevo revuelto', qty: 1, unit: 'unidad', groupKey: 'proteinas' },
              { id: '3', name: '[DÍA 2] Avena en hojuelas', qty: '1/3', unit: 'taza', groupKey: 'cereales' },
              { id: '4', name: '[DÍA 2] Manzana picada', qty: 1, unit: 'taza', groupKey: 'frutas' }
            ]
          },
          almuerzo: {
            portions: { cereales: 2, proteinas: 2, vegetales: 2, grasas: 1 },
            selectedFoods: [
              { id: '5', name: '[DÍA 1] Arroz cocido', qty: '2/3', unit: 'taza', groupKey: 'cereales' },
              { id: '6', name: '[DÍA 1] Pechuga a la plancha', qty: 60, unit: 'g', groupKey: 'proteinas' },
              { id: '7', name: '[DÍA 2] Pasta cocida', qty: '2/3', unit: 'taza', groupKey: 'cereales' },
              { id: '8', name: '[DÍA 2] Carne molida magra', qty: 60, unit: 'g', groupKey: 'proteinas' }
            ]
          },
          cena: {
            portions: { cereales: 1, proteinas: 1, vegetales: 1 },
            selectedFoods: [
              { id: '9', name: '[DÍA 1] Arepa asada', qty: '1/2', unit: 'unidad', groupKey: 'cereales' },
              { id: '10', name: '[DÍA 2] Casabe', qty: 1, unit: 'torta pequeña', groupKey: 'cereales' }
            ]
          }
        }
      };
      setPatient(mockPatient);
      setStatus('ready');
      return;
    }

    getPatientByEmail(email)
      .then(found => {
        if (!active) return;
        if (found) {
          setPatient(found);
          setStatus('ready');
        } else {
          setStatus('not-found');
        }
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [email]);

  return { patient, setPatient, status, setStatus };
}
