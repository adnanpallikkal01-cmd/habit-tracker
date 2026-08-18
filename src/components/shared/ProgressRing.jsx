import React from 'react'

/**
 * ProgressRing — SVG circular progress indicator
 * Props: percentage (0-100), size, strokeWidth, color, label, sublabel, children
 */
export default function ProgressRing({
  percentage = 0,
  size = 120,
  strokeWidth = 10,
  color = '#6366f1',
  trackColor = '#1e293b',
  label,
  sublabel,
  children,
}) {
  const r = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (percentage / 100) * circumference
  const cx = size / 2
  const cy = size / 2

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          <>
            {label !== undefined && (
              <span className="text-white font-bold" style={{ fontSize: size * 0.15 }}>
                {label}
              </span>
            )}
            {sublabel !== undefined && (
              <span className="text-slate-400" style={{ fontSize: size * 0.1 }}>
                {sublabel}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
