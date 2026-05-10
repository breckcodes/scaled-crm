import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email and password are required'); return }
    setLoading(true)
    try {
      const data = await authAPI.login({ email, password })
      login(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '28px', fontWeight: '800', color: '#F5F5F5' }}>
            Scaled CRM
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '15px', marginTop: '8px' }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              style={{
                width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '14px 16px', color: '#F5F5F5',
                fontSize: '15px', outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '14px 16px', color: '#F5F5F5',
                fontSize: '15px', outline: 'none'
              }}
            />
          </div>

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
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '14px', marginTop: '24px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#4F8EF7', textDecoration: 'none', fontWeight: '500' }}>
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
