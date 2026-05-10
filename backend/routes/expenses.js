const express = require('express')
const auth = require('../middleware/auth')
const { getDb } = require('../db')
const router = express.Router()

router.use(auth)

router.get('/', async (req, res) => {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT * FROM expenses WHERE userId = ? ORDER BY date DESC',
      args: [req.user.id]
    })
    res.json(result.rows.map(row => ({
      id: Number(row.id),
      userId: Number(row.userId),
      category: row.category || 'Other',
      description: row.description || '',
      amount: Number(row.amount) || 0,
      date: row.date || '',
      createdAt: row.createdAt || ''
    })))
  } catch (err) {
    res.status(500).json({ error: 'Failed to get expenses' })
  }
})

router.post('/', async (req, res) => {
  try {
    const db = getDb()
    const { category, description, amount, date } = req.body
    const result = await db.execute({
      sql: `INSERT INTO expenses (userId, category, description, amount, date) VALUES (?,?,?,?,?)`,
      args: [
        req.user.id,
        category || 'Other',
        description || '',
        Number(amount) || 0,
        date || new Date().toISOString().split('T')[0]
      ]
    })
    res.status(201).json({
      id: Number(result.lastInsertRowid),
      userId: req.user.id,
      category: category || 'Other',
      description: description || '',
      amount: Number(amount) || 0,
      date: date || ''
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create expense' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb()
    await db.execute({
      sql: 'DELETE FROM expenses WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id]
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense' })
  }
})

module.exports = router
