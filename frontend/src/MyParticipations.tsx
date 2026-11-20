import { useEffect, useState } from 'react'
import { api } from './api'
import type { User } from './auth'
import type { EventSummary } from './types'

type Props = {
    user: User
    onOpen: (id: number) => void
}

function MyParticipations({ user, onOpen }: Props) {
    const [events, setEvents] = useState<EventSummary[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        api<EventSummary[]>(user, '/api/events/participations/mine')
            .then(setEvents)
            .catch((e) => setError(e.message))
    }, [user])

    return (
        <div>
            <h2>Wydarzenia, w których biorę udział</h2>

            {error && <p style={{ color: 'crimson' }}>{error}</p>}
            {!error && events.length === 0 && (
                <p>Nie zadeklarowałeś jeszcze udziału w żadnym wydarzeniu.</p>
            )}

            {events.map((e) => (
                <div
                    key={e.id}
                    style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 12 }}
                >
                    <h3 style={{ margin: 0 }}>{e.title}</h3>
                    <p>{e.city}, {e.voivodeship}</p>
                    <p>{new Date(e.startDate).toLocaleString('pl-PL')}</p>
                    <button onClick={() => onOpen(e.id)}>Szczegóły</button>
                </div>
            ))}
        </div>
    )
}

export default MyParticipations