const API_URL = import.meta.env.VITE_API_URL || 'https://scaled-crm-v2.onrender.com'

function getToken() {
  return localStorage.getItem('scaled_crm_token')
}

async function apiCall(endpoint, options = {}) {
  const token = getToken()
  try {
    const res = await fetch(API_URL + endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    })
    if (res.status === 401) {
      localStorage.removeItem('scaled_crm_token')
      localStorage.removeItem('scaled_crm_user')
      window.location.href = '/login'
      return null
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Request failed')
    }
    return res.json()
  } catch (err) {
    console.error('API Error:', endpoint, err.message)
    throw err
  }
}

export const authAPI = {
  register: (d) => apiCall('/api/auth/register', { method: 'POST', body: JSON.stringify(d) }),
  login: (d) => apiCall('/api/auth/login', { method: 'POST', body: JSON.stringify(d) })
}

export const jobsAPI = {
  getAll: () => apiCall('/api/jobs'),
  getOne: (id) => apiCall(`/api/jobs/${id}`),
  create: (d) => apiCall('/api/jobs', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => apiCall(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id) => apiCall(`/api/jobs/${id}`, { method: 'DELETE' })
}

export const clientsAPI = {
  getAll: () => apiCall('/api/clients'),
  getOne: (id) => apiCall(`/api/clients/${id}`),
  create: (d) => apiCall('/api/clients', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => apiCall(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id) => apiCall(`/api/clients/${id}`, { method: 'DELETE' })
}

export const expensesAPI = {
  getAll: () => apiCall('/api/expenses'),
  create: (d) => apiCall('/api/expenses', { method: 'POST', body: JSON.stringify(d) }),
  remove: (id) => apiCall(`/api/expenses/${id}`, { method: 'DELETE' })
}

export const estimatesAPI = {
  getAll: () => apiCall('/api/estimates'),
  create: (d) => apiCall('/api/estimates', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => apiCall(`/api/estimates/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id) => apiCall(`/api/estimates/${id}`, { method: 'DELETE' })
}

export const userAPI = {
  getSettings: () => apiCall('/api/user/settings'),
  updateSettings: (d) => apiCall('/api/user/settings', { method: 'PUT', body: JSON.stringify(d) })
}

export const bookingsAPI = {
  getPublic: (username) => apiCall(`/api/bookings/public/${username}`),
  submitPublic: (username, d) => apiCall(`/api/bookings/public/${username}`, { method: 'POST', body: JSON.stringify(d) }),
  getAll: () => apiCall('/api/bookings'),
  update: (id, d) => apiCall(`/api/bookings/${id}`, { method: 'PUT', body: JSON.stringify(d) })
}

export default apiCall
