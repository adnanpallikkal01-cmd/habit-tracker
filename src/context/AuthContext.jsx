import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)

const TOKEN_KEY = 'adn_auth_token'
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '')

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Validate stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) { setAuthLoading(false); return }

    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setToken(storedToken)
        setUser({ id: data.userId, email: data.email })
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setAuthLoading(false))
  }, [])

  const saveToken = useCallback((tok, userData) => {
    localStorage.setItem(TOKEN_KEY, tok)
    setToken(tok)
    setUser(userData)
  }, [])

  const signup = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Sign up failed')
    saveToken(data.token, data.user)
    return data
  }, [saveToken])

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Login failed')
    saveToken(data.token, data.user)
    return data
  }, [saveToken])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    // Clear all app data from localStorage on logout
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('plt_v2_')) keysToRemove.push(k)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    setToken(null)
    setUser(null)
  }, [])

  // Authenticated fetch wrapper — attaches Bearer token automatically
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
