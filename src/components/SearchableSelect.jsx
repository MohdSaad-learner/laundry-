import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * A searchable dropdown ("combobox") — behaves like a <select> but lets the
 * user type to filter options. Works with plain arrays of { value, label, sub? }.
 *
 * props:
 *  - options: [{ value, label, sub? }]
 *  - value: currently selected value
 *  - onChange: (value) => void
 *  - placeholder
 *  - required
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  required = false,
  emptyText = 'No matches found'
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = useMemo(() => {
    if (!query) return options
    const q = query.toLowerCase()
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.sub || '').toLowerCase().includes(q)
    )
  }, [options, query])

  function selectOption(opt) {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  function handleKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlight]) selectOption(filtered[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input
        ref={inputRef}
        className="input cursor-pointer"
        placeholder={placeholder}
        value={open ? query : selected ? selected.label : ''}
        required={required && !value}
        onChange={(e) => {
          setQuery(e.target.value)
          setHighlight(0)
          if (!open) setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          setQuery('')
        }}
        onKeyDown={handleKeyDown}
      />
      {selected && !open && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            onChange('')
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-sm"
          aria-label="Clear selection"
        >
          ×
        </button>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">{emptyText}</p>
          )}
          {filtered.map((opt, i) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => selectOption(opt)}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-left px-3 py-2 text-sm flex flex-col ${
                i === highlight ? 'bg-brand-50 text-brand-700' : 'text-gray-700'
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.sub && <span className="text-xs text-gray-400">{opt.sub}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
