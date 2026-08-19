import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)

const TOKEN_KEY = 'adn_auth_token'
const DEFAULT_API_URL = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'https://habit-tracker-lwfi.onrender.com/api'
  : 'http://localhost:4000/api'
const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
const VERIFY_TIMEOUT_MS = 5000

function withTimeout(signalMs = VERIFY_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), signalMs)
  return { controller, clear: () => clearTimeout(timer) }
}

function decodeTokenUser(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (!payload?.userId || !payload?.email) return null
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return { id: payload.userId, email: payload.email }
  } catch {
    return null
  }
}

async function apiFetch(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try { return await fetch(url, { ...options, signal: controller.signal }) }
  finally { clearTimeout(timer) }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    return stored ? decodeTokenUser(stored) : null
  })
  const [authLoading, setAuthLoading] = useState(false)

  // Do not block the whole app while Render wakes up. Use the JWT locally first,
  // then verify in the background. Only a confirmed 401/403 removes the session.
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) return

    const optimisticUser = decodeTokenUser(storedToken)
    if (!optimisticUser) {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
      return
    }

    setToken(storedToken)
    setUser(optimisticUser)
    const { controller, clear } = withTimeout()

    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${storedToken}` },
      signal: controller.signal,
    })
      .then(async response => {
        if (response.status === 401 || response.status === 403) throw Object.assign(new Error('unauthorized'), { code: 'UNAUTHORIZED' })
        if (!response.ok) throw new Error('verification unavailable')
        return response.json()
      })
      .then(data => setUser({ id: data.userId, email: data.email }))
      .catch(error => {
        if (error?.code === 'UNAUTHORIZED') {
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setUser(null)
        }
        // Network/Render cold-start failures intentionally keep the cached session.
      })
      .finally(clear)
  }, [])

  const saveToken = useCallback((tok, userData) => {
    localStorage.setItem(TOKEN_KEY, tok)
    setToken(tok)
    setUser(userData)
  }, [])

  const signup = useCallback(async (email, password) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Sign up failed')
      saveToken(data.token, data.user)
      return data
    } catch (err) {
      if (err?.name === 'AbortError' || (err.name === 'TypeError' && err.message.includes('fetch'))) {
        throw new Error('Server is taking too long to respond. Please try again; the backend may be waking up.')
      }
      throw err
    }
  }, [saveToken])

  const login = useCallback(async (email, password) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Login failed')
      saveToken(data.token, data.user)
      return data
    } catch (err) {
      if (err?.name === 'AbortError' || (err.name === 'TypeError' && err.message.includes('fetch'))) {
        throw new Error('Server is taking too long to respond. Please try again; the backend may be waking up.')
      }
      throw err
    }
  }, [saveToken])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('plt_v2_')) keysToRemove.push(k)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    setToken(null)
    setUser(null)
  }, [])

  const authFetch = useCallback(async (url, options = {}) => {
    const currentToken = localStorage.getItem(TOKEN_KEY)
    const headers = {
      ...(options.headers || {}),
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    }
    return fetch(url, { ...options, headers })
  }, [])

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, authLoading, login, signup, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
