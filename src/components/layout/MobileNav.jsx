import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Flame,
  Heart,
  BookOpen,
  Dumbbell,
  Droplets,
  Wallet,
  PiggyBank,
  Target,
  TrendingUp,
  Calendar,
  BarChart3,
  User
} from 'lucide-react'

const BOTTOM_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/today', icon: CheckSquare, label: 'Today' },
  { to: '/habits', icon: Flame, label: 'Habits' },
  { to: '/prayer', icon: Heart, label: 'Prayer' },
  { to: '/study', icon: BookOpen, label: 'Study' },
  { to: '/fitness', icon: Dumbbell, label: 'Fit' },
  { to: '/water', icon: Droplets, label: 'Water' },
  { to: '/finance', icon: Wallet, label: 'Money' },
  { to: '/budget', icon: PiggyBank, label: 'Budget' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/growth', icon: TrendingUp, label: 'Growth' },
  { to: '/calendar', icon: Calendar, label: 'Cal' },
  { to: '/analytics', icon: BarChart3, label: 'Data' },
  { to: '/profile', icon: User, label: 'Me' },
]

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-2 left-1/2 z-50 w-[calc(100%-0.75rem)] max-w-lg -translate-x-1/2 rounded-[26px] border border-white/10 bg-[#09090d]/90 px-1.5 py-1.5 shadow-[0_18px_48px_rgba(15,23,42,0.7)] backdrop-blur-xl">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
        {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-w-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-1.5 transition-all duration-200 ${
                isActive ? 'bg-violet-500/15 text-white shadow-[inset_0_0_0_1px_rgba(167,139,250,0.28)]' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${isActive ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_8px_16px_rgba(139,92,246,0.28)]' : 'text-slate-300'}`}>
                  <Icon size={15} />
                </div>
                <span className="text-[8.5px] font-medium leading-none whitespace-nowrap">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
