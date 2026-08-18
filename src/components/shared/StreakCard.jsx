import React from 'react'
import { Flame, Trophy } from 'lucide-react'

/**
 * StreakCard — displays current and best streak
 */
export default function StreakCard({ current = 0, best = 0, label = 'Streak', className = '' }) {
  return (
    <div className={`rounded-2xl p-4 bg-slate-800/60 border border-slate-700/40 ${className}`}>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Flame size={20} className="text-orange-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white sm:text-2xl">{current}</p>
            <p className="text-[10px] text-slate-400 sm:text-xs">Current</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div>
            <p className="text-xl font-bold text-yellow-400 text-right sm:text-2xl">{best}</p>
            <p className="text-[10px] text-slate-400 text-right sm:text-xs">Best</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Trophy size={20} className="text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
