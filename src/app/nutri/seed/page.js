'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SeedPage() {
  const [status, setStatus] = useState('Creando paciente Maximiliano Prueba...');
  const router = useRouter();

  useEffect(() => {
    async function seed() {
      const patient = {
        name: 'Maximiliano Prueba',
        email: 'maxi@test.com',
        status: 'Activo',
        goal: 'Aumento de Masa Muscular',
        birth_date: '1995-05-15',
        gender: 'male',
        ci: '12345678',
        phone: '04141234567',
        weight: 78.5,
        height: 178,
        meal_plan: '4+1 snacks',
        clinical_history: 'Ninguna',
        measurements: {
          "CUELLO": 38,
          "BRAZO": 36,
          "TORSO": 102,
          "CINTURA": 82,
          "CADERA": 98,
          "GLÚTEOS": 100,
          "MUSLO": 56,
          "PANTORRILLA": 38,
          "weight": 78.5
        },
        menu: {
          dietForm: { rct: 2400, pctProt: 25, pctCho: 50, pctLip: 25 },
          formulas: { kcal: 2400, prot: 150, cho: 300, fat: 66.6 }
        }
      };

      const { data: pData, error: pErr } = await supabase.from('patients').insert([patient]).select().single();
      if (pErr) {
        setStatus("Error creando paciente: " + pErr.message);
        return;
      }
      const pid = pData.id;

      const hist1 = { id: Date.now() - 3000000, date: '2023-05-01', measurements: { weight: 75.0, CINTURA: 85, BRAZO: 34 }, profile: "NORMOPESO", imc: "23.6", dietForm: { rct: 2200 } };
      const hist2 = { id: Date.now() - 2000000, date: '2023-06-01', measurements: { weight: 76.5, CINTURA: 84, BRAZO: 35 }, profile: "NORMOPESO", imc: "24.1", dietForm: { rct: 2300 } };
      const hist3 = { id: Date.now() - 1000000, date: '2023-07-01', measurements: { weight: 77.8, CINTURA: 83, BRAZO: 35.5 }, profile: "NORMOPESO", imc: "24.5", dietForm: { rct: 2400 } };

      await supabase.from('patient_history_entries').insert([{ patient_id: pid, entry: hist1 }, { patient_id: pid, entry: hist2 }, { patient_id: pid, entry: hist3 }]).catch(e => {
         // Si la tabla no existe
         localStorage.setItem(`patient_history_${pid}`, JSON.stringify([hist1, hist2, hist3]));
      });

      setStatus('¡Paciente Maximiliano Prueba creado con éxito! Redirigiendo...');
      setTimeout(() => {
        router.push(`/nutri/patient/${pid}`);
      }, 2000);
    }
    seed();
  }, [router]);

  return <div style={{ padding: '50px', textAlign: 'center' }}><h2>{status}</h2></div>;
}
