export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  }

  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div
        className={`${sizes[size]} animate-spin rounded-full border-brand-border border-t-brand-orange`}
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}
