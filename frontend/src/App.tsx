import { useEffect, useState } from 'react'
import PolandMap from './PolandMap'
import AuthForm from './AuthForm'
import EventForm from './EventForm'
import MyEvents from './MyEvents'
import AdminPanel from './AdminPanel'
import ResetPasswordForm from './ResetPasswordForm'
import EventDetailsView from './EventDetailsView'
import MyParticipations from './MyParticipations'
import { api } from './api'
import { loadUser, saveUser, type User } from './auth'
import type { EventSummary } from './types'

type EventItem = {
    id: number
    title: string
    city: string
    startDate: string
    voivodeship: string
    categories: string[]
}

type Option = {
    id: number
    name: string
}

type Voivodeship = Option & { mapCode: string }

type View = 'events' | 'details' | 'new' | 'mine' | 'admin' | 'participations'

const PAGE_SIZE = 5

function App() {
    const [events, setEvents] = useState<EventItem[]>([])
    const [error, setError] = useState<string | null>(null)

    const [voivodeships, setVoivodeships] = useState<Voivodeship[]>([])
    const [categories, setCategories] = useState<Option[]>([])

    const [voivodeshipId, setVoivodeshipId] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [query, setQuery] = useState('')
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')

    const [sort, setSort] = useState('startDate,asc')
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    const [user, setUser] = useState<User | null>(loadUser())
    const [showAuth, setShowAuth] = useState(false)
    const [view, setView] = useState<View>('events')
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
    const [participationIds, setParticipationIds] = useState<number[]>([])
    const [resetToken, setResetToken] = useState<string | null>(
        () => new URLSearchParams(window.location.search).get('reset'),
    )

    useEffect(() => {
        fetch('/api/voivodeships').then((r) => r.json()).then(setVoivodeships)
        fetch('/api/categories').then((r) => r.json()).then(setCategories)
    }, [])

    // Po zalogowaniu użytkownik (rola USER) pobiera listę wydarzeń, w których deklaruje udział
    useEffect(() => {
        if (!user || user.role !== 'USER') return
        api<EventSummary[]>(user, '/api/events/participations/mine')
            .then((list) => setParticipationIds(list.map((e) => e.id)))
            .catch(() => setParticipationIds([]))
    }, [user])

    useEffect(() => {
        const params = new URLSearchParams()
        if (voivodeshipId) params.set('voivodeshipId', voivodeshipId)
        if (categoryId) params.set('categoryId', categoryId)
        if (query) params.set('query', query)
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        params.set('sort', sort)
        params.set('page', String(page))
        params.set('size', String(PAGE_SIZE))

        fetch('/api/events?' + params.toString())
            .then((res) => {
                if (!res.ok) throw new Error('Błąd serwera: ' + res.status)
                return res.json()
            })
            .then((data) => {
                setEvents(data.content)
                setTotalPages(data.page.totalPages)
                setError(null)
            })
            .catch((e) => setError(e.message))
    }, [voivodeshipId, categoryId, query, from, to, sort, page])

    // Każda zmiana filtra wraca na pierwszą stronę wyników
    function onFilterChange(setter: (value: string) => void) {
        return (value: string) => {
            setter(value)
            setPage(0)
        }
    }

    function resetFilters() {
        setVoivodeshipId('')
        setCategoryId('')
        setQuery('')
        setFrom('')
        setTo('')
        setSort('startDate,asc')
        setPage(0)
    }

    function handleLogin(u: User) {
        saveUser(u)
        setUser(u)
        setShowAuth(false)
    }

    function handleLogout() {
        saveUser(null)
        setUser(null)
        setParticipationIds([])
        setView('events')
    }

    function openDetails(id: number) {
        setSelectedEventId(id)
        setView('details')
    }

    function handleParticipationChange(eventId: number, participating: boolean) {
        setParticipationIds((ids) =>
            participating ? [...ids, eventId] : ids.filter((id) => id !== eventId),
        )
    }

    function reloadCategories() {
        fetch('/api/categories').then((r) => r.json()).then(setCategories)
    }

    if (resetToken) {
        return (
            <div style={{ maxWidth: 700, margin: '40px auto', padding: 16 }}>
                <ResetPasswordForm
                    token={resetToken}
                    onDone={() => {
                        window.history.replaceState({}, '', '/')
                        setResetToken(null)
                        setShowAuth(true)
                    }}
                />
            </div>
        )
    }

    return (
        <div style={{ maxWidth: 700, margin: '40px auto', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                {user ? (
                    <>
                        <span>{user.displayName ?? user.email} ({user.role})</span>
                        <button onClick={handleLogout}>Wyloguj</button>
                    </>
                ) : (
                    <button onClick={() => setShowAuth(!showAuth)}>Zaloguj / Zarejestruj</button>
                )}
            </div>

            {showAuth && !user && <AuthForm onSuccess={handleLogin} />}

            <h1>Wydarzenia w Polsce</h1>

            <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                <button onClick={() => setView('events')}>Wydarzenia</button>
                {user?.role === 'USER' && (
                    <button onClick={() => setView('participations')}>Biorę udział</button>
                )}
                {user?.role === 'ORGANIZER' && (
                    <>
                        <button onClick={() => setView('new')}>Dodaj wydarzenie</button>
                        <button onClick={() => setView('mine')}>Moje zgłoszenia</button>
                    </>
                )}
                {user?.role === 'ADMIN' && (
                    <button onClick={() => setView('admin')}>Panel administratora</button>
                )}
            </nav>

            {view === 'events' && (
                <>
                    <PolandMap
                        voivodeships={voivodeships}
                        selectedId={voivodeshipId}
                        onSelect={onFilterChange(setVoivodeshipId)}
                    />

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                        <input
                            placeholder="Szukaj po nazwie..."
                            value={query}
                            onChange={(e) => onFilterChange(setQuery)(e.target.value)}
                        />
                        <select
                            value={voivodeshipId}
                            onChange={(e) => onFilterChange(setVoivodeshipId)(e.target.value)}
                        >
                            <option value="">Całe województwa</option>
                            {voivodeships.map((v) => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                        <select
                            value={categoryId}
                            onChange={(e) => onFilterChange(setCategoryId)(e.target.value)}
                        >
                            <option value="">Wszystkie kategorie</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => onFilterChange(setFrom)(e.target.value)}
                        />
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => onFilterChange(setTo)(e.target.value)}
                        />
                        <select value={sort} onChange={(e) => onFilterChange(setSort)(e.target.value)}>
                            <option value="startDate,asc">Data: od najbliższych</option>
                            <option value="startDate,desc">Data: od najdalszych</option>
                            <option value="title,asc">Nazwa: A–Z</option>
                            <option value="title,desc">Nazwa: Z–A</option>
                        </select>
                        <button onClick={resetFilters}>Wyczyść</button>
                    </div>

                    {error && <p>{error}</p>}
                    {!error && events.length === 0 && <p>Brak wydarzeń dla wybranych filtrów.</p>}

                    {events.map((e) => (
                        <div
                            key={e.id}
                            style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 12 }}
                        >
                            <h2>{e.title}</h2>
                            <p>{e.city}, {e.voivodeship}</p>
                            <p>{new Date(e.startDate).toLocaleString('pl-PL')}</p>
                            <p>{e.categories.join(', ')}</p>
                            <button onClick={() => openDetails(e.id)}>Szczegóły</button>
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                            <button onClick={() => setPage(page - 1)} disabled={page === 0}>
                                ← Poprzednia
                            </button>
                            <span>Strona {page + 1} z {totalPages}</span>
                            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
                                Następna →
                            </button>
                        </div>
                    )}
                </>
            )}

            {view === 'details' && selectedEventId !== null && (
                <EventDetailsView
                    key={selectedEventId}
                    eventId={selectedEventId}
                    user={user}
                    participating={user !== null && participationIds.includes(selectedEventId)}
                    onParticipationChange={handleParticipationChange}
                    onBack={() => setView('events')}
                />
            )}

            {view === 'participations' && user && user.role === 'USER' && (
                <MyParticipations user={user} onOpen={openDetails} />
            )}

            {view === 'new' && user && (
                <EventForm
                    user={user}
                    voivodeships={voivodeships}
                    categories={categories}
                    url="/api/events"
                    method="POST"
                    heading="Dodaj wydarzenie"
                    submitLabel="Wyślij do weryfikacji"
                    onDone={() => setView('mine')}
                />
            )}

            {view === 'mine' && user && (
                <MyEvents user={user} voivodeships={voivodeships} categories={categories} />
            )}

            {view === 'admin' && user && (
                <AdminPanel
                    user={user}
                    voivodeships={voivodeships}
                    categories={categories}
                    onCategoriesChanged={reloadCategories}
                />
            )}
        </div>
    )
}

export default App