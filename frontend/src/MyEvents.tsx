import { useEffect, useState } from 'react'
import { api } from './api'
import EventForm from './EventForm'
import StatusBadge from './StatusBadge'
import type { User } from './auth'
import type { ImageItem } from './types'

type Option = {
  id: number
  name: string
}

type MyEvent = {
  id: number
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  city: string
  address: string | null
  voivodeshipId: number | null
  voivodeship: string
  categoryIds: number[]
  categories: string[]
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason: string | null
  capacity: number | null
  participantCount: number
  images: ImageItem[]
}

type Props = {
  user: User
  voivodeships: Option[]
  categories: Option[]
}

function MyEvents({ user, voivodeships, categories }: Props) {
  const [events, setEvents] = useState<MyEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [reload, setReload] = useState(0)
  const [editing, setEditing] = useState<MyEvent | null>(null)

  useEffect(() => {
    api<MyEvent[]>(user, '/api/events/mine')
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true))
  }, [user, reload])

  if (editing) {
    return (
      <EventForm
        key={editing.id}
        user={user}
        voivodeships={voivodeships}
        categories={categories}
        initial={editing}
        url={`/api/events/${editing.id}`}
        method="PUT"
        heading="Edytuj wydarzenie"
        submitLabel="Zapisz i wyślij ponownie do weryfikacji"
        onDone={() => {
          setEditing(null)
          setReload((r) => r + 1)
        }}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <div>
      <h2 className="text-4xl font-semibold">Moje zgłoszenia</h2>
      <p className="mt-2 text-muted">Wydarzenia, które dodałeś, i ich status.</p>

      {error && <p className="mt-6 text-red-600">{error}</p>}

      {loaded && !error && events.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-line px-6 py-16 text-center">
          <p className="font-serif text-2xl">Nie dodałeś jeszcze żadnych wydarzeń</p>
          <p className="mt-2 text-muted">Użyj zakładki „Dodaj wydarzenie” w menu.</p>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {events.map((e, i) => {
          const d = new Date(e.startDate)
          return (
            <article
              key={e.id}
              style={{ animationDelay: `${i * 70}ms` }}
              className="animate-rise flex flex-col gap-5 rounded-3xl border border-line bg-surface p-4 sm:flex-row sm:p-5"
            >
              <div className="h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-line sm:h-32 sm:w-44">
                {e.images[0] ? (
                  <img src={e.images[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{ background: 'linear-gradient(135deg,#b4432b,#e9a15a)' }}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={e.status} />
                  <span className="text-sm text-muted">
                    {d.toLocaleString('pl-PL', { dateStyle: 'long', timeStyle: 'short' })}
                  </span>
                </div>
                <h3 className="mt-2 truncate text-2xl font-semibold">{e.title}</h3>
                <p className="text-sm text-muted">
                  {e.city}, {e.voivodeship}
                  {e.categories.length > 0 && ` · ${e.categories.join(', ')}`}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Chętnych: {e.participantCount}
                  {e.capacity != null && ` / ${e.capacity} miejsc`}
                </p>

                {e.status === 'REJECTED' && e.rejectionReason && (
                  <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    <b>Powód odrzucenia:</b> {e.rejectionReason}
                  </p>
                )}

                {e.status !== 'APPROVED' && (
                  <button onClick={() => setEditing(e)} className="btn-ghost mt-4">
                    Edytuj
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default MyEvents
