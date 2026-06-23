'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUI } from './UIContext';

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

  const login = (email, password) => {
    const emailClean = email.trim().toLowerCase();
    const passClean = password.trim();

    // Limpiar sesión anterior
    try { localStorage.removeItem('nutri_user'); } catch (e) {}

    // Lógica de roles
    if (emailClean === 'meme' && passClean === '123') {
      const userData = { email: emailClean, role: 'Nutricionista', name: 'Lic. Salomé' };
      setUser(userData);
      localStorage.setItem('nutri_user', JSON.stringify(userData));
      router.push('/nutri/dashboard');
    } else if (passClean === '123') {
      const savedPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
      const registeredPatient = savedPatients.find(p => p.email === emailClean);
      const userData = { 
        email: emailClean, 
        role: 'Paciente', 
        name: registeredPatient ? registeredPatient.name : 'Paciente Premium' 
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
