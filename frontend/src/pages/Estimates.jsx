import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Trash2 } from 'lucide-react'
import { estimatesAPI, clientsAPI, jobsAPI } from '../utils/api'
import { formatCurrency } from '../utils/helpers'
import { SkeletonList } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import AnimatedCard from '../components/AnimatedCard'
import PageTransition from '../components/PageTransition'

const STATUS_COLORS = { draft: '#9CA3AF', sent: '#4F8EF7', accepted: '#22C55E', declined: '#EF4444' }

export default function Estimates() {
  const [estimates, setEstimates] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ clientId: '', notes: '', discount: 0, discountType: '$', deposit: 0, items: [{ service: '', label: '', price: '' }] })
  const [converting, setConverting] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [e, c] = await Promise.all([estimatesAPI.getAll(), clientsAPI.getAll()])
      setEstimates(e || [])
      setClients(c || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all' ? estimates : estimates.filter(e => e.status === filter)

  const total = (est) => {
    const sub = (est.items || []).reduce((s, i) => s + (Number(i.price) || 0), 0)
    const disc = est.discountType === '%' ? sub * (est.discount / 100) : (est.discount || 0)
    return Math.max(0, sub - disc)
  }

  const createEstimate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await estimatesAPI.create({
        ...form,
        clientId: form.clientId || null,
        items: form.items.filter(i => i.service || i.label)
      })
      setEstimates(prev => [created, ...prev])
      setShowCreate(false)
      setForm({ clientId: '', notes: '', discount: 0, discountType: '$', deposit: 0, items: [{ service: '', label: '', price: '' }] })
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const convertToJob = async (est) => {
    setConverting(est.id)
    try {
      await jobsAPI.create({
        clientId: est.clientId,
        service: est.items?.[0]?.service || 'From Estimate',
        price: total(est),
        deposit: est.deposit,
        status: 'upcoming',
        notes: est.notes
      })
      await estimatesAPI.update(est.id, { ...est, status: 'accepted' })
      setEstimates(prev => prev.map(e => e.id === est.id ? { ...e, status: 'accepted' } : e))
    } catch { /* ignore */ }
    finally { setConverting(null) }
  }

  const deleteEstimate = async (id) => {
    await estimatesAPI.remove(id)
    setEstimates(prev => prev.filter(e => e.id !== id))
  }

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { service: '', label: '', price: '' }] }))
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, field, val) => setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) }))

  if (loading) return <SkeletonList />

  return (
    <PageTransition>
      <div style={{ paddingBottom: '16px' }}>
        <div style={{ padding: '52px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: '700', color: '#F5F5F5' }}>Estimates</h1>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCreate(true)} style={{ background: '#4F8EF7', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
            <Plus size={16} /> New
          </motion.button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 20px 16px', overflowX: 'auto' }}>
          {['all', 'draft', 'sent', 'accepted', 'declined'].map(f => (
            <motion.button key={f} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)} style={{ background: filter === f ? '#4F8EF7' : '#111', color: filter === f ? 'white' : '#6B7280', border: `1px solid ${filter === f ? '#4F8EF7' : 'rgba(255,255,255,0.06)'}`, borderRadius: '20px', padding: '7px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
              {f === 'all' ? 'All' : f}
            </motion.button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="📋" title="No estimates" subtitle="Create estimates to send to clients" actionLabel="Create Estimate" onAction={() => setShowCreate(true)} />
        ) : (
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((est, i) => {
              const clientName = clients.find(c => c.id === est.clientId)?.name || 'No client'
              return (
                <AnimatedCard key={est.id} delay={i * 0.04} style={{ background: '#111', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <p style={{ color: '#F5F5F5', fontSize: '15px', fontWeight: '600' }}>{clientName}</p>
                      <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '2px' }}>
                        {est.items?.length || 0} item{est.items?.length !== 1 ? 's' : ''} · {new Date(est.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: '700' }}>{formatCurrency(total(est))}</p>
                      <span style={{ fontSize: '11px', color: STATUS_COLORS[est.status] || '#9CA3AF', fontWeight: '600', textTransform: 'capitalize' }}>
                        ● {est.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {est.status !== 'accepted' && (
                      <motion.button whileTap={{ scale: 0.95 }} disabled={converting === est.id} onClick={() => convertToJob(est)} style={{ flex: 1, background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                        {converting === est.id ? '...' : '→ Convert to Job'}
                      </motion.button>
                    )}
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => deleteEstimate(est.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '10px', padding: '10px 12px', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </AnimatedCard>
              )
            })}
          </div>
        )}

        {/* Create modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end', overflowY: 'auto' }}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }} style={{ background: '#111', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '480px', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: '700' }}>New Estimate</h3>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCreate(false)} style={{ background: '#1C1C1C', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#9CA3AF' }}>
                    <X size={18} />
                  </motion.button>
                </div>
                <form onSubmit={createEstimate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Client */}
                  <div>
                    <label style={{ color: '#9CA3AF', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Client (optional)</label>
                    <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} style={{ width: '100%', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px', color: '#F5F5F5', fontSize: '15px', outline: 'none' }}>
                      <option value="">No client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Line items */}
                  <div>
                    <label style={{ color: '#9CA3AF', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Services</label>
                    {form.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <input value={item.service} onChange={e => updateItem(i, 'service', e.target.value)} placeholder="Service name" style={{ flex: 2, background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px', color: '#F5F5F5', fontSize: '14px', outline: 'none' }} />
                        <input value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder="$0" type="number" style={{ flex: 1, background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px', color: '#F5F5F5', fontSize: '14px', outline: 'none' }} />
                        {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '18px' }}>×</button>}
                      </div>
                    ))}
                    <button type="button" onClick={addItem} style={{ background: 'none', border: '1px dashed rgba(79,142,247,0.4)', color: '#4F8EF7', borderRadius: '10px', padding: '8px', width: '100%', cursor: 'pointer', fontSize: '13px' }}>+ Add Line Item</button>
                  </div>

                  {/* Subtotal preview */}
                  <div style={{ background: '#1C1C1C', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9CA3AF', fontSize: '14px' }}>Total</span>
                      <span style={{ color: '#F5F5F5', fontSize: '16px', fontWeight: '700' }}>
                        {formatCurrency(form.items.reduce((s, i) => s + (Number(i.price) || 0), 0))}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ color: '#9CA3AF', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={2} style={{ width: '100%', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px', color: '#F5F5F5', fontSize: '14px', outline: 'none', resize: 'none' }} />
                  </div>

                  <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.97 }} style={{ background: saving ? '#1C2D4F' : '#4F8EF7', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Saving...' : 'Create Estimate'}
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
