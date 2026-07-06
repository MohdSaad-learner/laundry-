import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Layout from './Layout'
import Modal from './Modal'
import Badge from './Badge'

/**
 * Generic CRUD page.
 *
 * props:
 *  - table: supabase table name
 *  - title / subtitle: page header text
 *  - addLabel: label for the "add new" button
 *  - fields: [{ key, label, type: 'text'|'number'|'select'|'date'|'textarea', options?, required?, statusBadge? }]
 *  - columns: subset of field keys (plus 'status') to show in the table, in order
 *  - searchKeys: which field keys to filter on when searching
 *  - defaultValues: object of default values for a new row
 */
export default function CrudPage({
  table,
  title,
  subtitle,
  addLabel,
  fields,
  columns,
  searchKeys = [],
  defaultValues = {}
}) {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultValues)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(defaultValues)
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm(row)
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = { ...form, owner_id: user.id }
    delete payload.id
    delete payload.created_at

    const { error } = editing
      ? await supabase.from(table).update(payload).eq('id', editing.id)
      : await supabase.from(table).insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setModalOpen(false)
    load()
  }

  async function handleDelete(row) {
    if (!confirm(`Delete "${row[fields[0].key]}"? This can't be undone.`)) return
    const { error } = await supabase.from(table).delete().eq('id', row.id)
    if (error) setError(error.message)
    else load()
  }

  const filtered = rows.filter((r) => {
    if (!search) return true
    const s = search.toLowerCase()
    return searchKeys.some((k) => (r[k] || '').toString().toLowerCase().includes(s))
  })

  const cols = columns || fields.map((f) => f.key)

  return (
    <Layout
      title={title}
      subtitle={subtitle}
      action={
        <button className="btn-primary" onClick={openCreate}>
          + {addLabel}
        </button>
      }
    >
      <div className="card p-4">
        <input
          className="input max-w-sm mb-4"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {cols.map((c) => (
                  <th key={c} className="th">
                    {fields.find((f) => f.key === c)?.label || c}
                  </th>
                ))}
                <th className="th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="td" colSpan={cols.length + 1}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="td text-gray-400" colSpan={cols.length + 1}>
                    No records yet. Click "{addLabel}" to add your first one.
                  </td>
                </tr>
              )}
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  {cols.map((c) => {
                    const field = fields.find((f) => f.key === c)
                    const val = row[c]
                    return (
                      <td className="td" key={c}>
                        {field?.statusBadge ? (
                          <Badge status={val} />
                        ) : field?.type === 'number' ? (
                          field.prefix ? `${field.prefix}${val ?? 0}` : val ?? 0
                        ) : (
                          val || '—'
                        )}
                      </td>
                    )
                  })}
                  <td className="td text-right whitespace-nowrap">
                    <button
                      className="text-brand-600 hover:underline text-sm font-medium mr-3"
                      onClick={() => openEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 hover:underline text-sm font-medium"
                      onClick={() => handleDelete(row)}
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
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${title.slice(0, -1) || title}` : addLabel}
        wide
      >
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {f.label}
                {f.required && <span className="text-red-500"> *</span>}
              </label>
              {f.type === 'select' ? (
                <select
                  className="input"
                  required={f.required}
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                >
                  <option value="" disabled>
                    Select {f.label.toLowerCase()}
                  </option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  className="input"
                  rows={3}
                  required={f.required}
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              ) : (
                <input
                  className="input"
                  type={f.type || 'text'}
                  step={f.type === 'number' ? '0.01' : undefined}
                  required={f.required}
                  value={form[f.key] ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [f.key]: f.type === 'number' ? e.target.value : e.target.value
                    })
                  }
                />
              )}
            </div>
          ))}

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
