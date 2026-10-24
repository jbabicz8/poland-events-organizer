import { useEffect, useState } from 'react'

type EventItem = {
  id: number
  title: string
  city: string
  startDate: string
  voivodeship: string
  categories: string[]
}

type EventsPage = {
  content: EventItem[]
}

function App() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/events')
        .then((res) => {
          if (!res.ok) throw new Error('Błąd serwera: ' + res.status)
          return res.json()
        })
        .then((data: EventsPage) => setEvents(data.content))
        .catch((e) => setError(e.message))
  }, [])

  if (error) return <p>{error}</p>

  return (
      <div style={{ maxWidth: 700, margin: '40px auto', padding: 16 }}>
        <h1>Wydarzenia w Polsce</h1>
        {events.map((e) => (
            <div
                key={e.id}
                style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 12 }}
            >
              <h2>{e.title}</h2>
              <p>
                {e.city}, {e.voivodeship}
              </p>
              <p>{new Date(e.startDate).toLocaleString('pl-PL')}</p>
              <p>{e.categories.join(', ')}</p>
            </div>
        ))}
      </div>
  )
}

export default App