import React from 'react'

/**
 * HeatMap — GitHub-style consistency heatmap for the past year
 * Props: data ({ [dateStr]: value (0-4) }), title
 */
const LEVEL_COLORS = [
  'bg-[#0D0C10]',
  'bg-[#2b1c40]',
  'bg-[#4C1D95]',
  'bg-[#7C3AED]',
  'bg-gradient-to-br from-[#7C3AED] to-[#D946EF]'
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['M','T','W','T','F','S','S']

export default function HeatMap({ data = {}, title }) {
  // Build a 52-week grid
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 364)

  // Align to Monday
  const startDay = startDate.getDay()
  const offset = startDay === 0 ? 6 : startDay - 1
  startDate.setDate(startDate.getDate() - offset)

  const weeks = []
  let current = new Date(startDate)

  for (let w = 0; w < 53; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split('T')[0]
      const val = data[dateStr] ?? -1  // -1 = future or no data
      week.push({ dateStr, val, date: new Date(current) })
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  // Month labels
  const monthLabels = []
  weeks.forEach((week, wi) => {
    const firstDay = week[0].date
    if (firstDay.getDate() <= 7) {
      monthLabels.push({ wi, label: MONTHS[firstDay.getMonth()] })
    }
  })

  return (
    <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40 overflow-hidden">
      {title && <p className="text-sm font-semibold text-white mb-4">{title}</p>}

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels */}
          <div className="flex gap-1 ml-6">
            {weeks.map((week, wi) => {
              const ml = monthLabels.find(m => m.wi === wi)
              return (
                <div key={wi} className="w-3 text-xs text-slate-500 text-center">
                  {ml ? ml.label.charAt(0) : ''}
                </div>
              )
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-1">
              {DAYS.map((d, i) => (
                <div key={i} className="w-3 h-3 flex items-center justify-center text-xs text-slate-600">
                  {i % 2 === 0 ? d : ''}
                </div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(({ dateStr, val, date }) => {
                  const isFuture = date > today
                  const level = isFuture ? 0 : (val === -1 ? 0 : Math.min(4, Math.max(0, val)))
                  return (
                    <div
                      key={dateStr}
                      title={`${dateStr}: ${val === -1 ? 'No data' : val === 4 ? 'Complete' : `Level ${val}`}`}
                      className={`w-3 h-3 rounded-sm ${isFuture ? 'bg-slate-900' : LEVEL_COLORS[level]} transition-colors hover:opacity-80 cursor-default`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-slate-500">Less</span>
        {LEVEL_COLORS.map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-xs text-slate-500">More</span>
      </div>
    </div>
  )
}
