import { useEffect, useRef, useState } from 'react'
import { LuChevronDown, LuCheck, LuX } from 'react-icons/lu'

export default function MultiSelect({ value = [], onChange, options, placeholder = 'Select...' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggle(optValue) {
    if (value.includes(optValue)) onChange(value.filter((v) => v !== optValue))
    else onChange([...value, optValue])
  }

  function remove(optValue, e) {
    e.stopPropagation()
    onChange(value.filter((v) => v !== optValue))
  }

  const selected = options.filter((o) => value.includes(o.value))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input-field flex min-h-[42px] w-full flex-wrap items-center gap-1.5 text-left"
      >
        {selected.length === 0 && <span className="text-brand-brown/40">{placeholder}</span>}
        {selected.map((o) => (
          <span
            key={o.value}
            className="badge gap-1 border border-brand-border bg-brand-cream text-brand-brown/80"
          >
            {o.label}
            <LuX
              className="h-3 w-3 cursor-pointer hover:text-brand-orange"
              onClick={(e) => remove(o.value, e)}
            />
          </span>
        ))}
        <LuChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-brand-brown/50 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-60 w-full overflow-auto rounded-btn border border-brand-border bg-white py-1 shadow-lg"
        >
          {options.length === 0 && <li className="px-3 py-2 text-sm text-brand-brown/40">No options</li>}
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={value.includes(o.value)}
              onClick={() => toggle(o.value)}
              className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm text-brand-brown transition-colors hover:bg-brand-cream"
            >
              {o.label}
              {value.includes(o.value) && <LuCheck className="h-3.5 w-3.5 shrink-0 text-brand-orange" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
