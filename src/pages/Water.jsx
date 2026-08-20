import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import ProgressRing from '../components/shared/ProgressRing.jsx'
import StreakCard from '../components/shared/StreakCard.jsx'
import { getWaterMl, getWaterStreak } from '../utils/calculations.js'
import { toDateStr, pastDays, formatDateShort } from '../utils/dateHelpers.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Droplets, Bell, BellOff } from 'lucide-react'
import { requestNotificationPermission } from '../hooks/usePrayerReminders.js'

const QUICK_ADD = [
  { ml: 250, label: '+250ml' },
  { ml: 500, label: '+500ml' },
  { ml: 750, label: '+750ml' },
  { ml: 1000, label: '+1L' },
]

export default function Water() {
  const { state, dispatch } = useApp()
  const today = toDateStr()
  const target = state.settings?.dailyWaterTarget || 3000
  const currentMl = getWaterMl(state.waterLogs, today)
  const percentage = Math.min(100, Math.round((currentMl / target) * 100))
  const reminderEnabled = state.settings?.waterReminderEnabled ?? false
  const reminderInterval = Math.max(5, Number(state.settings?.waterReminderIntervalMinutes || 15))
  const nightPause = state.settings?.waterReminderNightPauseEnabled ?? true
  const nightStart = state.settings?.waterReminderNightStart || '22:00'
  const nightEnd = state.settings?.waterReminderNightEnd || '06:00'

  const streak = useMemo(() => getWaterStreak(state.waterLogs, target), [state.waterLogs, target])

  const addWater = (ml) => dispatch({ type: 'ADD_WATER', payload: { date: today, amount: ml } })
  const resetWater = () => dispatch({ type: 'SET_WATER', payload: { date: today, amount: 0 } })

  const toggleReminder = async () => {
    if (!reminderEnabled) {
      // Request permission first
      await requestNotificationPermission()
    }
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { waterReminderEnabled: !reminderEnabled }
    })
  }

  const chartData = pastDays(7).map(d => ({
    day: formatDateShort(d).split(' ')[0],
    litres: parseFloat((getWaterMl(state.waterLogs, d) / 1000).toFixed(2)),
    isToday: d === today,
  }))

  const ringColor = percentage >= 100 ? '#22c55e' : percentage >= 66 ? '#06b6d4' : percentage >= 33 ? '#f59e0b' : '#ef4444'

  return (
    <div className="space-y-6 pb-24 md:pb-6">

      {/* Main ring */}
      <div className="rounded-2xl p-8 bg-gradient-to-br from-cyan-900/40 to-blue-900/30 border border-cyan-700/30 flex flex-col items-center">
        <ProgressRing
          percentage={percentage}
          size={160}
          strokeWidth={14}
          color={ringColor}
          trackColor="#1e293b"
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{(currentMl / 1000).toFixed(2)}</p>
            <p className="text-cyan-300 text-sm">Litres</p>
            <p className="text-slate-400 text-xs mt-0.5">of {(target / 1000).toFixed(1)}L</p>
          </div>
        </ProgressRing>

        <p className="mt-4 text-lg font-semibold text-white">
          {percentage >= 100 ? '🎉 Target Reached!' : `${(target - currentMl) > 0 ? `${((target - currentMl) / 1000).toFixed(2)}L remaining` : 'Done!'}`}
        </p>
        <p className="text-cyan-300 text-sm">{percentage}% of daily target</p>
      </div>

      {/* Quick add */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK_ADD.map(({ ml, label }) => (
          <button
            key={ml}
            id={`water-add-${ml}`}
            onClick={() => addWater(ml)}
            className="py-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-semibold hover:bg-cyan-500/25 transition-all active:scale-95 text-sm"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Reset */}
      <div className="flex gap-3">
        <button
          onClick={resetWater}
          className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-sm font-medium hover:text-white hover:border-slate-600 transition-colors"
        >
          Reset Today
        </button>
      </div>

      {/* Water Reminder toggle */}
      <div className="rounded-2xl p-4 bg-slate-800/60 border border-slate-700/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Droplets size={15} className="text-cyan-400" />
              Water Reminder
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {reminderEnabled
                ? `🔔 You\'ll get a notification every ${reminderInterval} minutes`
                : `Get notified every ${reminderInterval} minutes to drink water`}
            </p>
          </div>
          <button
            id="water-reminder-toggle"
            onClick={toggleReminder}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all
              ${reminderEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600 hover:text-white'
              }`}
          >
            {reminderEnabled
              ? <><Bell size={14} /> On</>
              : <><BellOff size={14} /> Off</>
            }
          </button>
        </div>
        {reminderEnabled && (
          <p className="text-xs text-cyan-600 mt-2">
            💡 Reminders continue in the background when enabled. {nightPause ? `Night pause: ${nightStart}–${nightEnd}.` : 'Night pause is off.'}
          </p>
        )}
      </div>

      {/* Target setting */}
      <div className="rounded-2xl p-4 bg-slate-800/60 border border-slate-700/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Daily Target</p>
            <p className="text-xs text-slate-400">Set in Profile settings</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-cyan-400">{(target / 1000).toFixed(1)}L</p>
            <p className="text-xs text-slate-500">{target}ml</p>
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-4">Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <ReferenceLine y={target / 1000} stroke="#06b6d4" strokeDasharray="4 2" strokeWidth={1} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#22d3ee' }}
              formatter={(v) => [`${v}L`, 'Water']}
            />
            <Bar dataKey="litres" radius={[4, 4, 0, 0]} fill="#06b6d4" opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-500 mt-1 text-center">Dashed line = {(target/1000).toFixed(1)}L target</p>
      </div>

      <StreakCard current={streak.current} best={streak.best} label="Water Streak" />
    </div>
  )
}
