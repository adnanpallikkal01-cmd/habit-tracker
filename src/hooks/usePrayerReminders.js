import { useEffect, useRef } from 'react'
import { requestAndSubscribeToBackgroundNotifications } from '../services/push.js'

export async function fireNotification(title, body, tag = 'app-notif') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag,
        renotify: true,
        silent: false,
      })
      return
    } catch {
      // Fall back to a foreground notification when SW display is unavailable.
    }
  }
  new Notification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag, renotify: true, silent: false })
}

export function isNotificationSupported() {
  return 'Notification' in window && typeof Notification.requestPermission === 'function'
}

const PRAYER_META = {
  fajr:    { name: 'Fajr',    emoji: '🌅', arabic: 'الفجر'  },
  dhuhr:   { name: 'Dhuhr',   emoji: '☀️',  arabic: 'الظهر'  },
  asr:     { name: 'Asr',     emoji: '🌤️', arabic: 'العصر'  },
  maghrib: { name: 'Maghrib', emoji: '🌇', arabic: 'المغرب' },
  isha:    { name: 'Isha',    emoji: '🌙', arabic: 'العشاء' },
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') {
    try { await requestAndSubscribeToBackgroundNotifications() } catch {}
    return true
  }
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  if (result !== 'granted') return false
  try { await requestAndSubscribeToBackgroundNotifications() } catch (error) { console.warn(error) }
  return true
}

export async function enableBackgroundNotifications() {
  return requestAndSubscribeToBackgroundNotifications()
}

function firePrayerNotification(prayerId) {
  const meta = PRAYER_META[prayerId]
  if (!meta) return
  fireNotification(`${meta.emoji} Time for ${meta.name} Prayer`, `${meta.arabic} — It's prayer time. Don't miss it! 🤲`, `prayer-${prayerId}`)
}

export function usePrayerReminders(prayerTimes, enabled) {
  const firedRef = useRef({})
  useEffect(() => {
    if (!enabled || !('Notification' in window)) return
    const check = () => {
      const now = new Date()
      const todayKey = now.toDateString()
      if (firedRef.current._day !== todayKey) firedRef.current = { _day: todayKey }
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      Object.entries(prayerTimes || {}).forEach(([prayerId, time]) => {
        if (time === currentTime && !firedRef.current[prayerId]) {
          firedRef.current[prayerId] = true
          firePrayerNotification(prayerId)
        }
      })
    }
    check()
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [prayerTimes, enabled])
}

function isWithinWaterQuietHours(settings) {
  if (!settings?.waterReminderNightPauseEnabled) return false
  const start = String(settings.waterReminderNightStart || '22:00')
  const end = String(settings.waterReminderNightEnd || '06:00')
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if (![sh, sm, eh, em].every(Number.isFinite)) return false
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  if (startMinutes === endMinutes) return false
  return startMinutes > endMinutes
    ? nowMinutes >= startMinutes || nowMinutes < endMinutes
    : nowMinutes >= startMinutes && nowMinutes < endMinutes
}

export function useWaterReminder(settings) {
  useEffect(() => {
    const enabled = settings?.waterReminderEnabled ?? false
    if (!enabled || !('Notification' in window)) return
    const intervalMinutes = Math.max(5, Number(settings?.waterReminderIntervalMinutes || 15))
    const fire = () => {
      if (isWithinWaterQuietHours(settings)) return
      fireNotification('💧 Time to Drink Water!', 'Stay hydrated — have a glass of water now! 🥤', 'water-reminder')
    }
    // Do not wake the user during configured night hours.
    fire()
    const interval = setInterval(fire, intervalMinutes * 60 * 1000)
    return () => clearInterval(interval)
  }, [settings?.waterReminderEnabled, settings?.waterReminderIntervalMinutes, settings?.waterReminderNightPauseEnabled, settings?.waterReminderNightStart, settings?.waterReminderNightEnd])
}

export function useStudyReminderScheduler(scheduleItems, dispatch) {
  const handledRef = useRef({})
  useEffect(() => {
    if (!Array.isArray(scheduleItems) || !dispatch || !('Notification' in window) || Notification.permission !== 'granted') return
    const check = () => {
      const now = Date.now()
      scheduleItems.forEach(item => {
        const reminderEnabled = item?.reminderEnabled ?? item?.reminder ?? false
        if (!item || !item.id || !reminderEnabled || item.completed) return
        const hint = item.reminderTime || item.time || item.startTime
        if (!item.date || !hint) return
        const reminderMs = new Date(`${item.date}T${hint}`).getTime()
        const key = `${item.id}:${item.date}:${hint}`
        if (now >= reminderMs && !handledRef.current[key]) {
          handledRef.current[key] = true
          fireNotification(`📚 ${item.topic || item.subject || 'Study session'} is starting`, `Your scheduled study session starts at ${hint}.`, `study-reminder-${item.id}`)
          dispatch({ type: 'UPDATE_STUDY_SCHEDULE', payload: { ...item } })
        }
      })
    }
    check()
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [scheduleItems, dispatch])
}
