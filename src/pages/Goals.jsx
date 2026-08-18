import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import Modal, { ConfirmModal } from '../components/shared/Modal.jsx'
import { GOAL_CATEGORIES } from '../data/categories.js'
import { nanoid } from '../utils/nanoid.js'
import { Plus, Pencil, Trash2, Target } from 'lucide-react'

const STATUS_OPTS = ['active', 'completed', 'paused']
const STATUS_STYLE = {
  active: 'bg-indigo-500/20 text-indigo-400',
  completed: 'bg-green-500/20 text-green-400',
  paused: 'bg-slate-700 text-slate-400',
}

function GoalForm({ initial, onSave, onClose, currency }) {
  const [form, setForm] = useState(initial || {
    title: '', description: '', category: 'personal',
    target: 100, current: 0, unit: '%', deadline: '', status: 'active'
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Goal Title *</label>
        <input className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Learn React" value={form.title} onChange={e => set('title', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Description</label>
        <textarea rows="2" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="What does success look like?" value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Category</label>
          <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={form.category} onChange={e => set('category', e.target.value)}>
            {GOAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Unit</label>
          <input className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            placeholder="%, ₹, sessions" value={form.unit} onChange={e => set('unit', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Target</label>
          <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={form.target} onChange={e => set('target', Number(e.target.value))} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Current Progress</label>
          <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={form.current} onChange={e => set('current', Number(e.target.value))} />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Deadline</label>
        <input type="date" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          value={form.deadline} onChange={e => set('deadline', e.target.value)} />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">Cancel</button>
        <button onClick={() => form.title && onSave(form)} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
          {initial?.id ? 'Update Goal' : 'Create Goal'}
        </button>
      </div>
    </div>
  )
}

export default function Goals() {
  const { state, dispatch } = useApp()
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const currency = state.settings?.currency || '₹'

  const handleSave = (form) => {
    if (modal?.id) {
      dispatch({ type: 'UPDATE_GOAL', payload: { ...form, id: modal.id } })
    } else {
      dispatch({ type: 'ADD_GOAL', payload: { ...form, id: nanoid() } })
    }
    setModal(null)
  }

  const handleDelete = (id) => {
    setDeleteTarget(id)
  }

  const updateProgress = (goal, delta) => {
    const newCurrent = Math.max(0, Math.min(goal.target, goal.current + delta))
    dispatch({ type: 'UPDATE_GOAL', payload: { ...goal, current: newCurrent } })
  }

  const getCatInfo = (catId) => GOAL_CATEGORIES.find(c => c.id === catId) || { icon: '⭐', label: catId }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex justify-end">
        <button
          id="add-goal-btn"
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
        >
          <Plus size={16} />
          New Goal
        </button>
      </div>

      {/* Goals */}
      {state.goals.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-slate-800/40 border border-slate-700/40">
          <Target size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No goals yet</p>
          <p className="text-slate-400 text-sm mb-4">Set your personal targets and track progress</p>
          <button onClick={() => setModal('new')} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
            + Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {state.goals.map(goal => {
            const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0
            const cat = getCatInfo(goal.category)
            const isCompleted = pct >= 100

            return (
              <div key={goal.id} className={`rounded-2xl p-5 bg-slate-800/60 border transition-all ${isCompleted ? 'border-green-500/30' : 'border-slate-700/40'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="text-2xl mt-0.5">{cat.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{goal.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[goal.status]}`}>
                          {goal.status}
                        </span>
                      </div>
                      {goal.description && <p className="text-xs text-slate-400 mt-0.5">{goal.description}</p>}
                      {goal.deadline && <p className="text-xs text-slate-500 mt-0.5">🗓 {goal.deadline}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <button onClick={() => setModal(goal)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}</span>
                    <span className={`font-bold ${isCompleted ? 'text-green-400' : 'text-white'}`}>{pct}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full progress-bar ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Quick update */}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateProgress(goal, -1)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-600 transition-colors">-1</button>
                  <button onClick={() => updateProgress(goal, 1)} className="flex-1 py-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-xs font-medium hover:bg-indigo-600/50 transition-colors">+1 {goal.unit}</button>
                  <button onClick={() => updateProgress(goal, Math.ceil(goal.target * 0.1))} className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-600 transition-colors">+10%</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Goal' : 'New Goal'} size="md">
        <GoalForm initial={modal?.id ? modal : null} onSave={handleSave} onClose={() => setModal(null)} currency={currency} />
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete goal"
        message="This goal will be removed from your progress tracker."
        confirmText="Delete"
        onConfirm={() => {
          dispatch({ type: 'DELETE_GOAL', payload: deleteTarget })
          setDeleteTarget(null)
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
