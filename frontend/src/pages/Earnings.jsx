import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { jobsAPI, expensesAPI } from '../utils/api'
import { formatCurrency } from '../utils/helpers'
import { SkeletonList } from '../components/Skeleton'
import PageTransition from '../components/PageTransition'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const PERIODS = ['week', 'month', 'year', 'all']
const PERIOD_LABELS = { week: 'This Week', month: 'This Month', year: 'This Year', all: 'All Time' }

function getRange(period) {
  const now = new Date()
  if (period === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - 7)
    return start.toISOString().split('T')[0]
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  }
  if (period === 'year') {
    return `${now.getFullYear()}-01-01`
  }
  return '2000-01-01'
}

const MORE_LINKS = [
  { label: '💰 Expenses', path: '/expenses' },
  { label: '📋 Estimates', path: '/estimates' },
  { label: '⚙️ Settings', path: '/settings' }
]

export default function Earnings() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  const load = useCallback(async () => {
    try {
      const [j, e] = await Promise.all([jobsAPI.getAll(), expensesAPI.getAll()])
      setJobs(j || [])
      setExpenses(e || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const startDate = getRange(period)
  const completed = jobs.filter(j => j.status === 'completed' && j.date >= startDate)
  const periodExpenses = expenses.filter(e => e.date >= startDate)

  const revenue = completed.reduce((s, j) => s + (j.price || 0), 0)
  const totalExpenses = periodExpenses.reduce((s, e) => s + (e.amount || 0), 0)
  const profit = revenue - totalExpenses
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0

  // Bar chart data by week/month
  const chartData = (() => {
    if (period === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return days.map((day, i) => {
        const d = new Date(); d.setDate(d.getDate() - d.getDay() + i)
        const ds = d.toISOString().split('T')[0]
        const val = completed.filter(j => j.date === ds).reduce((s, j) => s + (j.price || 0), 0)
        return { name: day, revenue: val }
      })
    }
    if (period === 'month' || period === 'all') {
      const grouped = {}
      completed.forEach(j => {
        const m = j.date.slice(0, 7)
        grouped[m] = (grouped[m] || 0) + (j.price || 0)
      })
      return Object.entries(grouped).sort().slice(-6).map(([m, v]) => ({
        name: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short' }),
        revenue: v
      }))
    }
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(new Date().getFullYear(), i, 1)
      return d.toISOString().split('T')[0].slice(0, 7)
    })
    return months.map(m => ({
      name: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short' }),
      revenue: completed.filter(j => j.date.startsWith(m)).reduce((s, j) => s + (j.price || 0), 0)
    }))
  })()

  // Top clients
  const clientRevenue = {}
  completed.forEach(j => {
    if (j.clientId) clientRevenue[j.clientId] = (clientRevenue[j.clientId] || { id: j.clientId, total: 0, count: 0 })
    if (j.clientId) { clientRevenue[j.clientId].total += j.price || 0; clientRevenue[j.clientId].count++ }
  })

  if (loading) return <SkeletonList />

  return (
    <PageTransition>
      <div style={{ paddingBottom: '16px' }}>
        <div style={{ padding: '52px 20px 16px' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: '700', color: '#F5F5F5' }}>Earnings</h1>
        </div>

        {/* Quick nav to more pages */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 20px 16px', overflowX: 'auto' }}>
          {MORE_LINKS.map(l => (
            <motion.button key={l.path} whileTap={{ scale: 0.95 }} onClick={() => navigate(l.path)} style={{ background: '#111', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {l.label}
            </motion.button>
          ))}
        </div>

        {/* Period toggle */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 20px 16px' }}>
          {PERIODS.map(p => (
            <motion.button key={p} whileTap={{ scale: 0.95 }} onClick={() => setPeriod(p)} style={{ flex: 1, background: period === p ? '#4F8EF7' : '#111', color: period === p ? 'white' : '#6B7280', border: `1px solid ${period === p ? '#4F8EF7' : 'rgba(255,255,255,0.06)'}`, borderRadius: '10px', padding: '8px 4px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              {PERIOD_LABELS[p].split(' ').pop()}
            </motion.button>
          ))}
        </div>

        {/* Profit summary */}
        <div style={{ margin: '0 20px 16px', background: '#111', borderRadius: '18px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
            {PERIOD_LABELS[period]} Summary
          </p>
          {[
            { label: 'Revenue', value: formatCurrency(revenue), color: '#22C55E' },
            { label: 'Expenses', value: `-${formatCurrency(totalExpenses)}`, color: '#EF4444' },
            { label: 'Net Profit', value: formatCurrency(profit), color: profit >= 0 ? '#22C55E' : '#EF4444', bold: true },
            { label: 'Margin', value: `${margin.toFixed(1)}%`, color: '#9CA3AF' }
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: '#9CA3AF', fontSize: '14px' }}>{row.label}</span>
              <span style={{ color: row.color, fontSize: row.bold ? '18px' : '14px', fontWeight: row.bold ? '700' : '600' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 20px 16px' }}>
          {[
            { label: 'Jobs Done', value: completed.length, color: '#4F8EF7' },
            { label: 'Avg Value', value: completed.length ? formatCurrency(revenue / completed.length) : '$0', color: '#F97316' }
          ].map(s => (
            <div key={s.label} style={{ background: '#111', borderRadius: '14px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: '22px', fontWeight: '700', marginTop: '6px', fontFamily: 'Sora, sans-serif' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        {chartData.some(d => d.revenue > 0) && (
          <div style={{ margin: '0 20px 16px', background: '#111', borderRadius: '18px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Revenue</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#4B5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4B5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} contentStyle={{ background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F5F5F5', fontSize: '12px' }} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill="#4F8EF7" opacity={0.8 + (i / chartData.length) * 0.2} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
