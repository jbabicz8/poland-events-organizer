const STATUSES = {
  PENDING: {
    label: 'Oczekuje na weryfikację',
    cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  APPROVED: {
    label: 'Zatwierdzone',
    cls: 'bg-green-500/15 text-green-700 dark:text-green-400',
  },
  REJECTED: {
    label: 'Odrzucone',
    cls: 'bg-red-500/15 text-red-700 dark:text-red-400',
  },
}

export type EventStatus = keyof typeof STATUSES

function StatusBadge({ status }: { status: EventStatus }) {
  const s = STATUSES[status]
  return (
    <span className={'inline-block rounded-full px-3 py-1 text-xs font-semibold ' + s.cls}>
      {s.label}
    </span>
  )
}

export default StatusBadge
