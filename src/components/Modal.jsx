import { LuX } from 'react-icons/lu'

export default function Modal({ title, open, onClose, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-brown/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg rounded-card border border-brand-border bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl text-brand-brown">{title}</h3>
          <button onClick={onClose} className="text-brand-brown/50 hover:text-brand-brown" aria-label="Close">
            <LuX className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
