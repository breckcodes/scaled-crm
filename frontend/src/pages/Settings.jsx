import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { userAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { SkeletonList } from '../components/Skeleton'
import PageTransition from '../components/PageTransition'

const BASE_URL = 'https://scaled-crm-v2.vercel.app'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    try { setSettings(await userAPI.getSettings()) }
    catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const set = (field) => (e) => setSettings(prev => ({ ...prev, [field]: e.target.value }))
  const setServices = (services) => setSettings(prev => ({ ...prev, services }))

  const addService = () => setServices([...(settings.services || []), { name: '', price: 0, duration: 60 }])
  const removeService = (i) => setServices((settings.services || []).filter((_, idx) => idx !== i))
  const updateService = (i, field, val) => setServices((settings.services || []).map((s, idx) => idx === i ? { ...s, [field]: val } : s))

  const save = async () => {
    setSaving(true)
    try {
      await userAPI.updateSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const copyBookingLink = () => {
    if (settings?.username) navigator.clipboard.writeText(`${BASE_URL}/book/${settings.username}`)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  if (loading) return <SkeletonList />
  if (!settings) return null

  const inputStyle = {
    width: '100%', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', padding: '12px 14px', color: '#F5F5F5',
    fontSize: '14px', outline: 'none'
  }
  const labelStyle = { color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '6px' }
  const sectionStyle = { background: '#111', borderRadius: '18px', padding: '18px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '14px' }
  const sectionTitle = { color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }

  return (
    <PageTransition>
      <div style={{ padding: '0 0 32px' }}>
        <div style={{ padding: '52px 20px 20px' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: '700', color: '#F5F5F5' }}>Settings</h1>
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Business Info */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Business Info</p>
            {[
              { label: 'Your Name', field: 'name', type: 'text' },
              { label: 'Business Name', field: 'businessName', type: 'text' },
              { label: 'Phone', field: 'phone', type: 'tel' },
              { label: 'Service Area', field: 'serviceArea', type: 'text', placeholder: 'Dallas, TX' }
            ].map(f => (
              <div key={f.field}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type} value={settings[f.field] || ''} onChange={set(f.field)} placeholder={f.placeholder || ''} style={inputStyle} />
              </div>
            ))}
          </div>

          {/* Booking Link */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Booking Link</p>
            <div>
              <label style={labelStyle}>Username (your booking URL)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4B5563', fontSize: '13px' }}>@</span>
                  <input value={settings.username || ''} onChange={set('username')} placeholder="yourbusiness" style={{ ...inputStyle, paddingLeft: '28px' }} />
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={copyBookingLink} disabled={!settings.username} style={{ background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', color: settings.username ? '#4F8EF7' : '#4B5563', cursor: settings.username ? 'pointer' : 'not-allowed' }}>
                  <Copy size={16} />
                </motion.button>
              </div>
              {settings.username && (
                <p style={{ color: '#4B5563', fontSize: '11px', marginTop: '6px' }}>
                  {BASE_URL}/book/{settings.username}
                </p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Booking Note (shown to clients)</label>
              <textarea value={settings.bookingNote || ''} onChange={set('bookingNote')} placeholder="e.g. Book at least 48 hours in advance" rows={2} style={{ ...inputStyle, resize: 'none' }} />
            </div>
          </div>

          {/* Services */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Services & Pricing</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(settings.services || []).map((svc, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input value={svc.name} onChange={e => updateService(i, 'name', e.target.value)} placeholder="Service" style={{ ...inputStyle, flex: 2 }} />
                  <input type="number" value={svc.price} onChange={e => updateService(i, 'price', Number(e.target.value))} placeholder="$" style={{ ...inputStyle, flex: 1 }} />
                  <input type="number" value={svc.duration} onChange={e => updateService(i, 'duration', Number(e.target.value))} placeholder="min" style={{ ...inputStyle, flex: 1 }} />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeService(i)} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              ))}
              <motion.button whileTap={{ scale: 0.97 }} onClick={addService} style={{ background: 'rgba(79,142,247,0.1)', color: '#4F8EF7', border: '1px dashed rgba(79,142,247,0.3)', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Plus size={14} /> Add Service
              </motion.button>
            </div>
          </div>

          {/* Google Reviews */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Google Reviews</p>
            <div>
              <label style={labelStyle}>Review Link</label>
              <input value={settings.googleReviewLink || ''} onChange={set('googleReviewLink')} placeholder="https://g.page/r/..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Thank You Message Template</label>
              <textarea value={settings.thankYouTemplate || ''} onChange={set('thankYouTemplate')} placeholder="Thanks for choosing us! Please leave a review: {link}" rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </div>
          </div>

          {/* Revenue Goal */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Revenue Goal</p>
            <div>
              <label style={labelStyle}>Monthly Revenue Goal ($)</label>
              <input type="number" value={settings.revenueGoal || ''} onChange={set('revenueGoal')} placeholder="5000" style={inputStyle} />
            </div>
          </div>

          {/* SMS Templates */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>SMS Templates</p>
            <div>
              <label style={labelStyle}>Day Before Reminder</label>
              <textarea value={settings.reminderDayBefore || ''} onChange={set('reminderDayBefore')} placeholder="Hi {name}, reminder: you have a detailing appt tomorrow at {time}!" rows={2} style={{ ...inputStyle, resize: 'none' }} />
            </div>
            <div>
              <label style={labelStyle}>2-Hour Reminder</label>
              <textarea value={settings.reminderTwoHour || ''} onChange={set('reminderTwoHour')} placeholder="Hi {name}, I'll be there in 2 hours for your {service}!" rows={2} style={{ ...inputStyle, resize: 'none' }} />
            </div>
            <div>
              <label style={labelStyle}>Cancellation Policy</label>
              <textarea value={settings.cancellationPolicy || ''} onChange={set('cancellationPolicy')} placeholder="24hr cancellation policy applies..." rows={2} style={{ ...inputStyle, resize: 'none' }} />
            </div>
          </div>

          {/* Save */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={save} disabled={saving} style={{ background: saved ? '#22C55E' : saving ? '#1C2D4F' : '#4F8EF7', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.3s' }}>
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Settings'}
          </motion.button>

          {/* Sign Out */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
            Sign Out
          </motion.button>
        </div>
      </div>
    </PageTransition>
  )
}
