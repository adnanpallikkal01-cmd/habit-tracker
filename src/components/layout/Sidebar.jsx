import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, Flame, BookOpen, Dumbbell,
  Droplets, Wallet, PiggyBank, Target, TrendingUp,
  Calendar, BarChart3, User, ChevronLeft, ChevronRight,
  Heart
} from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

function AdnLogoMark({ className = '' }) {
  return (
    <img
      src="/icons/icon-512.png"
      alt="Adn Tracker logo"
      className={`${className} object-contain`}
    />
  )
}

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/today', icon: CheckSquare, label: 'Today' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/prayer', icon: Heart, label: 'Prayer' },
  { to: '/study', icon: BookOpen, label: 'Study' },
  { to: '/fitness', icon: Dumbbell, label: 'Fitness' },
  { to: '/water', icon: Droplets, label: 'Water' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/budget', icon: PiggyBank, label: 'Budget' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/growth', icon: TrendingUp, label: 'Growth' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
]

function SidebarLink({ to, icon: Icon, label, collapsed }) {
  const { pathname } = useLocation()
  const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${collapsed ? 'justify-center' : ''} ${
        isActive
          ? 'border border-violet-400/40 bg-violet-500/12 text-white shadow-[0_12px_30px_rgba(139,92,246,0.2)]'
          : 'text-slate-300 hover:bg-white/5 hover:text-white'
      }`}
      title={collapsed ? label : undefined}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
        isActive
          ? 'border-violet-300/50 bg-violet-500/18 text-violet-200'
          : 'border-white/5 bg-white/3 text-slate-300 group-hover:border-white/10'
      }`}>
        <Icon size={16} />
      </span>
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { state } = useApp()
  const name = state.settings?.userName || ''
  const profileIcon = state.settings?.profileIcon || '✨'
  const profileImage = state.settings?.profileImage

  return (
    <aside className={`hidden md:flex h-screen sticky top-0 z-40 flex-col border-r border-white/10 bg-slate-950/80 backdrop-blur-xl transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center gap-3 border-b border-white/10 px-4 ${collapsed ? 'h-20 justify-center' : 'h-20'}`}>
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-transparent shadow-[0_8px_30px_rgba(139,92,246,0.35)]">
          <AdnLogoMark className="h-10 w-10" />
        </div>
        {!collapsed && <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">Adn</p>
          <p className="text-sm font-bold text-white">Tracker</p>
        </div>}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className={`mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 ${collapsed ? 'hidden' : 'block'}`}>
          Menu
        </div>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <SidebarLink key={to} to={to} icon={Icon} label={label} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        {!collapsed && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/3 px-2 py-2">
            {state.settings?.profileImage ? (
              <img src={state.settings.profileImage} alt={name} className="h-9 w-9 rounded-full object-cover shadow-lg shadow-violet-500/30" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-violet-600 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-violet-500/30">
                {profileIcon}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{name || 'Profile'}</p>
              <p className="text-xs text-slate-400">Personal</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/3 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/7 hover:text-white"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  )
}
