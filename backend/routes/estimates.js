const express = require('express')
const auth = require('../middleware/auth')
const { getDb } = require('../db')
const router = express.Router()

router.use(auth)

async function estimateWithItems(db, row) {
  const items = await db.execute({
    sql: 'SELECT * FROM estimate_items WHERE estimateId = ?',
    args: [row.id]
  })
  return {
    id: Number(row.id),
    userId: Number(row.userId),
    clientId: row.clientId ? Number(row.clientId) : null,
    vehicleId: row.vehicleId ? Number(row.vehicleId) : null,
    status: row.status || 'draft',
    discount: Number(row.discount) || 0,
    discountType: row.discountType || '$',
    deposit: Number(row.deposit) || 0,
    notes: row.notes || '',
    createdAt: row.createdAt || '',
    items: items.rows.map(i => ({
      id: Number(i.id),
      service: i.service || '',
      label: i.label || '',
      price: Number(i.price) || 0
    }))
  }
}

router.get('/', async (req, res) => {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT * FROM estimates WHERE userId = ? ORDER BY createdAt DESC',
      args: [req.user.id]
    })
    const estimates = await Promise.all(
      result.rows.map(row => estimateWithItems(db, row))
    )
    res.json(estimates)
  } catch (err) {
    res.status(500).json({ error: 'Failed to get estimates' })
  }
})

router.post('/', async (req, res) => {
  try {
    const db = getDb()
    const { clientId, vehicleId, status, discount, discountType, deposit, notes, items } = req.body
    const result = await db.execute({
      sql: `INSERT INTO estimates (userId, clientId, vehicleId, status, discount, discountType, deposit, notes) VALUES (?,?,?,?,?,?,?,?)`,
      args: [
        req.user.id,
        clientId || null,
        vehicleId || null,
        status || 'draft',
        Number(discount) || 0,
        discountType || '$',
        Number(deposit) || 0,
        notes || ''
      ]
    })
    const estimateId = Number(result.lastInsertRowid)
    if (items && items.length > 0) {
      for (const item of items) {
        await db.execute({
          sql: `INSERT INTO estimate_items (estimateId, service, label, price) VALUES (?,?,?,?)`,
          args: [estimateId, item.service || '', item.label || '', Number(item.price) || 0]
        })
      }
    }
    const newEst = await db.execute({
      sql: 'SELECT * FROM estimates WHERE id = ?',
      args: [estimateId]
    })
    const estimate = await estimateWithItems(db, newEst.rows[0])
    res.status(201).json(estimate)
  } catch (err) {
    console.error('Create estimate error:', err)
    res.status(500).json({ error: 'Failed to create estimate' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const db = getDb()
    const { status, discount, discountType, deposit, notes } = req.body
    await db.execute({
      sql: `UPDATE estimates SET status=?, discount=?, discountType=?, deposit=?, notes=? WHERE id=? AND userId=?`,
      args: [
        status || 'draft',
        Number(discount) || 0,
        discountType || '$',
        Number(deposit) || 0,
        notes || '',
        req.params.id,
        req.user.id
      ]
    })
    const updated = await db.execute({
      sql: 'SELECT * FROM estimates WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id]
    })
    const estimate = await estimateWithItems(db, updated.rows[0])
    res.json(estimate)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update estimate' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb()
    await db.execute({
      sql: 'DELETE FROM estimate_items WHERE estimateId = ?',
      args: [req.params.id]
    })
    await db.execute({
      sql: 'DELETE FROM estimates WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id]
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete estimate' })
  }
})

module.exports = router
