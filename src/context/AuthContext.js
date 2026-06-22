'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  const login = (email, password) => {
    // Lógica de roles personalizada por el usuario
    if (email === 'meme' && password === '123') {
      const userData = { email, role: 'Nutricionista', name: 'Dra. Salomé' };
      setUser(userData);
      localStorage.setItem('nutri_user', JSON.stringify(userData));
      router.push('/nutri/dashboard');
    } else if (email === 'paciente' && password === '123') {
      const userData = { email, role: 'Paciente', name: 'Paciente Premium' };
      setUser(userData);
      localStorage.setItem('nutri_user', JSON.stringify(userData));
      router.push('/patient/home');
    } else {
      alert('Credenciales incorrectas. Usa meme/123 o paciente/123');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nutri_user');
    router.push('/');
  };

  useEffect(() => {
    const saved = localStorage.getItem('nutri_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
