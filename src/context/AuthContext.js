'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUI } from './UIContext';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { showToast } = useUI();

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('nutri_user');
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const login = async (email, password) => {
    const emailClean = email.trim().toLowerCase();
    const passClean = password.trim();

    try { localStorage.removeItem('nutri_user'); } catch (e) {}

    // Nutricionista
    if (emailClean === 'meme' && passClean === '123') {
      const userData = { email: emailClean, role: 'Nutricionista', name: 'Lic. Salomé' };
      setUser(userData);
      localStorage.setItem('nutri_user', JSON.stringify(userData));
      router.push('/nutri/dashboard');
      return;
    }

    // Buscar paciente en Supabase
    const { data: patient, error } = await supabase
      .from('patients')
      .select('name, email, password')
      .eq('email', emailClean)
      .single();

    if (patient && patient.password === passClean) {
      const userData = { 
        email: emailClean, 
        role: 'Paciente', 
        name: patient.name 
      };
      setUser(userData);
      localStorage.setItem('nutri_user', JSON.stringify(userData));
      router.push('/patient/home');
    } else {
      showToast('Credenciales incorrectas', 'error');
    }
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem('nutri_user'); } catch (e) {}
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, mounted }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
