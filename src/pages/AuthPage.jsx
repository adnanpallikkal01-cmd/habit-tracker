import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { BookOpen, Eye, EyeOff, Loader2, LogIn, UserPlus, Mail, Lock } from 'lucide-react'

export default function AuthPage() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isLogin = mode === 'login'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Please fill in all fields'); return }
    if (!isLogin && password !== confirmPassword) { setError('Passwords do not match'); return }
    if (!isLogin && password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    try {
      if (isLogin) {
        await login(email.trim(), password)
      } else {
        await signup(email.trim(), password)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background: 'radial-gradient(circle at top left, rgba(124,58,237,0.22), transparent 38%), radial-gradient(circle at bottom right, rgba(217,70,239,0.14), transparent 34%), linear-gradient(180deg, #050505 0%, #08070A 100%)',
      }}>

      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-5%',
          width: 350, height: 350,
          background: 'radial-gradient(circle, rgba(217,70,239,0.14) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #5C2D91, #7C3AED, #D946EF)' }}>
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Adn Tracker</h1>
          <p className="text-sm text-slate-400 mt-1">Your personal life & productivity hub</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-1"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(217,70,239,0.2), rgba(124,58,237,0.1))' }}>
          <div className="rounded-[14px] p-6 sm:p-8"
            style={{ background: 'rgba(10,9,13,0.96)', backdropFilter: 'blur(20px)' }}>

            {/* Tab Switcher */}
            <div className="flex rounded-xl p-1 mb-6"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {[['login', 'Sign In', LogIn], ['signup', 'Sign Up', UserPlus]].map(([m, label, Icon]) => (
                <button key={m} onClick={() => switchMode(m)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={mode === m
                    ? { background: 'linear-gradient(135deg, #5C2D91, #7C3AED)', color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }
                    : { color: '#6b7280' }}>
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#4b5563' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#4b5563' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    className="w-full rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (signup only) */}
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#4b5563' }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.09)',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                id="auth-submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 mt-2"
                style={{
                  background: loading
                    ? 'rgba(124,58,237,0.4)'
                    : 'linear-gradient(135deg, #5C2D91 0%, #7C3AED 50%, #9333EA 100%)',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(124,58,237,0.4)',
                  opacity: loading ? 0.7 : 1,
                }}>
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> {isLogin ? 'Signing in…' : 'Creating account…'}</>
                  : <>{isLogin ? <LogIn size={15} /> : <UserPlus size={15} />} {isLogin ? 'Sign In' : 'Create Account'}</>
                }
              </button>
            </form>

            {/* Switch mode hint */}
            <p className="text-center text-xs text-slate-500 mt-5">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button onClick={() => switchMode(isLogin ? 'signup' : 'login')}
                className="text-violet-400 font-semibold hover:text-violet-300 transition-colors underline underline-offset-2">
                {isLogin ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-700 mt-6">
          Your data is private and secured to your account only.
        </p>
      </div>
    </div>
  )
}
