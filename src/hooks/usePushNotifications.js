import { useState, useEffect } from 'react';

export function usePushNotifications(userKey) {
  const [subscription, setSubscription] = useState(null);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(Notification.permission);
      // Cargar subscription guardada
      const saved = localStorage.getItem(`push_sub_${userKey}`);
      if (saved) setSubscription(JSON.parse(saved));
    }
  }, [userKey]);

  const subscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return null;

      // Usamos el nombre de la variable pública según tu configuración
      const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_P_keynutrimemi;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pubKey)
      });

      const subJson = sub.toJSON();
      localStorage.setItem(`push_sub_${userKey}`, JSON.stringify(subJson));
      // También guardar con clave de rol para que el otro lado pueda notificar
      localStorage.setItem(`push_sub_role_${userKey}`, JSON.stringify(subJson));
      setSubscription(subJson);
      return subJson;
    } catch (err) {
      console.error('Subscribe error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (targetSubscription, title, body, url = '/') => {
    try {
      await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: targetSubscription, title, body, url })
      });
    } catch (err) {
      console.error('Send push error:', err);
    }
  };

  return { subscription, permission, loading, subscribe, sendNotification };
}

function urlBase64ToUint8Array(base64String) {
  if (!base64String) return new Uint8Array(0);
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
