import { useRef, useState } from 'react'
import PolandMap from './PolandMap'
import type { EventSummary } from './types'

type Voivodeship = {
  id: number
  name: string
  mapCode: string
}

type Props = {
  voivodeships: Voivodeship[]
  onOpen: (id: number) => void
}

function MapPage({ voivodeships, onOpen }: Props) {
  const [selectedId, setSelectedId] = useState('')
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(false)
  const lastRequest = useRef(0)

  const selected = voivodeships.find((v) => String(v.id) === selectedId)

  function select(id: string) {
    setSelectedId(id)
    const requestId = ++lastRequest.current
    if (!id) {
      setEvents([])
      return
    }
    setLoading(true)
    fetch(`/api/events?voivodeshipId=${id}&sort=startDate,asc&size=50`)
      .then((r) => r.json())
      .then((d) => {
        if (requestId === lastRequest.current) setEvents(d.content)
      })
      .catch(() => {
        if (requestId === lastRequest.current) setEvents([])
      })
      .finally(() => {
        if (requestId === lastRequest.current) setLoading(false)
      })
  }

  return (
    <div className="py-10">
      <h1 className="text-5xl font-semibold">Mapa wydarzeń</h1>
      <p className="mt-2 text-lg text-muted">Kliknij województwo, aby zobaczyć, co się w nim dzieje.</p>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="lg:sticky lg:top-24">
          <PolandMap voivodeships={voivodeships} selectedId={selectedId} onSelect={select} large />
        </div>

        <aside className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          {!selected ? (
            <div className="py-12 text-center">
              <p className="font-serif text-2xl">Wybierz województwo</p>
              <p className="mt-2 text-muted">Lista wydarzeń pojawi się tutaj.</p>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-semibold">{selected.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {loading ? 'Szukam...' : `${events.length} ${events.length === 1 ? 'wydarzenie' : 'wydarzeń'}`}
              </p>

              {!loading && events.length === 0 && (
                <p className="mt-8 rounded-2xl border border-dashed border-line px-4 py-10 text-center text-muted">
                  W tym województwie nie ma jeszcze wydarzeń.
                </p>
              )}

              <div key={selectedId} className="mt-6 space-y-3">
                {events.map((e, i) => {
                  const d = new Date(e.startDate)
                  return (
                    <button
                      key={e.id}
                      onClick={() => onOpen(e.id)}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className="animate-rise flex w-full items-center gap-4 rounded-2xl border-line p-3 text-left hover:-translate-y-0.5"
                    >
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-accent-soft text-center leading-tight text-accent">
                        <span>
                          <b className="block font-serif text-lg">{String(d.getDate()).padStart(2, '0')}</b>
                          <span className="text-[10px] font-semibold uppercase tracking-widest">
                            {d.toLocaleString('pl-PL', { month: 'short' }).replace('.', '')}
                          </span>
                        </span>
                      </span>
                      <span className="min-w-0">
                        <b className="block truncate font-serif text-lg font-semibold text-ink">{e.title}</b>
                        <span className="block truncate text-sm font-normal text-muted">
                          {e.city}
                          {e.categories[0] ? ` · ${e.categories[0]}` : ''}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

export default MapPage
