import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import Modal from '../components/shared/Modal.jsx'
import StreakCard from '../components/shared/StreakCard.jsx'
import { getGymStreak, getGymCount } from '../utils/calculations.js'
import { toDateStr, pastDays, getWeekDates, daysInMonth, currentMonth } from '../utils/dateHelpers.js'
import { WORKOUT_TYPES } from '../data/categories.js'
import { nanoid } from '../utils/nanoid.js'
import { Dumbbell, Plus, CheckCircle, XCircle } from 'lucide-react'

export default function Fitness() {
  const { state, dispatch } = useApp()
  const [showWorkout, setShowWorkout] = useState(false)
  const [workoutForm, setWorkoutForm] = useState({
    workoutType: WORKOUT_TYPES[0], durationMins: 60, caloriesBurned: 300, notes: ''
  })
  const today = toDateStr()
  const weekDates = getWeekDates()
  const monthDays = daysInMonth(currentMonth())

  const gymToday = state.gymLogs[today]
  const isDoneToday = gymToday?.done

  const streak = useMemo(() => getGymStreak(state.gymLogs), [state.gymLogs])
  const weekCount = useMemo(() => getGymCount(state.gymLogs, weekDates), [state.gymLogs, weekDates])
  const monthCount = useMemo(() => getGymCount(state.gymLogs, monthDays), [state.gymLogs, monthDays])

  const handleGymToggle = () => {
    if (!isDoneToday) {
      setShowWorkout(true)
    } else {
      dispatch({ type: 'UPDATE_GYM_LOG', payload: { date: today, data: { done: false } } })
    }
  }

  const handleSaveWorkout = () => {
    dispatch({ type: 'UPDATE_GYM_LOG', payload: { date: today, data: { done: true, ...workoutForm } } })
    setShowWorkout(false)
  }

  // History (last 14 days)
  const history = pastDays(14).reverse().filter(d => state.gymLogs[d]?.done)

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Today check-in */}
      <div className={`rounded-2xl p-6 border transition-all cursor-pointer ${isDoneToday
        ? 'bg-green-900/30 border-green-700/40'
        : 'bg-slate-800/60 border-slate-700/40 hover:border-green-500/40'
      }`} onClick={handleGymToggle}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${isDoneToday ? 'bg-green-500/20' : 'bg-slate-700'}`}>
            💪
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-white">GYM TODAY</p>
            {isDoneToday ? (
              <div>
                <p className="text-green-400 font-semibold">✓ Completed!</p>
                {gymToday.workoutType && <p className="text-xs text-slate-400">{gymToday.workoutType} · {gymToday.durationMins}min · {gymToday.caloriesBurned} kcal</p>}
              </div>
            ) : (
              <p className="text-slate-400">Tap to mark gym as completed</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 ${isDoneToday ? 'border-green-500 bg-green-500' : 'border-slate-600'}`}>
            {isDoneToday ? '✓' : '○'}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 bg-slate-800/60 border border-slate-700/40 text-center">
          <p className="text-xs text-slate-400 mb-1">This Week</p>
          <p className="text-2xl font-bold text-white">{weekCount}</p>
          <p className="text-xs text-slate-500">/ 7 days</p>
        </div>
        <div className="rounded-2xl p-4 bg-slate-800/60 border border-slate-700/40 text-center">
          <p className="text-xs text-slate-400 mb-1">This Month</p>
          <p className="text-2xl font-bold text-white">{monthCount}</p>
          <p className="text-xs text-slate-500">/ {monthDays.length} days</p>
        </div>
        <div className="rounded-2xl p-4 bg-slate-800/60 border border-slate-700/40 text-center">
          <p className="text-xs text-slate-400 mb-1">Streak</p>
          <p className="text-2xl font-bold text-orange-400">🔥{streak.current}</p>
          <p className="text-xs text-slate-500">days</p>
        </div>
      </div>

      {/* Monthly calendar */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-4">Monthly Attendance</h3>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-slate-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: (new Date(currentMonth() + '-01').getDay() + 6) % 7 }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {monthDays.map(d => {
            const done = state.gymLogs[d]?.done
            const isToday = d === today
            return (
              <div key={d} title={d}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                  ${done ? 'bg-green-500/80 text-white' : 'bg-slate-700/50 text-slate-500'}
                  ${isToday ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''}
                `}
              >
                {d.split('-')[2].replace(/^0/, '')}
              </div>
            )
          })}
        </div>
      </div>

      <StreakCard current={streak.current} best={streak.best} label="Gym Streak" />

      {/* History */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-4">Recent Workouts</h3>
        {history.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">
            <Dumbbell size={28} className="mx-auto mb-2 text-slate-600" />
            <p>No workouts logged yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 10).map(d => {
              const log = state.gymLogs[d]
              return (
                <div key={d} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700/60">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-sm">💪</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{log.workoutType || 'Workout'}</p>
                    <p className="text-xs text-slate-500">{d}</p>
                  </div>
                  <div className="text-right">
                    {log.durationMins && <p className="text-xs text-green-400">{log.durationMins}min</p>}
                    {log.caloriesBurned && <p className="text-xs text-slate-500">{log.caloriesBurned} kcal</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Workout modal */}
      <Modal isOpen={showWorkout} onClose={() => setShowWorkout(false)} title="Log Today's Workout">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Workout Type</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              value={workoutForm.workoutType} onChange={e => setWorkoutForm(f => ({ ...f, workoutType: e.target.value }))}>
              {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Duration (min)</label>
              <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={workoutForm.durationMins} onChange={e => setWorkoutForm(f => ({ ...f, durationMins: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Calories Burned</label>
              <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={workoutForm.caloriesBurned} onChange={e => setWorkoutForm(f => ({ ...f, caloriesBurned: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
            <textarea rows="2" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="Optional..." value={workoutForm.notes} onChange={e => setWorkoutForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowWorkout(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">Skip Details</button>
            <button onClick={handleSaveWorkout} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition-colors">Mark Done ✓</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
