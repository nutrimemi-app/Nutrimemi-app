'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function QuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
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
    if (found && found.onboardingAnswers) {
        setAnswers(found.onboardingAnswers);
    }
  }, [params.id]);

  const mealOptions = [
    { id: 'a', label: '2 comidas principales' },
    { id: 'b', label: '3 comidas principales' },
    { id: 'c', label: '3 comidas principales + 2 snacks' },
    { id: 'd', label: '3 comidas principales + 3 snacks' },
    { id: 'e', label: '2 comidas principales + 2 snacks' },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const saved = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
      const updated = saved.map(p => {
        if (p.id === parseInt(params.id)) {
          return { ...p, onboardingAnswers: answers };
        }
        return p;
      });
      localStorage.setItem('nutri_patients', JSON.stringify(updated));
      router.push(`/paciente/${params.id}/measurements`);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      color: '#1d512d', 
      height: '100dvh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'hidden'
    }}>
      <h1 style={{ fontSize: '2.8rem', fontWeight: '900', margin: '20px 0' }}>PREGUNTAS</h1>

      <div style={{ width: '100%', maxWidth: '380px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
        
        {step === 1 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '8px' }}>1. Comida favorita</p>
              <textarea 
                className="input-field"
                style={{ width: '100%', minHeight: '100px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '15px', padding: '15px', fontSize: '0.9rem' }}
                value={answers.favFood}
                onChange={(e) => setAnswers({...answers, favFood: e.target.value})}
                placeholder="Escribe la respuesta aqui..."
              />
            </div>
            <div>
              <p style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '8px' }}>2. Comida y alimento NO favorito</p>
              <textarea 
                className="input-field"
                style={{ width: '100%', minHeight: '100px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '15px', padding: '15px', fontSize: '0.9rem' }}
                value={answers.nonFavFood}
                onChange={(e) => setAnswers({...answers, nonFavFood: e.target.value})}
                placeholder="Escribe la respuesta aqui..."
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '10px' }}>3. Cuantas comidas deseas realizar durante el día</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mealOptions.map(opt => (
                  <label key={opt.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    fontSize: '0.9rem', 
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: answers.mealCount === opt.label ? 'rgba(29, 81, 45, 0.1)' : 'white',
                    padding: '12px',
                    borderRadius: '12px',
                    border: answers.mealCount === opt.label ? '1px solid #1d512d' : '1px solid transparent'
                  }}>
                    <input 
                      type="radio" 
                      name="mealCount" 
                      checked={answers.mealCount === opt.label}
                      onChange={() => setAnswers({...answers, mealCount: opt.label})}
                      style={{ width: '20px', height: '20px' }}
                    />
                    {opt.id}. {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '8px' }}>4. Actividad fisica que realizas, cual y cuantas veces al dia?</p>
              <textarea 
                className="input-field"
                style={{ width: '100%', minHeight: '100px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '15px', padding: '15px', fontSize: '0.9rem' }}
                value={answers.physicalActivity}
                onChange={(e) => setAnswers({...answers, physicalActivity: e.target.value})}
                placeholder="Escribe la respuesta aqui..."
              />
            </div>
            <div>
              <p style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '8px' }}>5. Intolerancia o alergia algún alimento</p>
              <textarea 
                className="input-field"
                style={{ width: '100%', minHeight: '100px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '15px', padding: '15px', fontSize: '0.9rem' }}
                value={answers.allergies}
                onChange={(e) => setAnswers({...answers, allergies: e.target.value})}
                placeholder="Escribe la respuesta aqui..."
              />
            </div>
          </div>
        )}

      </div>

      <div style={{ width: '100%', maxWidth: '380px', paddingBottom: '20px' }}>
        <button 
          onClick={handleNext}
          style={{ 
            width: '100%', 
            padding: '18px', 
            borderRadius: '50px', 
            fontWeight: '900', 
            fontSize: '1rem',
            background: '#1d512d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(29, 81, 45, 0.3)'
          }}
        >
          {step < 3 ? 'SIGUIENTE PREGUNTA' : 'SIGUIENTE PASO: MEDIDAS'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1d512d', margin: 0 }}>nutrimemi</p>
        </div>
      </div>
    </div>
  );
}
