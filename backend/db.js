require('dotenv').config()
const { createClient } = require('@libsql/client')

let db

function getDb() {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  return db
}

async function initDb() {
  const db = getDb()

  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    businessName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    username TEXT UNIQUE,
    phone TEXT DEFAULT '',
    serviceArea TEXT DEFAULT '',
    googleReviewLink TEXT DEFAULT '',
    revenueGoal REAL DEFAULT 0,
    thankYouTemplate TEXT DEFAULT '',
    reminderDayBefore TEXT DEFAULT '',
    reminderTwoHour TEXT DEFAULT '',
    cancellationPolicy TEXT DEFAULT '',
    bookingNote TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now'))
  )`)

  await db.execute(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    source TEXT DEFAULT '',
    birthday TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  )`)

  await db.execute(`CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    year TEXT DEFAULT '',
    make TEXT DEFAULT '',
    model TEXT DEFAULT '',
    color TEXT DEFAULT '#4F8EF7',
    vehicleType TEXT DEFAULT 'Sedan / Coupe',
    FOREIGN KEY (clientId) REFERENCES clients(id)
  )`)

  await db.execute(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    clientId INTEGER,
    vehicleId INTEGER,
    service TEXT DEFAULT '',
    price REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    discountType TEXT DEFAULT '$',
    deposit REAL DEFAULT 0,
    paymentMethod TEXT DEFAULT 'cash',
    status TEXT DEFAULT 'upcoming',
    date TEXT DEFAULT '',
    time TEXT DEFAULT '',
    duration INTEGER DEFAULT 60,
    location TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    tip REAL DEFAULT 0,
    source TEXT DEFAULT '',
    startedAt TEXT,
    completedAt TEXT,
    timerRunning INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  )`)

  await db.execute(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    category TEXT DEFAULT 'Other',
    description TEXT DEFAULT '',
    amount REAL DEFAULT 0,
    date TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  )`)

  await db.execute(`CREATE TABLE IF NOT EXISTS estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    clientId INTEGER,
    vehicleId INTEGER,
    status TEXT DEFAULT 'draft',
    discount REAL DEFAULT 0,
    discountType TEXT DEFAULT '$',
    deposit REAL DEFAULT 0,
    notes TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  )`)

  await db.execute(`CREATE TABLE IF NOT EXISTS estimate_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estimateId INTEGER NOT NULL,
    service TEXT DEFAULT '',
    label TEXT DEFAULT '',
    price REAL DEFAULT 0,
    FOREIGN KEY (estimateId) REFERENCES estimates(id)
  )`)

  await db.execute(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL DEFAULT 0,
    duration INTEGER DEFAULT 60,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`)

  await db.execute(`CREATE TABLE IF NOT EXISTS pending_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    clientName TEXT DEFAULT '',
    clientPhone TEXT DEFAULT '',
    clientEmail TEXT DEFAULT '',
    vehicleYear TEXT DEFAULT '',
    vehicleMake TEXT DEFAULT '',
    vehicleModel TEXT DEFAULT '',
    vehicleType TEXT DEFAULT '',
    service TEXT DEFAULT '',
    price REAL DEFAULT 0,
    preferredDate TEXT DEFAULT '',
    preferredTime TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  )`)

  console.log('✅ Turso database initialized')
}

module.exports = { getDb, initDb }
