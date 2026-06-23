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
    // Lógica de roles personalizada por el usuario
    if (email === 'meme' && password === '123') {
      const userData = { email, role: 'Nutricionista', name: 'Lic. Salomé' };
      setUser(userData);
      localStorage.setItem('nutri_user', JSON.stringify(userData));
      router.push('/nutri/dashboard');
    } else if (password === '123') {
      // Intentar buscar el nombre real si es un paciente registrado
      const savedPatients = JSON.parse(localStorage.getItem('nutri_patients') || '[]');
      const registeredPatient = savedPatients.find(p => p.email === email);
      
      const userData = { 
        email, 
        role: 'Paciente', 
        name: registeredPatient ? registeredPatient.name : 'Paciente Premium' 
      };
      setUser(userData);
      localStorage.setItem('nutri_user', JSON.stringify(userData));
      router.push('/patient/home');
    } else {
      showToast('Credenciales incorrectas. Usa meme/123 o paciente/123', 'error');
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
