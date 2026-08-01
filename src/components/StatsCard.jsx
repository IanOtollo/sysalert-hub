const TONES = {
  neutral: 'text-brand-brown',
  warning: 'text-brand-orange',
  success: 'text-brand-green',
}

export default function StatsCard({ label, value, icon: Icon, tone = 'neutral' }) {
  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-brand-brown/60">{label}</p>
        <p className={`mt-2 font-serif text-4xl ${TONES[tone]}`}>{value}</p>
      </div>
      {Icon && (
        <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-brand-cream ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  )
}
