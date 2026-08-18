import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * StatCard — displays a key metric
 * Props: title, value, subtitle, icon, trend, trendLabel, gradient, className
 */
export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, gradient, className = '', onClick }) {
  const trendColor = trend === 'up' ? 'text-violet-300' : trend === 'down' ? 'text-pink-300' : 'text-slate-400'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-white/8 bg-[#111014] p-5 shadow-[0_10px_24px_rgba(0,0,0,0.2)] card-hover animate-fadeIn
        ${onClick ? 'cursor-pointer' : ''}
        ${className}`}
    >
      {gradient && (
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-3xl" style={{ background: gradient }} />
      )}

      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#A9A3B3]">{title}</p>
          <p className="truncate text-xl font-bold text-white sm:text-2xl">{value}</p>
          {subtitle && <p className="mt-1 truncate text-[10px] text-[#6F6878] sm:text-xs">{subtitle}</p>}
          {trendLabel && (
            <div className={`mt-2 flex items-center gap-1 ${trendColor}`}>
              <TrendIcon size={12} />
              <span className="text-xs font-medium">{trendLabel}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="ml-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/5" style={{ background: gradient || 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(217,70,239,0.12))' }}>
            <Icon size={18} className="text-white" />
          </div>
        )}
      </div>
    </div>
  )
}
