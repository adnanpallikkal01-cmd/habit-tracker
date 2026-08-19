import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import CheckItem from '../components/shared/CheckItem.jsx'
import ProgressRing from '../components/shared/ProgressRing.jsx'
import { toDateStr } from '../utils/dateHelpers.js'
import {
  getPrayerStats, getDayHabitCompletion, getStudyMinutes,
  getWaterMl, getDailyScore
} from '../utils/calculations.js'
import { SELF_CARE_ITEMS, PRAYER_NAMES } from '../data/categories.js'
import { ChevronDown, Droplets, Plus } from 'lucide-react'

const STATUS_CYCLE = ['pending', 'completed', 'partial', 'missed', 'na']
const PRAYER_STATUS_CYCLE = ['pending', 'completed', 'qadha', 'missed']

export default function Today({ embedded = false }) {
  const { state, dispatch } = useApp()
  const today = toDateStr()
  const [expandedSections, setExpandedSections] = useState({
    prayers: true, habits: true, selfCare: true, water: true
  })

  const toggle = (key) => setExpandedSections(s => ({ ...s, [key]: !s[key] }))

  const prayerStats = useMemo(() => getPrayerStats(state.prayers, today), [state.prayers, today])
  const habitCompletion = useMemo(() => getDayHabitCompletion(state.habitLogs, state.habits, today), [state.habitLogs, state.habits, today])
  const studyMins = useMemo(() => getStudyMinutes(state.studySessions, today), [state.studySessions, today])
  const waterMl = useMemo(() => getWaterMl(state.waterLogs, today), [state.waterLogs, today])
  const waterTarget = state.settings?.dailyWaterTarget || 3000
  const gymDone = state.gymLogs[today]?.done

  const dailyScore = useMemo(() => getDailyScore(today, {
    prayers: state.prayers, studySessions: state.studySessions,
    gymLogs: state.gymLogs, waterLogs: state.waterLogs,
    habitLogs: state.habitLogs, habits: state.habits,
    settings: state.settings, selfCare: state.selfCare,
  }), [state, today])

  // Calculate overall today completion
  const allItems = [
    ...PRAYER_NAMES.map(p => (state.prayers[today]?.[p.id] === 'completed' ? 1 : 0)),
    ...state.habits.filter(h => h.active).map(h => state.habitLogs[today]?.[h.id] === 'completed' ? 1 : 0),
    ...SELF_CARE_ITEMS.map(i => state.selfCare[today]?.[i.id] ? 1 : 0),
    gymDone ? 1 : 0,
    waterMl >= waterTarget ? 1 : 0,
  ]
  const overallPct = allItems.length > 0
    ? Math.round((allItems.filter(Boolean).length / allItems.length) * 100)
    : 0

  const cycleStatus = (current, cycle) => {
    const idx = cycle.indexOf(current || cycle[0])
    return cycle[(idx + 1) % cycle.length]
  }

  const handlePrayer = (prayerId) => {
    const current = state.prayers[today]?.[prayerId] || 'pending'
    const next = cycleStatus(current, PRAYER_STATUS_CYCLE)
    dispatch({ type: 'UPDATE_PRAYER', payload: { date: today, prayerId, status: next } })
  }

  const handleHabit = (habitId) => {
    const current = state.habitLogs[today]?.[habitId] || 'pending'
    const next = cycleStatus(current, STATUS_CYCLE)
    dispatch({ type: 'TOGGLE_HABIT_LOG', payload: { date: today, habitId, status: next } })
  }

  const handleSelfCare = (itemId) => {
    dispatch({ type: 'TOGGLE_SELF_CARE', payload: { date: today, itemId } })
  }

  const handleGym = () => {
    dispatch({ type: 'UPDATE_GYM_LOG', payload: { date: today, data: { done: !gymDone } } })
  }

  const addWater = (ml) => {
    dispatch({ type: 'ADD_WATER', payload: { date: today, amount: ml } })
  }

  const Section = ({ id, title, badge, children }) => (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/40 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4"
        onClick={() => toggle(id)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{title}</span>
          {badge !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-medium">{badge}</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedSections[id] ? 'rotate-180' : ''}`} />
      </button>
      {expandedSections[id] && (
        <div className="px-5 pb-5 space-y-2">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className={`space-y-6 ${embedded ? '' : 'pb-24 md:pb-6'}`.trim()}>
      {/* Daily Score Hero */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-violet-900/40 border border-indigo-700/30">
        <ProgressRing
          percentage={overallPct}
          size={80}
          strokeWidth={7}
          color="#6366f1"
          label={`${overallPct}%`}
          sublabel="done"
        />
        <div>
          <p className="text-lg font-bold text-white">Today's Attendance</p>
          <p className="text-sm text-indigo-300">{allItems.filter(Boolean).length} of {allItems.length} items completed</p>
          <p className="text-xs text-slate-400 mt-1">Personal Score: <span className="text-white font-semibold">{dailyScore}/100</span></p>
        </div>
      </div>

      {/* Prayer */}
      <Section id="prayers" title="🕌 Prayers" badge={`${prayerStats.completed}/5`}>
        {PRAYER_NAMES.map(({ id, label, time }) => {
          const status = state.prayers[today]?.[id] || 'pending'
          return (
            <CheckItem
              key={id}
              label={label}
              subtitle={time}
              status={status === 'pending' ? 'pending' : status === 'completed' ? 'completed' : status === 'qadha' ? 'partial' : 'missed'}
              onChange={() => handlePrayer(id)}
            />
          )
        })}
      </Section>

      {/* Gym */}
      <div
        onClick={handleGym}
        className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all
          ${gymDone
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-slate-800/60 border-slate-700/40 hover:border-green-500/30'}`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${gymDone ? 'bg-green-500/20' : 'bg-slate-700'}`}>
          💪
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Gym Today</p>
          <p className={`text-xs font-medium ${gymDone ? 'text-green-400' : 'text-slate-400'}`}>
            {gymDone ? '✓ Completed — Great work!' : 'Tap to mark as completed'}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border transition-all
          ${gymDone ? 'bg-green-500 border-green-400 text-white' : 'bg-slate-700 border-slate-600 text-slate-500'}`}>
          {gymDone ? '✓' : '○'}
        </div>
      </div>

      {/* Water */}
      <Section id="water" title="💧 Water Intake" badge={`${(waterMl/1000).toFixed(1)}L / ${(waterTarget/1000).toFixed(1)}L`}>
        <div className="flex items-center gap-3 mb-3">
          <ProgressRing
            percentage={Math.min(100, Math.round((waterMl / waterTarget) * 100))}
            size={64}
            strokeWidth={6}
            color="#06b6d4"
            label={`${Math.round((waterMl / waterTarget) * 100)}%`}
          />
          <div className="flex-1">
            <p className="text-white font-bold">{(waterMl/1000).toFixed(2)}L consumed</p>
            <p className="text-slate-400 text-xs">{(waterTarget - waterMl) > 0 ? `${((waterTarget - waterMl)/1000).toFixed(2)}L remaining` : 'Target reached! 🎉'}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[250, 500, 750, 1000].map(ml => (
            <button
              key={ml}
              onClick={() => addWater(ml)}
              className="py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/25 transition-colors"
            >
              +{ml < 1000 ? `${ml}ml` : '1L'}
            </button>
          ))}
        </div>
      </Section>

      {/* Active Habits */}
      <Section id="habits" title="⭐ Habits" badge={`${habitCompletion}%`}>
        {state.habits.filter(h => h.active).length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">
            <p>No habits yet. Create some in the Habits section.</p>
          </div>
        ) : (
          state.habits.filter(h => h.active).map(habit => {
            const status = state.habitLogs[today]?.[habit.id] || 'pending'
            return (
              <CheckItem
                key={habit.id}
                icon={habit.icon}
                label={habit.name}
                subtitle={habit.target}
                status={status}
                onChange={() => handleHabit(habit.id)}
              />
            )
          })
        )}
      </Section>

      {/* Self Care */}
      <Section id="selfCare" title="✨ Self Care">
        <div className="grid grid-cols-2 gap-2">
          {SELF_CARE_ITEMS.map(item => {
            const done = state.selfCare[today]?.[item.id]
            return (
              <button
                key={item.id}
                onClick={() => handleSelfCare(item.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-sm
                  ${done
                    ? 'bg-green-500/15 border-green-500/30 text-green-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600'}`}
              >
                <span>{item.icon}</span>
                <span className="font-medium text-xs truncate">{item.label}</span>
                {done && <span className="ml-auto text-green-400">✓</span>}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Study quick info */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">📖 Study Today</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{(studyMins/60).toFixed(1)}h</p>
            <p className="text-xs text-slate-400">of {state.settings?.dailyStudyTarget || 4}h target</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-slate-700 flex items-center justify-center" style={{
            background: `conic-gradient(#3b82f6 ${Math.min(100, (studyMins/((state.settings?.dailyStudyTarget||4)*60))*100)}%, #1e293b 0)`
          }}>
            <span className="text-xs font-bold text-white">{Math.min(100, Math.round((studyMins/((state.settings?.dailyStudyTarget||4)*60))*100))}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
