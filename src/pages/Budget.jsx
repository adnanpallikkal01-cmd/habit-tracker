import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { getBudgetStatus } from '../utils/calculations.js'
import { FINANCE_CATEGORIES } from '../data/categories.js'
import { AlertTriangle, CheckCircle, Pencil } from 'lucide-react'

export default function Budget() {
  const { state, dispatch } = useApp()
  const [editingCat, setEditingCat] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const currency = state.settings?.currency || '₹'

  const budgetStatus = useMemo(() =>
    getBudgetStatus(state.budgets, state.transactions),
    [state.budgets, state.transactions]
  )

  const handleSave = (catId) => {
    const amount = Number(editAmount)
    if (amount > 0) {
      dispatch({ type: 'SET_BUDGET', payload: { id: `b_${catId}`, category: catId, amount } })
    }
    setEditingCat(null)
    setEditAmount('')
  }

  const startEdit = (cat, currentAmount) => {
    setEditingCat(cat)
    setEditAmount(String(currentAmount || ''))
  }

  const totalBudget = budgetStatus.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgetStatus.reduce((s, b) => s + b.spent, 0)
  const overBudgetCount = budgetStatus.filter(b => b.overBudget).length

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Summary */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/40">
        <h2 className="text-sm font-semibold text-white mb-4">Monthly Budget Overview</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Total Budget</p>
            <p className="text-lg font-bold text-white">{currency}{totalBudget.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Spent</p>
            <p className="text-lg font-bold text-red-400">{currency}{totalSpent.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Remaining</p>
            <p className={`text-lg font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currency}{Math.abs(totalBudget - totalSpent).toLocaleString()}
            </p>
          </div>
        </div>
        {/* Overall bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Overall Usage</span>
            <span>{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full progress-bar ${totalSpent > totalBudget ? 'bg-red-500' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min(100, totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0)}%` }}
            />
          </div>
        </div>
        {overBudgetCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-yellow-400 text-xs">
            <AlertTriangle size={13} />
            <span>{overBudgetCount} categor{overBudgetCount > 1 ? 'ies' : 'y'} over budget</span>
          </div>
        )}
      </div>

      {/* Category Budgets */}
      <div className="space-y-3">
        {FINANCE_CATEGORIES.map(cat => {
          const bs = budgetStatus.find(b => b.category === cat.id)
          const amount = bs?.amount || 0
          const spent = bs?.spent || 0
          const remaining = amount - spent
          const pct = amount > 0 ? Math.min(100, Math.round((spent / amount) * 100)) : 0
          const isOver = spent > amount && amount > 0

          return (
            <div key={cat.id} className={`rounded-2xl p-4 bg-slate-800/60 border transition-all ${isOver ? 'border-red-500/40 bg-red-900/10' : 'border-slate-700/40'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <p className="text-sm font-semibold text-white">{cat.label}</p>
                  {isOver && <AlertTriangle size={13} className="text-red-400" />}
                </div>
                <button
                  onClick={() => startEdit(cat.id, amount)}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <Pencil size={13} />
                </button>
              </div>

              {editingCat === cat.id ? (
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    className="flex-1 bg-slate-700 border border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                    placeholder="Budget amount"
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave(cat.id)}
                    autoFocus
                  />
                  <button onClick={() => handleSave(cat.id)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500">Save</button>
                  <button onClick={() => setEditingCat(null)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs hover:bg-slate-600">✕</button>
                </div>
              ) : (
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Budget: <span className="text-white font-medium">{currency}{amount.toLocaleString()}</span></span>
                  <span>Spent: <span className={`font-medium ${isOver ? 'text-red-400' : 'text-white'}`}>{currency}{spent.toLocaleString()}</span></span>
                  <span>Left: <span className={`font-medium ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {remaining >= 0 ? currency + remaining.toLocaleString() : '-' + currency + Math.abs(remaining).toLocaleString()}
                  </span></span>
                </div>
              )}

              {amount > 0 && (
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full progress-bar ${isOver ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
              {amount === 0 && (
                <button
                  onClick={() => startEdit(cat.id, '')}
                  className="text-xs text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  + Set a budget
                </button>
              )}
              {isOver && (
                <p className="text-xs text-red-400 mt-1 font-medium">⚠ Over budget by {currency}{Math.abs(remaining).toLocaleString()}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
