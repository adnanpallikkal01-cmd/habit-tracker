import React, { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import Modal, { ConfirmModal } from '../components/shared/Modal.jsx'
import { getPrayerStats, getDayHabitCompletion, getStudyMinutes, getWaterMl, getDailyScore } from '../utils/calculations.js'
import { toDateStr, daysInMonth, currentMonth, formatDateFull, formatTime12 } from '../utils/dateHelpers.js'
import { ChevronLeft, ChevronRight, Plus, Bell, Trash2, CalendarDays } from 'lucide-react'
import { nanoid } from '../utils/nanoid.js'

function getDayColor(score) {
  if (score === null) return 'bg-slate-800/50 text-slate-500'
  if (score >= 80) return 'bg-green-500/80 text-white'
  if (score >= 50) return 'bg-yellow-500/70 text-black'
  if (score > 0) return 'bg-red-500/60 text-white'
  return 'bg-slate-700/70 text-slate-400'
}

function EventForm({ initial, date, onSave, onClose }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    type: initial?.type || 'event',
    date: initial?.date || date,
    time: initial?.time || '09:00',
    reminderEnabled: initial?.reminderEnabled ?? true,
    repeatAnnually: initial?.repeatAnnually ?? false,
    notes: initial?.notes || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Title *</label>
        <input autoFocus value={form.title} onChange={e => set('title', e.target.value)} placeholder="Birthday, meeting, event..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-slate-400 mb-1 block">Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white" /></div>
        <div><label className="text-xs text-slate-400 mb-1 block">Time</label><input type="time" value={form.time} onChange={e => set('time', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white" /></div>
      </div>
      <div><label className="text-xs text-slate-400 mb-1 block">Type</label><select value={form.type} onChange={e => set('type', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"><option value="event">Event</option><option value="birthday">Birthday</option><option value="meeting">Meeting</option><option value="program">Program</option><option value="other">Other</option></select></div>
      <div><label className="text-xs text-slate-400 mb-1 block">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Optional details" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white" /></div>
      <label className="flex items-center gap-3 rounded-xl bg-slate-800/60 border border-slate-700/40 p-3 cursor-pointer"><input type="checkbox" checked={form.reminderEnabled} onChange={e => set('reminderEnabled', e.target.checked)} /><span><span className="block text-sm text-white">Reminder</span><span className="block text-xs text-slate-500">Notify me at this date and time</span></span></label>
      {form.type === 'birthday' && <label className="flex items-center gap-3 rounded-xl bg-slate-800/60 border border-slate-700/40 p-3 cursor-pointer"><input type="checkbox" checked={form.repeatAnnually} onChange={e => set('repeatAnnually', e.target.checked)} /><span><span className="block text-sm text-white">Repeat every year</span><span className="block text-xs text-slate-500">Useful for birthdays and annual events</span></span></label>}
      <div className="flex gap-3"><button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300">Cancel</button><button disabled={!form.title.trim()} onClick={() => onSave({ ...form, title: form.title.trim(), id: initial?.id || nanoid() })} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold disabled:opacity-40">Save Event</button></div>
    </div>
  )
}

export default function Calendar() {
  const { state, dispatch } = useApp()
  const [yearMonth, setYearMonth] = useState(currentMonth())
  const [selectedDay, setSelectedDay] = useState(null)
  const [eventModal, setEventModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const today = toDateStr()
  const monthDays = daysInMonth(yearMonth)
  const events = state.calendarEvents || []

  const dayScores = useMemo(() => {
    const scores = {}
    monthDays.forEach(d => {
      if (d > today) { scores[d] = null; return }
      const hasAnyData = state.prayers[d] || state.gymLogs[d] || state.waterLogs[d] || state.studySessions.some(s => s.date === d)
      if (!hasAnyData) { scores[d] = 0; return }
      scores[d] = getDailyScore(d, { prayers: state.prayers, studySessions: state.studySessions, gymLogs: state.gymLogs, waterLogs: state.waterLogs, habitLogs: state.habitLogs, habits: state.habits, settings: state.settings, selfCare: state.selfCare })
    })
    return scores
  }, [state, monthDays, today])

  const prevMonth = () => { const [y,m]=yearMonth.split('-').map(Number); const d=new Date(y,m-2,1); setYearMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`) }
  const nextMonth = () => { const [y,m]=yearMonth.split('-').map(Number); const d=new Date(y,m,1); setYearMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`) }
  const monthName = new Date(yearMonth + '-15').toLocaleDateString('en-IN',{month:'long',year:'numeric'})
  const firstDayOffset = (new Date(yearMonth + '-01').getDay()+6)%7

  const dayDetail = useMemo(() => {
    if (!selectedDay) return null
    const prayerStats = getPrayerStats(state.prayers, selectedDay)
    const habitPct = getDayHabitCompletion(state.habitLogs, state.habits, selectedDay)
    const studyMins = getStudyMinutes(state.studySessions, selectedDay)
    const waterMl = getWaterMl(state.waterLogs, selectedDay)
    const gymDone = state.gymLogs[selectedDay]?.done
    const expenses = state.transactions.filter(t=>t.date===selectedDay&&t.type==='expense').reduce((s,t)=>s+t.amount,0)
    return { prayerStats, habitPct, studyMins, waterMl, gymDone, expenses, score: dayScores[selectedDay], events: events.filter(e=>e.date===selectedDay) }
  }, [selectedDay,state,dayScores,events])
  const currency = state.settings?.currency || '₹'

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between gap-3"><button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400"><ChevronLeft size={18}/></button><div className="text-center"><h2 className="text-base font-bold text-white">{monthName}</h2><p className="text-[11px] text-slate-500">Tap any date to add a reminder</p></div><button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400"><ChevronRight size={18}/></button></div>
      <div className="rounded-2xl p-4 bg-slate-800/60 border border-slate-700/40">
        <div className="grid grid-cols-7 gap-1 mb-2">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div key={d} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({length:firstDayOffset}).map((_,i)=><div key={`e-${i}`}/>) }
          {monthDays.map(d=>{
            const score=dayScores[d], isToday=d===today, hasEvents=events.some(e=>e.date===d), dayNum=d.split('-')[2].replace(/^0/,'')
            return <button key={d} onClick={()=>setSelectedDay(d)} title={d} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all ${getDayColor(score)} hover:opacity-90 hover:scale-105 ${isToday?'ring-2 ring-white ring-offset-1 ring-offset-slate-900':''}`}><span>{dayNum}</span>{score!==null&&score>0&&<span className="text-[9px] opacity-80">{score}%</span>}{hasEvents&&<span className="w-1.5 h-1.5 rounded-full bg-violet-300 mt-0.5"/>}</button>
          })}
        </div>
        <div className="flex gap-4 mt-4 flex-wrap justify-center text-xs text-slate-500"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-300"/>Reminder</span><span>Green 80%+</span><span>Yellow 50–79%</span><span>Red &lt;50%</span></div>
      </div>
      <div className="flex justify-end"><button onClick={()=>setEventModal({date:today})} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold"><Plus size={16}/> Add Reminder</button></div>

      <Modal isOpen={!!selectedDay} onClose={()=>setSelectedDay(null)} title={selectedDay ? formatDateFull(selectedDay) : ''} size="md">
        {dayDetail&&<div className="space-y-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-slate-500">Daily score</p><p className="text-3xl font-bold text-white">{dayDetail.score ?? 0}%</p></div><button onClick={()=>setEventModal({date:selectedDay})} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"><Plus size={14}/> Add reminder</button></div>
          {dayDetail.events.length>0&&<div className="space-y-2"><h3 className="text-sm font-semibold text-white">Reminders</h3>{dayDetail.events.map(event=><div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20"><div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center"><CalendarDays size={17} className="text-violet-300"/></div><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{event.title}</p><p className="text-xs text-slate-500">{formatTime12(event.time)} · {event.type}{event.reminderEnabled?' · reminder on':''}</p></div><button onClick={()=>setDeleteTarget(event.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={15}/></button></div>)}</div>}
          <div className="grid grid-cols-2 gap-3"><div className="rounded-xl p-3 bg-violet-500/10 border border-violet-500/20"><p className="text-xs text-violet-300">Prayer</p><p className="text-lg font-bold text-white">{dayDetail.prayerStats.completed}/5</p></div><div className="rounded-xl p-3 bg-blue-500/10 border border-blue-500/20"><p className="text-xs text-blue-300">Study</p><p className="text-lg font-bold text-white">{(dayDetail.studyMins/60).toFixed(1)}h</p></div><div className="rounded-xl p-3 bg-green-500/10 border border-green-500/20"><p className="text-xs text-green-300">Gym</p><p className="text-lg font-bold text-white">{dayDetail.gymDone?'✓':'✗'}</p></div><div className="rounded-xl p-3 bg-cyan-500/10 border border-cyan-500/20"><p className="text-xs text-cyan-300">Water</p><p className="text-lg font-bold text-white">{(dayDetail.waterMl/1000).toFixed(1)}L</p></div><div className="rounded-xl p-3 bg-indigo-500/10 border border-indigo-500/20"><p className="text-xs text-indigo-300">Habits</p><p className="text-lg font-bold text-white">{dayDetail.habitPct}%</p></div><div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20"><p className="text-xs text-red-300">Expenses</p><p className="text-lg font-bold text-white">{currency}{dayDetail.expenses.toLocaleString()}</p></div></div>
        </div>}
      </Modal>
      <Modal isOpen={!!eventModal} onClose={()=>setEventModal(null)} title={eventModal?.id?'Edit Reminder':'Add Calendar Reminder'} size="md"><EventForm initial={eventModal?.id?eventModal:null} date={eventModal?.date || today} onClose={()=>setEventModal(null)} onSave={data=>{dispatch({type:eventModal?.id?'UPDATE_CALENDAR_EVENT':'ADD_CALENDAR_EVENT',payload:data});setEventModal(null)}}/></Modal>
      <ConfirmModal isOpen={!!deleteTarget} title="Delete reminder" message="This calendar reminder will be removed." confirmText="Delete" onConfirm={()=>{dispatch({type:'DELETE_CALENDAR_EVENT',payload:deleteTarget});setDeleteTarget(null)}} onClose={()=>setDeleteTarget(null)}/>
    </div>
  )
}
