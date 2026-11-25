type Props = {
  count: number
  capacity: number
  size?: 'sm' | 'md'
}

// Pasek zapełnienia wydarzenia. Zmienia kolor wraz z liczbą chętnych.
function SeatsBar({ count, capacity, size = 'md' }: Props) {
  const percent = Math.min(100, Math.round((count / capacity) * 100))
  const left = Math.max(0, capacity - count)
  const full = left === 0
  const almost = !full && (percent >= 90 || left <= 5)

  const color = full ? 'bg-red-600' : almost ? 'bg-accent' : percent >= 60 ? 'bg-accent-2' : 'bg-green-600'
  const label = full ? 'Brak miejsc' : almost ? `Ostatnie miejsca (${left})` : `Wolnych miejsc: ${left}`
  const labelColor = full ? 'text-red-600' : almost ? 'text-accent' : 'text-muted'

  return (
    <div className={size === 'sm' ? 'w-full' : 'w-full'}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={count}
        aria-label="Zapełnienie wydarzenia"
        className={'overflow-hidden rounded-full bg-line ' + (size === 'sm' ? 'h-1.5' : 'h-2.5')}
      >
        <div
          className={'h-full rounded-full transition-all duration-700 ' + color}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className={'mt-1.5 flex justify-between text-xs ' + (size === 'sm' ? '' : 'sm:text-sm')}>
        <span className={'font-medium ' + labelColor}>{label}</span>
        <span className="text-muted">
          {count} / {capacity}
        </span>
      </div>
    </div>
  )
}

export default SeatsBar
