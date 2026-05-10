const express = require('express')
const auth = require('../middleware/auth')
const { getDb } = require('../db')
const router = express.Router()

router.use(auth)

async function clientWithVehicles(db, clientRow, userId) {
  const vehicles = await db.execute({
    sql: 'SELECT * FROM vehicles WHERE clientId = ? AND userId = ?',
    args: [clientRow.id, userId]
  })
  return {
    id: Number(clientRow.id),
    userId: Number(clientRow.userId),
    name: clientRow.name || '',
    phone: clientRow.phone || '',
    email: clientRow.email || '',
    notes: clientRow.notes || '',
    source: clientRow.source || '',
    birthday: clientRow.birthday || '',
    createdAt: clientRow.createdAt || '',
    vehicles: vehicles.rows.map(v => ({
      id: Number(v.id),
      clientId: Number(v.clientId),
      year: v.year || '',
      make: v.make || '',
      model: v.model || '',
      color: v.color || '#4F8EF7',
      vehicleType: v.vehicleType || 'Sedan / Coupe'
    }))
  }
}

router.get('/', async (req, res) => {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT * FROM clients WHERE userId = ? ORDER BY name ASC',
      args: [req.user.id]
    })
    const clients = await Promise.all(
      result.rows.map(row => clientWithVehicles(db, row, req.user.id))
    )
    res.json(clients)
  } catch (err) {
    console.error('Get clients error:', err)
    res.status(500).json({ error: 'Failed to get clients' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT * FROM clients WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id]
    })
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' })
    }
    const client = await clientWithVehicles(db, result.rows[0], req.user.id)
    res.json(client)
  } catch (err) {
    res.status(500).json({ error: 'Failed to get client' })
  }
})

router.post('/', async (req, res) => {
  try {
    const db = getDb()
    const { name, phone, email, notes, source, birthday, vehicles } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Client name is required' })
    }
    const result = await db.execute({
      sql: `INSERT INTO clients (userId, name, phone, email, notes, source, birthday) VALUES (?,?,?,?,?,?,?)`,
      args: [req.user.id, name, phone || '', email || '', notes || '', source || '', birthday || '']
    })
    const clientId = Number(result.lastInsertRowid)
    if (vehicles && vehicles.length > 0) {
      for (const v of vehicles) {
        await db.execute({
          sql: `INSERT INTO vehicles (clientId, userId, year, make, model, color, vehicleType) VALUES (?,?,?,?,?,?,?)`,
          args: [
            clientId, req.user.id,
            v.year || '', v.make || '',
            v.model || '', v.color || '#4F8EF7',
            v.vehicleType || 'Sedan / Coupe'
          ]
        })
      }
    }
    const newClient = await db.execute({
      sql: 'SELECT * FROM clients WHERE id = ?',
      args: [clientId]
    })
    const client = await clientWithVehicles(db, newClient.rows[0], req.user.id)
    res.status(201).json(client)
  } catch (err) {
    console.error('Create client error:', err)
    res.status(500).json({ error: 'Failed to create client' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const db = getDb()
    const { name, phone, email, notes, source, birthday } = req.body
    await db.execute({
      sql: `UPDATE clients SET name=?, phone=?, email=?, notes=?, source=?, birthday=? WHERE id=? AND userId=?`,
      args: [
        name || '', phone || '', email || '',
        notes || '', source || '', birthday || '',
        req.params.id, req.user.id
      ]
    })
    const updated = await db.execute({
      sql: 'SELECT * FROM clients WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id]
    })
    const client = await clientWithVehicles(db, updated.rows[0], req.user.id)
    res.json(client)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update client' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb()
    await db.execute({
      sql: 'DELETE FROM vehicles WHERE clientId = ? AND userId = ?',
      args: [req.params.id, req.user.id]
    })
    await db.execute({
      sql: 'DELETE FROM clients WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id]
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete client' })
  }
})

module.exports = router
