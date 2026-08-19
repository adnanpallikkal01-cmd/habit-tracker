import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { Download, RotateCcw, LogOut, Bell, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import storage from '../services/storage.js'
import { enableBackgroundNotifications } from '../hooks/usePrayerReminders.js'
import { getBackgroundNotificationStatus, testBackgroundNotification } from '../services/push.js'

const AVATAR_ICONS = ['✨', '🧑‍💻', '🌙', '🎯', '⚡', '🔥', '🌞', '💎']
const PROFILE_IMAGES = ['👤', '😀', '😎', '🤖', '🧑‍🎨', '👩‍💼', '🧑‍🚀', '🧑‍💼']

function Section({ title, children }) {
  return (
    <div className="rounded-2xl p-5 bg-slate-800/60 border border-slate-700/40 space-y-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, subtitle, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-white">{label}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function NumberInput({ value, onChange, min = 0, max, step = 1 }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(Number(e.target.value))}
      className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:border-indigo-500"
    />
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-all"
      style={{ background: checked ? '#5C2D91' : '#222' }}>
      <span className="absolute top-1 transition-all w-4 h-4 rounded-full bg-white"
        style={{ left: checked ? 24 : 4 }} />
    </button>
  )
}

// Compress profile image to max 300×300 JPEG 70% — keeps localStorage size small on mobile
async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 300
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
          else { width = Math.round((width * MAX) / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function Profile() {
  const { state, dispatch } = useApp()
  const { logout, user } = useAuth()
  const settings = state.settings
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [pushStatus, setPushStatus] = useState({ loading: true, configured: false, subscribed: false, error: '', message: '' })
  const [pushBusy, setPushBusy] = useState(false)

  const update = (key, value) => dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } })
  const updateNotif = (key, value) =>
    dispatch({ type: 'UPDATE_SETTINGS', payload: { notifications: { ...settings.notifications, [key]: value } } })

  const refreshPushStatus = async () => {
    setPushStatus(s => ({ ...s, loading: true, error: '' }))
    const server = await getBackgroundNotificationStatus()
    let subscribed = false
    try {
      const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready : null
      subscribed = Boolean(await registration?.pushManager?.getSubscription())
    } catch {}
    setPushStatus({ loading: false, configured: server.pushConfigured, subscribed, error: server.error || '', message: '' })
  }

  React.useEffect(() => { refreshPushStatus() }, [])


  const exportData = () => {
    const data = storage.exportAll()
    const printWindow = window.open('', '_blank', 'width=960,height=1200')
    if (!printWindow) return

    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))

    const makeTable = (title, columns, rows) => {
      if (!rows.length) {
        return `<h3>${escapeHtml(title)}</h3><p class="empty">No records available</p>`
      }

      const head = columns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('')
      const body = rows.map(row => `<tr>${columns.map(col => `<td>${escapeHtml(row[col.key] ?? '')}</td>`).join('')}</tr>`).join('')
      return `
        <h3>${escapeHtml(title)}</h3>
        <table>
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      `
    }

    const habitsTable = makeTable('Habits', [
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'frequency', label: 'Frequency' },
      { key: 'target', label: 'Target' },
      { key: 'difficulty', label: 'Difficulty' },
    ], state.habits || [])

    const studyTable = makeTable('Study Sessions', [
      { key: 'topic', label: 'Topic' },
      { key: 'subject', label: 'Subject' },
      { key: 'date', label: 'Date' },
      { key: 'durationMins', label: 'Duration (min)' },
      { key: 'startTime', label: 'Start Time' },
    ], state.studySessions || [])

    const goalsTable = makeTable('Goals', [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'current', label: 'Current' },
      { key: 'target', label: 'Target' },
      { key: 'status', label: 'Status' },
    ], state.goals || [])

    const financeTable = makeTable('Transactions', [
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount' },
      { key: 'date', label: 'Date' },
    ], state.transactions || [])

    const summary = {
      exportedAt: new Date().toISOString(),
      userName: settings.userName || 'User',
      profileIcon: settings.profileIcon || '✨',
      totals: {
        habits: (state.habits || []).length,
        studySessions: (state.studySessions || []).length,
        goals: (state.goals || []).length,
        transactions: (state.transactions || []).length,
      },
    }

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Adn Tracker Report</title>
          <style>
            :root { color-scheme: dark; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background:
                radial-gradient(circle at top left, rgba(124,58,237,0.24), transparent 28%),
                radial-gradient(circle at bottom right, rgba(217,70,239,0.14), transparent 26%),
                linear-gradient(180deg, #07070a 0%, #120d1b 100%);
              color: #f5f3ff;
              font-family: Arial, Helvetica, sans-serif;
              padding: 28px;
            }
            .report {
              max-width: 1100px;
              margin: 0 auto;
              background: rgba(17, 16, 20, 0.96);
              border: 1px solid rgba(168, 85, 247, 0.32);
              border-radius: 24px;
              overflow: hidden;
              box-shadow: 0 30px 60px rgba(17, 12, 22, 0.45);
            }
            .header {
              background: linear-gradient(135deg, #1a0b2d 0%, #4c1d95 28%, #7c3aed 55%, #d946ef 100%);
              padding: 28px 30px;
            }
            .header h1 { margin: 0; font-size: 32px; color: #ffffff; }
            .meta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; font-size: 13px; color: #f5d0fe; }
            .content { padding: 28px 30px 36px; }
            .stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              gap: 14px;
              margin-bottom: 22px;
            }
            .stat {
              background: rgba(255,255,255,0.04);
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 14px;
              padding: 14px 16px;
            }
            .label { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #c4b5fd; }
            .value { font-size: 22px; font-weight: bold; margin-top: 8px; }
            h3 {
              margin: 22px 0 10px;
              color: #f3e8ff;
              font-size: 18px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              background: rgba(15,15,20,0.85);
              border: 1px solid rgba(255,255,255,0.06);
              border-radius: 12px;
              overflow: hidden;
              margin-bottom: 16px;
            }
            th, td {
              border-bottom: 1px solid rgba(255,255,255,0.06);
              padding: 10px 12px;
              text-align: left;
              vertical-align: top;
              font-size: 12px;
            }
            th {
              background: rgba(124,58,237,0.18);
              color: #e9d5ff;
              font-weight: bold;
            }
            td { color: #e5e7eb; }
            .empty { color: #a3a3a3; font-style: italic; }
            @media print {
              body { padding: 0; }
              .report { border-radius: 0; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <h1>Adn Tracker Report</h1>
              <div class="meta">
                <span>${escapeHtml(settings.userName || 'User')}</span>
                <span>•</span>
                <span>${escapeHtml(settings.profileIcon || '✨')}</span>
                <span>•</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <div class="content">
              <div class="stats">
                <div class="stat"><div class="label">Habits</div><div class="value">${(state.habits || []).length}</div></div>
                <div class="stat"><div class="label">Study Sessions</div><div class="value">${(state.studySessions || []).length}</div></div>
                <div class="stat"><div class="label">Goals</div><div class="value">${(state.goals || []).length}</div></div>
                <div class="stat"><div class="label">Transactions</div><div class="value">${(state.transactions || []).length}</div></div>
              </div>
              ${habitsTable}
              ${studyTable}
              ${goalsTable}
              ${financeTable}
            </div>
          </div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.focus(), 100)
    setTimeout(() => printWindow.print(), 250)
  }

  const handleReset = () => {
    if (confirmReset) {
      storage.clearAll()
      storage.deleteRemoteState().finally(() => window.location.reload())
    } else {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 4000)
    }
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6 max-w-2xl mx-auto">

      {/* Profile card */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-900/50 to-violet-900/30 border border-indigo-700/30 flex items-center gap-5">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white">
          {settings.profileImage ? (
            <img src={settings.profileImage} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">{settings.profileIcon || '✨'}</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <input
            className="text-xl font-bold text-white bg-transparent border-b border-transparent focus:border-indigo-400 focus:outline-none w-full"
            value={settings.userName || ''}
            onChange={e => update('userName', e.target.value)}
            placeholder="Your name"
          />
          <p className="text-sm text-indigo-300 mt-1">Adn Tracker</p>
        </div>
      </div>

      <Section title="Profile Icon">
        <div className="flex flex-wrap gap-2">
          {AVATAR_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => {
                update('profileIcon', icon)
                update('profileImage', '')
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border text-lg transition ${settings.profileIcon === icon && !settings.profileImage ? 'border-violet-400 bg-violet-500/20 shadow-[0_10px_20px_rgba(124,58,237,0.2)]' : 'border-slate-700 bg-slate-800/60 hover:border-violet-500/50'}`}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
            <label
            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-indigo-500/40 bg-indigo-600/15 px-4 py-2 text-sm font-medium text-indigo-300 transition hover:bg-indigo-600/25"
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  const compressed = await compressImage(file)
                  update('profileImage', compressed)
                  update('profileIcon', '✨')
                } catch {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    update('profileImage', event.target?.result || '')
                    update('profileIcon', '✨')
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
            From Gallery
          </label>

          {settings.profileImage && (
            <button
              type="button"
              onClick={() => {
                update('profileImage', '')
                update('profileIcon', '✨')
              }}
              className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 hover:border-red-500/50 hover:text-red-300"
            >
              Remove photo
            </button>
          )}
        </div>
      </Section>

      {/* Daily Targets */}
      <Section title="Daily Targets">
        <Row label="Water Target (ml)" subtitle={`Currently: ${settings.dailyWaterTarget}ml = ${(settings.dailyWaterTarget / 1000).toFixed(1)}L`}>
          <NumberInput
            value={settings.dailyWaterTarget}
            onChange={v => update('dailyWaterTarget', v)}
            min={500}
            max={10000}
            step={250}
          />
        </Row>
        <Row label="Water reminder interval" subtitle={`Remind me every ${settings.waterReminderIntervalMinutes || 15} minutes`}>
          <select value={settings.waterReminderIntervalMinutes || 15} onChange={e => update('waterReminderIntervalMinutes', Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
            {[15,30,45,60,90,120].map(m => <option key={m} value={m}>{m} minutes</option>)}
          </select>
        </Row>
        <Row label="Study Target (hours)" subtitle={`Currently: ${settings.dailyStudyTarget}h per day`}>
          <NumberInput
            value={settings.dailyStudyTarget}
            onChange={v => update('dailyStudyTarget', v)}
            min={1}
            max={16}
            step={0.5}
          />
        </Row>
        <Row label="Monthly Budget" subtitle={`Currently: ${settings.currency}${(settings.monthlyBudget || 0).toLocaleString()}`}>
          <NumberInput
            value={settings.monthlyBudget ?? 0}
            onChange={v => update('monthlyBudget', v)}
            min={0}
            step={500}
          />
        </Row>
      </Section>

      {/* Score Weights */}
      <Section title="Daily Score Weights">
        <p className="text-xs text-slate-500 -mt-2">Adjust how much each area contributes to your daily score (total should equal 100)</p>
        {Object.entries(settings.scoreWeights || {}).map(([key, val]) => (
          <Row key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} subtitle={`${val}% weight`}>
            <NumberInput
              value={val}
              onChange={v => dispatch({
                type: 'UPDATE_SETTINGS',
                payload: { scoreWeights: { ...settings.scoreWeights, [key]: v } }
              })}
              min={0}
              max={100}
              step={5}
            />
          </Row>
        ))}
        <div className="flex justify-between text-xs pt-1 border-t border-slate-700">
          <span className="text-slate-400">Total</span>
          <span className={`font-bold ${
            Object.values(settings.scoreWeights || {}).reduce((a, b) => a + b, 0) === 100
              ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {Object.values(settings.scoreWeights || {}).reduce((a, b) => a + b, 0)}%
          </span>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Reminders">
        <Row label="Background notifications" subtitle="Receive reminders when Adn Tracker is closed">
          <div className="flex items-center gap-2">
            {pushStatus.configured && pushStatus.subscribed ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-amber-400" />}
            <button
              type="button"
              disabled={pushBusy}
              onClick={async () => {
                setPushBusy(true)
                try {
                  const result = await enableBackgroundNotifications()
                  if (!result?.ok && result?.reason) throw new Error(result.reason)
                  await refreshPushStatus()
                  setPushStatus(s => ({ ...s, error: '', message: 'Background notifications enabled successfully.' }))
                } catch (error) {
                  setPushStatus(s => ({ ...s, error: error?.message || 'Could not enable background notifications.', message: '' }))
                } finally { setPushBusy(false) }
              }}
              className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold disabled:opacity-50"
            >
              {pushBusy ? 'Setting up…' : (pushStatus.subscribed ? 'Enable / Refresh' : 'Enable')}
            </button>
          </div>
        </Row>
        <div className={`rounded-xl border p-3 text-xs ${pushStatus.configured && pushStatus.subscribed ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' : 'border-amber-500/20 bg-amber-500/5 text-amber-300'}`}>
          {pushStatus.loading ? 'Checking notification server…' : pushStatus.configured ? (pushStatus.subscribed ? 'Background push is ready. Test it before relying on reminders.' : 'Server push is ready. Enable notifications on this phone.') : 'Background notifications are not configured on the server. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to Render, redeploy the API, then tap Enable / Refresh.'}
          {pushStatus.message && <div className="mt-1 text-emerald-300">{pushStatus.message}</div>}
          {pushStatus.error && <div className="mt-1 text-red-300">{pushStatus.error}</div>}
          {!pushStatus.loading && !pushStatus.error && !pushStatus.configured && <div className="mt-1 text-slate-400">API: {pushStatus.endpoint}</div>}
        </div>
        {pushStatus.configured && pushStatus.subscribed && (
          <button
            type="button"
            onClick={async () => {
              try { await testBackgroundNotification(); setPushStatus(s => ({ ...s, error: '', message: 'Test notification sent. Lock the phone and check your notification.' })) }
              catch (error) { setPushStatus(s => ({ ...s, error: error?.message || 'Test notification failed.', message: '' })) }
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold"
          >
            <Send size={13} /> Send test notification
          </button>
        )}
        {Object.entries(settings.notifications || {}).map(([key, val]) => (
          <Row key={key} label={key.charAt(0).toUpperCase() + key.slice(1) + ' reminder'}>
            <Toggle checked={!!val} onChange={v => updateNotif(key, v)} />
          </Row>
        ))}
      </Section>

      {/* Data */}
      <Section title="Data Management">
        <Row label="Export All Data" subtitle="Download a PDF-style report with the app theme">
          <button
            id="profile-export"
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 hover:bg-indigo-600/30 transition-colors text-sm font-medium"
          >
            <Download size={14} /> Export PDF
          </button>
        </Row>
        <Row label="Backup JSON" subtitle="Download a raw JSON backup for technical use">
          <button
            onClick={() => {
              const data = storage.exportAll()
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `lifetrack-backup-${new Date().toISOString().split('T')[0]}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            <Download size={14} /> JSON
          </button>
        </Row>
        <Row label="Reset All Data" subtitle="Permanently deletes all tracked data">
          <button
            id="profile-reset"
            onClick={handleReset}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
              ${confirmReset
                ? 'bg-red-600 text-white border-red-600 animate-pulse'
                : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
              }`}
          >
            <RotateCcw size={14} /> {confirmReset ? 'Confirm Reset?' : 'Reset'}
          </button>
        </Row>
      </Section>

      {/* Account */}
      <Section title="Account">
        <Row label="Signed in as" subtitle={user?.email || 'Your account'}>
          <button
            id="profile-logout"
            onClick={() => {
              if (confirmLogout) {
                logout()
              } else {
                setConfirmLogout(true)
                setTimeout(() => setConfirmLogout(false), 4000)
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
              ${confirmLogout
                ? 'bg-orange-600 text-white border-orange-600 animate-pulse'
                : 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20'
              }`}
          >
            <LogOut size={14} /> {confirmLogout ? 'Confirm Sign Out?' : 'Sign Out'}
          </button>
        </Row>
      </Section>

      {/* App info */}
      <div className="text-center text-xs text-slate-600 pb-2">
        Adn Tracker v1.0 · Built with React + Vite
      </div>
    </div>
  )
}
