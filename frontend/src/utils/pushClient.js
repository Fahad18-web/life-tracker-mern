import api from '../api/axiosInstance';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export async function enablePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  const reg = await navigator.serviceWorker.ready;

  const { data } = await api.get('/push/vapid-public-key');
  const key = data.publicKey || data.data?.publicKey;
  if (!key) throw new Error('Missing VAPID public key');

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key)
    });
  }

  await api.post('/push/subscribe', subscription.toJSON());

  // Actually deliver a notification (subscribe alone does not)
  await api.post('/push/test');

  return true;
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
  try {
    await api.delete('/push/subscribe');
  } catch (_) {
    /* ignore */
  }
}