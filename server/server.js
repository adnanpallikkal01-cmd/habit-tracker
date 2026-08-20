import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import webpush from 'web-push'

const app = express()
const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*'
const JWT_SECRET = process.env.JWT_SECRET || 'adn_tracker_jwt_secret_change_in_prod_2024'
const JWT_EXPIRES_IN = '30d'
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI environment variable.')
  process.exit(1)
}

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
} else {
  console.warn('VAPID keys are not configured. Background push notifications are disabled until VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are added.')
}

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }))
app.use(express.json({ limit: '10mb' }))

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true })
const User = mongoose.model('User', userSchema)

const stateSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  state: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true })
const State = mongoose.model('State', stateSchema)

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  subscription: { type: mongoose.Schema.Types.Mixed, required: true },
  timeZone: { type: String, default: 'Asia/Kolkata' },
}, { timestamps: true })
const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema)

const notificationDeliverySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  key: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
}, { timestamps: true })
notificationDeliverySchema.index({ userId: 1, key: 1 }, { unique: true })
const NotificationDelivery = mongoose.model('NotificationDelivery', notificationDeliverySchema)

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Authentication required' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    req.userEmail = payload.email
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, pushConfigured: Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) }))

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })
    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) return res.status(409).json({ message: 'An account with this email already exists' })
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ email: email.toLowerCase().trim(), passwordHash })
    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    res.status(201).json({ token, user: { id: user._id, email: user.email } })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' })
    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    res.json({ token, user: { id: user._id, email: user.email } })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/api/auth/verify', authMiddleware, (req, res) => res.json({ ok: true, userId: req.userId, email: req.userEmail }))

app.get('/api/state', authMiddleware, async (req, res) => {
  const record = await State.findOne({ userId: req.userId }).lean()
  res.json({ state: record?.state || null })
})

app.put('/api/state', authMiddleware, async (req, res) => {
  if (!req.body?.state || typeof req.body.state !== 'object') return res.status(400).json({ message: 'state object is required' })
  const state = { ...req.body.state }
  state.settings = { ...(state.settings || {}), timeZone: state.settings?.timeZone || 'Asia/Kolkata' }
  const record = await State.findOneAndUpdate(
    { userId: req.userId },
    { userId: req.userId, state },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean()
  res.json({ ok: true, updatedAt: record.updatedAt })
})

app.delete('/api/state', authMiddleware, async (req, res) => {
  await State.deleteOne({ userId: req.userId })
  await NotificationDelivery.deleteMany({ userId: req.userId })
  await PushSubscription.deleteMany({ userId: req.userId })
  res.json({ ok: true })
})

app.get('/api/push/public-key', (_req, res) => {
  if (!VAPID_PUBLIC_KEY) return res.status(503).json({ message: 'Push notifications are not configured.' })
  res.json({ publicKey: VAPID_PUBLIC_KEY })
})

app.post('/api/push/subscribe', authMiddleware, async (req, res) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return res.status(503).json({ message: 'Push notifications are not configured on the server.' })
  const { subscription, timeZone } = req.body || {}
  if (!subscription?.endpoint) return res.status(400).json({ message: 'Push subscription is required.' })
  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    { userId: req.userId, endpoint: subscription.endpoint, subscription, timeZone: timeZone || 'Asia/Kolkata' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  res.json({ ok: true })
})

app.post('/api/push/test', authMiddleware, async (req, res) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return res.status(503).json({ message: 'Background notifications are not configured on the server yet.' })
  const subscriptions = await PushSubscription.find({ userId: req.userId }).lean()
  if (!subscriptions.length) return res.status(404).json({ message: 'No push subscription found. Tap Enable / Refresh first.' })
  let delivered = false
  for (const record of subscriptions) {
    try {
      await webpush.sendNotification(record.subscription, JSON.stringify({
        title: '🔔 Adn Tracker test',
        body: 'Background notifications are working. Your reminders can now arrive when the app is closed.',
        tag: 'adn-tracker-test',
        renotify: true,
        url: '/profile',
      }))
      delivered = true
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) await PushSubscription.deleteOne({ _id: record._id })
      else console.error('Test push delivery error:', error.message)
    }
  }
  if (!delivered) return res.status(502).json({ message: 'The push service rejected the subscription. Enable / Refresh again.' })
  res.json({ ok: true, message: 'Test notification sent.' })
})

