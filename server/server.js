import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

const app = express()
const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*'

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI environment variable.')
  process.exit(1)
}

app.use(cors({ origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN.split(',').map(v => v.trim()) }))
app.use(express.json({ limit: '5mb' }))

const stateSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  state: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true })

const State = mongoose.model('State', stateSchema)

function getUserId(req, res, next) {
  const id = String(req.header('x-user-id') || '').trim()
  if (!id || id.length > 100) return res.status(400).json({ message: 'Missing or invalid user id' })
  req.userId = id
  next()
}

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/state', getUserId, async (req, res) => {
  const record = await State.findOne({ userId: req.userId }).lean()
  res.json({ state: record?.state || null })
})

app.put('/api/state', getUserId, async (req, res) => {
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

app.delete('/api/state', getUserId, async (req, res) => {
  await State.deleteOne({ userId: req.userId })
  res.json({ ok: true })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Internal server error' })
})

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Adn Tracker API listening on port ${PORT}`))
  })
  .catch(error => {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  })
