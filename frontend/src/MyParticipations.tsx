import { useEffect, useState } from 'react'
import { api } from './api'
import type { User } from './auth'
import type { EventSummary } from './types'
import EventCard from './EventCard'

type Props = {
  user: User
  onOpen: (id: number) => void
}

function MyParticipations({ user, onOpen }: Props) {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api<EventSummary[]>(user, '/api/events/participations/mine')
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true))
  }, [user])

  return (
    <div>
      <h2 className="text-4xl font-semibold">Biorę udział</h2>
      <p className="mt-2 text-muted">Wydarzenia, na które się zapisałeś.</p>

      {error && <p className="mt-6 text-red-600">{error}</p>}

      {loaded && !error && events.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-line px-6 py-16 text-center">
          <p className="font-serif text-2xl">Jeszcze nic tu nie ma</p>
          <p className="mt-2 text-muted">
            Wejdź w szczegóły dowolnego wydarzenia i kliknij „Biorę udział”.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e, i) => (
          <EventCard key={e.id} event={e} index={i} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

export default MyParticipations
