import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { ConfirmModal } from '../components/shared/Modal.jsx'
import { getStudyMinutes, getStudyStreak, getStudyMinutesRange } from '../utils/calculations.js'
import { toDateStr, pastDays, getWeekDates, formatDateShort } from '../utils/dateHelpers.js'
import { nanoid } from '../utils/nanoid.js'
import { fireNotification, requestNotificationPermission } from '../hooks/usePrayerReminders.js'
import {
  Play, Pause, Square, Plus, Trash2, BookOpen,
  Coffee, Bell, BellOff, Clock, X, Edit2, ChevronDown,
  Calendar, AlarmClock, Zap, Flame, TrendingUp
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function fmtSecs(s) {
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}
function fmtMins(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`
}
function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const todayStr = toDateStr()
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = toDateStr(tomorrow)
  if (dateStr === todayStr) return 'Today'
  if (dateStr === tomorrowStr) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─────────────────────────────────────────────────────────────────
// Subject Meta (emoji + accent used in timer ring)
// ─────────────────────────────────────────────────────────────────
const SUBJECT_EMOJIS = {
  'Mathematics': '📐', 'Physics': '⚛️', 'Chemistry': '🧪', 'Biology': '🧬',
  'JavaScript': '🟨', 'React': '⚛️', 'Node.js': '🟢', 'MongoDB': '🍃',
  'Python': '🐍', 'Data Structures': '🌳', 'Algorithms': '🔢', 'English': '📝',
  'History': '📜', 'Geography': '🌍', 'Economics': '📈', 'Computer Science': '💻',
  'Other': '📚'
}
const getEmoji = (s) => SUBJECT_EMOJIS[s] || '📚'

// Day labels
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─────────────────────────────────────────────────────────────────
// Inline Timer Panel
// ─────────────────────────────────────────────────────────────────
function TimerPanel({ schedule, onClose, onSave }) {
  const [phase, setPhase]             = useState('idle')
  const [pausedPhase, setPausedPhase] = useState(null)
  const [studyMins, setStudyMins]     = useState(schedule?.durationMins || 25)
  const [breakMins, setBreakMins]     = useState(5)
  const [secsLeft, setSecsLeft]       = useState((schedule?.durationMins || 25) * 60)
  const [totalSecs, setTotalSecs]     = useState((schedule?.durationMins || 25) * 60)
  const [sessionStart, setSessionStart] = useState(null)
  const [elapsed, setElapsed]         = useState(0)
  const [notifEnabled, setNotifEnabled] = useState(
    'Notification' in window ? Notification.permission === 'granted' : false
  )
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const notificationSupported = 'Notification' in window && typeof Notification.requestPermission === 'function'
  const timerRef   = useRef(null)
  const elapsedRef = useRef(null)

  const topic   = schedule?.topic || ''
  const subject = schedule?.subject || topic || 'Study'

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current)
    clearInterval(elapsedRef.current)
    timerRef.current = null
    elapsedRef.current = null
  }, [])

  const runStudy = useCallback((secs) => {
    stopTimer()
    setSecsLeft(secs); setTotalSecs(secs)
    timerRef.current = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) {
          stopTimer(); setPhase('break')
          fireNotification(`📚 ${subject} session done!`, `Take a ${breakMins}-minute break. ☕`, 'study-done')
          return 0
        }
        return s - 1
      })
    }, 1000)
    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }, [subject, breakMins, stopTimer])

  const runBreak = useCallback((secs) => {
    stopTimer()
    setSecsLeft(secs); setTotalSecs(secs)
    timerRef.current = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) {
          stopTimer(); setPhase('idle')
          fireNotification('☕ Break over!', 'Time to get back to studying! 📚', 'break-done')
          return 0
        }
        return s - 1
      })
    }, 1000)
  }, [stopTimer])

  useEffect(() => {
    if (phase === 'studying') {
      setSessionStart(new Date()); setElapsed(0)
      runStudy(studyMins * 60)
    } else if (phase === 'break') {
      runBreak(breakMins * 60)
    }
    return stopTimer
  }, [phase]) // eslint-disable-line

  useEffect(() => {
    if (phase === 'idle') { setSecsLeft(studyMins * 60); setTotalSecs(studyMins * 60) }
  }, [studyMins, phase])

  useEffect(() => () => stopTimer(), [stopTimer])

  const handleEnableNotifications = async () => {
    if (!notificationSupported) return
    setIsRequestingPermission(true)
    try {
      const ok = await requestNotificationPermission()
      setNotifEnabled(ok)
      if (!ok && Notification.permission === 'denied') {
        console.warn('Notifications were denied by the browser.')
      }
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const handleStart = async () => {
    if (notificationSupported && Notification.permission === 'default' && !notifEnabled) {
      await handleEnableNotifications()
    }
    setPhase('studying')
  }

  const handlePause = () => {
    if (phase === 'paused') {
      const prev = pausedPhase; setPausedPhase(null); setPhase(prev)
      stopTimer()
      if (prev === 'studying') {
        timerRef.current = setInterval(() => setSecsLeft(s => {
          if (s <= 1) { stopTimer(); setPhase('break'); fireNotification(`📚 Done!`, `Break time! ☕`, 'study-done'); return 0 }
          return s - 1
        }), 1000)
        elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
      } else {
        timerRef.current = setInterval(() => setSecsLeft(s => {
          if (s <= 1) { stopTimer(); setPhase('idle'); fireNotification('☕ Break over!', 'Back to studying! 📚', 'break-done'); return 0 }
          return s - 1
        }), 1000)
      }
    } else {
      setPausedPhase(phase); setPhase('paused'); stopTimer()
    }
  }

  const handleStop = () => {
    stopTimer()
    if ((phase === 'studying' || pausedPhase === 'studying') && sessionStart) {
      const elapsedMins = Math.max(1, Math.round(elapsed / 60))
      onSave({
        subject: schedule?.subject || topic || 'Study',
        topic,
        durationMins: elapsedMins,
        date: toDateStr(),
        startTime: sessionStart.toTimeString().slice(0, 5),
        endTime: new Date().toTimeString().slice(0, 5),
        notes: 'Recorded by timer',
      })
    }
    setPhase('idle'); setPausedPhase(null); setElapsed(0); setSessionStart(null)
    setSecsLeft(studyMins * 60); setTotalSecs(studyMins * 60)
  }

  const isIdle   = phase === 'idle'
  const isBreak  = phase === 'break'
  const isPaused = phase === 'paused'
  const dispPhase = pausedPhase || phase

  // SVG Ring
  const SIZE = 180, SW = 14
  const r    = (SIZE - SW) / 2
  const circ = 2 * Math.PI * r
  const pct  = totalSecs > 0 ? secsLeft / totalSecs : 1
  const dash = circ * (1 - pct)

  const ringColor  = isBreak ? '#22c55e' : (isPaused && dispPhase === 'break') ? '#22c55e' : '#EDBB00'
  const ringColor2 = isBreak ? '#16a34a' : '#5C2D91'

  const phaseLabel = isIdle ? 'Ready to study' : isBreak ? '☕ Break Time' : isPaused ? '⏸ Paused' : '📚 Studying…'
  const phaseDot   = isBreak ? '#22c55e' : isPaused ? '#EDBB00' : !isIdle ? '#EDBB00' : '#444'

  return (
    <div className="study-card animate-fadeIn overflow-hidden" style={{ border: '1px solid #2a1a40' }}>
      {/* Header bar */}
      <div style={{ background: 'linear-gradient(135deg,#0d0014,#1a0a2e)', padding: '14px 18px' }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{getEmoji(subject)}</span>
          <div>
            <p className="text-sm font-bold text-white">{topic || subject}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: phaseDot }} />
              <span className="text-xs" style={{ color: isBreak ? '#4ade80' : isPaused ? '#EDBB00' : isIdle ? '#555' : '#EDBB00' }}>
                {phaseLabel}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => { stopTimer(); onClose() }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: '#1a1a1a', color: '#555' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.color = '#ccc' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#555' }}>
          <X size={14} />
        </button>
      </div>

      <div className="p-5">
        {/* Main timer area */}
        <div className="flex flex-col items-center mb-5">
          {/* SVG ring */}
          <div className={`relative ${!isIdle && !isPaused ? 'animate-goldGlow' : ''}`}>
            <svg width={SIZE} height={SIZE} className="rotate-[-90deg]">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={ringColor} />
                  <stop offset="100%" stopColor={ringColor2} />
                </linearGradient>
              </defs>
              {/* Track */}
              <circle cx={SIZE/2} cy={SIZE/2} r={r} fill="none" stroke="#1a1a1a" strokeWidth={SW} />
              {/* Progress */}
              <circle
                cx={SIZE/2} cy={SIZE/2} r={r}
                fill="none" stroke="url(#ringGrad)" strokeWidth={SW} strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={dash}
                style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.3s ease' }}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono font-black text-white" style={{ fontSize: 36, letterSpacing: '-1px' }}>
                {fmtSecs(secsLeft)}
              </span>
              <span className="text-xs mt-1" style={{ color: isBreak ? '#4ade80' : '#666' }}>
                {isBreak ? 'break' : 'remaining'}
              </span>
              {!isIdle && (
                <span className="text-xs font-mono mt-0.5" style={{ color: '#EDBB00' }}>
                  +{fmtSecs(elapsed)}
                </span>
              )}
            </div>
          </div>

          {/* Duration chips — idle only */}
          {isIdle && (
            <div className="w-full mt-4 space-y-3">
              <div>
                <p className="text-xs mb-2 flex items-center gap-1" style={{ color: '#555' }}>
                  <Clock size={10} /> Study duration
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[15, 25, 30, 45, 60, 90].map(m => (
                    <button key={m} onClick={() => setStudyMins(m)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={studyMins === m
                        ? { background: 'linear-gradient(135deg,#EDBB00,#F5CC33)', color: '#000' }
                        : { background: '#1a1a1a', color: '#666', border: '1px solid #222' }}>
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs mb-2 flex items-center gap-1" style={{ color: '#555' }}>
                  <Coffee size={10} /> Break duration
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[5, 10, 15, 20].map(m => (
                    <button key={m} onClick={() => setBreakMins(m)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={breakMins === m
                        ? { background: '#16a34a', color: '#fff' }
                        : { background: '#1a1a1a', color: '#666', border: '1px solid #222' }}>
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {isIdle ? (
            <button onClick={handleStart} className="study-btn-gold flex-1 flex items-center justify-center gap-2">
              <Play size={14} fill="currentColor" /> Start Timer
            </button>
          ) : (
            <>
              <button onClick={handlePause}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={isPaused
                  ? { background: 'linear-gradient(135deg,#5C2D91,#7B3FC0)', color: '#fff' }
                  : { background: '#1a1a1a', color: '#EDBB00', border: '1px solid #2a2a2a' }}>
                {isPaused ? <><Play size={13} fill="currentColor" /> Resume</> : <><Pause size={13} /> Pause</>}
              </button>
              <button onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: '#1a0a0a', color: '#f87171', border: '1px solid #2a1010' }}>
                <Square size={12} fill="currentColor" /> Save & Stop
              </button>
            </>
          )}
        </div>
        {isBreak && (
          <button onClick={() => { stopTimer(); setPhase('idle'); setSecsLeft(studyMins*60); setTotalSecs(studyMins*60) }}
            className="w-full mt-2 text-xs text-center transition-colors"
            style={{ color: '#444' }}
            onMouseEnter={e => e.currentTarget.style.color = '#888'}
            onMouseLeave={e => e.currentTarget.style.color = '#444'}>
            Skip break →
          </button>
        )}

        {/* Notification row */}
        <div className="mt-4 flex items-center gap-2 pt-3" style={{ borderTop: '1px solid #1a1a1a' }}>
          {notifEnabled
            ? <><Bell size={11} style={{ color: '#22c55e' }} /><span className="text-xs" style={{ color: '#444' }}>Notifications on</span></>
            : <><BellOff size={11} style={{ color: '#333' }} />
              <span className="text-xs" style={{ color: '#444' }}>
                {notificationSupported ? (
                  <button
                    type="button"
                    onClick={handleEnableNotifications}
                    disabled={isRequestingPermission}
                    className="font-medium underline decoration-current underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ color: '#5C2D91' }}
                  >
                    {isRequestingPermission ? 'Requesting...' : 'Enable notifications'}
                  </button>
                ) : (
                  <span className="text-[#fbbf24]">Browser notifications unavailable</span>
                )}
                {notificationSupported && ' to get alerted'}
              </span>
            </>
          }
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Schedule Card
// ─────────────────────────────────────────────────────────────────
function ScheduleCard({ item, isTimerOpen, onPlay, onEdit, onDelete }) {
  const isPast = item.date < toDateStr() && item.date !== toDateStr()

  return (
    <div className="study-card study-card-hover animate-studyCardIn transition-all"
      style={{ border: isTimerOpen ? '1px solid #5C2D91' : '1px solid #1a1a1a' }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Emoji icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: '#1a1a1a' }}>
            {getEmoji(item.subject || item.topic)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{item.topic}</p>
            {item.subject && item.subject !== item.topic && (
              <p className="text-xs mt-0.5 truncate" style={{ color: '#5C2D91' }}>{item.subject}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              <span className="flex items-center gap-1 text-xs" style={{ color: '#555' }}>
                <Calendar size={10} />
                <span style={{ color: isPast ? '#f87171' : '#EDBB00' }}>{fmtDate(item.date)}</span>
              </span>
              {item.time && (
                <span className="flex items-center gap-1 text-xs" style={{ color: '#555' }}>
                  <Clock size={10} /> {item.time}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(237,187,0,0.12)', color: '#EDBB00' }}>
                {fmtMins(item.durationMins)}
              </span>
              {item.reminder && (
                <span className="flex items-center gap-1 text-xs" style={{ color: '#5C2D91' }}>
                  <Bell size={10} /> Reminder set
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onEdit}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: '#1a1a1a', color: '#555' }}
              onMouseEnter={e => e.currentTarget.style.color = '#EDBB00'}
              onMouseLeave={e => e.currentTarget.style.color = '#555'}>
              <Edit2 size={12} />
            </button>
            <button onClick={onDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: '#1a1a1a', color: '#555' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = '#555'}>
              <Trash2 size={12} />
            </button>
            <button onClick={onPlay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={isTimerOpen
                ? { background: '#5C2D91', color: '#fff' }
                : { background: 'rgba(237,187,0,0.12)', color: '#EDBB00', border: '1px solid rgba(237,187,0,0.2)' }}
              onMouseEnter={e => { if (!isTimerOpen) e.currentTarget.style.background = 'rgba(237,187,0,0.22)' }}
              onMouseLeave={e => { if (!isTimerOpen) e.currentTarget.style.background = 'rgba(237,187,0,0.12)' }}>
              {isTimerOpen ? <><ChevronDown size={12} /> Close</> : <><Play size={11} fill="currentColor" /> Start</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Edit Schedule Modal
// ─────────────────────────────────────────────────────────────────
function EditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    topic:       item.topic || '',
    subject:     item.subject || '',
    date:        item.date || toDateStr(),
    time:        item.time || '',
    durationMins: item.durationMins || 25,
    reminder:    item.reminder || false,
  })
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Duration split
  const [hrs,  setHrs]  = useState(Math.floor((item.durationMins || 25) / 60))
  const [mins, setMins] = useState((item.durationMins || 25) % 60)
  useEffect(() => setF('durationMins', hrs * 60 + mins), [hrs, mins])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md animate-scaleIn study-card" style={{ border: '1px solid #2a1a40' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-base font-bold text-white">Edit Session</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#1a1a1a', color: '#555' }}>
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Topic */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#555' }}>Topic *</label>
            <input className="study-input" placeholder="e.g. Chapter 5 — Integration"
              value={form.topic} onChange={e => setF('topic', e.target.value)} />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#555' }}>Date</label>
              <input type="date" className="study-input" style={{ colorScheme: 'dark' }}
                value={form.date} onChange={e => setF('date', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#555' }}>Time</label>
              <input type="time" className="study-input" style={{ colorScheme: 'dark' }}
                value={form.time} onChange={e => setF('time', e.target.value)} />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#555' }}>Duration</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <input type="number" min="0" max="12"
                  className="study-input text-center" style={{ width: 64, flex: 'none' }}
                  value={hrs} onChange={e => setHrs(Number(e.target.value))} />
                <span className="text-sm" style={{ color: '#555' }}>hrs</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input type="number" min="0" max="59"
                  className="study-input text-center" style={{ width: 64, flex: 'none' }}
                  value={mins} onChange={e => setMins(Number(e.target.value))} />
                <span className="text-sm" style={{ color: '#555' }}>min</span>
              </div>
            </div>
          </div>

          {/* Reminder toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
            <div className="flex items-center gap-2">
              <AlarmClock size={14} style={{ color: '#5C2D91' }} />
              <span className="text-sm text-white">Set Reminder</span>
              <span className="text-xs" style={{ color: '#444' }}>Alert before session</span>
            </div>
            <button onClick={() => setF('reminder', !form.reminder)}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ background: form.reminder ? '#5C2D91' : '#222' }}>
              <span className="absolute top-1 transition-all w-4 h-4 rounded-full bg-white"
                style={{ left: form.reminder ? 24 : 4 }} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="study-btn-ghost flex-1">Cancel</button>
            <button onClick={() => { onSave({ ...form }); onClose() }}
              className="study-btn-primary flex-1">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Add Schedule Modal
// ─────────────────────────────────────────────────────────────────
function AddScheduleModal({ onSave, onClose }) {
  const [topic,    setTopic]    = useState('')
  const [date,     setDate]     = useState(toDateStr())
  const [time,     setTime]     = useState('')
  const [hrs,      setHrs]      = useState(0)
  const [mins,     setMins]     = useState(25)
  const [reminder, setReminder] = useState(false)
  const totalMins = hrs * 60 + mins

  const handleSave = () => {
    if (!topic.trim() || totalMins < 1) return
    onSave({ topic: topic.trim(), date, time, durationMins: totalMins, reminder })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md animate-scaleIn study-card" style={{ border: '1px solid #2a1a40' }}>
        <div className="flex items-center justify-between p-5 pb-0">
          <div>
            <h2 className="text-base font-bold text-white">Schedule Study Session</h2>
            <p className="text-xs mt-0.5" style={{ color: '#444' }}>Plan what you'll study and when</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#1a1a1a', color: '#555' }}>
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#555' }}>Topic / Subject *</label>
            <input className="study-input" placeholder="e.g. Chapter 3 – Quadratic Equations"
              value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#555' }}>Date</label>
              <input type="date" className="study-input" style={{ colorScheme: 'dark' }}
                value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#555' }}>Start Time</label>
              <input type="time" className="study-input" style={{ colorScheme: 'dark' }}
                value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#555' }}>Duration</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="12"
                  className="study-input text-center" style={{ width: 72, flex: 'none' }}
                  value={hrs} onChange={e => setHrs(Math.max(0, Number(e.target.value)))} />
                <span className="text-sm" style={{ color: '#555' }}>hrs</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="59"
                  className="study-input text-center" style={{ width: 72, flex: 'none' }}
                  value={mins} onChange={e => setMins(Math.max(0, Number(e.target.value)))} />
                <span className="text-sm" style={{ color: '#555' }}>min</span>
              </div>
              {totalMins > 0 && (
                <span className="text-sm font-semibold" style={{ color: '#EDBB00' }}>= {fmtMins(totalMins)}</span>
              )}
            </div>
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[15, 25, 30, 45, 60, 90, 120].map(m => (
                <button key={m} onClick={() => { setHrs(Math.floor(m/60)); setMins(m%60) }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={totalMins === m
                    ? { background: 'rgba(237,187,0,0.2)', color: '#EDBB00', border: '1px solid rgba(237,187,0,0.3)' }
                    : { background: '#1a1a1a', color: '#555', border: '1px solid #222' }}>
                  {m >= 60 ? `${m/60}h` : `${m}m`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
            <div className="flex items-center gap-2">
              <AlarmClock size={14} style={{ color: '#5C2D91' }} />
              <div>
                <p className="text-sm text-white">Set Reminder</p>
                <p className="text-xs" style={{ color: '#444' }}>Get notified at session time</p>
              </div>
            </div>
            <button onClick={() => setReminder(r => !r)}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ background: reminder ? '#5C2D91' : '#222' }}>
              <span className="absolute top-1 transition-all w-4 h-4 rounded-full bg-white"
                style={{ left: reminder ? 24 : 4 }} />
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="study-btn-ghost flex-1">Cancel</button>
            <button onClick={handleSave}
              disabled={!topic.trim() || totalMins < 1}
              className="study-btn-gold flex-1"
              style={{ opacity: (!topic.trim() || totalMins < 1) ? 0.4 : 1 }}>
              Schedule Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Custom Tooltip for chart
// ─────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: '#111', border: '1px solid #222' }}>
      <p style={{ color: '#888' }}>{label}</p>
      <p className="font-bold mt-0.5" style={{ color: '#EDBB00' }}>{payload[0].value}h</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Auto Schedule Modal
// ─────────────────────────────────────────────────────────────────
function AutoScheduleModal({ onSave, onClose }) {
  const [subjects, setSubjects] = useState(['Mathematics', 'Physics', 'Chemistry'])
  const [selectedDate, setSelectedDate] = useState(toDateStr())
  const [startTime, setStartTime] = useState('10:00')
  const [sessionDuration, setSessionDuration] = useState(60)

  const handleGenerate = () => {
    if (subjects.length === 0) return

    const schedules = []
    let currentHour = parseInt(startTime.split(':')[0])
    let currentMinute = parseInt(startTime.split(':')[1])

    subjects.forEach((subject) => {
      const time = String(currentHour).padStart(2, '0') + ':' + String(currentMinute).padStart(2, '0')
      
      schedules.push({
        topic: subject,
        subject: subject,
        date: selectedDate,
        time: time,
        durationMins: sessionDuration,
        reminder: true
      })

      // Move to next time slot
      currentMinute += sessionDuration
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60)
        currentMinute = currentMinute % 60
      }
    })

    onSave(schedules)
    onClose()
  }

  const addSubject = () => {
    setSubjects([...subjects, 'New Subject'])
  }

  const updateSubject = (idx, val) => {
    const updated = [...subjects]
    updated[idx] = val
    setSubjects(updated)
  }

  const removeSubject = (idx) => {
    setSubjects(subjects.filter((_, i) => i !== idx))
  }

  // Calculate end time
  let endHour = parseInt(startTime.split(':')[0])
  let endMinute = parseInt(startTime.split(':')[1])
  endMinute += sessionDuration * subjects.length
  if (endMinute >= 60) {
    endHour += Math.floor(endMinute / 60)
    endMinute = endMinute % 60
  }
  const endTime = String(endHour).padStart(2, '0') + ':' + String(endMinute).padStart(2, '0')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md animate-scaleIn study-card" style={{ border: '1px solid #2a1a40' }}>
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-base font-bold text-white">Auto Schedule</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#1a1a1a', color: '#555' }}>
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Subjects */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: '#555' }}>Subjects (in order)</label>
            <div className="space-y-2">
              {subjects.map((subj, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: '#5C2D91', color: '#fff', minWidth: '28px', textAlign: 'center' }}>{idx + 1}</span>
                  <input className="study-input flex-1" value={subj}
                    onChange={e => updateSubject(idx, e.target.value)} placeholder="Subject name" />
                  <button onClick={() => removeSubject(idx)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: '#1a1a1a', color: '#f87171' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addSubject}
              className="mt-2 text-xs text-center w-full py-2 rounded-lg"
              style={{ color: '#5C2D91', background: 'rgba(92,45,145,0.1)' }}>
              + Add Subject
            </button>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#555' }}>Date</label>
            <input type="date" value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="study-input w-full" />
          </div>

          {/* Start Time */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#555' }}>Start time</label>
            <input type="time" value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="study-input w-full" />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#555' }}>Duration per subject</label>
            <div className="flex items-center gap-2">
              <input type="number" min="15" max="180" step="15"
                className="study-input flex-1"
                value={sessionDuration} onChange={e => setSessionDuration(Number(e.target.value))} />
              <span className="text-sm" style={{ color: '#555' }}>mins</span>
            </div>
          </div>

          {/* Schedule Preview */}
          <div className="p-3 rounded-xl" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
            <p className="text-xs font-medium mb-2" style={{ color: '#888' }}>Schedule preview:</p>
            <div className="space-y-1">
              {subjects.map((subj, idx) => {
                let sHour = parseInt(startTime.split(':')[0])
                let sMin = parseInt(startTime.split(':')[1])
                sMin += sessionDuration * idx
                if (sMin >= 60) {
                  sHour += Math.floor(sMin / 60)
                  sMin = sMin % 60
                }
                const slotStart = String(sHour).padStart(2, '0') + ':' + String(sMin).padStart(2, '0')
                
                let eMin = sMin + sessionDuration
                let eHour = sHour
                if (eMin >= 60) {
                  eHour += Math.floor(eMin / 60)
                  eMin = eMin % 60
                }
                const slotEnd = String(eHour).padStart(2, '0') + ':' + String(eMin).padStart(2, '0')

                return (
                  <div key={idx} className="text-xs" style={{ color: '#888' }}>
                    <span style={{ color: '#EDBB00' }}>{slotStart}</span> - <span style={{ color: '#EDBB00' }}>{slotEnd}</span>
                    <span> • {subj}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs mt-2 pt-2 border-t border-slate-700" style={{ color: '#888' }}>
              Total time: {subjects.length * sessionDuration} mins ({startTime} → {endTime})
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="study-btn-ghost flex-1">Cancel</button>
            <button onClick={handleGenerate}
              disabled={subjects.length === 0}
              className="study-btn-gold flex-1"
              style={{ opacity: subjects.length === 0 ? 0.4 : 1 }}>
              Create Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Study Page
// ─────────────────────────────────────────────────────────────────
export default function Study() {
  const { state, dispatch } = useApp()
  const today = toDateStr()

  // Stats
  const todayMins  = useMemo(() => getStudyMinutes(state.studySessions, today),        [state.studySessions, today])
  const weekMins   = useMemo(() => getStudyMinutesRange(state.studySessions, getWeekDates()), [state.studySessions])
  const monthMins  = useMemo(() => getStudyMinutesRange(state.studySessions, pastDays(30)), [state.studySessions])
  const streak     = useMemo(() => getStudyStreak(state.studySessions), [state.studySessions])
  const dailyTarget = state.settings?.dailyStudyTarget || 4
  const todayPct   = Math.min(100, Math.round((todayMins / (dailyTarget * 60)) * 100))

  // Chart data
  const chartData = pastDays(7).map(d => ({
    day: formatDateShort(d).split(' ')[0],
    hours: parseFloat((getStudyMinutes(state.studySessions, d) / 60).toFixed(1)),
    isToday: d === today,
  }))

  // Scheduled sessions (sorted by date+time)
  const scheduled = useMemo(() =>
    [...(state.studyScheduled || [])].sort((a, b) =>
      (a.date + (a.time || '')) < (b.date + (b.time || '')) ? -1 : 1
    ),
  [state.studyScheduled])

  // Active timer (keyed by scheduled item id)
  const [activeTimer, setActiveTimer] = useState(null) // id of scheduled item
  const [showAdd,     setShowAdd]     = useState(false)
  const [showAutoSchedule, setShowAutoSchedule] = useState(false)
  const [editItem,    setEditItem]    = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleAddSchedule = (data) => {
    dispatch({ type: 'ADD_STUDY_SCHEDULE', payload: { ...data, id: nanoid() } })
  }
  const handleAutoSchedule = (schedules) => {
    schedules.forEach(schedule => {
      dispatch({ type: 'ADD_STUDY_SCHEDULE', payload: { ...schedule, id: nanoid() } })
    })
  }
  const handleUpdateSchedule = (item) => {
    dispatch({ type: 'UPDATE_STUDY_SCHEDULE', payload: item })
  }
  const handleDeleteSchedule = (id) => {
    setDeleteTarget({ type: 'schedule', id })
  }
  const handleSaveSession = (sessionData) => {
    dispatch({ type: 'ADD_STUDY_SESSION', payload: { ...sessionData, id: nanoid() } })
  }
  const handleDeleteSession = (id) => {
    setDeleteTarget({ type: 'session', id })
  }

  return (
    <div className="study-page space-y-5 pb-24 md:pb-8">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <BookOpen size={20} style={{ color: '#5C2D91' }} />
            Study Planner
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#444' }}>Schedule, track, and master your sessions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAutoSchedule(true)} className="study-btn-primary flex items-center gap-1.5 text-sm px-4 py-2">
            <Zap size={14} /> Auto Schedule
          </button>
          <button onClick={() => setShowAdd(true)} className="study-btn-gold flex items-center gap-1.5 text-sm px-4 py-2">
            <Plus size={14} /> Schedule
          </button>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Today */}
        <div className="study-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap size={11} style={{ color: '#EDBB00' }} />
            <p className="text-xs font-medium" style={{ color: '#666' }}>Today</p>
          </div>
          <p className="text-lg font-black text-white">{fmtMins(todayMins)}</p>
          {/* Progress bar */}
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
            <div className="h-full rounded-full progress-bar transition-all"
              style={{ width: `${todayPct}%`, background: 'linear-gradient(90deg,#5C2D91,#EDBB00)' }} />
          </div>
          <p className="text-xs mt-1" style={{ color: '#333' }}>of {dailyTarget}h</p>
        </div>

        {/* Week */}
        <div className="study-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={11} style={{ color: '#5C2D91' }} />
            <p className="text-xs font-medium" style={{ color: '#666' }}>This Week</p>
          </div>
          <p className="text-lg font-black text-white">{fmtMins(weekMins)}</p>
          <p className="text-xs mt-1" style={{ color: '#333' }}>{(weekMins/60).toFixed(1)}h total</p>
        </div>

        {/* Streak */}
        <div className="study-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame size={11} style={{ color: '#EDBB00' }} />
            <p className="text-xs font-medium" style={{ color: '#666' }}>Streak</p>
          </div>
          <p className="text-lg font-black" style={{ color: streak.current > 0 ? '#EDBB00' : '#333' }}>
            {streak.current} <span className="text-sm">🔥</span>
          </p>
          <p className="text-xs mt-1" style={{ color: '#333' }}>best {streak.best}d</p>
        </div>
      </div>

      {/* ── Scheduled Sessions ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar size={14} style={{ color: '#5C2D91' }} />
            Scheduled Sessions
            {scheduled.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(92,45,145,0.2)', color: '#5C2D91' }}>
                {scheduled.length}
              </span>
            )}
          </h2>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: '#444' }}
            onMouseEnter={e => e.currentTarget.style.color = '#EDBB00'}
            onMouseLeave={e => e.currentTarget.style.color = '#444'}>
            <Plus size={12} /> Add session
          </button>
        </div>

        {scheduled.length === 0 ? (
          <div className="study-card p-8 text-center" style={{ border: '1px dashed #1a1a1a' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: '#0d0d0d' }}>
              <Calendar size={20} style={{ color: '#333' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#444' }}>No sessions scheduled yet</p>
            <p className="text-xs mt-1 mb-4" style={{ color: '#333' }}>Plan your study time in advance</p>
            <button onClick={() => setShowAdd(true)} className="study-btn-primary text-sm px-5 py-2">
              <span className="flex items-center gap-1.5"><Plus size={13} /> Schedule Now</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {scheduled.map((item) => (
              <div key={item.id}>
                <ScheduleCard
                  item={item}
                  isTimerOpen={activeTimer === item.id}
                  onPlay={() => setActiveTimer(activeTimer === item.id ? null : item.id)}
                  onEdit={() => setEditItem(item)}
                  onDelete={() => handleDeleteSchedule(item.id)}
                />
                {/* Inline Timer */}
                {activeTimer === item.id && (
                  <div className="mt-2 animate-fadeIn">
                    <TimerPanel
                      key={item.id}
                      schedule={item}
                      onClose={() => setActiveTimer(null)}
                      onSave={handleSaveSession}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 7-Day Chart ── */}
      <div className="study-card p-5">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <TrendingUp size={14} style={{ color: '#EDBB00' }} />
          Daily Study — Last 7 Days
        </h3>
        <p className="text-xs mb-4" style={{ color: '#444' }}>Hours studied per day</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fill: '#444', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#444', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="hours" radius={[5, 5, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.isToday ? '#EDBB00' : entry.hours > 0 ? '#5C2D91' : '#1a1a1a'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Session History ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock size={14} style={{ color: '#5C2D91' }} />
            Session History
          </h3>
        </div>

        {state.studySessions.length === 0 ? (
          <div className="study-card p-6 text-center" style={{ border: '1px dashed #1a1a1a' }}>
            <BookOpen size={24} className="mx-auto mb-2" style={{ color: '#2a2a2a' }} />
            <p className="text-sm" style={{ color: '#333' }}>No sessions recorded yet</p>
            <p className="text-xs mt-1" style={{ color: '#2a2a2a' }}>Start a timer from your scheduled sessions above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...state.studySessions].reverse().slice(0, 20).map((session, idx) => (
              <div key={session.id}
                className="study-card study-card-hover flex items-center gap-3 p-3.5 transition-all"
                style={{ animationDelay: `${idx * 0.04}s` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background: '#1a1a1a' }}>
                  {getEmoji(session.subject || session.topic)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {session.topic || session.subject}
                    </p>
                    {session.notes === 'Recorded by timer' && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md"
                        style={{ background: 'rgba(92,45,145,0.15)', color: '#7B3FC0' }}>⏱ timed</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#444' }}>
                    {session.date}
                    {session.startTime && ` · ${session.startTime}${session.endTime ? `–${session.endTime}` : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold" style={{ color: '#EDBB00' }}>
                    {fmtMins(session.durationMins)}
                  </span>
                  <button onClick={() => handleDeleteSession(session.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAutoSchedule && (
        <AutoScheduleModal
          onSave={handleAutoSchedule}
          onClose={() => setShowAutoSchedule(false)}
        />
      )}
      {showAdd && (
        <AddScheduleModal
          onSave={handleAddSchedule}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editItem && (
        <EditModal
          item={editItem}
          onSave={(data) => handleUpdateSchedule({ ...editItem, ...data })}
          onClose={() => setEditItem(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.type === 'schedule' ? 'Delete scheduled session' : 'Delete study session'}
        message={deleteTarget?.type === 'schedule'
          ? 'This scheduled study session will be removed from your plan.'
          : 'This recorded study session will be permanently deleted.'}
        confirmText="Delete"
        onConfirm={() => {
          if (deleteTarget?.type === 'schedule') {
            dispatch({ type: 'DELETE_STUDY_SCHEDULE', payload: deleteTarget.id })
            if (activeTimer === deleteTarget.id) setActiveTimer(null)
          } else {
            dispatch({ type: 'DELETE_STUDY_SESSION', payload: deleteTarget.id })
          }
          setDeleteTarget(null)
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