app.delete('/api/push/subscribe', authMiddleware, async (req, res) => {
  const endpoint = req.body?.endpoint
  if (endpoint) await PushSubscription.deleteOne({ userId: req.userId, endpoint })
  else await PushSubscription.deleteMany({ userId: req.userId })
  res.json({ ok: true })
})

function getLocalParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short'
  }).formatToParts(date)
  const out = {}
  for (const part of parts) if (part.type !== 'literal') out[part.type] = part.value
  return out
}

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hRaw, mRaw] = String(timeStr).split(':')
  const h = Number(hRaw), m = Number(mRaw)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return String(timeStr)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function isWithinQuietHours(localHour, localMinute, startStr = '22:00', endStr = '06:00') {
  const [sh, sm] = String(startStr).split(':').map(Number)
  const [eh, em] = String(endStr).split(':').map(Number)
  if (![sh, sm, eh, em].every(Number.isFinite)) return false
  const nowMinutes = Number(localHour) * 60 + Number(localMinute)
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  if (startMinutes === endMinutes) return false
  return startMinutes > endMinutes
    ? nowMinutes >= startMinutes || nowMinutes < endMinutes
    : nowMinutes >= startMinutes && nowMinutes < endMinutes
}

function dueWithinWindow(date, timeZone, dateStr, timeStr, windowMinutes = 5) {
  if (!dateStr || !timeStr) return false
  const local = getLocalParts(date, timeZone)
  const localDate = `${local.year}-${local.month}-${local.day}`
  if (localDate !== dateStr) return false
  const currentMinutes = Number(local.hour) * 60 + Number(local.minute)
  const [hour, minute] = String(timeStr).split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false
  const scheduledMinutes = hour * 60 + minute
  const diff = currentMinutes - scheduledMinutes
  return diff >= 0 && diff <= windowMinutes
}

function dueNow(date, timeZone, dateStr, timeStr) {
  if (!dateStr || !timeStr) return false
  const local = getLocalParts(date, timeZone)
  return local.year === dateStr.slice(0,4) && local.month === dateStr.slice(5,7) && local.day === dateStr.slice(8,10) && local.hour === timeStr.slice(0,2) && local.minute === timeStr.slice(3,5)
}

async function sendReminder(userId, key, payload) {
  const already = await NotificationDelivery.findOne({ userId, key }).lean()
  if (already) return
  const subscriptions = await PushSubscription.find({ userId }).lean()
  if (!subscriptions.length) return

  let delivered = false
  for (const record of subscriptions) {
    try {
      await webpush.sendNotification(record.subscription, JSON.stringify(payload))
      delivered = true
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await PushSubscription.deleteOne({ _id: record._id })
      } else {
        console.error('Push delivery error:', error.message)
      }
    }
  }
  if (delivered) {
    try { await NotificationDelivery.create({ userId, key }) } catch (error) { if (error?.code !== 11000) console.error('Delivery log error:', error.message) }
  }
}

