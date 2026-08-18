import React from 'react'

/**
 * CheckItem — large animated checkbox for daily activities
 * Props: label, checked, status ('completed'|'partial'|'missed'|'na'|'pending'), onChange, icon, subtitle
 */
const STATUS_STYLES = {
  completed: 'border-violet-400/30 bg-gradient-to-r from-violet-500/12 to-fuchsia-500/10',
  partial: 'border-violet-400/25 bg-violet-500/8',
  missed: 'border-red-500/30 bg-red-500/8',
  na: 'border-white/10 bg-[#0D0C10]',
  pending: 'border-white/10 bg-[#0D0C10]',
}
const STATUS_CHECK = {
  completed: { bg: 'bg-gradient-to-br from-[#7C3AED] to-[#D946EF] shadow-[0_0_18px_rgba(124,58,237,0.45)]', icon: '✓' },
  partial: { bg: 'bg-gradient-to-br from-violet-500 to-fuchsia-500', icon: '~' },
  missed: { bg: 'bg-red-500', icon: '✗' },
  na: { bg: 'bg-slate-600', icon: '—' },
  pending: { bg: 'bg-[#111014]', icon: '' },
}

export default function CheckItem({ label, status = 'pending', onChange, icon, subtitle, actions }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending
  const check = STATUS_CHECK[status] || STATUS_CHECK.pending
  const isDone = status === 'completed'

  return (
    <div
      onClick={onChange}
      className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-200 check-item cursor-pointer ${style}`}
    >
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white transition-all duration-200 ${check.bg} ${isDone ? 'animate-checkPop' : ''}`}>
        {check.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <p className={`text-sm font-medium transition-all ${isDone ? 'line-through text-[#A9A3B3]' : 'text-white'}`}>
            {label}
          </p>
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-[#6F6878]">{subtitle}</p>}
      </div>

      {actions ? actions : (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
          status === 'completed' ? 'bg-violet-500/15 text-violet-200' :
          status === 'partial' ? 'bg-violet-500/10 text-violet-200' :
          status === 'missed' ? 'bg-red-500/15 text-red-300' :
          status === 'na' ? 'bg-white/5 text-[#A9A3B3]' :
          'bg-white/5 text-[#6F6878]'
        }`}>
          {status === 'completed' ? 'Done' : status === 'partial' ? 'Partial' : status === 'missed' ? 'Missed' : status === 'na' ? 'N/A' : 'Pending'}
        </span>
      )}
    </div>
  )
}
