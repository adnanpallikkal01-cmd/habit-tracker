import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import Modal, { ConfirmModal } from '../components/shared/Modal.jsx'
import { getFinanceTotals, getExpensesByCategory } from '../utils/calculations.js'
import { toDateStr, startOfMonth, startOfWeek } from '../utils/dateHelpers.js'
import { FINANCE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../data/categories.js'
import { nanoid } from '../utils/nanoid.js'
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
]

function TxForm({ type, onSave, onClose, currency }) {
  const [form, setForm] = useState({
    type, amount: '', category: type === 'income' ? 'salary' : 'food',
    description: '', date: toDateStr(), paymentMethod: 'upi', notes: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const cats = type === 'income' ? INCOME_CATEGORIES : FINANCE_CATEGORIES

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Amount ({currency}) *</label>
          <input type="number" min="0" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Date</label>
          <input type="date" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Category</label>
        <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          value={form.category} onChange={e => set('category', e.target.value)}>
          {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Description</label>
        <input className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          placeholder="e.g. Lunch at restaurant" value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      {type === 'expense' && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Payment Method</label>
          <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
            {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">Cancel</button>
        <button
          onClick={() => form.amount > 0 && onSave({ ...form, amount: Number(form.amount), id: nanoid() })}
          className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors
            ${type === 'income' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
        >
          Add {type === 'income' ? 'Income' : 'Expense'}
        </button>
      </div>
    </div>
  )
}

export default function Finance() {
  const { state, dispatch } = useApp()
  const [filter, setFilter] = useState('month')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const currency = state.settings?.currency || '₹'
  const today = toDateStr()

  const { startDate, endDate } = useMemo(() => {
    const end = today
    const start = filter === 'today' ? today
      : filter === 'week' ? startOfWeek()
      : filter === 'month' ? startOfMonth()
      : '2000-01-01'
    return { startDate: start, endDate: end }
  }, [filter, today])

  const totals = useMemo(() =>
    getFinanceTotals(state.transactions, startDate, endDate),
    [state.transactions, startDate, endDate]
  )

  const catBreakdown = useMemo(() =>
    getExpensesByCategory(state.transactions, startDate, endDate),
    [state.transactions, startDate, endDate]
  )

  const pieData = useMemo(() =>
    FINANCE_CATEGORIES
      .filter(c => catBreakdown[c.id] > 0)
      .map(c => ({ name: c.label, value: catBreakdown[c.id], color: c.color, icon: c.icon }))
      .sort((a, b) => b.value - a.value),
    [catBreakdown]
  )

  const filteredTx = useMemo(() =>
    state.transactions
      .filter(t => t.date >= startDate && t.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [state.transactions, startDate, endDate]
  )

  const handleSave = (tx) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: tx })
    setModal(null)
  }
  const handleDelete = (id) => {
    setDeleteTarget(id)
  }

  const getCatInfo = (catId) =>
    [...FINANCE_CATEGORIES, ...INCOME_CATEGORIES].find(c => c.id === catId) || { icon: '💰', label: catId }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 bg-green-900/30 border border-green-700/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-green-400" />
            <p className="text-xs text-green-300">Income</p>
          </div>
          <p className="text-2xl font-bold text-white">{currency}{totals.income.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl p-4 bg-red-900/30 border border-red-700/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={14} className="text-red-400" />
            <p className="text-xs text-red-300">Expenses</p>
          </div>
          <p className="text-2xl font-bold text-white">{currency}{totals.expenses.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl p-4 bg-slate-800/60 border border-slate-700/40">
          <p className="text-xs text-slate-400 mb-1">Savings</p>
          <p className={`text-2xl font-bold ${totals.savings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {currency}{Math.abs(totals.savings).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl p-4 bg-slate-800/60 border border-slate-700/40">
          <p className="text-xs text-slate-400 mb-1">Savings Rate</p>
          <p className={`text-2xl font-bold ${totals.savingsRate >= 30 ? 'text-green-400' : totals.savingsRate > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
            {totals.savingsRate}%
          </p>
        </div>
      </div>

      {/* Actions + Filter */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 flex-1 bg-slate-800 rounded-xl p-1">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button id="add-income-btn" onClick={() => setModal('income')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition-colors">
          <Plus size={16} />Income
        </button>
        <button id="add-expense-btn" onClick={() => setModal('expense')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors">
          <Plus size={16} />Expense
        </button>
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
          <h3 className="text-sm font-semibold text-white mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${currency}${v.toLocaleString()}`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span>{d.icon} {d.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Transactions</h3>
        {filteredTx.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-slate-800/40 border border-slate-700/40">
            <Wallet size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">No transactions</p>
            <p className="text-slate-400 text-sm">Add your first income or expense</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTx.map(tx => {
              const cat = getCatInfo(tx.category)
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-base flex-shrink-0">
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.description || cat.label}</p>
                    <p className="text-xs text-slate-500">{tx.date} · {tx.paymentMethod || ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount.toLocaleString()}
                    </span>
                    <button onClick={() => handleDelete(tx.id)} className="p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'income' ? 'Add Income' : 'Add Expense'} size="md">
          <TxForm type={modal} onSave={handleSave} onClose={() => setModal(null)} currency={currency} />
        </Modal>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete transaction"
        message="This transaction will be permanently removed from your financial history."
        confirmText="Delete"
        onConfirm={() => {
          dispatch({ type: 'DELETE_TRANSACTION', payload: deleteTarget })
          setDeleteTarget(null)
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
