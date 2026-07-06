import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444']

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [customersCount, setCustomersCount] = useState(0)
  const [revenueToday, setRevenueToday] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: o } = await supabase
        .from('orders')
        .select('*, customers(name), services(name)')
        .order('created_at', { ascending: false })
      setOrders(o || [])

      const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true })
      setCustomersCount(count || 0)

      const today = new Date().toISOString().slice(0, 10)
      const todayRevenue = (o || [])
        .filter((x) => x.created_at?.slice(0, 10) === today && x.payment_status === 'Paid')
        .reduce((sum, x) => sum + Number(x.total_amount || 0), 0)
      setRevenueToday(todayRevenue)

      setLoading(false)
    }
    load()
  }, [])

  const pending = orders.filter((o) => o.status === 'Pending').length
  const ready = orders.filter((o) => o.status === 'Ready').length
  const delivered = orders.filter((o) => o.status === 'Delivered').length
  const inProcess = orders.filter((o) => o.status === 'In Process').length
  const cancelled = orders.filter((o) => o.status === 'Cancelled').length
  const total = orders.length || 1

  const statusData = [
    { name: 'Pending', value: pending },
    { name: 'In Process', value: inProcess },
    { name: 'Ready', value: ready },
    { name: 'Delivered', value: delivered }
  ]

  // last 7 days order counts
  const days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })
  const trend = days.map((d) => {
    const key = d.toISOString().slice(0, 10)
    const count = orders.filter((o) => o.created_at?.slice(0, 10) === key).length
    return { day: d.toLocaleDateString(undefined, { weekday: 'short' }), orders: count }
  })

  return (
    <Layout title="Welcome back, Admin" subtitle="Here's what's happening in your store today">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🧾" label="Total Orders" value={orders.length} />
        <StatCard icon="⏳" label="Pending Orders" value={pending} />
        <StatCard icon="📦" label="Ready for Delivery" value={ready} />
        <StatCard icon="💰" label="Today's Revenue" value={`₹${revenueToday.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-5">
          <h3 className="font-bold text-gray-900 mb-4">Orders — last 7 days</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#c81e2b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">Order Status</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-2 text-sm">
            {statusData.map((s, i) => (
              <div key={s.name} className="flex justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ background: PIE_COLORS[i] }}
                  />
                  {s.name}
                </span>
                <span>
                  {s.value} ({Math.round((s.value / total) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="th">Order ID</th>
                <th className="th">Customer</th>
                <th className="th">Amount</th>
                <th className="th">Status</th>
                <th className="th">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="td" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td className="td text-gray-400" colSpan={5}>
                    No orders yet. Head to Orders to create your first one.
                  </td>
                </tr>
              )}
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="border-b border-gray-50">
                  <td className="td font-medium">{o.order_no}</td>
                  <td className="td">{o.customers?.name || '—'}</td>
                  <td className="td">₹{o.total_amount}</td>
                  <td className="td">
                    <Badge status={o.status} />
                  </td>
                  <td className="td">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Total customers on file: {customersCount}
      </p>
    </Layout>
  )
}
