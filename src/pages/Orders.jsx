import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import SearchableSelect from '../components/SearchableSelect'

const STATUSES = ['Pending', 'In Process', 'Ready', 'Delivered', 'Cancelled']

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [printOrder, setPrintOrder] = useState(null)

  const [form, setForm] = useState(emptyForm())

  function emptyForm() {
    return {
      customer_id: '',
      service_id: '',
      notes: '',
      discount: 0,
      items: [{ item_name: '', service_id: '', service_name: '', qty: 1, price: 0 }]
    }
  }

  async function loadAll() {
    setLoading(true)
    setError('')
    const [{ data: o, error: oErr }, { data: c }, { data: s }] = await Promise.all([
      supabase
        .from('orders')
        .select('*, customers(name, phone, address), services(name), order_items(*)')
        .order('created_at', { ascending: false }),
      supabase.from('customers').select('id, name, phone').order('name'),
      supabase.from('services').select('id, name, price').order('name')
    ])
    if (oErr) setError(oErr.message)
    setOrders(o || [])
    setCustomers(c || [])
    setServices(s || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name,
    sub: c.phone
  }))

  function addItemRow(prefill) {
    setForm((f) => ({
      ...f,
      items: [...f.items, prefill || { item_name: '', service_id: '', service_name: '', qty: 1, price: 0 }]
    }))
  }
  function updateItem(i, key, val) {
    setForm((f) => {
      const items = [...f.items]
      items[i] = { ...items[i], [key]: val }
      return { ...f, items }
    })
  }
  function selectItemService(i, serviceId) {
    const svc = services.find((s) => s.id === serviceId)
    setForm((f) => {
      const items = [...f.items]
      items[i] = {
        ...items[i],
        service_id: serviceId,
        service_name: svc?.name || '',
        price: svc ? svc.price : items[i].price
      }
      return { ...f, items }
    })
  }
  function removeItem(i) {
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  }

  // Selecting a "primary service" now actually does something: it adds a
  // ready-made item row using that service's name & price.
  function handlePrimaryServiceChange(serviceId) {
    const svc = services.find((s) => s.id === serviceId)
    setForm((f) => ({ ...f, service_id: serviceId }))
    if (svc) {
      addItemRow({ item_name: svc.name, service_id: svc.id, service_name: svc.name, qty: 1, price: svc.price })
    }
  }

  const itemsTotal = form.items.reduce(
    (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0),
    0
  )
  const discountPct = Math.min(Math.max(Number(form.discount) || 0, 0), 100)
  const discountAmount = (itemsTotal * discountPct) / 100
  const grandTotal = Math.max(itemsTotal - discountAmount, 0)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEdit(order) {
    setEditing(order)
    setForm({
      customer_id: order.customer_id || '',
      service_id: order.service_id || '',
      notes: order.notes || '',
      discount: order.discount || 0,
      items:
        order.order_items && order.order_items.length
          ? order.order_items.map((it) => ({
              id: it.id,
              item_name: it.item_name,
              service_id: '',
              service_name: it.service_name || '',
              qty: it.qty,
              price: it.price
            }))
          : [{ item_name: '', service_id: '', service_name: '', qty: 1, price: 0 }]
    })
    setModalOpen(true)
  }

  async function handleSaveOrder(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (editing) {
      const { error: orderErr } = await supabase
        .from('orders')
        .update({
          customer_id: form.customer_id || null,
          service_id: form.service_id || null,
          total_amount: grandTotal,
          discount: discountPct,
          notes: form.notes
        })
        .eq('id', editing.id)

      if (orderErr) {
        setError(orderErr.message)
        setSaving(false)
        return
      }

      // Replace item rows: delete old, insert current set
      await supabase.from('order_items').delete().eq('order_id', editing.id)
      const itemRows = form.items
        .filter((it) => it.item_name)
        .map((it) => ({
          order_id: editing.id,
          item_name: it.item_name,
          service_name: it.service_name,
          qty: Number(it.qty) || 1,
          price: Number(it.price) || 0
        }))
      if (itemRows.length) {
        const { error: itemsErr } = await supabase.from('order_items').insert(itemRows)
        if (itemsErr) setError(itemsErr.message)
      }

      // Keep the matching invoice amount in sync
      await supabase.from('invoices').update({ amount: grandTotal }).eq('order_id', editing.id)

      setSaving(false)
      setModalOpen(false)
      setForm(emptyForm())
      setEditing(null)
      loadAll()
      return
    }

    const orderNo = `NL${Math.floor(1000 + Math.random() * 9000)}`

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        owner_id: user.id,
        order_no: orderNo,
        customer_id: form.customer_id || null,
        service_id: form.service_id || null,
        status: 'Pending',
        payment_status: 'Unpaid',
        total_amount: grandTotal,
        discount: discountPct,
        notes: form.notes
      })
      .select()
      .single()

    if (orderErr) {
      setError(orderErr.message)
      setSaving(false)
      return
    }

    const itemRows = form.items
      .filter((it) => it.item_name)
      .map((it) => ({
        order_id: order.id,
        item_name: it.item_name,
        service_name: it.service_name,
        qty: Number(it.qty) || 1,
        price: Number(it.price) || 0
      }))

    if (itemRows.length) {
      const { error: itemsErr } = await supabase.from('order_items').insert(itemRows)
      if (itemsErr) setError(itemsErr.message)
    }

    // Auto-generate a matching invoice
    await supabase.from('invoices').insert({
      owner_id: user.id,
      invoice_no: `INV-${orderNo.replace('NL', '')}`,
      order_id: order.id,
      customer_id: form.customer_id || null,
      amount: grandTotal,
      status: 'Pending',
      payment_mode: 'Cash'
    })

    setSaving(false)
    setModalOpen(false)
    setForm(emptyForm())
    loadAll()
  }

  async function handleDeleteOrder(order) {
    if (!confirm(`Delete order ${order.order_no}? This will also remove its items and invoice.`)) return
    const { error } = await supabase.from('orders').delete().eq('id', order.id)
    if (error) {
      setError(error.message)
      return
    }
    if (selected?.id === order.id) setSelected(null)
    loadAll()
  }

  async function updateStatus(order, status) {
    await supabase.from('orders').update({ status }).eq('id', order.id)
    if (status === 'Delivered') {
      await supabase.from('invoices').update({ status: 'Paid' }).eq('order_id', order.id)
      await supabase.from('orders').update({ payment_status: 'Paid' }).eq('id', order.id)
    }
    loadAll()
  }

  return (
    <Layout
      title="Orders"
      subtitle="Dashboard / Orders"
      action={
        <button className="btn-primary" onClick={openCreate}>
          + New Order
        </button>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="th">Order ID</th>
                  <th className="th">Customer</th>
                  <th className="th">Items</th>
                  <th className="th">Amount</th>
                  <th className="th">Status</th>
                  <th className="th">Date</th>
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
                {!loading && orders.length === 0 && (
                  <tr>
                    <td className="td text-gray-400" colSpan={7}>
                      No orders yet. Create your first order.
                    </td>
                  </tr>
                )}
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/60 ${
                      selected?.id === o.id ? 'bg-brand-50' : ''
                    }`}
                  >
                    <td className="td font-medium cursor-pointer" onClick={() => setSelected(o)}>
                      {o.order_no}
                    </td>
                    <td className="td cursor-pointer" onClick={() => setSelected(o)}>
                      {o.customers?.name || '—'}
                    </td>
                    <td className="td cursor-pointer" onClick={() => setSelected(o)}>
                      {o.order_items?.length ?? 0}
                    </td>
                    <td className="td cursor-pointer" onClick={() => setSelected(o)}>
                      ₹{o.total_amount}
                    </td>
                    <td className="td cursor-pointer" onClick={() => setSelected(o)}>
                      <Badge status={o.status} />
                    </td>
                    <td className="td cursor-pointer" onClick={() => setSelected(o)}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="td text-right whitespace-nowrap">
                      <button
                        className="text-brand-600 hover:underline text-sm font-medium mr-3"
                        onClick={() => openEdit(o)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-500 hover:underline text-sm font-medium"
                        onClick={() => handleDeleteOrder(o)}
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

        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
          {!selected && <p className="text-sm text-gray-400">Select an order to view details.</p>}
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{selected.order_no}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge status={selected.status} />
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Customer</p>
                <p className="font-medium">{selected.customers?.name || '—'}</p>
                <p className="text-sm text-gray-500">{selected.customers?.phone}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Items</p>
                <div className="space-y-2">
                  {(selected.order_items || []).map((it) => (
                    <div key={it.id} className="flex justify-between text-sm">
                      <span>
                        {it.qty} x {it.item_name}
                      </span>
                      <span>₹{it.qty * it.price}</span>
                    </div>
                  ))}
                  {(selected.order_items || []).length === 0 && (
                    <p className="text-sm text-gray-400">No items recorded.</p>
                  )}
                </div>
              </div>

              {selected.discount > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Discount</span>
                  <span>{selected.discount}%</span>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-brand-600">₹{selected.total_amount}</span>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Update status</p>
                <select
                  className="input"
                  value={selected.status}
                  onChange={(e) => {
                    updateStatus(selected, e.target.value)
                    setSelected({ ...selected, status: e.target.value })
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button className="btn-secondary flex-1 justify-center" onClick={() => openEdit(selected)}>
                  Edit Order
                </button>
                <button
                  className="btn-secondary flex-1 justify-center"
                  onClick={() => setPrintOrder(selected)}
                >
                  🖨 Print Invoice (A6)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? `Edit Order ${editing.order_no}` : 'New Order'}
        wide
      >
        <form onSubmit={handleSaveOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Customer *</label>
              <SearchableSelect
                options={customerOptions}
                value={form.customer_id}
                onChange={(v) => setForm({ ...form, customer_id: v })}
                placeholder="Search customer by name or phone..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Primary service
              </label>
              <select
                className="input"
                value={form.service_id}
                onChange={(e) => handlePrimaryServiceChange(e.target.value)}
              >
                <option value="">Select service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ₹{s.price}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Choosing a service adds it below as an order item automatically.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-500">Order items</label>
              <button type="button" className="text-brand-600 text-sm font-medium" onClick={() => addItemRow()}>
                + Add item
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="input col-span-4"
                    placeholder="Item (e.g. White Shirt)"
                    value={it.item_name}
                    onChange={(e) => updateItem(i, 'item_name', e.target.value)}
                  />
                  <select
                    className="input col-span-4"
                    value={it.service_id}
                    onChange={(e) => selectItemService(i, e.target.value)}
                  >
                    <option value="">Service (optional)</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input col-span-1"
                    type="number"
                    min={1}
                    value={it.qty}
                    onChange={(e) => updateItem(i, 'qty', e.target.value)}
                  />
                  <input
                    className="input col-span-2"
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={it.price}
                    onChange={(e) => updateItem(i, 'price', e.target.value)}
                  />
                  <button
                    type="button"
                    className="col-span-1 text-red-400 hover:text-red-600"
                    onClick={() => removeItem(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Discount (%)</label>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <input
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-gray-100 pt-4">
            <div className="text-sm text-gray-500">
              Subtotal ₹{itemsTotal.toFixed(2)} — Discount {discountPct}% (₹{discountAmount.toFixed(2)})
            </div>
            <div className="text-lg font-bold">Total ₹{grandTotal.toFixed(2)}</div>
          </div>

          <div className="flex justify-end gap-3">
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
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      {printOrder && (
        <div className="print-only fixed inset-0 z-[100] bg-white">
          <div className="a6-invoice">
            <div className="text-center mb-2">
              <p className="font-extrabold text-base">New Life</p>
              <p className="text-[10px]">Dyers &amp; Dry Cleaners</p>
            </div>
            <div className="flex justify-between text-[10px] border-t border-b border-black/30 py-1 mb-2">
              <span>#{printOrder.order_no}</span>
              <span>{new Date(printOrder.created_at).toLocaleDateString()}</span>
            </div>
            <div className="text-[10px] mb-2">
              <p className="font-semibold">{printOrder.customers?.name}</p>
              <p>{printOrder.customers?.phone}</p>
              <p>{printOrder.customers?.address}</p>
            </div>
            <table className="w-full text-[10px] mb-2">
              <thead>
                <tr className="border-b border-black/30">
                  <th className="text-left py-1">Item</th>
                  <th className="text-right py-1">Qty</th>
                  <th className="text-right py-1">Amt</th>
                </tr>
              </thead>
              <tbody>
                {(printOrder.order_items || []).map((it) => (
                  <tr key={it.id}>
                    <td className="py-0.5">{it.item_name}</td>
                    <td className="text-right py-0.5">{it.qty}</td>
                    <td className="text-right py-0.5">₹{it.qty * it.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {printOrder.discount > 0 && (
              <div className="flex justify-between text-[10px]">
                <span>Discount</span>
                <span>{printOrder.discount}%</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold border-t border-black/30 pt-1 mt-1">
              <span>Total</span>
              <span>₹{printOrder.total_amount}</span>
            </div>
            <p className="text-center text-[9px] mt-3">Thank you for choosing New Life!</p>
          </div>
          <div className="no-print fixed bottom-4 left-0 right-0 flex justify-center gap-3">
            <button className="btn-secondary" onClick={() => setPrintOrder(null)}>
              Close
            </button>
            <button className="btn-primary" onClick={() => window.print()}>
              🖨 Print
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}
