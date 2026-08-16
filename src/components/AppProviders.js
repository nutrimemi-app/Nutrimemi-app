'use client';
import { usePathname } from 'next/navigation';
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import BottomNav from "@/components/BottomNav";

export default function AppProviders({ children }) {
  const pathname = usePathname() || '';
  
  // Si la ruta es pública (como la de bienvenida del paciente), no cargamos los contextos globales
  // que podrían fallar por falta de sesión o por políticas de incógnito.
  const isPublicRoute = pathname.startsWith('/paciente');

  if (isPublicRoute) {
    return (
      <div className="pwa-container">
        {children}
      </div>
    );
  }

  return (
    <UIProvider>
      <AuthProvider>
        <div className="pwa-container">
          {children}
          <BottomNav />
        </div>
      </AuthProvider>
    </UIProvider>
  );
}
