import { useEffect, useState } from 'react'
import PolandMap from './PolandMap'
import AuthForm from './AuthForm'
import EventForm from './EventForm'
import MyEvents from './MyEvents'
import AdminPanel from './AdminPanel'
import ResetPasswordForm from './ResetPasswordForm'
import EventDetailsView from './EventDetailsView'
import MyParticipations from './MyParticipations'
import Header, { type View } from './Header'
import EventCard from './EventCard'
import MapPage from './MapPage'
import { useTheme } from './theme'
import { api } from './api'
import { loadUser, saveUser, type User } from './auth'
import type { EventSummary } from './types'

type Option = {
  id: number
  name: string
}

type Voivodeship = Option & { mapCode: string }

const PAGE_SIZE = 6

function App() {
  const { theme, toggle } = useTheme()

  const [events, setEvents] = useState<EventSummary[]>([])
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
  const [totalElements, setTotalElements] = useState(0)

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
        setTotalElements(data.page.totalElements)
        setError(null)
      })
      .catch((e) => setError(e.message))
  }, [voivodeshipId, categoryId, query, from, to, sort, page])

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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      <div className="grid min-h-screen place-items-center px-5 py-10">
        <div className="animate-rise w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-2xl shadow-black/10">
          <ResetPasswordForm
            token={resetToken}
            onDone={() => {
              window.history.replaceState({}, '', '/')
              setResetToken(null)
              setShowAuth(true)
            }}
          />
        </div>
      </div>
    )
  }

  const selectedVoivodeship = voivodeships.find((v) => String(v.id) === voivodeshipId)

  return (
    <div className="min-h-screen">
      <Header
        user={user}
        view={view}
        theme={theme}
        onToggleTheme={toggle}
        onNavigate={setView}
        onLoginClick={() => setShowAuth(true)}
        onLogout={handleLogout}
      />

      {showAuth && !user && (
        <div
          className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowAuth(false)}
        >
          <div
            className="animate-rise relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-surface p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAuth(false)}
              aria-label="Zamknij"
              className="absolute right-4 top-4 !h-9 !w-9 !rounded-full !p-0"
            >
              ✕
            </button>
            <AuthForm onSuccess={handleLogin} />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8">
        {view === 'events' && (
          <>
            <section className="grid items-center gap-12 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
              <div>
                <span className="inline-block rounded-full bg-accent-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
                  Kultura · Rozrywka · Cała Polska
                </span>
                <h1 className="mb-5 mt-6 text-5xl font-semibold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
                  Znajdź wydarzenie, które <em className="font-normal text-accent">warto przeżyć</em>
                </h1>
                <p className="max-w-md text-lg text-muted">
                  Koncerty, festiwale, spektakle i wystawy z całego kraju. Wybierz region na mapie albo wpisz, czego szukasz.
                </p>

                <div className="mt-8 flex max-w-xl rounded-full border border-line bg-surface p-1.5 shadow-xl shadow-black/5">
                  <input
                    value={query}
                    onChange={(e) => onFilterChange(setQuery)(e.target.value)}
                    placeholder="Szukaj po nazwie..."
                    aria-label="Szukaj wydarzeń"
                    className="!w-full flex-1 !border-0 !bg-transparent !px-5 text-base !shadow-none !ring-0"
                  />
                  {query && (
                    <button onClick={() => onFilterChange(setQuery)('')} className="btn-ghost mr-1 border-0">
                      ✕
                    </button>
                  )}
                </div>

                <div className="mt-10 flex gap-10">
                  <div>
                    <b className="block font-serif text-3xl font-semibold">{totalElements}</b>
                    <span className="text-sm text-muted">wydarzeń</span>
                  </div>
                  <div>
                    <b className="block font-serif text-3xl font-semibold">{voivodeships.length}</b>
                    <span className="text-sm text-muted">województw</span>
                  </div>
                  <div>
                    <b className="block font-serif text-3xl font-semibold">{categories.length}</b>
                    <span className="text-sm text-muted">kategorii</span>
                  </div>
                </div>
              </div>

              <PolandMap
                large
                voivodeships={voivodeships}
                selectedId={voivodeshipId}
                onSelect={onFilterChange(setVoivodeshipId)}
              />
            </section>

            <section aria-label="Filtry" className="border-t border-line pt-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => onFilterChange(setCategoryId)('')}
                  className={categoryId === '' ? '!border-strong !bg-strong !text-on-strong' : ''}
                >
                  Wszystkie
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onFilterChange(setCategoryId)(String(c.id))}
                    className={categoryId === String(c.id) ? '!border-strong !bg-strong !text-on-strong' : ''}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm">
                <select
                  value={voivodeshipId}
                  onChange={(e) => onFilterChange(setVoivodeshipId)(e.target.value)}
                  aria-label="Województwo"
                >
                  <option value="">Cała Polska</option>
                  {voivodeships.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-muted">
                  Od
                  <input type="date" value={from} onChange={(e) => onFilterChange(setFrom)(e.target.value)} />
                </label>
                <label className="flex items-center gap-2 text-muted">
                  Do
                  <input type="date" value={to} onChange={(e) => onFilterChange(setTo)(e.target.value)} />
                </label>
                <select value={sort} onChange={(e) => onFilterChange(setSort)(e.target.value)} aria-label="Sortowanie">
                  <option value="startDate,asc">Data: od najbliższych</option>
                  <option value="startDate,desc">Data: od najdalszych</option>
                  <option value="title,asc">Nazwa: A–Z</option>
                  <option value="title,desc">Nazwa: Z–A</option>
                </select>
                <button onClick={resetFilters} className="btn-ghost ml-auto">Wyczyść filtry</button>
              </div>
            </section>

            <div className="mb-7 mt-12 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-4xl font-semibold leading-tight">Nadchodzące wydarzenia</h2>
              <p className="text-muted">
                {totalElements} {totalElements === 1 ? 'wynik' : 'wyników'}
                {selectedVoivodeship && ` · ${selectedVoivodeship.name}`}
              </p>
            </div>

            {error && <p className="text-red-600">{error}</p>}

            {!error && events.length === 0 && (
              <div className="rounded-3xl border border-dashed border-line px-6 py-16 text-center">
                <p className="font-serif text-2xl">Nic tu jeszcze nie ma</p>
                <p className="mt-2 text-muted">Spróbuj zmienić filtry albo wybrać inny region.</p>
                <button onClick={resetFilters} className="btn-primary mt-6">Wyczyść filtry</button>
              </div>
            )}

            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {events.map((e, i) => (
                <EventCard key={e.id} event={e} index={i} onOpen={openDetails} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button onClick={() => setPage(page - 1)} disabled={page === 0}>
                  ← Poprzednia
                </button>
                <span className="text-sm text-muted">Strona {page + 1} z {totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
                  Następna →
                </button>
              </div>
            )}
          </>
        )}

        {view === 'map' && <MapPage voivodeships={voivodeships} onOpen={openDetails} />}

        {view !== 'events' && view !== 'map' && (
          <div
            className={
              'mx-auto pt-10 ' +
              (['participations', 'new', 'admin', 'details'].includes(view) ? 'max-w-[1440px]' : 'max-w-3xl')
            }
          >
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
                showPreview
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
        )}
      </main>
    </div>
  )
}

export default App