async function runReminderScheduler() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return
  try {
    const records = await State.find({}).lean()
    const now = new Date()

    for (const record of records) {
      const state = record.state || {}
      const settings = state.settings || {}
      const timeZone = settings.timeZone || 'Asia/Kolkata'
      const local = getLocalParts(now, timeZone)
      const today = `${local.year}-${local.month}-${local.day}`

      // Helper: send only when a reminder is enabled and its scheduled time is
      // within the last 5 minutes. This makes short Render wake-up delays safe.
      const sendIfDue = async (kind, id, dateStr, timeStr, payload) => {
        if (!id || !dateStr || !timeStr) return
        if (!dueWithinWindow(now, timeZone, dateStr, timeStr, 5)) return
        await sendReminder(record.userId, `${kind}:${id}:${dateStr}:${timeStr}`, payload)
      }

      // Daily prayer reminders. Use the saved prayer times and the user's
      // notification preference. Empty times are ignored.
      if (settings.notifications?.prayer === true) {
        const labels = {
          fajr: ['🌅', 'Fajr', 'الفجر'],
          dhuhr: ['☀️', 'Dhuhr', 'الظهر'],
          asr: ['🌤️', 'Asr', 'العصر'],
          maghrib: ['🌇', 'Maghrib', 'المغرب'],
          isha: ['🌙', 'Isha', 'العشاء'],
        }
        for (const [prayerId, time] of Object.entries(settings.prayerTimes || {})) {
          if (!time) continue
          const meta = labels[prayerId] || ['🤲', prayerId, '']
          await sendIfDue(
            'prayer', prayerId, today, time,
            { title: `${meta[0]} Time for ${meta[1]} Prayer`, body: `${meta[2]} — It's prayer time. Don't miss it! 🤲`, tag: `prayer-${prayerId}`, url: '/prayer' }
          )
        }
      }

      // Study schedules. The UI stores the flag as `reminder`, while older
      // records may use `reminderEnabled`; support both.
      for (const item of Array.isArray(state.studyScheduled) ? state.studyScheduled : []) {
        const reminderEnabled = item?.reminderEnabled === true || item?.reminder === true
        const hint = item?.reminderTime || item?.time || item?.startTime
        if (!item?.id || !reminderEnabled || item.completed || !item.date || !hint) continue
        await sendIfDue(
          'study', item.id, item.date, hint,
          { title: `📚 ${item.topic || item.subject || 'Study session'} is starting`, body: `Your scheduled study session starts at ${formatTime12(hint)}.`, tag: `study-${item.id}`, url: '/study' }
        )
      }

      // Calendar events.
      for (const event of Array.isArray(state.calendarEvents) ? state.calendarEvents : []) {
        if (!event?.id || !event.reminderEnabled || !event.date || !event.time) continue
        const eventDate = event.repeatAnnually ? `${today.slice(0, 4)}-${event.date.slice(5, 10)}` : event.date
        await sendIfDue(
          'calendar', event.id, eventDate, event.time,
          { title: `📅 ${event.title}`, body: event.notes || `${event.type || 'Event'} reminder`, tag: `calendar-${event.id}`, url: '/calendar' }
        )
      }

      // Borrow / lend return reminders.
      for (const loan of Array.isArray(state.loans) ? state.loans : []) {
        if (!loan?.id || loan.returned || !loan.reminderEnabled || !loan.returnDate || !loan.returnTime) continue
        const verb = loan.direction === 'borrowed' ? `Return ${loan.person}'s money` : `Follow up with ${loan.person}`
        await sendIfDue(
          'loan', loan.id, loan.returnDate, loan.returnTime,
          { title: `💰 ${verb}`, body: `${loan.direction === 'borrowed' ? 'Borrowed' : 'Lent'} amount: ${settings.currency || '₹'}${Number(loan.amount || 0).toLocaleString()}`, tag: `loan-${loan.id}`, url: '/finance' }
        )
      }

      // Water reminders. Interval is configurable from Profile. Night pause prevents
      // hydration notifications from waking the user (default: 10:00 PM–6:00 AM).
      if (settings.waterReminderEnabled || settings.notifications?.water === true) {
        const interval = Math.max(5, Number(settings.waterReminderIntervalMinutes || 15))
        const minuteOfDay = Number(local.hour) * 60 + Number(local.minute)
        const nightPause = settings.waterReminderNightPauseEnabled ?? true
        const inNightPause = nightPause && isWithinQuietHours(
          local.hour,
          local.minute,
          settings.waterReminderNightStart || '22:00',
          settings.waterReminderNightEnd || '06:00'
        )
        if (!inNightPause && minuteOfDay % interval === 0) {
          await sendReminder(record.userId, `water:${today}:${Math.floor(minuteOfDay / interval)}`, {
            title: '💧 Time to Drink Water!',
            body: 'Stay hydrated — have a glass of water now! 🥤',
            tag: 'water-reminder',
            url: '/water'
          })
        }
      }
    }
  } catch (error) {
    console.error('Reminder scheduler error:', error)
  }
}

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Internal server error' })
})

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Adn Tracker API listening on port ${PORT}`)
      if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        setTimeout(runReminderScheduler, 5000)
        setInterval(runReminderScheduler, 15_000)
        console.log('Background reminder scheduler enabled')
      }
    })
  })
  .catch(error => {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  })
