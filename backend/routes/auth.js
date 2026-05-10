const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getDb } = require('../db')
const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { name, businessName, email, password } = req.body
    if (!name || !businessName || !email || !password) {
      return res.status(400).json({
        error: 'Name, business name, email and password are required'
      })
    }
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      })
    }
    const db = getDb()
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase()]
    })
    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: 'An account with this email already exists'
      })
    }
    const hashedPassword = await bcrypt.hash(password, 12)
    const result = await db.execute({
      sql: `INSERT INTO users (name, businessName, email, password) VALUES (?, ?, ?, ?)`,
      args: [name, businessName, email.toLowerCase(), hashedPassword]
    })
    const userId = Number(result.lastInsertRowid)
    const token = jwt.sign(
      { id: userId, email: email.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )
    res.status(201).json({
      token,
      user: { id: userId, name, businessName, email: email.toLowerCase() }
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Registration failed. Please try again.' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email.toLowerCase()]
    })
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'No account found with this email' })
    }
    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Incorrect password' })
    }
    const token = jwt.sign(
      { id: Number(user.id), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )
    res.json({
      token,
      user: {
        id: Number(user.id),
        name: user.name,
        businessName: user.businessName,
        email: user.email
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed. Please try again.' })
  }
})

module.exports = router
