import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import Badge from '../components/Badge'

const STATUSES = ['Pending', 'Out for Delivery', 'Delivered', 'Cancelled']

export default function Delivery() {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [orders, setOrders] = useState([])
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ order_id: '', staff_id: '', address: '', eta: '30 mins' })

  async function load() {
    setLoading(true)
    const [{ data: d }, { data: o }, { data: s }] = await Promise.all([
      supabase
        .from('deliveries')
        .select('*, customers(name, phone), staff(name, phone)')
        .order('created_at', { ascending: false }),
      supabase.from('orders').select('id, order_no, customer_id, customers(name, address)'),
      supabase.from('staff').select('id, name').eq('status', 'Active')
    ])
    setDeliveries(d || [])
    setOrders(o || [])
    setStaffList(s || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({ order_id: '', staff_id: '', address: '', eta: '30 mins' })
    setModalOpen(true)
  }

  function openEdit(d) {
    setEditing(d)
    setForm({
      order_id: d.order_id || '',
      staff_id: d.staff_id || '',
      address: d.address || '',
      eta: d.eta || ''
    })
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const order = orders.find((o) => o.id === form.order_id)

    if (editing) {
      const { error } = await supabase
        .from('deliveries')
        .update({
          order_id: form.order_id || null,
          customer_id: order?.customer_id || editing.customer_id || null,
          staff_id: form.staff_id || null,
          address: form.address || order?.customers?.address,
          eta: form.eta
        })
        .eq('id', editing.id)
      setSaving(false)
      if (error) {
        setError(error.message)
        return
      }
      setModalOpen(false)
      setEditing(null)
      setForm({ order_id: '', staff_id: '', address: '', eta: '30 mins' })
      load()
      return
    }

    const deliveryNo = `DLV-${Math.floor(1000 + Math.random() * 9000)}`

    const { error } = await supabase.from('deliveries').insert({
      owner_id: user.id,
      delivery_no: deliveryNo,
      order_id: form.order_id || null,
      customer_id: order?.customer_id || null,
      staff_id: form.staff_id || null,
      address: form.address || order?.customers?.address,
      status: 'Pending',
      eta: form.eta
    })

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setModalOpen(false)
    setForm({ order_id: '', staff_id: '', address: '', eta: '30 mins' })
    load()
  }

  async function handleDelete(d) {
    if (!confirm(`Delete delivery ${d.delivery_no}? This can't be undone.`)) return
    const { error } = await supabase.from('deliveries').delete().eq('id', d.id)
    if (error) setError(error.message)
    else load()
  }

  async function updateStatus(d, status) {
    const patch = { status }
    if (status === 'Delivered') patch.delivered_at = new Date().toISOString()
    await supabase.from('deliveries').update(patch).eq('id', d.id)
    load()
  }

  return (
    <Layout
      title="Deliveries"
      subtitle="Dashboard / Deliveries"
      action={
        <button className="btn-primary" onClick={openCreate}>
          + New Delivery
        </button>
      }
    >
      <div className="card p-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="th">Delivery ID</th>
                <th className="th">Customer</th>
                <th className="th">Address</th>
                <th className="th">Staff</th>
                <th className="th">ETA</th>
                <th className="th">Status</th>
                <th className="th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="td" colSpan={7}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && deliveries.length === 0 && (
                <tr>
                  <td className="td text-gray-400" colSpan={7}>
                    No deliveries scheduled yet.
                  </td>
                </tr>
              )}
              {deliveries.map((d) => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="td font-medium">{d.delivery_no}</td>
                  <td className="td">{d.customers?.name || '—'}</td>
                  <td className="td max-w-xs truncate">{d.address || '—'}</td>
                  <td className="td">{d.staff?.name || 'Unassigned'}</td>
                  <td className="td">{d.eta}</td>
                  <td className="td">
                    <Badge status={d.status} />
                  </td>
                  <td className="td text-right whitespace-nowrap">
                    <select
                      className="input text-xs py-1 inline-block w-auto mr-3"
                      value={d.status}
                      onChange={(e) => updateStatus(d, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      className="text-brand-600 hover:underline text-sm font-medium mr-3"
                      onClick={() => openEdit(d)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 hover:underline text-sm font-medium"
                      onClick={() => handleDelete(d)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? `Edit Delivery ${editing.delivery_no}` : 'Schedule Delivery'}
        wide
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Order *</label>
            <select
              className="input"
              required
              value={form.order_id}
              onChange={(e) => setForm({ ...form, order_id: e.target.value })}
            >
              <option value="" disabled>
                Select order
              </option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_no} — {o.customers?.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Assign delivery staff
            </label>
            <select
              className="input"
              value={form.staff_id}
              onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
            >
              <option value="">Unassigned</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">ETA</label>
            <input
              className="input"
              value={form.eta}
              onChange={(e) => setForm({ ...form, eta: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Delivery address (optional override)
            </label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Leave blank to use customer's saved address"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setModalOpen(false)
                setEditing(null)
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
