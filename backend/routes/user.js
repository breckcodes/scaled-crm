const express = require('express')
const auth = require('../middleware/auth')
const { getDb } = require('../db')
const router = express.Router()

router.use(auth)

router.get('/settings', async (req, res) => {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [req.user.id]
    })
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    const user = result.rows[0]
    const servicesResult = await db.execute({
      sql: 'SELECT * FROM services WHERE userId = ?',
      args: [req.user.id]
    })
    res.json({
      id: Number(user.id),
      name: user.name,
      businessName: user.businessName,
      email: user.email,
      username: user.username || '',
      phone: user.phone || '',
      serviceArea: user.serviceArea || '',
      googleReviewLink: user.googleReviewLink || '',
      revenueGoal: Number(user.revenueGoal) || 0,
      thankYouTemplate: user.thankYouTemplate || '',
      reminderDayBefore: user.reminderDayBefore || '',
      reminderTwoHour: user.reminderTwoHour || '',
      cancellationPolicy: user.cancellationPolicy || '',
      bookingNote: user.bookingNote || '',
      services: servicesResult.rows.map(s => ({
        id: Number(s.id),
        name: s.name,
        price: Number(s.price),
        duration: Number(s.duration)
      }))
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to get settings' })
  }
})

router.put('/settings', async (req, res) => {
  try {
    const db = getDb()
    const {
      name, businessName, username, phone,
      serviceArea, googleReviewLink, revenueGoal,
      thankYouTemplate, reminderDayBefore,
      reminderTwoHour, cancellationPolicy,
      bookingNote, services
    } = req.body

    if (username) {
      const existing = await db.execute({
        sql: 'SELECT id FROM users WHERE username = ? AND id != ?',
        args: [username, req.user.id]
      })
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Username already taken' })
      }
    }

    await db.execute({
      sql: `UPDATE users SET
            name=?, businessName=?, username=?,
            phone=?, serviceArea=?, googleReviewLink=?,
            revenueGoal=?, thankYouTemplate=?,
            reminderDayBefore=?, reminderTwoHour=?,
            cancellationPolicy=?, bookingNote=?
            WHERE id=?`,
      args: [
        name || '', businessName || '',
        username || null, phone || '',
        serviceArea || '', googleReviewLink || '',
        Number(revenueGoal) || 0,
        thankYouTemplate || '',
        reminderDayBefore || '',
        reminderTwoHour || '',
        cancellationPolicy || '',
        bookingNote || '',
        req.user.id
      ]
    })

    if (services && Array.isArray(services)) {
      await db.execute({
        sql: 'DELETE FROM services WHERE userId = ?',
        args: [req.user.id]
      })
      for (const s of services) {
        await db.execute({
          sql: `INSERT INTO services (userId, name, price, duration) VALUES (?,?,?,?)`,
          args: [req.user.id, s.name || '', Number(s.price) || 0, Number(s.duration) || 60]
        })
      }
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Update settings error:', err)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

module.exports = router
