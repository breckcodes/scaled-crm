import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({
    name: '', businessName: '', email: '', password: '', confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.businessName || !form.email || !form.password) {
      setError('All fields are required'); return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters'); return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return
    }
    setLoading(true)
    try {
      const data = await authAPI.register({
        name: form.name, businessName: form.businessName,
        email: form.email, password: form.password
      })
      login(data.token, data.user)
      navigate('/onboarding')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'name', label: 'Your Name', type: 'text', placeholder: 'John Smith' },
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Your Business Name' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    { key: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••••' }
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#080808',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '28px', fontWeight: '800', color: '#F5F5F5' }}>
            Create Account
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '15px', marginTop: '8px' }}>
            Start managing your detailing business
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '6px' }}>
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={set(f.key)}
                placeholder={f.placeholder}
                autoComplete="new-password"
                style={{
                  width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '14px 16px', color: '#F5F5F5',
                  fontSize: '15px', outline: 'none'
                }}
              />
            </div>
          ))}

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px', padding: '12px', color: '#EF4444', fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            style={{
              background: loading ? '#1C2D4F' : '#4F8EF7', color: 'white',
              border: 'none', borderRadius: '14px', padding: '16px',
              fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px', transition: 'background 0.2s'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '14px', marginTop: '24px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#4F8EF7', textDecoration: 'none', fontWeight: '500' }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
