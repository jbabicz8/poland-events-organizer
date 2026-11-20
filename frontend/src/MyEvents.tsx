import { useEffect, useState } from 'react'
import { api } from './api'
import EventForm from './EventForm'
import type { User } from './auth'

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
}

type Props = {
    user: User
    voivodeships: Option[]
    categories: Option[]
}

const STATUS_LABELS = {
    PENDING: 'Oczekuje na weryfikację',
    APPROVED: 'Zatwierdzone',
    REJECTED: 'Odrzucone',
}

const STATUS_COLORS = {
    PENDING: '#b45309',
    APPROVED: '#15803d',
    REJECTED: '#b91c1c',
}

function MyEvents({ user, voivodeships, categories }: Props) {
    const [events, setEvents] = useState<MyEvent[]>([])
    const [error, setError] = useState<string | null>(null)
    const [reload, setReload] = useState(0)
    const [editing, setEditing] = useState<MyEvent | null>(null)

    useEffect(() => {
        api<MyEvent[]>(user, '/api/events/mine')
            .then(setEvents)
            .catch((e) => setError(e.message))
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
            <h2>Moje zgłoszenia</h2>

            {error && <p style={{ color: 'crimson' }}>{error}</p>}
            {!error && events.length === 0 && <p>Nie dodałeś jeszcze żadnych wydarzeń.</p>}

            {events.map((e) => (
                <div
                    key={e.id}
                    style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 12 }}
                >
                    <h3 style={{ margin: 0 }}>{e.title}</h3>
                    <p>{e.city}, {e.voivodeship}</p>
                    <p>{new Date(e.startDate).toLocaleString('pl-PL')}</p>
                    <p>{e.categories.join(', ')}</p>
                    <p>
                        Chętnych: {e.participantCount}
                        {e.capacity != null && ` / ${e.capacity} miejsc`}
                    </p>
                    <p style={{ fontWeight: 600, color: STATUS_COLORS[e.status] }}>
                        {STATUS_LABELS[e.status]}
                    </p>
                    {e.status === 'REJECTED' && e.rejectionReason && (
                        <p>Powód odrzucenia: {e.rejectionReason}</p>
                    )}
                    {e.status !== 'APPROVED' && (
                        <button onClick={() => setEditing(e)}>Edytuj</button>
                    )}
                </div>
            ))}
        </div>
    )
}

export default MyEvents