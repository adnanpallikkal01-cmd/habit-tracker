import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart, BookOpen, Dumbbell, Droplets, Wallet,
  PiggyBank, Flame, Star, TrendingUp, Calendar
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import StatCard from '../components/shared/StatCard.jsx'
import StreakCard from '../components/shared/StreakCard.jsx'
import ProgressRing from '../components/shared/ProgressRing.jsx'
import {
  getPrayerStats, getPrayerStreak, getDayHabitCompletion,
  getStudyMinutes, getGymStreak, getWaterMl, getFinanceTotals,
  getDailyScore, getWeeklyHabitCompletion, getGymCount
} from '../utils/calculations.js'
import { toDateStr, getWeekDates, formatDateShort, startOfMonth } from '../utils/dateHelpers.js'

export default function Dashboard() {
  const { state } = useApp()
  const navigate = useNavigate()
  const today = toDateStr()
  const weekDates = getWeekDates()
  const monthStart = startOfMonth()

  const prayerStats = useMemo(() => getPrayerStats(state.prayers, today), [state.prayers, today])
  const prayerStreak = useMemo(() => getPrayerStreak(state.prayers), [state.prayers])

  const habitCompletion = useMemo(() =>
    getDayHabitCompletion(state.habitLogs, state.habits, today),
    [state.habitLogs, state.habits, today]
  )
  const weeklyHabitCompletion = useMemo(() =>
    getWeeklyHabitCompletion(state.habitLogs, state.habits),
    [state.habitLogs, state.habits]
  )

  const studyMins = useMemo(() => getStudyMinutes(state.studySessions, today), [state.studySessions, today])
  const studyHours = (studyMins / 60).toFixed(1)

  const gymToday = state.gymLogs[today]?.done
  const gymStreak = useMemo(() => getGymStreak(state.gymLogs), [state.gymLogs])
  const gymWeek = useMemo(() => getGymCount(state.gymLogs, weekDates), [state.gymLogs, weekDates])

  const waterMl = useMemo(() => getWaterMl(state.waterLogs, today), [state.waterLogs, today])
  const waterTarget = state.settings?.dailyWaterTarget || 3000
  const waterPct = Math.round((waterMl / waterTarget) * 100)

  const finance = useMemo(() =>
    getFinanceTotals(state.transactions, monthStart, today),
    [state.transactions, monthStart, today]
  )

  const dailyScore = useMemo(() =>
    getDailyScore(today, {
      prayers: state.prayers,
      studySessions: state.studySessions,
      gymLogs: state.gymLogs,
      waterLogs: state.waterLogs,
      habitLogs: state.habitLogs,
      habits: state.habits,
      settings: state.settings,
      selfCare: state.selfCare,
    }),
    [state, today]
  )

  const currency = state.settings?.currency || '₹'

  // Weekly overview chart data
  const weeklyData = weekDates.map(d => ({
    day: formatDateShort(d).split(' ')[0],
    date: d,
    score: getDailyScore(d, {
      prayers: state.prayers, studySessions: state.studySessions,
      gymLogs: state.gymLogs, waterLogs: state.waterLogs,
      habitLogs: state.habitLogs, habits: state.habits,
      settings: state.settings, selfCare: state.selfCare,
    })
  }))

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Daily Score Hero */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-900/60 to-violet-900/40 border border-indigo-700/30 animate-fadeIn">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-indigo-300 font-medium mb-1">Today's Personal Score</p>
            <div className="mb-4 flex items-center gap-2 sm:gap-3">
              <span className="text-4xl font-bold text-white sm:text-5xl">{dailyScore}</span>
              <span className="text-xl font-light text-indigo-300 sm:text-2xl">/ 100</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Today's Progress</span>
                <span className="text-white font-medium">{habitCompletion}% habits</span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full progress-bar"
                  style={{ width: `${dailyScore}%` }}
                />
              </div>
            </div>
          </div>
          <ProgressRing
            percentage={dailyScore}
            size={100}
            strokeWidth={8}
            color="#6366f1"
            trackColor="#1e293b"
            label={`${dailyScore}%`}
            sublabel="score"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Habits Done"
          value={`${habitCompletion}%`}
          subtitle={`${weeklyHabitCompletion}% this week`}
          icon={Star}
          gradient="bg-indigo-500"
          className="stagger-1"
          onClick={() => navigate('/habits')}
        />
        <StatCard
          title="Prayer"
          value={`${prayerStats.completed}/5`}
          subtitle={`${prayerStats.percentage}% today`}
          icon={Heart}
          gradient="bg-violet-500"
          className="stagger-2"
          onClick={() => navigate('/prayer')}
        />
        <StatCard
          title="Study"
          value={`${studyHours}h`}
          subtitle={`Target: ${state.settings?.dailyStudyTarget || 4}h`}
          icon={BookOpen}
          gradient="bg-blue-500"
          className="stagger-3"
          onClick={() => navigate('/study')}
        />
        <StatCard
          title="Gym"
          value={gymToday ? '✓ Done' : '✗ Not yet'}
          subtitle={`${gymWeek}/7 this week`}
          icon={Dumbbell}
          gradient="bg-green-500"
          className="stagger-4"
          onClick={() => navigate('/fitness')}
        />
        <StatCard
          title="Water"
          value={`${(waterMl / 1000).toFixed(1)}L`}
          subtitle={`${waterPct}% of ${(waterTarget/1000).toFixed(1)}L target`}
          icon={Droplets}
          gradient="bg-cyan-500"
          className="stagger-5"
          onClick={() => navigate('/water')}
        />
        <StatCard
          title="Spent Today"
          value={`${currency}${state.transactions.filter(t => t.date === today && t.type === 'expense').reduce((s,t) => s+t.amount, 0).toLocaleString()}`}
          subtitle="Today's expenses"
          icon={Wallet}
          gradient="bg-red-500"
          className="stagger-6"
          onClick={() => navigate('/finance')}
        />
        <StatCard
          title="Saved"
          value={`${currency}${finance.savings.toLocaleString()}`}
          subtitle={`${finance.savingsRate}% rate`}
          icon={PiggyBank}
          trend={finance.savings > 0 ? 'up' : 'down'}
          trendLabel={`${finance.savingsRate}% savings rate`}
          gradient="bg-emerald-500"
          className="stagger-7"
          onClick={() => navigate('/finance')}
        />
        <StatCard
          title="Streak"
          value={`🔥 ${gymStreak.current}`}
          subtitle={`Best: ${gymStreak.best} days`}
          icon={Flame}
          gradient="bg-orange-500"
          className="stagger-8"
          onClick={() => navigate('/fitness')}
        />
      </div>

      {/* Weekly Overview */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40 animate-fadeIn stagger-3">
        <h2 className="text-sm font-semibold text-white mb-4">Weekly Overview</h2>
        <div className="flex items-end gap-2 h-24">
          {weeklyData.map(({ day, date, score }) => {
            const isToday = date === today
            const height = Math.max(8, score)
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-slate-500 font-medium">{score}%</div>
                <div className="w-full flex items-end" style={{ height: 64 }}>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                        : score >= 70
                          ? 'bg-indigo-700/60'
                          : score >= 40
                            ? 'bg-yellow-700/60'
                            : 'bg-slate-700/60'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <div className={`text-xs font-medium ${isToday ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {day}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Prayer Summary */}
        <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40 animate-fadeIn cursor-pointer hover:border-violet-500/40 transition-colors" onClick={() => navigate('/prayer')}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Prayer Today</h3>
            <span className="text-xs text-slate-500">Streak: {prayerStreak.current}🔥</span>
          </div>
          <div className="flex gap-2">
            {['fajr','dhuhr','asr','maghrib','isha'].map(p => {
              const s = state.prayers[today]?.[p]
              return (
                <div key={p} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium
                  ${s === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    s === 'qadha' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    s === 'missed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-slate-700 text-slate-500'}`}>
                  {p.charAt(0).toUpperCase()}
                </div>
              )
            })}
          </div>
          <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full progress-bar" style={{ width: `${prayerStats.percentage}%` }} />
          </div>
        </div>

        {/* Finance Summary */}
        <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40 animate-fadeIn cursor-pointer hover:border-emerald-500/40 transition-colors" onClick={() => navigate('/finance')}>
          <h3 className="text-sm font-semibold text-white mb-3">Finance This Month</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Income</span>
              <span className="text-xs font-semibold text-green-400">{currency}{finance.income.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Expenses</span>
              <span className="text-xs font-semibold text-red-400">{currency}{finance.expenses.toLocaleString()}</span>
            </div>
            <div className="h-px bg-slate-700 my-1" />
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Savings</span>
              <span className="text-xs font-bold text-white">{currency}{finance.savings.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full progress-bar" style={{ width: `${Math.min(100, finance.savingsRate)}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">{finance.savingsRate}% savings rate</p>
        </div>

        {/* Study + Gym */}
        <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40 animate-fadeIn">
          <h3 className="text-sm font-semibold text-white mb-3">Health & Study</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-blue-400" />
                <span className="text-xs text-slate-400">Study</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (studyMins / ((state.settings?.dailyStudyTarget || 4) * 60)) * 100)}%` }} />
                </div>
                <span className="text-xs text-white w-8 text-right">{studyHours}h</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell size={14} className="text-green-400" />
                <span className="text-xs text-slate-400">Gym</span>
              </div>
              <span className={`text-xs font-medium ${gymToday ? 'text-green-400' : 'text-slate-500'}`}>
                {gymToday ? '✓ Completed' : '○ Not yet'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets size={14} className="text-cyan-400" />
                <span className="text-xs text-slate-400">Water</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, waterPct)}%` }} />
                </div>
                <span className="text-xs text-white w-8 text-right">{waterPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StreakCard current={prayerStreak.current} best={prayerStreak.best} label="Prayer Streak" />
        <StreakCard current={gymStreak.current} best={gymStreak.best} label="Gym Streak" />
      </div>
    </div>
  )
}
