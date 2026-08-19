const TOKEN_KEY = 'adn_auth_token'
const DEFAULT_API_URL = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'https://habit-tracker-lwfi.onrender.com/api'
  : 'http://localhost:4000/api'
const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

const authHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY)
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function getPublicKey() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(`${API_BASE_URL}/push/public-key`, { signal: controller.signal })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || `Notification server returned HTTP ${response.status}.`)
    if (!data?.publicKey) throw new Error('Background notification key is missing on the server.')
    return data.publicKey
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Notification server is taking too long to respond. The Render service may be waking up.')
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export async function getBackgroundNotificationStatus() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal })
    const data = await response.json().catch(() => ({}))
    return {
      ok: response.ok,
      pushConfigured: Boolean(data?.pushConfigured),
      data,
      endpoint: `${API_BASE_URL}/health`,
      error: response.ok ? '' : (data?.message || `Notification server returned HTTP ${response.status}.`),
    }
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'Notification server timed out. The Render service may be sleeping or unavailable.'
      : 'Cannot reach notification server. Check VITE_API_URL and the Render service.'
    return { ok: false, pushConfigured: false, data: null, endpoint: `${API_BASE_URL}/health`, error: message }
  } finally {
    clearTimeout(timer)
  }
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
    headers: authHeaders(),
    body: JSON.stringify({ subscription: subscription.toJSON(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Could not register background notifications.')
  return { ok: true }
}

export async function testBackgroundNotification() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return { ok: false, reason: 'You must be signed in.' }
  const response = await fetch(`${API_BASE_URL}/push/test`, { method: 'POST', headers: authHeaders() })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Test notification could not be sent.')
  return { ok: true, message: data.message }
}

export async function requestAndSubscribeToBackgroundNotifications() {
  if (!('Notification' in window)) return { ok: false, reason: 'Notifications are not supported on this device/browser.' }
  if (Notification.permission === 'denied') return { ok: false, reason: 'Notifications are blocked. Enable them in browser/site settings.' }
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'Notification permission was not granted.' }
  return subscribeToBackgroundNotifications()
}
