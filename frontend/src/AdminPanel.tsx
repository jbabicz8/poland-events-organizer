import { useEffect, useState } from 'react'
import { api } from './api'
import CategoriesAdmin from './CategoriesAdmin'
import EventForm from './EventForm'
import type { User } from './auth'

type Option = {
    id: number
    name: string
}

type AdminEvent = {
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
    organizer: string | null
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    rejectionReason: string | null
    capacity: number | null
    participantCount: number
}

type Tab = 'pending' | 'all' | 'add' | 'categories'

type Props = {
    user: User
    voivodeships: Option[]
    categories: Option[]
    onCategoriesChanged: () => void
}

const STATUS_LABELS = {
    PENDING: 'Oczekuje na weryfikację',
    APPROVED: 'Zatwierdzone',
    REJECTED: 'Odrzucone',
}

function AdminPanel({ user, voivodeships, categories, onCategoriesChanged }: Props) {
    const [tab, setTab] = useState<Tab>('pending')
    const [events, setEvents] = useState<AdminEvent[]>([])
    const [error, setError] = useState<string | null>(null)
    const [reload, setReload] = useState(0)
    const [rejectingId, setRejectingId] = useState<number | null>(null)
    const [reason, setReason] = useState('')
    const [editing, setEditing] = useState<AdminEvent | null>(null)

    // Lista wydarzeń pobiera się tylko w zakładkach z wydarzeniami
    useEffect(() => {
        if (tab !== 'pending' && tab !== 'all') return
        const url = tab === 'pending' ? '/api/admin/events/pending' : '/api/admin/events'
        api<AdminEvent[]>(user, url)
            .then((data) => {
                setEvents(data)
                setError(null)
            })
            .catch((e) => setError(e.message))
    }, [user, tab, reload])

    async function approve(id: number) {
        try {
            await api(user, `/api/admin/events/${id}/approve`, 'POST')
            setError(null)
            setReload((r) => r + 1)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił błąd')
        }
    }

    async function reject(id: number) {
        if (!reason.trim()) {
            setError('Podaj powód odrzucenia')
            return
        }
        try {
            await api(user, `/api/admin/events/${id}/reject`, 'POST', { reason })
            setError(null)
            setRejectingId(null)
            setReason('')
            setReload((r) => r + 1)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił błąd')
        }
    }

    async function remove(id: number) {
        if (!window.confirm('Na pewno usunąć to wydarzenie? Tej operacji nie można cofnąć.')) {
            return
        }
        try {
            await api(user, `/api/admin/events/${id}`, 'DELETE')
            setError(null)
            setReload((r) => r + 1)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił błąd')
        }
    }

    if (editing) {
        return (
            <EventForm
                key={editing.id}
                user={user}
                voivodeships={voivodeships}
                categories={categories}
                initial={editing}
                url={`/api/admin/events/${editing.id}`}
                method="PUT"
                heading="Edytuj wydarzenie (administrator)"
                submitLabel="Zapisz zmiany"
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
            <h2>Panel administratora</h2>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <button onClick={() => setTab('pending')} disabled={tab === 'pending'}>
                    Oczekujące
                </button>
                <button onClick={() => setTab('all')} disabled={tab === 'all'}>
                    Wszystkie wydarzenia
                </button>
                <button onClick={() => setTab('add')} disabled={tab === 'add'}>
                    Dodaj wydarzenie
                </button>
                <button onClick={() => setTab('categories')} disabled={tab === 'categories'}>
                    Kategorie
                </button>
            </div>

            {tab === 'add' && (
                <EventForm
                    key="admin-add"
                    user={user}
                    voivodeships={voivodeships}
                    categories={categories}
                    url="/api/admin/events"
                    method="POST"
                    heading="Dodaj wydarzenie w imieniu organizatora"
                    submitLabel="Dodaj i opublikuj"
                    withOrganizerName
                    onDone={() => {
                        setTab('all')
                        setReload((r) => r + 1)
                    }}
                />
            )}

            {tab === 'categories' && (
                <CategoriesAdmin user={user} onChanged={onCategoriesChanged} />
            )}

            {(tab === 'pending' || tab === 'all') && (
                <>
                    {error && <p style={{ color: 'crimson' }}>{error}</p>}
                    {events.length === 0 && !error && <p>Brak wydarzeń na tej liście.</p>}

                    {events.map((e) => (
                        <div
                            key={e.id}
                            style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 12 }}
                        >
                            <h3 style={{ margin: 0 }}>{e.title}</h3>
                            <p>Status: {STATUS_LABELS[e.status]}</p>
                            <p>Organizator: {e.organizer ?? 'brak danych'}</p>
                            <p>{e.city}, {e.voivodeship}{e.address ? ` — ${e.address}` : ''}</p>
                            <p>
                                {new Date(e.startDate).toLocaleString('pl-PL')}
                                {e.endDate && ` – ${new Date(e.endDate).toLocaleString('pl-PL')}`}
                            </p>
                            <p>{e.categories.join(', ')}</p>
                            <p>
                                Chętnych: {e.participantCount}
                                {e.capacity != null && ` / ${e.capacity} miejsc`}
                            </p>
                            {e.description && <p>{e.description}</p>}
                            {e.status === 'REJECTED' && e.rejectionReason && (
                                <p>Powód odrzucenia: {e.rejectionReason}</p>
                            )}

                            {rejectingId === e.id ? (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <input
                                        placeholder="Powód odrzucenia"
                                        value={reason}
                                        onChange={(ev) => setReason(ev.target.value)}
                                        style={{ flex: 1, minWidth: 200 }}
                                    />
                                    <button onClick={() => reject(e.id)}>Potwierdź odrzucenie</button>
                                    <button onClick={() => { setRejectingId(null); setReason('') }}>Anuluj</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {e.status === 'PENDING' && (
                                        <>
                                            <button onClick={() => approve(e.id)}>Zatwierdź</button>
                                            <button onClick={() => { setRejectingId(e.id); setReason(''); setError(null) }}>
                                                Odrzuć
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => setEditing(e)}>Edytuj</button>
                                    <button onClick={() => remove(e.id)}>Usuń</button>
                                </div>
                            )}
                        </div>
                    ))}
                </>
            )}
        </div>
    )
}

export default AdminPanel