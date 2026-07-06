import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const COLORS = ['#c81e2b', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#64748b']

export default function Reports() {
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: o }, { data: inv }, { data: exp }] = await Promise.all([
        supabase.from('orders').select('*, services(name)'),
        supabase.from('invoices').select('*'),
        supabase.from('expenses').select('*')
      ])
      setOrders(o || [])
      setInvoices(inv || [])
      setExpenses(exp || [])
      setLoading(false)
    }
    load()
  }, [])

  const totalRevenue = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((s, i) => s + Number(i.amount || 0), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const netProfit = totalRevenue - totalExpenses

  const revenueByPayment = Object.entries(
    invoices
      .filter((i) => i.status === 'Paid')
      .reduce((acc, i) => {
        const k = i.payment_mode || 'Other'
        acc[k] = (acc[k] || 0) + Number(i.amount || 0)
        return acc
      }, {})
  ).map(([name, value]) => ({ name, value }))

  const serviceRevenue = Object.entries(
    orders.reduce((acc, o) => {
      const k = o.services?.name || 'Others'
      acc[k] = (acc[k] || 0) + Number(o.total_amount || 0)
      return acc
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <Layout title="Reports" subtitle="Dashboard / Reports">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Total Revenue (paid invoices)</p>
          <p className="text-2xl font-bold mt-1">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold mt-1">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Net Profit</p>
          <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{netProfit.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">Revenue by Service</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={serviceRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#c81e2b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">Revenue by Payment Mode</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={revenueByPayment} dataKey="value" nameKey="name" outerRadius={100} label>
                  {revenueByPayment.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-bold text-gray-900 mb-3">Service Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="th">Service</th>
                <th className="th">Revenue</th>
                <th className="th">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="td" colSpan={3}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && serviceRevenue.length === 0 && (
                <tr>
                  <td className="td text-gray-400" colSpan={3}>
                    No order data yet.
                  </td>
                </tr>
              )}
              {serviceRevenue.map((s) => (
                <tr key={s.name} className="border-b border-gray-50">
                  <td className="td font-medium">{s.name}</td>
                  <td className="td">₹{s.value.toLocaleString()}</td>
                  <td className="td">
                    {totalRevenue > 0 ? Math.round((s.value / (totalRevenue || 1)) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
