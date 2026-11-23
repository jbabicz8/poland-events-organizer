import type { EventSummary } from './types'

const GRADIENTS = [
    'linear-gradient(135deg,#b4432b,#e9a15a)',
    'linear-gradient(135deg,#3b1f1a,#8a4a3a 60%,#d98a3d)',
    'linear-gradient(135deg,#5b6b4a,#c9b36a)',
    'linear-gradient(135deg,#7a3b52,#e0a08a)',
    'linear-gradient(135deg,#2d4a5a,#d98a3d)',
    'linear-gradient(135deg,#a8552f,#f1c27d)',
]

type Props = {
    event: EventSummary
    index: number
    onOpen: (id: number) => void
}

function EventCard({ event, index, onOpen }: Props) {
    const date = new Date(event.startDate)
    const cover = event.images?.[0]?.url
    const count = event.participantCount ?? 0
    const full = event.capacity != null && count >= event.capacity
    const percent = event.capacity ? Math.min(100, Math.round((count / event.capacity) * 100)) : 0

    return (
        <article
            onClick={() => onOpen(event.id)}
            style={{ animationDelay: `${index * 80}ms` }}
            className="animate-rise group cursor-pointer overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/20"
        >
            <div className="relative h-52 overflow-hidden">
                {cover ? (
                    <img
                        src={cover}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div
                        className="h-full w-full transition duration-700 group-hover:scale-105"
                        style={{ background: GRADIENTS[event.id % GRADIENTS.length] }}
                    />
                )}
                <div className="absolute left-4 top-4 rounded-2xl bg-surface px-3 py-1.5 text-center leading-tight shadow-lg">
                    <b className="block font-serif text-xl">{String(date.getDate()).padStart(2, '0')}</b>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-accent">
            {date.toLocaleString('pl-PL', { month: 'short' }).replace('.', '')}
          </span>
                </div>
                {event.categories[0] && (
                    <span className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
            {event.categories[0]}
          </span>
                )}
            </div>

            <div className="p-6">
                <h3 className="text-[22px] font-semibold leading-snug">{event.title}</h3>
                <p className="mt-2 text-sm text-muted">
                    {event.city} · {event.voivodeship}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-dashed border-line pt-4 text-sm">
                    <div className="flex items-center gap-2.5 text-muted">
                        {event.capacity ? (
                            <>
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line">
                                    <div className="h-full rounded-full bg-accent-2" style={{ width: `${percent}%` }} />
                                </div>
                                {full ? 'Brak miejsc' : `${count} / ${event.capacity}`}
                            </>
                        ) : (
                            <>{count} chętnych</>
                        )}
                    </div>
                    <span className="font-semibold text-accent">Szczegóły →</span>
                </div>
            </div>
        </article>
    )
}

export default EventCard