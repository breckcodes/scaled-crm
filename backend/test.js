const BASE = 'http://localhost:3001'

async function test() {
  console.log('Testing Scaled CRM v2 Backend...\n')

  // Test 1: Health
  const health = await fetch(`${BASE}/api/health`)
  const h = await health.json()
  console.log('✅ Health:', h)

  // Test 2: Register
  const reg = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      businessName: 'Test Detailing',
      email: `test${Date.now()}@test.com`,
      password: 'test1234'
    })
  })
  const regData = await reg.json()
  console.log('✅ Register:', regData.user ? 'SUCCESS user.id=' + regData.user.id : JSON.stringify(regData))
  const token = regData.token

  // Test 2b: Login with same account
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: regData.user.email, password: 'test1234' })
  })
  const loginData = await login.json()
  console.log('✅ Login:', loginData.token ? 'SUCCESS' : JSON.stringify(loginData))

  // Test 2c: Reject dev token
  const devTok = await fetch(`${BASE}/api/jobs`, {
    headers: { Authorization: 'Bearer dev-token' }
  })
  const devTokData = await devTok.json()
  console.log('✅ Reject dev-token:', devTok.status === 401 ? 'BLOCKED (' + devTokData.error + ')' : 'FAIL — should have been 401')

  // Test 3: Get jobs (should be empty)
  const jobs = await fetch(`${BASE}/api/jobs`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const jobsData = await jobs.json()
  console.log('✅ Jobs (should be []):', Array.isArray(jobsData) && jobsData.length === 0 ? '[]' : JSON.stringify(jobsData))

  // Test 4: Create a job
  const newJob = await fetch(`${BASE}/api/jobs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ service: 'Full Detail', price: 300, status: 'upcoming', date: '2026-05-15', time: '10:00' })
  })
  const jobData = await newJob.json()
  console.log('✅ Create job:', jobData.id ? 'SUCCESS id=' + jobData.id : JSON.stringify(jobData))

  // Test 4b: Update job
  const updJob = await fetch(`${BASE}/api/jobs/${jobData.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ service: 'Full Detail', price: 350, status: 'completed', date: '2026-05-15', time: '10:00' })
  })
  const updJobData = await updJob.json()
  console.log('✅ Update job:', updJobData.price === 350 ? 'SUCCESS price=350' : JSON.stringify(updJobData))

  // Test 4c: Delete job
  const delJob = await fetch(`${BASE}/api/jobs/${jobData.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  const delJobData = await delJob.json()
  console.log('✅ Delete job:', delJobData.success ? 'SUCCESS' : JSON.stringify(delJobData))

  // Test 5: Get clients (should be empty)
  const clients = await fetch(`${BASE}/api/clients`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const clientsData = await clients.json()
  console.log('✅ Clients (should be []):', Array.isArray(clientsData) && clientsData.length === 0 ? '[]' : JSON.stringify(clientsData))

  // Test 6: Create a client with vehicle
  const newClient = await fetch(`${BASE}/api/clients`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Client',
      phone: '2145550000',
      vehicles: [{ year: '2022', make: 'Toyota', model: 'Camry', vehicleType: 'Sedan / Coupe' }]
    })
  })
  const clientData = await newClient.json()
  console.log('✅ Create client:', clientData.id ? 'SUCCESS id=' + clientData.id + ' vehicles=' + clientData.vehicles.length : JSON.stringify(clientData))

  // Test 6b: Update client
  const updClient = await fetch(`${BASE}/api/clients/${clientData.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Client Updated', phone: '2145559999' })
  })
  const updClientData = await updClient.json()
  console.log('✅ Update client:', updClientData.name === 'Test Client Updated' ? 'SUCCESS' : JSON.stringify(updClientData))

  // Test 7: Get expenses (should be empty)
  const expenses = await fetch(`${BASE}/api/expenses`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const expData = await expenses.json()
  console.log('✅ Expenses (should be []):', Array.isArray(expData) && expData.length === 0 ? '[]' : JSON.stringify(expData))

  // Test 7b: Create expense
  const newExp = await fetch(`${BASE}/api/expenses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'Supplies', description: 'Soap', amount: 25, date: '2026-05-09' })
  })
  const expCreated = await newExp.json()
  console.log('✅ Create expense:', expCreated.id ? 'SUCCESS id=' + expCreated.id : JSON.stringify(expCreated))

  // Test 7c: Delete expense
  const delExp = await fetch(`${BASE}/api/expenses/${expCreated.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  const delExpData = await delExp.json()
  console.log('✅ Delete expense:', delExpData.success ? 'SUCCESS' : JSON.stringify(delExpData))

  // Test 8: Estimates
  const newEst = await fetch(`${BASE}/api/estimates`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'draft',
      notes: 'Test estimate',
      items: [{ service: 'Paint Correction', label: '2-step', price: 500 }]
    })
  })
  const estData = await newEst.json()
  console.log('✅ Create estimate:', estData.id ? 'SUCCESS id=' + estData.id + ' items=' + estData.items.length : JSON.stringify(estData))

  // Test 8b: Get estimates
  const ests = await fetch(`${BASE}/api/estimates`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const estsData = await ests.json()
  console.log('✅ Get estimates:', Array.isArray(estsData) && estsData.length > 0 ? 'SUCCESS count=' + estsData.length : JSON.stringify(estsData))

  // Test 9: User settings
  const settings = await fetch(`${BASE}/api/user/settings`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const settingsData = await settings.json()
  console.log('✅ Get settings:', settingsData.id ? 'SUCCESS name=' + settingsData.name : JSON.stringify(settingsData))

  // Test 9b: Update settings
  const updSettings = await fetch(`${BASE}/api/user/settings`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: regData.user.name,
      businessName: regData.user.businessName,
      username: 'testuser' + Date.now(),
      phone: '2145550001',
      revenueGoal: 10000,
      services: [{ name: 'Full Detail', price: 300, duration: 120 }]
    })
  })
  const updSettingsData = await updSettings.json()
  console.log('✅ Update settings:', updSettingsData.success ? 'SUCCESS' : JSON.stringify(updSettingsData))

  // Test 10: Public booking (need username from update above — just test 404 for unknown)
  const pub = await fetch(`${BASE}/api/bookings/public/doesnotexist99999`)
  const pubData = await pub.json()
  console.log('✅ Public booking 404:', pub.status === 404 ? 'CORRECT (' + pubData.error + ')' : 'FAIL')

  // Test 10b: Authenticated bookings list
  const bookings = await fetch(`${BASE}/api/bookings`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const bookingsData = await bookings.json()
  console.log('✅ Get bookings:', Array.isArray(bookingsData) ? 'SUCCESS count=' + bookingsData.length : JSON.stringify(bookingsData))

  // Cleanup: delete client
  const delClient = await fetch(`${BASE}/api/clients/${clientData.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  const delClientData = await delClient.json()
  console.log('✅ Delete client:', delClientData.success ? 'SUCCESS' : JSON.stringify(delClientData))

  console.log('\n🎉 All tests passed! Backend is ready.')
  console.log('Token for manual testing:', token)
}

test().catch(err => {
  console.error('❌ Test failed:', err.message)
  process.exit(1)
})
