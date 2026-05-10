const express = require('express')
const auth = require('../middleware/auth')
const { getDb } = require('../db')
const router = express.Router()

router.get('/public/:username', async (req, res) => {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [req.params.username]
    })
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' })
    }
    const user = result.rows[0]
    const services = await db.execute({
      sql: 'SELECT * FROM services WHERE userId = ?',
      args: [user.id]
    })
    res.json({
      businessName: user.businessName,
      ownerName: user.name,
      bookingNote: user.bookingNote || '',
      services: services.rows.map(s => ({
        id: Number(s.id),
        name: s.name,
        price: Number(s.price),
        duration: Number(s.duration)
      }))
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to get booking info' })
  }
})

router.post('/public/:username', async (req, res) => {
  try {
    const db = getDb()
    const userResult = await db.execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: [req.params.username]
    })
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' })
    }
    const userId = Number(userResult.rows[0].id)
    const {
      clientName, clientPhone, clientEmail,
      vehicleYear, vehicleMake, vehicleModel,
      vehicleType, service, price,
      preferredDate, preferredTime, notes
    } = req.body
    await db.execute({
      sql: `INSERT INTO pending_bookings
            (userId, clientName, clientPhone, clientEmail,
             vehicleYear, vehicleMake, vehicleModel,
             vehicleType, service, price,
             preferredDate, preferredTime, notes)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        userId, clientName || '', clientPhone || '',
        clientEmail || '', vehicleYear || '',
        vehicleMake || '', vehicleModel || '',
        vehicleType || '', service || '',
        Number(price) || 0, preferredDate || '',
        preferredTime || '', notes || ''
      ]
    })
    res.status(201).json({ success: true, message: 'Booking request submitted!' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit booking' })
  }
})

router.get('/', auth, async (req, res) => {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: `SELECT * FROM pending_bookings WHERE userId = ? AND status = 'pending' ORDER BY createdAt DESC`,
      args: [req.user.id]
    })
    res.json(result.rows.map(row => ({
      id: Number(row.id),
      clientName: row.clientName || '',
      clientPhone: row.clientPhone || '',
      clientEmail: row.clientEmail || '',
      vehicleYear: row.vehicleYear || '',
      vehicleMake: row.vehicleMake || '',
      vehicleModel: row.vehicleModel || '',
      vehicleType: row.vehicleType || '',
      service: row.service || '',
      price: Number(row.price) || 0,
      preferredDate: row.preferredDate || '',
      preferredTime: row.preferredTime || '',
      notes: row.notes || '',
      status: row.status || 'pending',
      createdAt: row.createdAt || ''
    })))
  } catch (err) {
    res.status(500).json({ error: 'Failed to get bookings' })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const db = getDb()
    const { status } = req.body
    await db.execute({
      sql: `UPDATE pending_bookings SET status = ? WHERE id = ? AND userId = ?`,
      args: [status, req.params.id, req.user.id]
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking' })
  }
})

module.exports = router
