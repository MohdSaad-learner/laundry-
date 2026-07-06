import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import Badge from '../components/Badge'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [printInvoice, setPrintInvoice] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('invoices')
      .select('*, customers(name, phone, address), orders(order_no, order_items(*))')
      .order('created_at', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function markPaid(inv) {
    await supabase.from('invoices').update({ status: 'Paid' }).eq('id', inv.id)
    load()
  }

  const filtered = invoices.filter((i) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      i.invoice_no?.toLowerCase().includes(s) || i.customers?.name?.toLowerCase().includes(s)
    )
  })

  return (
    <Layout title="Invoices" subtitle="Dashboard / Invoices">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-4">
          <input
            className="input max-w-sm mb-4"
            placeholder="Search invoice or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="th">Invoice ID</th>
                  <th className="th">Customer</th>
                  <th className="th">Amount</th>
                  <th className="th">Status</th>
                  <th className="th">Date</th>
                  <th className="th text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="td" colSpan={6}>
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="td text-gray-400" colSpan={6}>
                      No invoices yet — they're created automatically when you add an order.
                    </td>
                  </tr>
                )}
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer ${
                      selected?.id === inv.id ? 'bg-brand-50' : ''
                    }`}
                    onClick={() => setSelected(inv)}
                  >
                    <td className="td font-medium">{inv.invoice_no}</td>
                    <td className="td">{inv.customers?.name || '—'}</td>
                    <td className="td">₹{inv.amount}</td>
                    <td className="td">
                      <Badge status={inv.status} />
                    </td>
                    <td className="td">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                    <td className="td text-right">
                      {inv.status !== 'Paid' && (
                        <button
                          className="text-brand-600 text-sm font-medium hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            markPaid(inv)
                          }}
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">Invoice Preview</h3>
          {!selected && <p className="text-sm text-gray-400">Select an invoice to preview it.</p>}
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">New Life</p>
                  <p className="text-xs text-gray-400">Dyers &amp; Dry Cleaners</p>
                </div>
                <Badge status={selected.status} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Invoice #{selected.invoice_no}</span>
                <span>{new Date(selected.invoice_date).toLocaleDateString()}</span>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 mb-1">Bill to</p>
                <p className="font-medium">{selected.customers?.name}</p>
                <p className="text-gray-500">{selected.customers?.phone}</p>
                <p className="text-gray-500">{selected.customers?.address}</p>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1">
                {(selected.orders?.order_items || []).map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span>
                      {it.qty} x {it.item_name}
                    </span>
                    <span>₹{it.qty * it.price}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-brand-600">₹{selected.amount}</span>
              </div>
              <button
                className="btn-secondary w-full justify-center"
                onClick={() => setPrintInvoice(selected)}
              >
                🖨 Print (A6)
              </button>
            </div>
          )}
        </div>
      </div>

      {printInvoice && (
        <div className="print-only fixed inset-0 z-[100] bg-white">
          <div className="a6-invoice">
            <div className="text-center mb-2">
              <p className="font-extrabold text-base">New Life</p>
              <p className="text-[10px]">Dyers &amp; Dry Cleaners</p>
            </div>
            <div className="flex justify-between text-[10px] border-t border-b border-black/30 py-1 mb-2">
              <span>#{printInvoice.invoice_no}</span>
              <span>{new Date(printInvoice.invoice_date).toLocaleDateString()}</span>
            </div>
            <div className="text-[10px] mb-2">
              <p className="font-semibold">{printInvoice.customers?.name}</p>
              <p>{printInvoice.customers?.phone}</p>
              <p>{printInvoice.customers?.address}</p>
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
                {(printInvoice.orders?.order_items || []).map((it) => (
                  <tr key={it.id}>
                    <td className="py-0.5">{it.item_name}</td>
                    <td className="text-right py-0.5">{it.qty}</td>
                    <td className="text-right py-0.5">₹{it.qty * it.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between text-xs font-bold border-t border-black/30 pt-1 mt-1">
              <span>Total</span>
              <span>₹{printInvoice.amount}</span>
            </div>
            <p className="text-center text-[9px] mt-3">Thank you for choosing New Life!</p>
          </div>
          <div className="no-print fixed bottom-4 left-0 right-0 flex justify-center gap-3">
            <button className="btn-secondary" onClick={() => setPrintInvoice(null)}>
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
