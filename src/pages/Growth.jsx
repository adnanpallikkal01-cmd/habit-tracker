import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import ProgressRing from '../components/shared/ProgressRing.jsx'
import { getGrowthScores } from '../utils/calculations.js'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

const AREA_INFO = [
  { key: 'discipline', label: 'Discipline', icon: '🎯', description: 'Task completion, routine adherence' },
  { key: 'knowledge', label: 'Knowledge', icon: '📖', description: 'Study hours, learning consistency' },
  { key: 'health', label: 'Health', icon: '❤️', description: 'Water, sleep, self-care' },
  { key: 'fitness', label: 'Fitness', icon: '💪', description: 'Gym attendance, activity' },
  { key: 'spiritual', label: 'Spiritual', icon: '🕌', description: 'Prayer consistency' },
  { key: 'finance', label: 'Finance', icon: '💰', description: 'Budget adherence, savings' },
]

function ScoreBar({ label, icon, score, description }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="rounded-xl p-4 bg-slate-800/60 border border-slate-700/40">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <span className="text-xl font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full progress-bar"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function Growth() {
  const { state } = useApp()

  const scores = useMemo(() => getGrowthScores({
    prayers: state.prayers,
    studySessions: state.studySessions,
    gymLogs: state.gymLogs,
    waterLogs: state.waterLogs,
    habitLogs: state.habitLogs,
    habits: state.habits,
    selfCare: state.selfCare,
    settings: state.settings,
  }), [state])

  const radarData = AREA_INFO.map(a => ({
    area: a.label,
    score: scores[a.key] || 0,
    fullMark: 100,
  }))

  const overallColor = scores.overall >= 80 ? '#22c55e' : scores.overall >= 60 ? '#6366f1' : '#f59e0b'

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Overall Score */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-900/50 to-violet-900/30 border border-indigo-700/30 flex items-center gap-6">
        <ProgressRing
          percentage={scores.overall}
          size={110}
          strokeWidth={10}
          color={overallColor}
          trackColor="#1e293b"
          label={`${scores.overall}%`}
          sublabel="overall"
        />
        <div>
          <h2 className="text-xl font-bold text-white">Personal Growth Score</h2>
          <p className="text-slate-400 text-sm mt-1">Based on last 30 days of activity</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {scores.overall >= 80 && <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">🏆 Excellent</span>}
            {scores.overall >= 60 && scores.overall < 80 && <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400">⭐ Good Progress</span>}
            {scores.overall < 60 && <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">💪 Keep Going</span>}
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-4">Growth Radar</h3>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="area" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`${v}%`, 'Score']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Area breakdown */}
      <div className="space-y-3">
        {AREA_INFO.map(({ key, label, icon, description }) => (
          <ScoreBar
            key={key}
            label={label}
            icon={icon}
            description={description}
            score={scores[key] || 0}
          />
        ))}
      </div>

      {/* Tips */}
      <div className="rounded-2xl p-5 bg-slate-800/40 border border-slate-700/40">
        <h3 className="text-sm font-semibold text-white mb-3">💡 Focus Areas</h3>
        <div className="space-y-2">
          {AREA_INFO
            .filter(a => (scores[a.key] || 0) < 60)
            .map(a => (
              <div key={a.key} className="flex items-center gap-2 text-sm">
                <span>{a.icon}</span>
                <span className="text-slate-400">{a.label} needs attention — currently at <span className="text-yellow-400 font-medium">{scores[a.key]}%</span></span>
              </div>
            ))
          }
          {AREA_INFO.every(a => (scores[a.key] || 0) >= 60) && (
            <p className="text-green-400 text-sm">🎉 All areas are performing well! Keep it up.</p>
          )}
        </div>
      </div>
    </div>
  )
}
