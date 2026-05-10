require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { initDb } = require('./db')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL
    ].filter(Boolean)
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }
    callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

app.get('/api/health', (_, res) =>
  res.json({ ok: true, version: '2.0', ts: Date.now() })
)

app.use('/api/auth', require('./routes/auth'))
app.use('/api/jobs', require('./routes/jobs'))
app.use('/api/clients', require('./routes/clients'))
app.use('/api/expenses', require('./routes/expenses'))
app.use('/api/estimates', require('./routes/estimates'))
app.use('/api/user', require('./routes/user'))
app.use('/api/bookings', require('./routes/bookings'))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong' })
})

async function start() {
  try {
    await initDb()
    app.listen(PORT, () => {
      console.log(`✅ Scaled CRM v2 running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start:', err)
    process.exit(1)
  }
}

start()
