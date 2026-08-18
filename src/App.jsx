import React, { Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { useApp } from './context/AppContext.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Header from './components/layout/Header.jsx'
import MobileNav from './components/layout/MobileNav.jsx'
import {
  usePrayerReminders,
  useWaterReminder,
  requestNotificationPermission,
  useStudyReminderScheduler,
} from './hooks/usePrayerReminders.js'

// Pages
import Dashboard from './pages/Dashboard.jsx'
import Today from './pages/Today.jsx'
import Habits from './pages/Habits.jsx'
import Prayer from './pages/Prayer.jsx'
import Study from './pages/Study.jsx'
import Fitness from './pages/Fitness.jsx'
import Water from './pages/Water.jsx'
import Finance from './pages/Finance.jsx'
import Budget from './pages/Budget.jsx'
import Goals from './pages/Goals.jsx'
import Growth from './pages/Growth.jsx'
import Calendar from './pages/Calendar.jsx'
import Analytics from './pages/Analytics.jsx'
import Profile from './pages/Profile.jsx'

// ── Notification permission banner ───────────────────────────────
function NotifBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      // Show after 2s so page loads first
      const t = setTimeout(() => setShow(true), 2000)
      return () => clearTimeout(t)
    }
  }, [])

  if (!show) return null

  const allow = async () => {
    await requestNotificationPermission()
    setShow(false)
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md
      bg-slate-800 border border-violet-500/40 rounded-2xl p-4 shadow-2xl shadow-black/40
      flex items-center gap-3 animate-slideUp">
      <img src="/icons/icon-48.png" alt="Adn Tracker" className="h-10 w-10 flex-shrink-0 rounded-xl object-cover" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Enable Prayer Reminders</p>
        <p className="text-xs text-slate-400 mt-0.5">Get notified at each prayer time</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={() => setShow(false)}
          className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          Later
        </button>
        <button id="enable-prayer-notif" onClick={allow}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors">
          Allow
        </button>
      </div>
    </div>
  )
}

// ── App Shell — needs to be inside AppProvider to read state ─────
function AppShell() {
  const { state, dispatch } = useApp()

  // Activate prayer reminders globally
  usePrayerReminders(
    state.settings?.prayerTimes,
    state.settings?.notifications?.prayer ?? true
  )

  // Activate water reminder (every 15 min)
  useWaterReminder(state.settings?.waterReminderEnabled ?? false)

  // Keep scheduled study reminders active while the app is open, even after navigation.
  useStudyReminderScheduler(state.studyScheduled || [], dispatch)

  return (
    <div className="app-shell flex h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-5">
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[#5C2D91] border-t-[#EDBB00] rounded-full animate-spin" />
              </div>
            }>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/today" element={<Today />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/prayer" element={<Prayer />} />
                <Route path="/study" element={<Study />} />
                <Route path="/fitness" element={<Fitness />} />
                <Route path="/water" element={<Water />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/growth" element={<Growth />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Prayer notification permission banner */}
      <NotifBanner />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
