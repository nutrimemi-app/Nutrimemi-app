'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, Share, Download, X } from 'lucide-react';

const UIContext = createContext({
  showToast: () => {}, // Valor por defecto vacío para evitar errores durante el build
});

export function UIProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [pwaPrompt, setPwaPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [os, setOs] = useState('android');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW error', err));
    }

    // Detect OS
    const ua = window.navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setOs('ios');

    // Android: mostrar banner SOLO cuando Chrome confirma que la app es instalable
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaPrompt(true);
    });

    // iOS Safari: mostrar instrucciones manuales
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|Chrome|FxiOS/.test(ua);
    const isStandalone = window.navigator.standalone === true;
    if (isIOS && isSafari && !isStandalone) {
      setOs('ios');
      setTimeout(() => setPwaPrompt(true), 2000);
    }

    // Detectar si ya está instalada (limpia el prompt si está en modo standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaPrompt(false);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setPwaPrompt(false);
  };

  return (
    <UIContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Notification (Glassmorphism Native Style) */}
      {toast && (
        <div 
          className="fade-in"
          style={{
            position: 'fixed',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            padding: '16px 24px',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            minWidth: '280px',
            border: `1.5px solid ${toast.type === 'success' ? '#1d512d20' : '#ff444420'}`
          }}
        >
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: toast.type === 'success' ? '#1d512d15' : '#ff444415',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {toast.type === 'success' ? <CheckCircle size={20} color="#1d512d" /> : <XCircle size={20} color="#ff4444" />}
          </div>
          <span style={{ fontWeight: '800', color: '#1d512d', fontSize: '0.9rem' }}>{toast.message}</span>
        </div>
      )}

      {/* PWA Prompt (iOS/Android Native Invite) */}
      {pwaPrompt && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(15px)',
          borderRadius: '28px',
          padding: '24px',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.18)',
          zIndex: 9999,
          border: '1.5px solid rgba(0,0,0,0.05)',
          maxWidth: '450px',
          margin: '0 auto'
        }} className="slide-up">
          <button 
            onClick={() => setPwaPrompt(false)}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}
          >
            <X size={16} color="#666" />
          </button>

          <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '20px' }}>
             <img 
               src="/logopwa.jpg" 
               alt="Nutrimemi PWA"
               style={{ width: '64px', height: '64px', borderRadius: '18px', objectFit: 'cover', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }} 
             />
             <div>
                <h4 style={{ margin: 0, fontWeight: '900', color: '#1d512d', fontSize: '1.1rem' }}>Instalar Nutrimemi</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6, fontWeight: '700' }}>APP OFICIAL DISPONIBLE</p>
             </div>
          </div>
          
          <div style={{ background: 'rgba(29, 81, 45, 0.05)', padding: '18px', borderRadius: '20px', marginBottom: '24px' }}>
             {os === 'ios' ? (
                <div style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#1d512d', fontWeight: '600' }}>
                   1. Toca el botón <strong>Compartir</strong> <Share size={18} style={{ verticalAlign: 'middle', margin: '0 4px' }} /> abajo en Safari.<br/>
                   2. Pulsa en <strong>"Añadir a pantalla de inicio"</strong> <Download size={18} style={{ verticalAlign: 'middle', margin: '0 4px' }} />.<br/>
                   3. ¡Listo! Tendrás acceso directo en tu iPhone.
                </div>
             ) : (
                <div style={{ fontSize: '1rem', lineHeight: '1.4', color: '#1d512d', fontWeight: '900', textAlign: 'center' }}>
                   ¡Instala la app!<br/>
                    <span style={{ fontWeight: '400', opacity: 0.8 }}>y trabajemos juntos en tu versión más saludable!</span>
                </div>
             )}
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
             <button 
               onClick={() => setPwaPrompt(false)} 
               style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'rgba(0,0,0,0.05)', fontWeight: '900', color: '#666', fontSize: '0.9rem' }}
             >
               Quizás luego
             </button>
             <button 
               onClick={os === 'ios' ? () => setPwaPrompt(false) : handleInstallClick} 
               style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', background: '#1d512d', color: 'white', fontWeight: '900', fontSize: '0.9rem', boxShadow: '0 8px 20px rgba(29, 81, 45, 0.3)' }}
             >
               {os === 'ios' ? '¡Entendido!' : 'DESCARGAR'}
             </button>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .slide-up {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(110%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
