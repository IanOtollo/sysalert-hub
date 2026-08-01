import { useEffect, useRef, useState } from 'react'
import { LuChevronDown, LuCheck } from 'react-icons/lu'

export default function Select({ value, onChange, options, placeholder = 'Select...', className = '' }) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const ref = useRef(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function openMenu() {
    setOpen(true)
    setHighlighted(Math.max(options.findIndex((o) => o.value === value), 0))
  }

  function handleKeyDown(e) {
    if (!open && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault()
      openMenu()
      return
    }
    if (!open) return

    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted >= 0 && options[highlighted]) {
        onChange(options[highlighted].value)
        setOpen(false)
      }
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="input-field flex w-full items-center justify-between gap-2 text-left"
      >
        <span className={`truncate ${selected ? 'text-brand-brown' : 'text-brand-brown/40'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <LuChevronDown
          className={`h-4 w-4 shrink-0 text-brand-brown/50 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-60 w-full min-w-max overflow-auto rounded-btn border border-brand-border bg-white py-1 shadow-lg"
        >
          {options.length === 0 && <li className="px-3 py-2 text-sm text-brand-brown/40">No options</li>}
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className={`flex cursor-pointer items-center justify-between gap-3 whitespace-nowrap px-3 py-2 text-sm transition-colors ${
                i === highlighted ? 'bg-brand-cream' : ''
              } ${o.value === value ? 'font-medium text-brand-orange' : 'text-brand-brown'}`}
            >
              {o.label}
              {o.value === value && <LuCheck className="h-3.5 w-3.5 shrink-0" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
