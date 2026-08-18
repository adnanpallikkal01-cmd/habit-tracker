import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import Modal from '../components/shared/Modal.jsx'
import {
  getPrayerStats, getDayHabitCompletion, getStudyMinutes,
  getWaterMl, getDailyScore
} from '../utils/calculations.js'
import { toDateStr, daysInMonth, currentMonth, pastDays, formatDateFull } from '../utils/dateHelpers.js'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PRAYER_NAMES } from '../data/categories.js'

function getDayColor(score) {
  if (score === null) return 'bg-slate-800/50 text-slate-600'
  if (score >= 80) return 'bg-green-500/80 text-white'
  if (score >= 50) return 'bg-yellow-500/70 text-black'
  if (score > 0) return 'bg-red-500/60 text-white'
  return 'bg-slate-700/70 text-slate-400'
}

export default function Calendar() {
  const { state } = useApp()
  const [yearMonth, setYearMonth] = useState(currentMonth())
  const [selectedDay, setSelectedDay] = useState(null)
  const today = toDateStr()

  const monthDays = daysInMonth(yearMonth)

  const dayScores = useMemo(() => {
    const scores = {}
    monthDays.forEach(d => {
      if (d > today) { scores[d] = null; return }
      const hasAnyData = state.prayers[d] || state.gymLogs[d] || state.waterLogs[d] || state.studySessions.some(s => s.date === d)
      if (!hasAnyData) { scores[d] = 0; return }
      scores[d] = getDailyScore(d, {
        prayers: state.prayers, studySessions: state.studySessions,
        gymLogs: state.gymLogs, waterLogs: state.waterLogs,
        habitLogs: state.habitLogs, habits: state.habits,
        settings: state.settings, selfCare: state.selfCare,
      })
    })
    return scores
  }, [state, monthDays, today])

  const prevMonth = () => {
    const [y, m] = yearMonth.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const nextMonth = () => {
    const [y, m] = yearMonth.split('-').map(Number)
    const d = new Date(y, m, 1)
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthName = new Date(yearMonth + '-15').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const firstDayOffset = (new Date(yearMonth + '-01').getDay() + 6) % 7

  // Day detail
  const dayDetail = useMemo(() => {
    if (!selectedDay) return null
    const prayerStats = getPrayerStats(state.prayers, selectedDay)
    const habitPct = getDayHabitCompletion(state.habitLogs, state.habits, selectedDay)
    const studyMins = getStudyMinutes(state.studySessions, selectedDay)
    const waterMl = getWaterMl(state.waterLogs, selectedDay)
    const gymDone = state.gymLogs[selectedDay]?.done
    const expenses = state.transactions
      .filter(t => t.date === selectedDay && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)
    const score = dayScores[selectedDay]
    return { prayerStats, habitPct, studyMins, waterMl, gymDone, expenses, score }
  }, [selectedDay, state, dayScores])

  const currency = state.settings?.currency || '₹'

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-bold text-white">{monthName}</h2>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl p-4 bg-slate-800/60 border border-slate-700/40">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e-${i}`} />)}
          {monthDays.map(d => {
            const score = dayScores[d]
            const isToday = d === today
            const isFuture = d > today
            const dayNum = d.split('-')[2].replace(/^0/, '')

            return (
              <button
                key={d}
                onClick={() => !isFuture && setSelectedDay(d)}
                title={`${d}: Score ${score}%`}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all
                  ${isFuture ? 'bg-slate-800/30 text-slate-700 cursor-default' : getDayColor(score)}
                  ${isToday ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''}
                  ${!isFuture ? 'hover:opacity-90 cursor-pointer hover:scale-105' : ''}
                `}
              >
                <span>{dayNum}</span>
                {!isFuture && score !== null && score > 0 && (
                  <span className="text-[9px] opacity-80 mt-0.5">{score}%</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 flex-wrap justify-center">
          <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-3 rounded bg-green-500/80" />Excellent (80%+)</span>
          <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-3 rounded bg-yellow-500/70" />Partial (50-79%)</span>
          <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-3 rounded bg-red-500/60" />Poor (&lt;50%)</span>
          <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-3 rounded bg-slate-700/70" />No data</span>
        </div>
      </div>

      {/* Day detail modal */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? formatDateFull(selectedDay) : ''}
        size="md"
      >
        {dayDetail && (
          <div className="space-y-4">
            {/* Score */}
            <div className="text-center p-4 rounded-xl bg-slate-800/80">
              <p className="text-4xl font-bold text-white">{dayDetail.score}%</p>
              <p className="text-slate-400 text-sm">Daily Score</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3 bg-violet-500/10 border border-violet-500/20">
                <p className="text-xs text-violet-300 mb-1">Prayer</p>
                <p className="text-lg font-bold text-white">{dayDetail.prayerStats.completed}/5</p>
                <p className="text-xs text-slate-500">{dayDetail.prayerStats.percentage}%</p>
              </div>
              <div className="rounded-xl p-3 bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-300 mb-1">Study</p>
                <p className="text-lg font-bold text-white">{(dayDetail.studyMins/60).toFixed(1)}h</p>
                <p className="text-xs text-slate-500">{dayDetail.studyMins}min</p>
              </div>
              <div className="rounded-xl p-3 bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-300 mb-1">Gym</p>
                <p className="text-lg font-bold text-white">{dayDetail.gymDone ? '✓' : '✗'}</p>
                <p className="text-xs text-slate-500">{dayDetail.gymDone ? 'Completed' : 'Missed'}</p>
              </div>
              <div className="rounded-xl p-3 bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-xs text-cyan-300 mb-1">Water</p>
                <p className="text-lg font-bold text-white">{(dayDetail.waterMl/1000).toFixed(1)}L</p>
                <p className="text-xs text-slate-500">{dayDetail.waterMl}ml</p>
              </div>
              <div className="rounded-xl p-3 bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-xs text-indigo-300 mb-1">Habits</p>
                <p className="text-lg font-bold text-white">{dayDetail.habitPct}%</p>
                <p className="text-xs text-slate-500">completion</p>
              </div>
              <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-300 mb-1">Expenses</p>
                <p className="text-lg font-bold text-white">{currency}{dayDetail.expenses.toLocaleString()}</p>
                <p className="text-xs text-slate-500">spent</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
