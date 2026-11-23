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

function time(d: Date) {
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

function EventDetailsView({ eventId, user, participating, onParticipationChange, onBack }: Props) {
  const [event, setEvent] = useState<EventSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    fetch('/api/events/' + eventId)
        .then((res) => {
          if (!res.ok) throw new Error('Błąd ' + res.status + ' przy pobieraniu wydarzenia')
          return res.json()
        })
        .then(setEvent)
        .catch((e) => setError(e.message))
  }, [eventId])

  const imageCount = event?.images?.length ?? 0

  function showPrev() {
    setActiveImage((i) => (i - 1 + imageCount) % imageCount)
  }
  function showNext() {
    setActiveImage((i) => (i + 1) % imageCount)
  }

  useEffect(() => {
    if (imageCount < 2) return
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowLeft') setActiveImage((i) => (i - 1 + imageCount) % imageCount)
      if (e.key === 'ArrowRight') setActiveImage((i) => (i + 1) % imageCount)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [imageCount])

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

  const backButton = (
      <button onClick={onBack} className="btn-ghost mb-6">
        ← Wróć do listy
      </button>
  )

  if (!event) {
    return (
        <div className="mx-auto max-w-[1440px]">
          {backButton}
          {error ? (
              <p className="text-red-600">{error}</p>
          ) : (
              <div className="animate-pulse">
                <div className="aspect-[3/2] rounded-3xl bg-line" />
                <div className="mt-8 h-10 w-2/3 rounded-xl bg-line" />
                <div className="mt-4 h-5 w-1/3 rounded-xl bg-line" />
              </div>
          )}
        </div>
    )
  }

  const start = new Date(event.startDate)
  const end = event.endDate ? new Date(event.endDate) : null
  const dateLabel = start.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  let timeLabel = time(start)
  if (end) {
    timeLabel +=
        end.toDateString() === start.toDateString()
            ? ` – ${time(end)}`
            : ` – ${end.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}, ${time(end)}`
  }

  const started = start <= new Date()
  const canParticipate = user?.role === 'USER'
  const count = event.participantCount ?? 0
  const full = event.capacity != null && count >= event.capacity
  const percent = event.capacity ? Math.min(100, Math.round((count / event.capacity) * 100)) : 0
  const images = event.images ?? []
  const current = images[Math.min(activeImage, images.length - 1)]

  // Adres do wyszukania w Google Maps (bez klucza API)
  const mapQuery = encodeURIComponent(
      [event.address, event.city, event.voivodeship, 'Polska'].filter(Boolean).join(', '),
  )
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`
  const mapEmbed = `https://www.google.com/maps?q=${mapQuery}&output=embed`

  // Link organizatora pokazujemy tylko, jeśli to na pewno http(s) (ochrona przed javascript: itp.)
  let websiteHost: string | null = null
  if (event.websiteUrl && /^https?:\/\//i.test(event.websiteUrl)) {
    try {
      websiteHost = new URL(event.websiteUrl).hostname.replace(/^www\./, '')
    } catch {
      websiteHost = null
    }
  }

  return (
      <div className="mx-auto max-w-[1440px]">
        {backButton}

        <div className="grid items-start gap-10 lg:grid-cols-[2.2fr_1fr]">
          <div className="animate-rise">
            {current ? (
                <>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-line sm:aspect-[3/2]">
                    <img
                        key={current.id}
                        src={current.url}
                        alt={event.title}
                        className="animate-rise h-full w-full object-cover"
                    />
                    {images.length > 1 && (
                        <>
                          <button
                              onClick={showPrev}
                              aria-label="Poprzednie zdjęcie"
                              className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border-0 bg-black/50 p-0 text-white backdrop-blur transition hover:scale-110 hover:bg-black/70 hover:text-white"
                          >
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 5l-7 7 7 7" />
                            </svg>
                          </button>
                          <button
                              onClick={showNext}
                              aria-label="Następne zdjęcie"
                              className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border-0 bg-black/50 p-0 text-white backdrop-blur transition hover:scale-110 hover:bg-black/70 hover:text-white"
                          >
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <span className="absolute bottom-4 right-4 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      {Math.min(activeImage, images.length - 1) + 1} / {images.length}
                    </span>
                        </>
                    )}
                  </div>
                  {images.length > 1 && (
                      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                        {images.map((img, i) => (
                            <button
                                key={img.id}
                                onClick={() => setActiveImage(i)}
                                aria-label={`Zdjęcie ${i + 1}`}
                                className={
                                    'h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 p-0 ' +
                                    (i === activeImage ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100')
                                }
                            >
                              <img src={img.url} alt="" className="h-full w-full object-cover" />
                            </button>
                        ))}
                      </div>
                  )}
                </>
            ) : (
                <div
                    className="grid aspect-[4/3] place-items-center rounded-3xl p-8 text-center sm:aspect-[3/2]"
                    style={{ background: 'linear-gradient(135deg,#b4432b,#e9a15a)' }}
                >
                  <span className="font-serif text-4xl font-semibold text-white drop-shadow">{event.title}</span>
                </div>
            )}

            <div className="mt-8 flex flex-wrap gap-2">
              {event.categories.map((c) => (
                  <span key={c} className="rounded-full bg-accent-soft px-4 py-1.5 text-sm font-medium text-accent">
                {c}
              </span>
              ))}
            </div>

            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{event.title}</h1>

            {event.description ? (
                <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-ink/85">{event.description}</p>
            ) : (
                <p className="mt-6 text-muted">Organizator nie dodał jeszcze opisu.</p>
            )}
          </div>

          <aside
              style={{ animationDelay: '120ms' }}
              className="animate-rise rounded-3xl border border-line bg-surface p-6 shadow-xl shadow-black/5 sm:p-8 lg:sticky lg:top-24"
          >
            <dl className="space-y-5">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted">Kiedy</dt>
                <dd className="mt-1 font-serif text-xl first-letter:uppercase">{dateLabel}</dd>
                <dd className="text-muted">{timeLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted">Gdzie</dt>
                <dd className="mt-1 font-serif text-xl">{event.city}</dd>
                <dd className="text-muted">
                  {event.address ? `${event.address}, ` : ''}
                  {event.voivodeship}
                </dd>
                <dd className="mt-3 flex flex-wrap gap-2">
                  <a
                      href={mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-bg px-4 py-2 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="currentColor" aria-hidden="true">
                      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
                    </svg>
                    Otwórz w Google Maps
                  </a>
                  <button
                      onClick={() => setShowMap(!showMap)}
                      className="btn-ghost text-sm"
                      aria-expanded={showMap}
                  >
                    {showMap ? 'Ukryj podgląd' : 'Pokaż podgląd'}
                  </button>
                </dd>
                {showMap && (
                    <dd className="animate-rise mt-3 overflow-hidden rounded-2xl border border-line">
                      <iframe
                          title={`Mapa: ${event.city}`}
                          src={mapEmbed}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="h-56 w-full"
                      />
                    </dd>
                )}
              </div>
              {event.organizerName && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-widest text-muted">Organizator</dt>
                    <dd className="mt-1">{event.organizerName}</dd>
                  </div>
              )}
              {websiteHost && event.websiteUrl && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-widest text-muted">Więcej informacji</dt>
                    <dd className="mt-2">
                      <a
                          href={event.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-bg px-4 py-2 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
                        </svg>
                        <span className="truncate">{websiteHost}</span>
                      </a>
                    </dd>
                  </div>
              )}
            </dl>

            <div className="mt-6 border-t border-dashed border-line pt-6">
              <div className="flex items-end justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted">Chętni</span>
                <span className="font-serif text-lg">
                {count}
                  {event.capacity != null && <span className="text-muted"> / {event.capacity}</span>}
              </span>
              </div>
              {event.capacity != null && (
                  <>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-accent-2 transition-all duration-700" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {full ? 'Brak wolnych miejsc' : `Wolnych miejsc: ${event.capacity - count}`}
                    </p>
                  </>
              )}
            </div>

            <div className="mt-6">
              {started ? (
                  <p className="rounded-2xl bg-line/60 px-4 py-3 text-sm text-muted">
                    Wydarzenie już się rozpoczęło.
                    {participating && ' Zadeklarowałeś w nim udział.'}
                  </p>
              ) : !user ? (
                  <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent">
                    Zaloguj się, aby zadeklarować udział w wydarzeniu.
                  </p>
              ) : canParticipate ? (
                  <button
                      onClick={toggleParticipation}
                      disabled={busy || (full && !participating)}
                      className={participating ? 'btn-ghost w-full py-3' : 'btn-primary w-full py-3'}
                  >
                    {busy
                        ? 'Chwileczkę...'
                        : participating
                            ? 'Wycofaj udział'
                            : full
                                ? 'Brak wolnych miejsc'
                                : 'Biorę udział'}
                  </button>
              ) : (
                  <p className="rounded-2xl bg-line/60 px-4 py-3 text-sm text-muted">
                    Konta organizatora i administratora nie zapisują się na wydarzenia.
                  </p>
              )}
              {participating && !started && (
                  <p className="mt-3 text-center text-sm text-green-700 dark:text-green-400">
                    ✓ Bierzesz udział w tym wydarzeniu
                  </p>
              )}
              {error && <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>}
            </div>
          </aside>
        </div>
      </div>
  )
}

export default EventDetailsView