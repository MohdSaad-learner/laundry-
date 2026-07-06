const COLORS = {
  active: 'badge-green',
  paid: 'badge-green',
  delivered: 'badge-green',
  ready: 'badge-green',
  'in stock': 'badge-green',
  pending: 'badge-orange',
  unpaid: 'badge-orange',
  'low stock': 'badge-orange',
  'on leave': 'badge-orange',
  'in process': 'badge-blue',
  'out for delivery': 'badge-blue',
  inactive: 'badge-gray',
  cancelled: 'badge-red',
  'out of stock': 'badge-red'
}

export default function Badge({ status }) {
  const key = (status || '').toLowerCase()
  const cls = COLORS[key] || 'badge-gray'
  return <span className={`badge ${cls}`}>{status}</span>
}
