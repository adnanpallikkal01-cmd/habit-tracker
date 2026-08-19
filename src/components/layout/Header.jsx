import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { getGreeting, formatDateFull, toDateStr } from '../../utils/dateHelpers.js'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/habits': 'Habits',
  '/prayer': 'Prayer',
  '/study': 'Study',
  '/fitness': 'Fitness',
  '/water': 'Water',
  '/finance': 'Finance',
  '/budget': 'Budget',
  '/growth': 'Growth',
  '/calendar': 'Calendar',
  '/profile': 'Profile',
}

export default function Header() {
  const { state } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const name = state.settings?.userName || ''
  const profileIcon = state.settings?.profileIcon || '✨'
  const profileImage = state.settings?.profileImage
  const isHome = location.pathname === '/'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/70 px-4 backdrop-blur-xl md:px-6">
      <div className="flex flex-col justify-center">
        {isHome ? (
          <>
            <h1 className="text-base font-semibold leading-tight text-white">
              <span className="text-violet-300">{getGreeting()}</span>{name ? `, ${name}` : ''} 👋
            </h1>
            <p className="text-xs text-slate-400">{formatDateFull(toDateStr())}</p>
          </>
        ) : (
          <h1 className="text-base font-semibold text-white">
            {PAGE_TITLES[location.pathname] || 'Adn Tracker'}
          </h1>
        )}
      </div>

      <button type="button" onClick={() => navigate('/profile')} aria-label="Open profile" className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-violet-400/60">
        {profileImage ? (
          <img src={profileImage} alt={name} className="h-9 w-9 rounded-full object-cover shadow-[0_10px_20px_rgba(139,92,246,0.35)]" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-violet-600 to-cyan-400 text-sm font-black text-white shadow-[0_10px_20px_rgba(139,92,246,0.35)]">
            {profileIcon}
          </div>
        )}
      </button>
    </header>
  )
}
