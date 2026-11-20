import { useState } from 'react'
import { api } from './api'
import type { User } from './auth'

type Option = {
    id: number
    name: string
}

export type EventFormData = {
    id: number
    title: string
    description: string | null
    startDate: string
    endDate: string | null
    city: string
    address: string | null
    voivodeshipId: number | null
    categoryIds: number[]
    capacity: number | null
}

type Props = {
    user: User
    voivodeships: Option[]
    categories: Option[]
    initial?: EventFormData
    url: string
    method: 'POST' | 'PUT'
    heading: string
    submitLabel: string
    withOrganizerName?: boolean
    onDone: () => void
    onCancel?: () => void
}

function EventForm({
                       user,
                       voivodeships,
                       categories,
                       initial,
                       url,
                       method,
                       heading,
                       submitLabel,
                       withOrganizerName = false,
                       onDone,
                       onCancel,
                   }: Props) {
    const [organizerName, setOrganizerName] = useState('')
    const [title, setTitle] = useState(initial?.title ?? '')
    const [description, setDescription] = useState(initial?.description ?? '')
    const [startDate, setStartDate] = useState(initial?.startDate.slice(0, 16) ?? '')
    const [endDate, setEndDate] = useState(initial?.endDate?.slice(0, 16) ?? '')
    const [city, setCity] = useState(initial?.city ?? '')
    const [address, setAddress] = useState(initial?.address ?? '')
    const [voivodeshipId, setVoivodeshipId] = useState(
        initial?.voivodeshipId ? String(initial.voivodeshipId) : '',
    )
    const [categoryIds, setCategoryIds] = useState<number[]>(initial?.categoryIds ?? [])
    const [capacity, setCapacity] = useState(
        initial?.capacity != null ? String(initial.capacity) : '',
    )
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    function toggleCategory(id: number) {
        setCategoryIds((current) =>
            current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
        )
    }

    // Walidacja po stronie klienta (NF4). Zwraca komunikat błędu albo null.
    function validate(): string | null {
        if (withOrganizerName && !organizerName.trim()) return 'Podaj nazwę organizatora'
        if (!title.trim()) return 'Podaj nazwę wydarzenia'
        if (!startDate) return 'Podaj datę rozpoczęcia'
        if (endDate && endDate < startDate) {
            return 'Data zakończenia nie może być wcześniejsza niż rozpoczęcia'
        }
        if (!city.trim()) return 'Podaj miejscowość'
        if (!voivodeshipId) return 'Wybierz województwo'
        if (categoryIds.length === 0) return 'Wybierz co najmniej jedną kategorię'
        if (capacity) {
            const n = Number(capacity)
            if (!Number.isInteger(n) || n < 1) {
                return 'Liczba miejsc musi być liczbą całkowitą większą od zera'
            }
        }
        return null
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const problem = validate()
        if (problem) {
            setError(problem)
            return
        }

        setError(null)
        setSaving(true)
        try {
            const eventData = {
                title,
                description,
                startDate,
                endDate: endDate || null,
                city,
                address,
                voivodeshipId: Number(voivodeshipId),
                categoryIds,
                capacity: capacity ? Number(capacity) : null,
            }
            await api(
                user,
                url,
                method,
                withOrganizerName ? { organizerName, event: eventData } : eventData,
            )
            onDone()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił błąd')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
            <h2>{heading}</h2>

            {withOrganizerName && (
                <label>
                    Organizator (nazwa osoby lub organizacji) *
                    <input
                        style={{ width: '100%' }}
                        value={organizerName}
                        onChange={(e) => setOrganizerName(e.target.value)}
                    />
                </label>
            )}

            <label>
                Nazwa *
                <input
                    style={{ width: '100%' }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </label>

            <label>
                Opis
                <textarea
                    rows={4}
                    style={{ width: '100%' }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </label>

            <label>
                Rozpoczęcie *
                <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </label>

            <label>
                Zakończenie
                <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </label>

            <label>
                Miejscowość *
                <input
                    style={{ width: '100%' }}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                />
            </label>

            <label>
                Adres
                <input
                    style={{ width: '100%' }}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />
            </label>

            <label>
                Województwo *
                <select value={voivodeshipId} onChange={(e) => setVoivodeshipId(e.target.value)}>
                    <option value="">Wybierz...</option>
                    {voivodeships.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                </select>
            </label>

            <label>
                Liczba miejsc (zostaw puste, jeśli bez limitu)
                <input
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                />
            </label>

            <fieldset>
                <legend>Kategorie * (wybierz jedną lub więcej)</legend>
                {categories.map((c) => (
                    <label key={c.id} style={{ display: 'block' }}>
                        <input
                            type="checkbox"
                            checked={categoryIds.includes(c.id)}
                            onChange={() => toggleCategory(c.id)}
                        />{' '}
                        {c.name}
                    </label>
                ))}
            </fieldset>

            {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>
                    {saving ? 'Zapisywanie...' : submitLabel}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel}>
                        Anuluj
                    </button>
                )}
            </div>
        </form>
    )
}

export default EventForm