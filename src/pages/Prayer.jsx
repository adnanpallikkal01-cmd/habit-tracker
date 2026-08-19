import React, { useMemo, useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import ProgressRing from '../components/shared/ProgressRing.jsx'
import StreakCard from '../components/shared/StreakCard.jsx'
import { PRAYER_NAMES, PRAYER_STATUSES } from '../data/categories.js'
import { getPrayerStats, getPrayerStreak, getMonthlyPrayerRate } from '../utils/calculations.js'
import { toDateStr, daysInMonth, currentMonth, pastDays, formatTime12 } from '../utils/dateHelpers.js'
import { requestNotificationPermission } from '../hooks/usePrayerReminders.js'
import { Bell, BellOff, Clock } from 'lucide-react'

const STATUS_DOT = {
  completed: 'bg-green-500',
  missed: 'bg-red-500',
  qadha: 'bg-yellow-500',
  pending: 'bg-slate-700',
}

const STATUS_BORDER = {
  completed: 'border-green-500/30 bg-green-500/10',
  missed: 'border-red-500/30 bg-red-500/10',
  qadha: 'border-yellow-500/30 bg-yellow-500/10',
  pending: 'border-slate-700/40 bg-slate-800/60',
}

const PRAYER_STATUS_CYCLE = ['pending', 'completed', 'qadha', 'missed']

const DEFAULT_TIMES = {
  fajr: '05:30', dhuhr: '13:00', asr: '16:30', maghrib: '18:45', isha: '20:15',
}

// ── Countdown to next prayer ──────────────────────────────────────
function useNextPrayer(prayerTimes) {
  const [next, setNext] = useState(null)

  useEffect(() => {
    const calc = () => {
      const now = new Date()
      const nowMins = now.getHours() * 60 + now.getMinutes()

      const upcoming = PRAYER_NAMES
        .map(p => {
          const time = (prayerTimes || {})[p.id] || DEFAULT_TIMES[p.id]
          if (!time) return null
          const [h, m] = time.split(':').map(Number)
          const prayerMins = h * 60 + m
          const diff = prayerMins > nowMins ? prayerMins - nowMins : 24 * 60 - nowMins + prayerMins
          return { ...p, time, diff }
        })
        .filter(Boolean)
        .sort((a, b) => a.diff - b.diff)

      if (upcoming[0]) {
        const d = upcoming[0].diff
        const hrs = Math.floor(d / 60)
        const mins = d % 60
        setNext({ ...upcoming[0], hrs, mins })
      }
    }
    calc()
    const t = setInterval(calc, 60_000)
    return () => clearInterval(t)
  }, [prayerTimes])

  return next
}

// ── Notification permission button ───────────────────────────────
function NotifPermBtn() {
  const [perm, setPerm] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  )

  const request = async () => {
    const granted = await requestNotificationPermission()
    setPerm(granted ? 'granted' : 'denied')
  }

  if (perm === 'granted') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
        <Bell size={13} /> Reminders ON
      </span>
    )
  }
  return (
    <button
      id="prayer-enable-notif"
      onClick={request}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 transition-colors font-medium"
    >
      <Bell size={13} /> Enable Reminders
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────
export default function Prayer() {
  const { state, dispatch } = useApp()
  const today = toDateStr()
  const yearMonth = currentMonth()

  const prayerTimes = state.settings?.prayerTimes || DEFAULT_TIMES
  const notifEnabled = state.settings?.notifications?.prayer ?? true
  const nextPrayer = useNextPrayer(prayerTimes)

  const todayStats = useMemo(() => getPrayerStats(state.prayers, today), [state.prayers, today])
  const streak = useMemo(() => getPrayerStreak(state.prayers), [state.prayers])
  const monthlyRate = useMemo(() => getMonthlyPrayerRate(state.prayers, yearMonth), [state.prayers, yearMonth])

  const weeklyPrayers = useMemo(() => {
    const days7 = pastDays(7)
    let total = 0, done = 0
    days7.forEach(d => {
      const s = getPrayerStats(state.prayers, d)
      total += s.total; done += s.completed
    })
    return total > 0 ? Math.round((done / total) * 100) : 0
  }, [state.prayers])

  const monthDays = daysInMonth(yearMonth)

  const cycleStatus = (current) => {
    const idx = PRAYER_STATUS_CYCLE.indexOf(current || 'pending')
    return PRAYER_STATUS_CYCLE[(idx + 1) % PRAYER_STATUS_CYCLE.length]
  }

  const handlePrayer = (prayerId, currentStatus) => {
    const next = cycleStatus(currentStatus)
    dispatch({ type: 'UPDATE_PRAYER', payload: { date: today, prayerId, status: next } })
  }

  const updateTime = (prayerId, time) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        prayerTimes: { ...prayerTimes, [prayerId]: time }
      }
    })
  }

  const toggleNotif = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { notifications: { ...state.settings?.notifications, prayer: !notifEnabled } }
    })
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">

      {/* Today's Progress */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-violet-900/50 to-purple-900/30 border border-violet-700/30">
        <div className="flex items-center gap-6">
          <ProgressRing
            percentage={todayStats.percentage}
            size={100}
            strokeWidth={8}
            color="#a78bfa"
            trackColor="#1e293b"
            label={`${todayStats.completed}/5`}
            sublabel="prayers"
          />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white mb-1">Today's Prayers</h2>
            <p className="text-violet-300 text-sm">{todayStats.percentage}% complete</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">Weekly: {weeklyPrayers}%</span>
              <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">Monthly: {monthlyRate}%</span>
            </div>
          </div>
        </div>

        {/* Next prayer countdown */}
        {nextPrayer && (
          <div className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 bg-violet-950/60 border border-violet-700/30">
            <Clock size={16} className="text-violet-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-white font-semibold text-sm">{nextPrayer.name}</span>
              <span className="text-slate-400 text-xs ml-2">{formatTime12(nextPrayer.time)}</span>
            </div>
            <span className="text-violet-300 text-sm font-medium">
              {nextPrayer.hrs > 0 ? `${nextPrayer.hrs}h ` : ''}{nextPrayer.mins}m away
            </span>
          </div>
        )}
      </div>

      {/* Prayer Times & Reminders */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Bell size={15} className="text-violet-400" /> Prayer Reminders
          </h3>
          <div className="flex items-center gap-3">
            <NotifPermBtn />
            {/* master on/off toggle */}
            <button
              onClick={toggleNotif}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium
                ${notifEnabled
                  ? 'bg-violet-600/20 text-violet-300 border-violet-500/30 hover:bg-violet-600/30'
                  : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
                }`}
              title={notifEnabled ? 'Disable all prayer reminders' : 'Enable all prayer reminders'}
            >
              {notifEnabled ? <Bell size={12} /> : <BellOff size={12} />}
              {notifEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Set the time for each prayer — you'll get a browser notification when it's time. 🕌
        </p>

        <div className="space-y-2">
          {PRAYER_NAMES.map(({ id, label, arabicName }) => {
            const isNext = nextPrayer?.id === id
            return (
              <div
                key={id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                  ${isNext ? 'border-violet-500/50 bg-violet-900/20' : 'border-slate-700/40 bg-slate-800/40'}`}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-slate-500">{arabicName}</p>
                </div>
                {isNext && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium animate-pulse">
                    Next
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <input
                    id={`prayer-time-${id}`}
                    type="time"
                    value={prayerTimes[id] || DEFAULT_TIMES[id] || ''}
                    onChange={e => updateTime(id, e.target.value)}
                    disabled={!notifEnabled}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white
                      focus:outline-none focus:border-violet-500 transition-colors
                      disabled:opacity-40 disabled:cursor-not-allowed
                      [color-scheme:dark]"
                  />
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-slate-500 mt-3">
          Times are saved automatically. Make sure to click "Allow" for browser notifications.
        </p>
      </div>

      {/* Today's Prayers — Mark Status */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-4">Mark Today's Prayers</h3>
        <div className="space-y-3">
          {PRAYER_NAMES.map(({ id, label, time, arabicName }) => {
            const status = state.prayers[today]?.[id] || 'pending'
            const reminderTime = prayerTimes[id] || time
            return (
              <div
                key={id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${STATUS_BORDER[status]}`}
                onClick={() => handlePrayer(id, status)}
              >
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white">{label}</span>
                    <span className="text-xs text-slate-500">{arabicName}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    <Clock size={10} className="inline mr-1" />{formatTime12(reminderTime)}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {PRAYER_STATUS_CYCLE.filter(s => s !== 'pending').map(s => (
                    <button
                      key={s}
                      onClick={e => { e.stopPropagation(); dispatch({ type: 'UPDATE_PRAYER', payload: { date: today, prayerId: id, status: s } }) }}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                        status === s
                          ? s === 'completed' ? 'bg-green-500 text-white' :
                            s === 'qadha' ? 'bg-yellow-500 text-black' :
                            'bg-red-500 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {s === 'completed' ? '✓' : s === 'qadha' ? 'Q' : '✗'}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-3 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Completed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />Qadha</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Missed</span>
        </div>
      </div>

      {/* Streak */}
      <StreakCard current={streak.current} best={streak.best} label="Prayer Streak" />

      {/* Monthly Calendar */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-4">Monthly Prayer Calendar</h3>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: (new Date(yearMonth + '-01').getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {monthDays.map(d => {
            const s = getPrayerStats(state.prayers, d)
            const isToday = d === today
            const bgColor =
              s.completed === 5 ? 'bg-green-500/80' :
              s.completed >= 3 ? 'bg-yellow-500/70' :
              s.completed > 0 ? 'bg-orange-500/60' :
              s.total > 0 ? 'bg-red-500/50' : 'bg-slate-700/50'

            return (
              <div
                key={d}
                title={`${d}: ${s.completed}/5 prayers`}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all
                  ${bgColor}
                  ${isToday ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''}
                  ${s.completed > 0 ? 'text-white' : 'text-slate-500'}
                `}
              >
                {d.split('-')[2].replace(/^0/, '')}
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/80" />5/5 Complete</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500/70" />3-4/5</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500/60" />1-2/5</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/50" />Missed</span>
        </div>
      </div>
    </div>
  )
}
