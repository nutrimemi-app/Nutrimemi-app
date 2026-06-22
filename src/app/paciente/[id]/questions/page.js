'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function QuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [answers, setAnswers] = useState({
    favFood: '',
    nonFavFood: '',
    mealCount: '',
    physicalActivity: '',
    allergies: ''
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const found = saved.find(p => p.id === parseInt(params.id));
    if (found) {
        setPatient(found);
        if (found.onboardingAnswers) {
            setAnswers(found.onboardingAnswers);
        }
    }
  }, [params.id]);

  const mealOptions = [
    { id: 'a', label: '2 comidas principales' },
    { id: 'b', label: '3 comidas principales' },
    { id: 'c', label: '3 comidas principales + 2 snacks' },
    { id: 'd', label: '3 comidas principales + 3 snacks' },
    { id: 'e', label: '2 comidas principales + 2 snacks' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
    const updated = saved.map(p => {
      if (p.id === parseInt(params.id)) {
        return { ...p, onboardingAnswers: answers };
      }
      return p;
    });
    localStorage.setItem('nutri_patients', JSON.stringify(updated));
    router.push(`/paciente/${params.id}/measurements`);
  };

  return (
    <div style={{ padding: '40px 20px', color: '#1d512d', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '40px' }}>PREGUNTAS</h1>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        <div>
          <p style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '10px' }}>1. Comida favorita</p>
          <textarea 
            required
            className="input-field"
            style={{ minHeight: '80px', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '12px', padding: '15px' }}
            value={answers.favFood}
            onChange={(e) => setAnswers({...answers, favFood: e.target.value})}
            placeholder="Escribe la respuesta aqui..."
          />
        </div>

        <div>
          <p style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '10px' }}>2. Comida y alimento NO favorito</p>
          <textarea 
            required
            className="input-field"
            style={{ minHeight: '80px', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '12px', padding: '15px' }}
            value={answers.nonFavFood}
            onChange={(e) => setAnswers({...answers, nonFavFood: e.target.value})}
            placeholder="Escribe la respuesta aqui..."
          />
        </div>

        <div>
          <p style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '10px' }}>3. Cuantas comidas deseas realizar durante el día</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mealOptions.map(opt => (
              <label key={opt.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                fontSize: '1rem', 
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                <input 
                  type="radio" 
                  name="mealCount" 
                  required
                  checked={answers.mealCount === opt.label}
                  onChange={() => setAnswers({...answers, mealCount: opt.label})}
                  style={{ width: '18px', height: '18px' }}
                />
                {opt.id}. {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '10px' }}>4. Actividad fisica que realizas, cual y cuantas veces al dia?</p>
          <textarea 
            required
            className="input-field"
            style={{ minHeight: '80px', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '12px', padding: '15px' }}
            value={answers.physicalActivity}
            onChange={(e) => setAnswers({...answers, physicalActivity: e.target.value})}
            placeholder="Escribe la respuesta aqui..."
          />
        </div>

        <div>
          <p style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '10px' }}>5. Intolerancia o alergia algún alimento</p>
          <textarea 
            required
            className="input-field"
            style={{ minHeight: '80px', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '12px', padding: '15px' }}
            value={answers.allergies}
            onChange={(e) => setAnswers({...answers, allergies: e.target.value})}
            placeholder="Escribe la respuesta aqui..."
          />
        </div>

        <button 
          type="submit"
          className="btn-primary"
          style={{ 
            marginTop: '20px', 
            padding: '20px', 
            borderRadius: '16px', 
            fontWeight: '900', 
            fontSize: '1.2rem',
            background: '#1d512d',
            color: 'white'
          }}
        >
          SIGUIENTE POSO: MEDIDAS
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1d512d' }}>nutrimemi</p>
        </div>
      </form>
    </div>
  );
}
