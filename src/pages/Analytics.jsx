import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend
} from 'recharts'
import { pastDays, formatDateShort, toDateStr } from '../utils/dateHelpers.js'
import {
  getDailyScore, getStudyMinutes, getWaterMl, getPrayerStats,
  getDayHabitCompletion
} from '../utils/calculations.js'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
}

function TrendBadge({ value, compare }) {
  if (value > compare) return (
    <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
      <TrendingUp size={12} /> +{(value - compare).toFixed(0)}
    </span>
  )
  if (value < compare) return (
    <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
      <TrendingDown size={12} /> {(value - compare).toFixed(0)}
    </span>
  )
  return <span className="flex items-center gap-1 text-slate-500 text-xs"><Minus size={12} /> No change</span>
}

export default function Analytics() {
  const { state } = useApp()

  const last30 = pastDays(30)
  const last7 = pastDays(7)
  const prev7 = pastDays(14).slice(0, 7)

  const chartData = useMemo(() => last30.map(d => ({
    day: formatDateShort(d).replace(' ', '\n'),
    score: getDailyScore(d, {
      prayers: state.prayers, studySessions: state.studySessions,
      gymLogs: state.gymLogs, waterLogs: state.waterLogs,
      habitLogs: state.habitLogs, habits: state.habits,
      settings: state.settings, selfCare: state.selfCare,
    }),
    study: parseFloat((getStudyMinutes(state.studySessions, d) / 60).toFixed(1)),
    water: parseFloat((getWaterMl(state.waterLogs, d) / 1000).toFixed(2)),
    habits: getDayHabitCompletion(state.habitLogs, state.habits, d),
    prayer: getPrayerStats(state.prayers, d).percentage,
    gym: state.gymLogs[d]?.done ? 1 : 0,
  })), [state, last30])

  const this7 = chartData.slice(-7)
  const thatPrev7 = useMemo(() => prev7.map(d => ({
    score: getDailyScore(d, {
      prayers: state.prayers, studySessions: state.studySessions,
      gymLogs: state.gymLogs, waterLogs: state.waterLogs,
      habitLogs: state.habitLogs, habits: state.habits,
      settings: state.settings, selfCare: state.selfCare,
    }),
    study: getStudyMinutes(state.studySessions, d) / 60,
    habits: getDayHabitCompletion(state.habitLogs, state.habits, d),
    prayer: getPrayerStats(state.prayers, d).percentage,
  })), [state, prev7])

  const avg = (arr, key) => arr.reduce((s, x) => s + (x[key] || 0), 0) / arr.length

  const thisScore = avg(this7, 'score')
  const prevScore = avg(thatPrev7, 'score')
  const thisStudy = avg(this7, 'study')
  const prevStudy = avg(thatPrev7, 'study')
  const thisHabits = avg(this7, 'habits')
  const prevHabits = avg(thatPrev7, 'habits')
  const thisPrayer = avg(this7, 'prayer')
  const prevPrayer = avg(thatPrev7, 'prayer')
  const gymWeek = this7.filter(d => d.gym).length
  const gymPrev = thatPrev7.reduce((s, d, i) => s + (state.gymLogs[prev7[i]]?.done ? 1 : 0), 0)

  const summaryCards = [
    { label: 'Avg Daily Score', value: `${thisScore.toFixed(0)}%`, compare: prevScore, color: 'text-indigo-400' },
    { label: 'Avg Study / Day', value: `${thisStudy.toFixed(1)}h`, compare: prevStudy, color: 'text-blue-400' },
    { label: 'Habit Completion', value: `${thisHabits.toFixed(0)}%`, compare: prevHabits, color: 'text-violet-400' },
    { label: 'Prayer Rate', value: `${thisPrayer.toFixed(0)}%`, compare: prevPrayer, color: 'text-purple-400' },
    { label: 'Gym Sessions', value: `${gymWeek}/7`, compare: gymPrev, color: 'text-green-400' },
  ]

  return (
    <div className="space-y-6 pb-24 md:pb-6">

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {summaryCards.map(({ label, value, compare, color }) => (
          <div key={label} className="rounded-2xl p-4 bg-slate-800/60 border border-slate-700/40">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <div className="mt-1">
              <TrendBadge value={parseFloat(value)} compare={compare} />
            </div>
          </div>
        ))}
      </div>

      {/* Daily Score — 30 day line */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-4">Daily Score — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
              interval={4} />
            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_STYLE} formatter={v => [`${v}%`, 'Score']} />
            <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2}
              dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Study vs Habits — 30 day */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-4">Study Hours & Habits — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Line type="monotone" dataKey="study" name="Study (h)" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="habits" name="Habits (%)" stroke="#a78bfa" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Prayer & Water bars — last 7 days */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-4">Prayer & Water — This Week</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={this7} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Bar dataKey="prayer" name="Prayer (%)" fill="#a78bfa" radius={[4, 4, 0, 0]} opacity={0.85} />
            <Bar dataKey="water" name="Water (L)" fill="#06b6d4" radius={[4, 4, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gym attendance — last 30 days dots */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-3">Gym Attendance — Last 30 Days</h3>
        <div className="grid grid-cols-10 gap-1.5">
          {last30.map(d => {
            const done = state.gymLogs[d]?.done
            const isToday = d === toDateStr()
            return (
              <div
                key={d}
                title={d}
                className={`aspect-square rounded-lg transition-all
                  ${done ? 'bg-green-500/80' : 'bg-slate-700/50'}
                  ${isToday ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''}
                `}
              />
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/80" /> Gym done</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-700/50" /> Rest day</span>
        </div>
      </div>

    </div>
  )
}
