import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { bookingsAPI } from '../utils/api'

const VEHICLE_TYPES = ['Sedan / Coupe', 'SUV / Crossover', 'Truck', 'Van / Minivan', 'Sports Car', 'Convertible', 'Other']

export default function BookingPage() {
  const { username } = useParams()
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    service: '', price: 0,
    vehicleYear: '', vehicleMake: '', vehicleModel: '', vehicleType: 'Sedan / Coupe',
    preferredDate: '', preferredTime: '',
    clientName: '', clientPhone: '', clientEmail: '', notes: ''
  })

  useEffect(() => {
    bookingsAPI.getPublic(username)
      .then(data => setBusiness(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [username])

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await bookingsAPI.submitPublic(username, form)
      setSubmitted(true)
    } catch { /* ignore */ }
    finally { setSubmitting(false) }
  }

  const inputStyle = { width: '100%', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 16px', color: '#F5F5F5', fontSize: '15px', outline: 'none' }
  const labelStyle = { color: '#9CA3AF', fontSize: '13px', display: 'block', marginBottom: '6px' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#4B5563' }}>Loading...</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '52px', marginBottom: '16px' }}>🔍</div>
      <h1 style={{ color: '#F5F5F5', fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Business Not Found</h1>
      <p style={{ color: '#6B7280' }}>No business found with this link.</p>
    </div>
  )

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} style={{ fontSize: '72px', marginBottom: '20px' }}>🎉</motion.div>
      <h1 style={{ fontFamily: 'Sora, sans-serif', color: '#F5F5F5', fontSize: '26px', fontWeight: '800', marginBottom: '12px' }}>Request Sent!</h1>
      <p style={{ color: '#9CA3AF', fontSize: '16px', lineHeight: '1.6' }}>
        <strong style={{ color: '#F5F5F5' }}>{business.ownerName}</strong> will confirm your appointment shortly.
      </p>
      <p style={{ color: '#4B5563', fontSize: '13px', marginTop: '16px' }}>You can close this page.</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#080808', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Sora, sans-serif', color: '#F5F5F5', fontSize: '20px', fontWeight: '700' }}>
          {business.businessName}
        </h1>
        <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px' }}>Book an appointment</p>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '6px', padding: '16px 20px', maxWidth: '480px', margin: '0 auto' }}>
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: s <= step ? '#4F8EF7' : '#1C1C1C', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ padding: '0 20px', maxWidth: '480px', margin: '0 auto' }}>
        {business.bookingNote && step === 1 && (
          <div style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#9CA3AF', fontSize: '13px' }}>
            ℹ️ {business.bookingNote}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Service */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Pick a Service</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(business.services || []).map(svc => (
                  <motion.div key={svc.id} whileTap={{ scale: 0.98 }} onClick={() => { setForm(f => ({ ...f, service: svc.name, price: svc.price })); setStep(2) }} style={{ background: form.service === svc.name ? 'rgba(79,142,247,0.15)' : '#111', border: `1px solid ${form.service === svc.name ? '#4F8EF7' : 'rgba(255,255,255,0.06)'}`, borderRadius: '14px', padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: '#F5F5F5', fontWeight: '600' }}>{svc.name}</p>
                      <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '2px' }}>{svc.duration} min</p>
                    </div>
                    <p style={{ color: '#4F8EF7', fontWeight: '700', fontSize: '18px' }}>
                      ${svc.price}
                    </p>
                  </motion.div>
                ))}
                {(business.services || []).length === 0 && (
                  <p style={{ color: '#4B5563', textAlign: 'center', padding: '24px' }}>No services listed yet.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Vehicle */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Your Vehicle</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[{ label: 'Year', field: 'vehicleYear', type: 'text', placeholder: '2022' }, { label: 'Make', field: 'vehicleMake', type: 'text', placeholder: 'Toyota' }, { label: 'Model', field: 'vehicleModel', type: 'text', placeholder: 'Camry' }].map(f => (
                  <div key={f.field}>
                    <label style={labelStyle}>{f.label}</label>
                    <input type={f.type} value={form[f.field]} onChange={set(f.field)} placeholder={f.placeholder} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Vehicle Type</label>
                  <select value={form.vehicleType} onChange={set('vehicleType')} style={{ ...inputStyle }}>
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(1)} style={{ flex: 1, background: '#1C1C1C', color: '#9CA3AF', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>← Back</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(3)} style={{ flex: 2, background: '#4F8EF7', color: 'white', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Continue →</motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Date + Time */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>When?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Preferred Date</label>
                  <input type="date" value={form.preferredDate} onChange={set('preferredDate')} min={new Date().toISOString().split('T')[0]} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Preferred Time</label>
                  <input type="time" value={form.preferredTime} onChange={set('preferredTime')} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(2)} style={{ flex: 1, background: '#1C1C1C', color: '#9CA3AF', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>← Back</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(4)} disabled={!form.preferredDate} style={{ flex: 2, background: form.preferredDate ? '#4F8EF7' : '#1C2D4F', color: 'white', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: form.preferredDate ? 'pointer' : 'not-allowed' }}>Continue →</motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Contact */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Your Info</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[{ label: 'Full Name', field: 'clientName', type: 'text', placeholder: 'John Smith' }, { label: 'Phone', field: 'clientPhone', type: 'tel', placeholder: '(214) 555-0000' }, { label: 'Email (optional)', field: 'clientEmail', type: 'email', placeholder: 'you@email.com' }].map(f => (
                  <div key={f.field}>
                    <label style={labelStyle}>{f.label}</label>
                    <input type={f.type} value={form[f.field]} onChange={set(f.field)} placeholder={f.placeholder} style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Notes (optional)</label>
                  <textarea value={form.notes} onChange={set('notes')} placeholder="Any special requests..." rows={2} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(3)} style={{ flex: 1, background: '#1C1C1C', color: '#9CA3AF', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>← Back</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(5)} disabled={!form.clientName || !form.clientPhone} style={{ flex: 2, background: (form.clientName && form.clientPhone) ? '#4F8EF7' : '#1C2D4F', color: 'white', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: (form.clientName && form.clientPhone) ? 'pointer' : 'not-allowed' }}>Review →</motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Confirm */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Confirm Booking</h2>
              <div style={{ background: '#111', borderRadius: '16px', padding: '18px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Service', value: form.service },
                  { label: 'Price', value: `$${form.price}` },
                  { label: 'Vehicle', value: `${form.vehicleYear} ${form.vehicleMake} ${form.vehicleModel}` },
                  { label: 'Date', value: form.preferredDate },
                  { label: 'Time', value: form.preferredTime },
                  { label: 'Name', value: form.clientName },
                  { label: 'Phone', value: form.clientPhone }
                ].filter(r => r.value).map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                    <span style={{ color: '#6B7280', fontSize: '14px' }}>{row.label}</span>
                    <span style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: '500' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <motion.button type="submit" disabled={submitting} whileTap={{ scale: 0.97 }} style={{ background: submitting ? '#1C2D4F' : '#22C55E', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Submitting...' : '✓ Submit Request'}
                </motion.button>
                <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setStep(4)} style={{ background: '#1C1C1C', color: '#9CA3AF', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', cursor: 'pointer' }}>← Go Back</motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
