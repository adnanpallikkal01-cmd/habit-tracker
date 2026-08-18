import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import HeatMap from '../components/shared/HeatMap.jsx'
import StreakCard from '../components/shared/StreakCard.jsx'
import Modal, { ConfirmModal } from '../components/shared/Modal.jsx'
import { getHabitStreak, getDayHabitCompletion } from '../utils/calculations.js'
import { toDateStr, pastDays, getWeekDates } from '../utils/dateHelpers.js'
import { HABIT_CATEGORIES, HABIT_FREQUENCIES } from '../data/categories.js'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Flame } from 'lucide-react'
import { nanoid } from '../utils/nanoid.js'

const ICONS = ['⭐','💪','📖','💧','🧘','⏰','😴','🥗','💻','🏃','🚿','🦷','💊','📝','🎯','🎵']
const DIFFICULTIES = ['easy', 'medium', 'hard']

function HabitForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    name: '', category: 'health', icon: '⭐', frequency: 'daily',
    target: '', reminderTime: '', difficulty: 'medium', active: true,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      {/* Icon */}
      <div>
        <label className="text-xs text-slate-400 mb-2 block">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(ico => (
            <button
              key={ico}
              onClick={() => set('icon', ico)}
              className={`w-9 h-9 text-lg rounded-lg transition-all ${form.icon === ico ? 'bg-indigo-500/40 ring-2 ring-indigo-500' : 'bg-slate-800 hover:bg-slate-700'}`}
            >
              {ico}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Habit Name *</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Wake Up Early"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Category</label>
        <select
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          value={form.category}
          onChange={e => set('category', e.target.value)}
        >
          {HABIT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
      </div>

      {/* Target */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Target</label>
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. 30 minutes, Before 6 AM"
          value={form.target}
          onChange={e => set('target', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Frequency */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Frequency</label>
          <select
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={form.frequency}
            onChange={e => set('frequency', e.target.value)}
          >
            {HABIT_FREQUENCIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Difficulty</label>
          <select
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={form.difficulty}
            onChange={e => set('difficulty', e.target.value)}
          >
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Reminder */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Reminder Time (optional)</label>
        <input
          type="time"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          value={form.reminderTime}
          onChange={e => set('reminderTime', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => form.name.trim() && onSave(form)}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
        >
          {initial ? 'Update Habit' : 'Create Habit'}
        </button>
      </div>
    </div>
  )
}

export default function Habits() {
  const { state, dispatch } = useApp()
  const [modal, setModal] = useState(null) // null | 'add' | {habit}
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [view, setView] = useState('daily')
  const today = toDateStr()
  const weekDates = getWeekDates()
  const days14 = pastDays(14)

  // Build heatmap data
  const heatData = useMemo(() => {
    const data = {}
    pastDays(365).forEach(d => {
      const pct = getDayHabitCompletion(state.habitLogs, state.habits, d)
      data[d] = pct === 0 ? 0 : pct < 30 ? 1 : pct < 60 ? 2 : pct < 85 ? 3 : 4
    })
    return data
  }, [state.habitLogs, state.habits])

  const handleSave = (form) => {
    if (modal?.id) {
      dispatch({ type: 'UPDATE_HABIT', payload: { ...form, id: modal.id } })
    } else {
      dispatch({ type: 'ADD_HABIT', payload: { ...form, id: nanoid() } })
    }
    setModal(null)
  }

  const handleDelete = (id) => {
    setDeleteTarget(id)
  }

  const toggleActive = (habit) => {
    dispatch({ type: 'UPDATE_HABIT', payload: { ...habit, active: !habit.active } })
  }

  const DIFF_COLOR = { easy: 'text-green-400', medium: 'text-yellow-400', hard: 'text-red-400' }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['daily','weekly'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === v ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <button
          id="add-habit-btn"
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
        >
          <Plus size={16} />
          Add Habit
        </button>
      </div>

      {/* Habits List */}
      {state.habits.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-slate-800/40 border border-slate-700/40">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-white font-semibold mb-1">No habits yet</p>
          <p className="text-slate-400 text-sm mb-4">Start building your daily routine</p>
          <button
            onClick={() => setModal('add')}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            + Add Your First Habit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {state.habits.map(habit => {
            const streak = getHabitStreak(state.habitLogs, habit.id)
            const todayStatus = state.habitLogs[today]?.[habit.id] || 'pending'

            // Week completion dots
            const weekDots = weekDates.map(d => ({
              d,
              status: state.habitLogs[d]?.[habit.id] || 'pending'
            }))

            return (
              <div
                key={habit.id}
                className={`rounded-2xl p-4 bg-slate-800/60 border transition-all ${habit.active ? 'border-slate-700/40' : 'border-slate-800 opacity-60'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-xl flex-shrink-0">
                    {habit.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-white">{habit.name}</p>
                      <span className={`text-xs ${DIFF_COLOR[habit.difficulty] || 'text-slate-400'}`}>•</span>
                      <span className={`text-xs ${DIFF_COLOR[habit.difficulty] || 'text-slate-400'}`}>{habit.difficulty}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{habit.target} · {habit.frequency}</p>

                    {/* Week dots */}
                    <div className="flex gap-1 mb-2">
                      {weekDots.map(({ d, status }) => (
                        <div
                          key={d}
                          title={d}
                          className={`w-5 h-5 rounded-md flex-shrink-0 ${
                            status === 'completed' ? 'bg-green-500' :
                            status === 'partial' ? 'bg-yellow-500' :
                            status === 'missed' ? 'bg-red-500/60' :
                            'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-orange-400">
                        <Flame size={12} />
                        <span className="text-xs font-medium">{streak.current} day streak</span>
                      </div>
                      <span className="text-xs text-slate-500">Best: {streak.best}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setModal(habit)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => toggleActive(habit)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                      {habit.active ? <ToggleRight size={14} className="text-indigo-400" /> : <ToggleLeft size={14} />}
                    </button>
                    <button onClick={() => handleDelete(habit.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Heatmap */}
      <HeatMap data={heatData} title="Habit Consistency — Past Year" />

      {/* Modal */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?.id ? 'Edit Habit' : 'New Habit'}
        size="md"
      >
        <HabitForm
          initial={modal?.id ? modal : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete habit"
        message="This habit and its progress history will be removed."
        confirmText="Delete"
        onConfirm={() => {
          dispatch({ type: 'DELETE_HABIT', payload: deleteTarget })
          setDeleteTarget(null)
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
