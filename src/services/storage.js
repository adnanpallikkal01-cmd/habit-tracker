const NS = 'plt_v2_'
const OLD_NS = 'plt_'
const MIGRATION_KEY = `${NS}migrationDone`
const TOKEN_KEY = 'adn_auth_token'

// The previous build stored demo data under plt_. Clear that legacy namespace once
// so the first database-backed build starts clean.
if (!localStorage.getItem(MIGRATION_KEY)) {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i)
    if (key?.startsWith(OLD_NS) && !key.startsWith(NS)) localStorage.removeItem(key)
  }
  localStorage.setItem(MIGRATION_KEY, 'true')
}

const keys = {
  settings: `${NS}settings`,
  habits: `${NS}habits`,
  habitLogs: `${NS}habitLogs`,
  prayers: `${NS}prayers`,
  studySessions: `${NS}studySessions`,
  studyScheduled: `${NS}studyScheduled`,
  gymLogs: `${NS}gymLogs`,
  waterLogs: `${NS}waterLogs`,
  selfCare: `${NS}selfCare`,
  transactions: `${NS}transactions`,
  budgets: `${NS}budgets`,
  goals: `${NS}goals`,
  calendarEvents: `${NS}calendarEvents`,
  loans: `${NS}loans`,
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '')

const getToken = () => localStorage.getItem(TOKEN_KEY)

const authHeaders = () => {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

let syncTimer = null
const REQUEST_TIMEOUT_MS = 7000

const fetchWithTimeout = async (url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try { return await fetch(url, { ...options, signal: controller.signal }) }
  finally { clearTimeout(timer) }
}

const safeParse = (raw) => {
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}

export const storage = {
  get: (key) => safeParse(localStorage.getItem(keys[key] || key)),
  set: (key, value) => {
    try { localStorage.setItem(keys[key] || key, JSON.stringify(value)) } catch (e) { console.error('Storage write error:', e) }
  },
  remove: (key) => localStorage.removeItem(keys[key] || key),
  clearAll: () => {
    Object.values(keys).forEach(k => localStorage.removeItem(k))
  },
  exportAll: () => {
    const data = {}
    Object.entries(keys).forEach(([k, v]) => {
      const raw = localStorage.getItem(v)
      if (raw) data[k] = safeParse(raw)
    })
    return data
  },
  persistState: (state) => {
    Object.entries(state).forEach(([key, value]) => {
      if (keys[key]) storage.set(key, value)
    })
    clearTimeout(syncTimer)
    syncTimer = setTimeout(() => storage.syncState(state), 500)
  },
  syncState: async (state) => {
    const token = getToken()
    if (!token) return // not logged in, skip sync
    try {
      await fetchWithTimeout(`${API_BASE_URL}/state`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ state }),
      })
    } catch (error) {
      console.warn('Cloud sync unavailable; local data is still saved.', error)
    }
  },
  loadRemoteState: async () => {
    const token = getToken()
    if (!token) return null
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/state`, {
        headers: authHeaders(),
      })
      if (!response.ok) return null
      const data = await response.json()
      return data?.state || null
    } catch (error) {
      console.warn('Cloud data unavailable; using local data.', error)
      return null
    }
  },
  deleteRemoteState: async () => {
    const token = getToken()
    if (!token) return
    try {
      await fetchWithTimeout(`${API_BASE_URL}/state`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    } catch (error) {
      console.warn('Could not delete cloud data.', error)
    }
  },
}

export default storage
