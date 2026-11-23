import { useEffect, useState } from 'react'
import { api } from './api'
import CategoriesAdmin from './CategoriesAdmin'
import EventForm from './EventForm'
import StatusBadge from './StatusBadge'
import type { User } from './auth'
import type { ImageItem } from './types'

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
  images: ImageItem[]
}

type Tab = 'pending' | 'all' | 'add' | 'categories'

type Props = {
  user: User
  voivodeships: Option[]
  categories: Option[]
  onCategoriesChanged: () => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'pending', label: 'Oczekujące' },
  { id: 'all', label: 'Wszystkie wydarzenia' },
  { id: 'add', label: 'Dodaj wydarzenie' },
  { id: 'categories', label: 'Kategorie' },
]

function AdminPanel({ user, voivodeships, categories, onCategoriesChanged }: Props) {
  const [tab, setTab] = useState<Tab>('pending')
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
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
      .finally(() => setLoaded(true))
  }, [user, tab, reload])

  function changeTab(t: Tab) {
    setTab(t)
    setLoaded(false)
    setError(null)
    setRejectingId(null)
  }

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
      <h2 className="text-4xl font-semibold">Panel administratora</h2>
      <p className="mt-2 text-muted">Moderuj zgłoszenia, zarządzaj wydarzeniami i kategoriami.</p>

      <div className="mt-6 inline-flex max-w-full flex-wrap gap-1 rounded-full border border-line bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => changeTab(t.id)}
            className={
              'rounded-full border-0 ' +
              (tab === t.id ? 'bg-strong text-on-strong hover:text-on-strong' : 'bg-transparent text-muted')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
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
            showPreview
            onDone={() => {
              changeTab('all')
              setReload((r) => r + 1)
            }}
          />
        )}

        {tab === 'categories' && <CategoriesAdmin user={user} onChanged={onCategoriesChanged} />}

        {(tab === 'pending' || tab === 'all') && (
          <>
            {error && <p className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>}

            {loaded && events.length === 0 && !error && (
              <div className="rounded-3xl border border-dashed border-line px-6 py-16 text-center">
                <p className="font-serif text-2xl">
                  {tab === 'pending' ? 'Wszystko przejrzane' : 'Brak wydarzeń'}
                </p>
                <p className="mt-2 text-muted">
                  {tab === 'pending' ? 'Nie ma zgłoszeń czekających na weryfikację.' : 'Nic tu jeszcze nie ma.'}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {events.map((e, i) => {
                const d = new Date(e.startDate)
                return (
                  <article
                    key={e.id}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className="animate-rise rounded-3xl border border-line bg-surface p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row">
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
                        <h3 className="mt-2 text-2xl font-semibold leading-tight">{e.title}</h3>
                        <p className="mt-1 text-sm text-muted">
                          {e.city}, {e.voivodeship}
                          {e.address ? ` — ${e.address}` : ''}
                          {e.categories.length > 0 && ` · ${e.categories.join(', ')}`}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          Organizator: <span className="text-ink">{e.organizer ?? 'brak danych'}</span> · Chętnych:{' '}
                          {e.participantCount}
                          {e.capacity != null && ` / ${e.capacity}`}
                        </p>
                        {e.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-ink/80">{e.description}</p>
                        )}
                        {e.status === 'REJECTED' && e.rejectionReason && (
                          <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                            <b>Powód odrzucenia:</b> {e.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-dashed border-line pt-4">
                      {rejectingId === e.id ? (
                        <div className="flex flex-wrap gap-3">
                          <input
                            autoFocus
                            placeholder="Powód odrzucenia (zobaczy go organizator)"
                            value={reason}
                            onChange={(ev) => setReason(ev.target.value)}
                            className="min-w-[220px] flex-1"
                          />
                          <button onClick={() => reject(e.id)} className="btn-primary">
                            Potwierdź odrzucenie
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null)
                              setReason('')
                            }}
                            className="btn-ghost"
                          >
                            Anuluj
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {e.status === 'PENDING' && (
                            <>
                              <button onClick={() => approve(e.id)} className="btn-primary">
                                Zatwierdź
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingId(e.id)
                                  setReason('')
                                  setError(null)
                                }}
                                className="btn-ghost"
                              >
                                Odrzuć
                              </button>
                            </>
                          )}
                          <button onClick={() => setEditing(e)} className="btn-ghost">
                            Edytuj
                          </button>
                          <button
                            onClick={() => remove(e.id)}
                            className="btn-ghost ml-auto text-red-600 hover:border-red-500 hover:text-red-600"
                          >
                            Usuń
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminPanel
