import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function Settings() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    business_name: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    low_stock_alerts: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('business_profile')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (data) {
        setProfile(data)
        setForm(data)
      }
      setLoading(false)
    }
    load()
  }, [user.id])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    const payload = { ...form, owner_id: user.id }

    const { error } = profile
      ? await supabase.from('business_profile').update(payload).eq('id', profile.id)
      : await supabase.from('business_profile').insert(payload)

    setSaving(false)
    if (!error) setSaved(true)
  }

  if (loading) {
    return (
      <Layout title="Settings" subtitle="Dashboard / Settings">
        <p className="text-sm text-gray-400">Loading…</p>
      </Layout>
    )
  }

  return (
    <Layout title="Settings" subtitle="Dashboard / Settings">
      <div className="card p-6 max-w-2xl">
        <h3 className="font-bold text-gray-900 mb-1">Business Profile</h3>
        <p className="text-sm text-gray-400 mb-6">
          This information appears on your invoices and customer-facing pages.
        </p>

        {saved && (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4">
            Settings saved.
          </p>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Business name</label>
            <input
              className="input"
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Tagline</label>
            <input
              className="input"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
            <textarea
              className="input"
              rows={2}
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input
              className="input"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input
              className="input"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Website</label>
            <input
              className="input"
              value={form.website || ''}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between border-t border-gray-100 pt-4">
            <div>
              <p className="text-sm font-medium text-gray-800">Low stock alerts</p>
              <p className="text-xs text-gray-400">Get notified when inventory runs low.</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${
                  form.low_stock_alerts ? 'text-brand-700' : 'text-gray-400'
                }`}
              >
                {form.low_stock_alerts ? 'On' : 'Off'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={form.low_stock_alerts}
                onClick={() => setForm({ ...form, low_stock_alerts: !form.low_stock_alerts })}
                className={`flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-200 relative outline-none focus:ring-2 focus:ring-brand-300 ${
                  form.low_stock_alerts ? 'bg-brand-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    form.low_stock_alerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
