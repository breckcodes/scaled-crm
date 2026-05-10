const express = require('express')
const auth = require('../middleware/auth')
const { getDb } = require('../db')
const router = express.Router()

router.use(auth)

function rowToJob(row) {
  return {
    id: Number(row.id),
    userId: Number(row.userId),
    clientId: row.clientId ? Number(row.clientId) : null,
    vehicleId: row.vehicleId ? Number(row.vehicleId) : null,
    service: row.service || '',
    price: Number(row.price) || 0,
    discount: Number(row.discount) || 0,
    discountType: row.discountType || '$',
    deposit: Number(row.deposit) || 0,
    paymentMethod: row.paymentMethod || 'cash',
    status: row.status || 'upcoming',
    date: row.date || '',
    time: row.time || '',
    duration: Number(row.duration) || 60,
    location: row.location || '',
    notes: row.notes || '',
    tip: Number(row.tip) || 0,
    source: row.source || '',
    startedAt: row.startedAt || null,
    completedAt: row.completedAt || null,
    timerRunning: row.timerRunning === 1,
    createdAt: row.createdAt || ''
  }
}

router.get('/', async (req, res) => {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT * FROM jobs WHERE userId = ? ORDER BY date DESC, time DESC',
      args: [req.user.id]
    })
    res.json(result.rows.map(rowToJob))
  } catch (err) {
    console.error('Get jobs error:', err)
    res.status(500).json({ error: 'Failed to get jobs' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT * FROM jobs WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id]
    })
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' })
    }
    res.json(rowToJob(result.rows[0]))
  } catch (err) {
    res.status(500).json({ error: 'Failed to get job' })
  }
})

router.post('/', async (req, res) => {
  try {
    const db = getDb()
    const {
      clientId, vehicleId, service, price, discount,
      discountType, deposit, paymentMethod, status,
      date, time, duration, location, notes, tip, source
    } = req.body
    const result = await db.execute({
      sql: `INSERT INTO jobs
            (userId, clientId, vehicleId, service, price,
             discount, discountType, deposit, paymentMethod,
             status, date, time, duration, location, notes,
             tip, source)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        req.user.id,
        clientId || null,
        vehicleId || null,
        service || '',
        Number(price) || 0,
        Number(discount) || 0,
        discountType || '$',
        Number(deposit) || 0,
        paymentMethod || 'cash',
        status || 'upcoming',
        date || '',
        time || '',
        Number(duration) || 60,
        location || '',
        notes || '',
        Number(tip) || 0,
        source || ''
      ]
    })
    const newJob = await db.execute({
      sql: 'SELECT * FROM jobs WHERE id = ?',
      args: [Number(result.lastInsertRowid)]
    })
    res.status(201).json(rowToJob(newJob.rows[0]))
  } catch (err) {
    console.error('Create job error:', err)
    res.status(500).json({ error: 'Failed to create job' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const db = getDb()
    const {
      clientId, vehicleId, service, price, discount,
      discountType, deposit, paymentMethod, status,
      date, time, duration, location, notes, tip,
      source, startedAt, completedAt, timerRunning
    } = req.body
    await db.execute({
      sql: `UPDATE jobs SET
            clientId=?, vehicleId=?, service=?, price=?,
            discount=?, discountType=?, deposit=?,
            paymentMethod=?, status=?, date=?, time=?,
            duration=?, location=?, notes=?, tip=?,
            source=?, startedAt=?, completedAt=?,
            timerRunning=?
            WHERE id=? AND userId=?`,
      args: [
        clientId || null,
        vehicleId || null,
        service || '',
        Number(price) || 0,
        Number(discount) || 0,
        discountType || '$',
        Number(deposit) || 0,
        paymentMethod || 'cash',
        status || 'upcoming',
        date || '',
        time || '',
        Number(duration) || 60,
        location || '',
        notes || '',
        Number(tip) || 0,
        source || '',
        startedAt || null,
        completedAt || null,
        timerRunning ? 1 : 0,
        req.params.id,
        req.user.id
      ]
    })
    const updated = await db.execute({
      sql: 'SELECT * FROM jobs WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id]
    })
    res.json(rowToJob(updated.rows[0]))
  } catch (err) {
    console.error('Update job error:', err)
    res.status(500).json({ error: 'Failed to update job' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb()
    await db.execute({
      sql: 'DELETE FROM jobs WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id]
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job' })
  }
})

module.exports = router
