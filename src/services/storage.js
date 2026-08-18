const NS = 'plt_v2_'
const OLD_NS = 'plt_'
const MIGRATION_KEY = `${NS}migrationDone`
const USER_KEY = `${NS}userId`

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
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '')
let userId = localStorage.getItem(USER_KEY)
if (!userId) {
  userId = globalThis.crypto?.randomUUID?.() || `user_${Date.now()}_${Math.random().toString(36).slice(2)}`
  localStorage.setItem(USER_KEY, userId)
}

let syncTimer = null
let currentState = null

const safeParse = (raw) => {
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}

export const storage = {
  getUserId: () => userId,
  get: (key) => safeParse(localStorage.getItem(keys[key] || key)),
  set: (key, value) => {
    try { localStorage.setItem(keys[key] || key, JSON.stringify(value)) } catch (e) { console.error('Storage write error:', e) }
  },
  remove: (key) => localStorage.removeItem(keys[key] || key),
  clearAll: () => {
    Object.values(keys).forEach(k => localStorage.removeItem(k))
  },
  exportAll: () => {
    const data = { userId }
    Object.entries(keys).forEach(([k, v]) => {
      const raw = localStorage.getItem(v)
      if (raw) data[k] = safeParse(raw)
    })
    return data
  },
  persistState: (state) => {
    currentState = state
    Object.entries(state).forEach(([key, value]) => {
      if (keys[key]) storage.set(key, value)
    })
    clearTimeout(syncTimer)
    syncTimer = setTimeout(() => storage.syncState(state), 500)
  },
  syncState: async (state) => {
    try {
      await fetch(`${API_BASE_URL}/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ state }),
      })
    } catch (error) {
      console.warn('Cloud sync unavailable; local data is still saved.', error)
    }
  },
  loadRemoteState: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/state`, {
        headers: { 'x-user-id': userId },
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
    try {
      await fetch(`${API_BASE_URL}/state`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      })
    } catch (error) {
      console.warn('Could not delete cloud data.', error)
    }
  },
}

export default storage
