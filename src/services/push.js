const TOKEN_KEY = 'adn_auth_token'
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '')

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

async function getPublicKey() {
  const response = await fetch(`${API_BASE_URL}/push/public-key`)
  if (!response.ok) throw new Error('Background notifications are not configured on the server yet.')
  const data = await response.json()
  if (!data?.publicKey) throw new Error('Background notification key is missing.')
  return data.publicKey
}

export function pushConfigAvailable() {
  return Boolean('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)
}

export async function subscribeToBackgroundNotifications() {
  if (!pushConfigAvailable()) return { ok: false, reason: 'Push notifications are not supported on this device/browser.' }
  if (Notification.permission !== 'granted') return { ok: false, reason: 'Notification permission is not granted.' }
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return { ok: false, reason: 'You must be signed in.' }

  const publicKey = await getPublicKey()
  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const response = await fetch(`${API_BASE_URL}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ subscription: subscription.toJSON(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Could not register background notifications.')
  }
  return { ok: true }
}

export async function requestAndSubscribeToBackgroundNotifications() {
  if (!('Notification' in window)) return { ok: false, reason: 'Notifications are not supported on this device/browser.' }
  if (Notification.permission === 'denied') return { ok: false, reason: 'Notifications are blocked. Enable them in browser/site settings.' }
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'Notification permission was not granted.' }
  return subscribeToBackgroundNotifications()
}
