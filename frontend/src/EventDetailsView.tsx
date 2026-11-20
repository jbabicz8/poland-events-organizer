import { useEffect, useState } from 'react'
import { api } from './api'
import type { User } from './auth'
import type { EventSummary } from './types'

type Props = {
    eventId: number
    user: User | null
    participating: boolean
    onParticipationChange: (eventId: number, participating: boolean) => void
    onBack: () => void
}

function EventDetailsView({
                              eventId,
                              user,
                              participating,
                              onParticipationChange,
                              onBack,
                          }: Props) {
    const [event, setEvent] = useState<EventSummary | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        fetch('/api/events/' + eventId)
            .then((res) => {
                if (!res.ok) throw new Error('Błąd ' + res.status + ' przy pobieraniu wydarzenia')
                return res.json()
            })
            .then(setEvent)
            .catch((e) => setError(e.message))
    }, [eventId])

    async function toggleParticipation() {
        if (!user) return
        setBusy(true)
        setError(null)
        try {
            const updated = await api<EventSummary>(
                user,
                `/api/events/${eventId}/participation`,
                participating ? 'DELETE' : 'POST',
            )
            setEvent(updated)
            onParticipationChange(eventId, !participating)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił błąd')
        } finally {
            setBusy(false)
        }
    }

    const started = event ? new Date(event.startDate) <= new Date() : false
    const canParticipate = user?.role === 'USER'
    const count = event?.participantCount ?? 0
    const full = event?.capacity != null && count >= event.capacity

    return (
        <div>
            <button onClick={onBack}>← Wróć do listy</button>

            {!event && !error && <p>Ładowanie...</p>}

            {event && (
                <>
                    <h2>{event.title}</h2>
                    <p>
                        {new Date(event.startDate).toLocaleString('pl-PL')}
                        {event.endDate && ` – ${new Date(event.endDate).toLocaleString('pl-PL')}`}
                    </p>
                    <p>
                        {event.city}, {event.voivodeship}
                        {event.address ? ` — ${event.address}` : ''}
                    </p>
                    <p>Kategorie: {event.categories.join(', ')}</p>
                    {event.organizerName && <p>Organizator: {event.organizerName}</p>}
                    {event.description && <p>{event.description}</p>}

                    <p style={{ fontWeight: 600 }}>
                        Chętnych: {count}
                        {event.capacity != null && ` / ${event.capacity} miejsc`}
                    </p>
                    {event.capacity != null && (
                        <p>
                            {full
                                ? 'Brak wolnych miejsc.'
                                : `Wolnych miejsc: ${event.capacity - count}`}
                        </p>
                    )}

                    {started ? (
                        <p>
                            Wydarzenie już się rozpoczęło.
                            {participating && ' Zadeklarowałeś w nim udział.'}
                        </p>
                    ) : !user ? (
                        <p>Zaloguj się, aby zadeklarować udział w wydarzeniu.</p>
                    ) : canParticipate ? (
                        <button onClick={toggleParticipation} disabled={busy || (full && !participating)}>
                            {participating
                                ? 'Wycofaj udział'
                                : full
                                    ? 'Brak wolnych miejsc'
                                    : 'Biorę udział'}
                        </button>
                    ) : null}
                </>
            )}

            {error && <p style={{ color: 'crimson' }}>{error}</p>}
        </div>
    )
}

export default EventDetailsView