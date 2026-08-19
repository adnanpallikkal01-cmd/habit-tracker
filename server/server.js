import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const app = express()
const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*'
const JWT_SECRET = process.env.JWT_SECRET || 'adn_tracker_jwt_secret_change_in_prod_2024'
const JWT_EXPIRES_IN = '30d'

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI environment variable.')
  process.exit(1)
}

app.use(cors({ origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN.split(',').map(v => v.trim()) }))
app.use(express.json({ limit: '10mb' }))

// ── Schemas ───────────────────────────────────────────────────────

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

// ── Auth Middleware ───────────────────────────────────────────────

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

// ── Health ────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// ── Auth Routes ───────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) return res.status(409).json({ message: 'An account with this email already exists' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ email: email.toLowerCase().trim(), passwordHash })

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

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

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({ token, user: { id: user._id, email: user.email } })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Verify token (used by client on startup)
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ ok: true, userId: req.userId, email: req.userEmail })
})

// ── State Routes (now JWT-protected) ─────────────────────────────

app.get('/api/state', authMiddleware, async (req, res) => {
  const record = await State.findOne({ userId: req.userId }).lean()
  res.json({ state: record?.state || null })
})

app.put('/api/state', authMiddleware, async (req, res) => {
  if (!req.body?.state || typeof req.body.state !== 'object') {
    return res.status(400).json({ message: 'state object is required' })
  }
  const record = await State.findOneAndUpdate(
    { userId: req.userId },
    { userId: req.userId, state: req.body.state },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean()
  res.json({ ok: true, updatedAt: record.updatedAt })
})

app.delete('/api/state', authMiddleware, async (req, res) => {
  await State.deleteOne({ userId: req.userId })
  res.json({ ok: true })
})

// ── Global error handler ──────────────────────────────────────────

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Internal server error' })
})

// ── Connect & Start ───────────────────────────────────────────────

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Adn Tracker API listening on port ${PORT}`))
  })
  .catch(error => {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  })
