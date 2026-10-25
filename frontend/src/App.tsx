import { useEffect, useState } from 'react'
import PolandMap from './PolandMap'

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


const PAGE_SIZE = 5

function App() {
    const [events, setEvents] = useState<EventItem[]>([])
    const [error, setError] = useState<string | null>(null)

    const [categories, setCategories] = useState<Option[]>([])
    const [voivodeships, setVoivodeships] = useState<Voivodeship[]>([])

    const [voivodeshipId, setVoivodeshipId] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [query, setQuery] = useState('')
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')

    const [sort, setSort] = useState('startDate,asc')
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    useEffect(() => {
        fetch('/api/voivodeships').then((r) => r.json()).then(setVoivodeships)
        fetch('/api/categories').then((r) => r.json()).then(setCategories)
    }, [])

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

    return (
        <div style={{ maxWidth: 700, margin: '40px auto', padding: 16 }}>
            <h1>Wydarzenia w Polsce</h1>

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
        </div>
    )
}

export default App