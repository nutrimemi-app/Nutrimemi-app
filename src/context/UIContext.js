'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, Share, Download, X } from 'lucide-react';

const UIContext = createContext({
  showToast: () => {},
  showConfirm: () => {},
});

export function UIProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [pwaPrompt, setPwaPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [os, setOs] = useState('android');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirm({ title, message, onConfirm });
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
    <UIContext.Provider value={{ showToast, showConfirm }}>
      {children}
      
      {/* Confirm Modal (Native Action Sheet Style) */}
      {confirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 20000,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}>
          <div className="slide-up" style={{
            width: '100%',
            maxWidth: '500px',
            background: 'white',
            borderRadius: '32px 32px 0 0',
            padding: '32px 24px',
            boxShadow: '0 -20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1d512d', marginBottom: '12px' }}>{confirm.title}</h3>
            <p style={{ fontSize: '1rem', opacity: 0.6, marginBottom: '32px', lineHeight: '1.5' }}>{confirm.message}</p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setConfirm(null)}
                style={{ flex: 1, padding: '18px', borderRadius: '20px', border: 'none', background: 'rgba(0,0,0,0.05)', fontWeight: '900', color: '#666', fontSize: '1rem' }}
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  confirm.onConfirm();
                  setConfirm(null);
                }}
                style={{ flex: 1, padding: '18px', borderRadius: '20px', border: 'none', background: '#1d512d', color: 'white', fontWeight: '900', fontSize: '1rem' }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification (Glassmorphism Native Style - REFINADO) */}
      {toast && (
        <div 
          className="fade-in"
          style={{
            position: 'fixed',
            top: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(25px) saturate(180%)',
            WebkitBackdropFilter: 'blur(25px) saturate(180%)',
            padding: '18px 24px',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            width: 'calc(100% - 40px)',
            maxWidth: '380px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ 
            flexShrink: 0,
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: toast.type === 'success' ? '#1d512d' : '#ff4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {toast.type === 'success' ? <CheckCircle size={18} color="white" /> : <XCircle size={18} color="white" />}
          </div>
          <p style={{ margin: 0, fontWeight: '800', color: '#1d512d', fontSize: '0.9rem', lineHeight: '1.3' }}>{toast.message}</p>
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
