import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { userAPI } from '../utils/api'

const DEFAULT_SERVICES = [
  { name: 'Exterior Wash', price: 100, duration: 60 },
  { name: 'Interior Only', price: 150, duration: 90 },
  { name: 'Full Detail', price: 300, duration: 180 }
]

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [services, setServices] = useState(DEFAULT_SERVICES)
  const [saving, setSaving] = useState(false)

  const updateService = (i, field, val) => {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }
  const removeService = (i) => setServices(prev => prev.filter((_, idx) => idx !== i))
  const addService = () => setServices(prev => [...prev, { name: '', price: 0, duration: 60 }])

  const finish = async () => {
    setSaving(true)
    try {
      await userAPI.updateSettings({
        name: user.name,
        businessName: user.businessName,
        services: services.filter(s => s.name.trim())
      })
      localStorage.setItem('scaled_onboarded', 'true')
      navigate('/dashboard')
    } catch {
      navigate('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#080808',
      display: 'flex', flexDirection: 'column', padding: '24px'
    }}>
      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '40px', marginTop: '16px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            height: '4px', borderRadius: '2px', flex: 1,
            background: s <= step ? '#4F8EF7' : '#1C1C1C',
            transition: 'background 0.3s'
          }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚀</div>
              <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '26px', fontWeight: '800', color: '#F5F5F5', marginBottom: '12px' }}>
                Welcome to Scaled CRM,<br />{user?.name?.split(' ')[0]}!
              </h1>
              <p style={{ color: '#9CA3AF', fontSize: '15px', lineHeight: '1.6' }}>
                You're running <strong style={{ color: '#F5F5F5' }}>{user?.businessName}</strong>.<br />
                Let's get you set up in 2 quick steps.
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep(2)}
              style={{
                background: '#4F8EF7', color: 'white', border: 'none',
                borderRadius: '14px', padding: '16px', fontSize: '16px',
                fontWeight: '600', cursor: 'pointer', marginTop: 'auto'
              }}
            >
              Get Started →
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', fontWeight: '700', color: '#F5F5F5' }}>
              Your Services & Pricing
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
              Edit or remove these — you can always update later.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
              {services.map((svc, i) => (
                <div key={i} style={{
                  background: '#111', borderRadius: '14px', padding: '14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      value={svc.name}
                      onChange={e => updateService(i, 'name', e.target.value)}
                      placeholder="Service name"
                      style={{
                        flex: 1, background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px', padding: '10px 12px', color: '#F5F5F5',
                        fontSize: '14px', outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => removeService(i)}
                      style={{
                        background: 'rgba(239,68,68,0.15)', color: '#EF4444',
                        border: 'none', borderRadius: '8px', padding: '8px 12px',
                        cursor: 'pointer', fontSize: '18px', lineHeight: 1
                      }}
                    >×</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ color: '#6B7280', fontSize: '11px' }}>Price ($)</label>
                      <input
                        type="number"
                        value={svc.price}
                        onChange={e => updateService(i, 'price', Number(e.target.value))}
                        style={{
                          width: '100%', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px', padding: '8px 12px', color: '#F5F5F5',
                          fontSize: '14px', outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ color: '#6B7280', fontSize: '11px' }}>Duration (min)</label>
                      <input
                        type="number"
                        value={svc.duration}
                        onChange={e => updateService(i, 'duration', Number(e.target.value))}
                        style={{
                          width: '100%', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px', padding: '8px 12px', color: '#F5F5F5',
                          fontSize: '14px', outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addService}
                style={{
                  background: 'rgba(79,142,247,0.1)', color: '#4F8EF7',
                  border: '1px dashed rgba(79,142,247,0.4)', borderRadius: '14px',
                  padding: '14px', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                + Add Service
              </button>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep(3)}
              style={{
                background: '#4F8EF7', color: 'white', border: 'none',
                borderRadius: '14px', padding: '16px', fontSize: '16px',
                fontWeight: '600', cursor: 'pointer'
              }}
            >
              Continue →
            </motion.button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6 }}
              style={{ fontSize: '72px' }}
            >
              🎉
            </motion.div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '26px', fontWeight: '800', color: '#F5F5F5', textAlign: 'center' }}>
              You're all set!<br />Let's get to work 💪
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '15px', textAlign: 'center', lineHeight: '1.6' }}>
              Your services are saved. Start adding jobs and clients from the dashboard.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={finish}
              disabled={saving}
              style={{
                background: saving ? '#1C2D4F' : '#4F8EF7', color: 'white', border: 'none',
                borderRadius: '14px', padding: '16px 40px', fontSize: '16px',
                fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', marginTop: '8px'
              }}
            >
              {saving ? 'Saving...' : 'Go to Dashboard →'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
