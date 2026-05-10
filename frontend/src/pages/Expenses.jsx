import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Trash2 } from 'lucide-react'
import { expensesAPI } from '../utils/api'
import { formatCurrency } from '../utils/helpers'
import { SkeletonList } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import PageTransition from '../components/PageTransition'

const CATEGORIES = [
  { key: 'Supplies', icon: '🧴' },
  { key: 'Products', icon: '🪣' },
  { key: 'Equipment', icon: '🔧' },
  { key: 'Fuel', icon: '⛽' },
  { key: 'Marketing', icon: '📣' },
  { key: 'Other', icon: '📦' }
]

function categoryIcon(cat) { return CATEGORIES.find(c => c.key === cat)?.icon || '📦' }

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ category: 'Supplies', description: '', amount: '', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try { setExpenses((await expensesAPI.getAll()) || []) }
    catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const addExpense = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) return
    setSaving(true)
    try {
      const created = await expensesAPI.create({ ...form, amount: Number(form.amount) })
      setExpenses(prev => [created, ...prev])
      setShowAdd(false)
      setForm({ category: 'Supplies', description: '', amount: '', date: new Date().toISOString().split('T')[0] })
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const deleteExpense = async (id) => {
    await expensesAPI.remove(id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthTotal = expenses.filter(e => e.date?.startsWith(thisMonth)).reduce((s, e) => s + (e.amount || 0), 0)

  // Group by month
  const grouped = {}
  expenses.forEach(e => {
    const m = (e.date || '').slice(0, 7)
    if (!grouped[m]) grouped[m] = []
    grouped[m].push(e)
  })

  if (loading) return <SkeletonList />

  return (
    <PageTransition>
      <div style={{ paddingBottom: '16px' }}>
        <div style={{ padding: '52px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: '700', color: '#F5F5F5' }}>Expenses</h1>
            <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '2px' }}>
              This month: <span style={{ color: '#EF4444', fontWeight: '600' }}>{formatCurrency(monthTotal)}</span>
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(true)} style={{ background: '#4F8EF7', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
            <Plus size={16} /> Add
          </motion.button>
        </div>

        {expenses.length === 0 ? (
          <EmptyState icon="💰" title="No expenses yet" subtitle="Track your supplies, fuel, and costs" actionLabel="Add Expense" onAction={() => setShowAdd(true)} />
        ) : (
          <div style={{ padding: '0 20px' }}>
            {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([month, items]) => (
              <div key={month} style={{ marginBottom: '20px' }}>
                <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  <span style={{ color: '#4B5563', marginLeft: '8px' }}>
                    {formatCurrency(items.reduce((s, e) => s + (e.amount || 0), 0))}
                  </span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map(expense => (
                    <motion.div key={expense.id} layout style={{ background: '#111', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>{categoryIcon(expense.category)}</span>
                        <div>
                          <p style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: '500' }}>{expense.description || expense.category}</p>
                          <p style={{ color: '#4B5563', fontSize: '12px', marginTop: '2px' }}>
                            {expense.category} · {expense.date}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <p style={{ color: '#EF4444', fontSize: '15px', fontWeight: '600' }}>-{formatCurrency(expense.amount)}</p>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteExpense(expense.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }} style={{ background: '#111', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: '#F5F5F5', fontSize: '18px', fontWeight: '700' }}>Add Expense</h3>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(false)} style={{ background: '#1C1C1C', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#9CA3AF' }}>
                    <X size={18} />
                  </motion.button>
                </div>

                <form onSubmit={addExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Category */}
                  <div>
                    <label style={{ color: '#9CA3AF', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Category</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {CATEGORIES.map(c => (
                        <motion.button key={c.key} type="button" whileTap={{ scale: 0.95 }} onClick={() => setForm(f => ({ ...f, category: c.key }))} style={{ background: form.category === c.key ? 'rgba(79,142,247,0.2)' : '#1C1C1C', color: form.category === c.key ? '#4F8EF7' : '#9CA3AF', border: `1px solid ${form.category === c.key ? '#4F8EF7' : 'rgba(255,255,255,0.06)'}`, borderRadius: '10px', padding: '10px 6px', fontSize: '13px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '20px' }}>{c.icon}</span>
                          {c.key}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {[
                    { label: 'Description', key: 'description', type: 'text', placeholder: 'What did you buy?' },
                    { label: 'Amount ($)', key: 'amount', type: 'number', placeholder: '0.00' },
                    { label: 'Date', key: 'date', type: 'date', placeholder: '' }
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ color: '#9CA3AF', fontSize: '13px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                      <input type={f.type} value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px', color: '#F5F5F5', fontSize: '15px', outline: 'none' }} />
                    </div>
                  ))}

                  <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.97 }} style={{ background: saving ? '#1C2D4F' : '#4F8EF7', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Saving...' : 'Add Expense'}
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
