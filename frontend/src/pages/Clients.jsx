import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { clientsAPI, jobsAPI } from '../utils/api'
import { getInitials, nameToColor, formatCurrency, todayStr } from '../utils/helpers'
import { SkeletonList } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import AnimatedCard from '../components/AnimatedCard'
import PageTransition from '../components/PageTransition'
import AddClientModal from './AddClientModal'

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    try {
      const [c, j] = await Promise.all([clientsAPI.getAll(), jobsAPI.getAll()])
      setClients(c || [])
      setJobs(j || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const clientStats = (client) => {
    const cJobs = jobs.filter(j => j.clientId === client.id && j.status === 'completed')
    const spend = cJobs.reduce((s, j) => s + (j.price || 0), 0)
    const lastJobDate = cJobs.sort((a, b) => b.date.localeCompare(a.date))[0]?.date || null
    const today = todayStr()
    const daysSince = lastJobDate ? Math.floor((new Date(today) - new Date(lastJobDate)) / 86400000) : 999
    const isVip = cJobs.length >= 5 || spend >= 500
    const isAtRisk = daysSince >= 60 && cJobs.length > 0
    return { spend, visits: cJobs.length, lastJobDate, daysSince, isVip, isAtRisk }
  }

  const enriched = clients.map(c => ({ ...c, ...clientStats(c) }))

  const filtered = enriched.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.phone || '').includes(q) || c.vehicles?.some(v => `${v.make} ${v.model}`.toLowerCase().includes(q))
    const matchFilter = filter === 'all' || (filter === 'vip' && c.isVip) || (filter === 'at_risk' && c.isAtRisk)
    return matchSearch && matchFilter
  })

  if (loading) return <SkeletonList />

  return (
    <PageTransition>
      <div style={{ paddingBottom: '16px' }}>
        <div style={{ padding: '52px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: '700', color: '#F5F5F5' }}>Clients</h1>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(true)} style={{ background: '#4F8EF7', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
            <Plus size={16} /> Add Client
          </motion.button>
        </div>

        {/* Search */}
        <div style={{ padding: '0 20px 12px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '36px', top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 12px 12px 40px', color: '#F5F5F5', fontSize: '14px', outline: 'none' }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 20px 16px' }}>
          {[{ key: 'all', label: 'All' }, { key: 'vip', label: '👑 VIP' }, { key: 'at_risk', label: '🔴 At Risk' }].map(f => (
            <motion.button key={f.key} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f.key)} style={{ background: filter === f.key ? '#4F8EF7' : '#111', color: filter === f.key ? 'white' : '#6B7280', border: `1px solid ${filter === f.key ? '#4F8EF7' : 'rgba(255,255,255,0.06)'}`, borderRadius: '20px', padding: '7px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              {f.label}
            </motion.button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="👥" title={search ? 'No results' : 'No clients yet'} subtitle={search ? 'Try a different search' : 'Add your first client'} actionLabel={!search ? 'Add Client' : undefined} onAction={() => setShowAdd(true)} />
        ) : (
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((client, i) => (
              <AnimatedCard key={client.id} delay={i * 0.04} onClick={() => navigate(`/clients/${client.id}`)} style={{ background: '#111', borderRadius: '16px', padding: '16px', border: `1px solid ${client.isAtRisk ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: nameToColor(client.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', fontWeight: '700', flexShrink: 0, position: 'relative' }}>
                    {getInitials(client.name)}
                    {client.isAtRisk && <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', animation: 'pulse 2s infinite' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ color: '#F5F5F5', fontSize: '15px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</p>
                      {client.isVip && <span style={{ fontSize: '14px' }}>👑</span>}
                    </div>
                    {client.vehicles?.[0] && (
                      <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '2px' }}>
                        {client.vehicles[0].year} {client.vehicles[0].make} {client.vehicles[0].model}
                      </p>
                    )}
                    <p style={{ color: '#4B5563', fontSize: '11px', marginTop: '2px' }}>
                      {client.visits} visit{client.visits !== 1 ? 's' : ''} · {formatCurrency(client.spend)} lifetime
                      {client.lastJobDate && ` · Last: ${new Date(client.lastJobDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}

        {showAdd && (
          <AddClientModal
            onClose={() => setShowAdd(false)}
            onClientCreated={(c) => { setClients(prev => [c, ...prev]); setShowAdd(false) }}
          />
        )}
      </div>
    </PageTransition>
  )
}
