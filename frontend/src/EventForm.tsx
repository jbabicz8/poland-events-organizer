import { useEffect, useRef, useState } from 'react'
import { api, apiUpload } from './api'
import type { User } from './auth'
import type { ImageItem } from './types'

const MAX_IMAGES = 7
const MAX_SIZE = 10 * 1024 * 1024
const MAX_DIMENSION = 1920
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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
    images: ImageItem[]
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

// Jedno zdjęcie na liście: albo już zapisane na serwerze, albo świeżo wybrane z dysku
type PhotoItem = {
    key: string
    existing?: ImageItem
    file?: File
    previewUrl: string
}

// Zmniejsza zdjęcie do JPEG o dłuższym boku max 1920 px.
// Przy okazji usuwa dane EXIF (np. lokalizację GPS) i uwzględnia obrót zdjęcia z telefonu.
async function compressImage(file: File): Promise<File> {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Brak obsługi canvas')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85),
    )
    if (!blob) throw new Error('Nie udało się zapisać zdjęcia')

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
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

    // Zdjęcia
    const [items, setItems] = useState<PhotoItem[]>(() =>
        (initial?.images ?? []).map((img) => ({
            key: 'e' + img.id,
            existing: img,
            previewUrl: img.url,
        })),
    )
    const [orderDirty, setOrderDirty] = useState(false)
    const [dragIndex, setDragIndex] = useState<number | null>(null)
    const [dropActive, setDropActive] = useState(false)
    const [processing, setProcessing] = useState(false)

    // Przy zamknięciu formularza zwalniamy podglądy świeżo wybranych zdjęć
    const itemsRef = useRef(items)
    useEffect(() => {
        itemsRef.current = items
    }, [items])
    useEffect(() => {
        return () => {
            itemsRef.current.forEach((i) => {
                if (i.file) URL.revokeObjectURL(i.previewUrl)
            })
        }
    }, [])

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

    async function addFiles(files: File[]) {
        if (files.length === 0) return

        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                setError(
                    `"${file.name}": dozwolone formaty to JPG, PNG i WebP (zdjęcia HEIC z iPhone'a zamień na JPG)`,
                )
                return
            }
            if (file.size > MAX_SIZE) {
                setError(`"${file.name}": zdjęcie może mieć maksymalnie 10 MB`)
                return
            }
        }
        if (items.length + files.length > MAX_IMAGES) {
            setError(`Wydarzenie może mieć maksymalnie ${MAX_IMAGES} zdjęć`)
            return
        }

        setError(null)
        setProcessing(true)
        try {
            const compressed = await Promise.all(files.map(compressImage))
            setItems((current) => [
                ...current,
                ...compressed.map((file) => ({
                    key: crypto.randomUUID(),
                    file,
                    previewUrl: URL.createObjectURL(file),
                })),
            ])
        } catch {
            setError('Nie udało się przetworzyć zdjęcia. Spróbuj użyć pliku JPG, PNG lub WebP.')
        } finally {
            setProcessing(false)
        }
    }

    function moveItem(from: number, to: number) {
        if (from === to) return
        setItems((current) => {
            const copy = [...current]
            const [moved] = copy.splice(from, 1)
            copy.splice(to, 0, moved)
            return copy
        })
        setOrderDirty(true)
    }

    async function removeItem(item: PhotoItem) {
        if (item.existing) {
            if (!initial) return
            try {
                await api(user, `/api/events/${initial.id}/images/${item.existing.id}`, 'DELETE')
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Wystąpił błąd')
                return
            }
        } else {
            URL.revokeObjectURL(item.previewUrl)
        }
        setItems((current) => current.filter((i) => i.key !== item.key))
        setError(null)
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
            const saved = await api<{ id: number }>(
                user,
                url,
                method,
                withOrganizerName ? { organizerName, event: eventData } : eventData,
            )

            // Wydarzenie jest zapisane. Wysyłamy nowe zdjęcia i ustawiamy kolejność z listy.
            const eventId = initial?.id ?? saved.id
            const failures: string[] = []
            const finalIds: number[] = []
            let uploadedAny = false

            for (const item of items) {
                if (item.existing) {
                    finalIds.push(item.existing.id)
                } else if (item.file) {
                    try {
                        const uploaded = await apiUpload<ImageItem>(
                            user,
                            `/api/events/${eventId}/images`,
                            item.file,
                        )
                        finalIds.push(uploaded.id)
                        uploadedAny = true
                    } catch (err) {
                        failures.push(`${item.file.name}: ${err instanceof Error ? err.message : 'błąd'}`)
                    }
                }
            }

            if (finalIds.length > 1 && (uploadedAny || orderDirty)) {
                try {
                    await api(user, `/api/events/${eventId}/images/order`, 'PUT', { imageIds: finalIds })
                } catch (err) {
                    failures.push(
                        'Kolejność zdjęć: ' + (err instanceof Error ? err.message : 'błąd'),
                    )
                }
            }

            if (failures.length > 0) {
                window.alert(
                    'Wydarzenie zapisano, ale nie wszystko udało się zapisać:\n' +
                    failures.join('\n') +
                    '\nMożesz poprawić to, edytując wydarzenie.',
                )
            }

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

            <fieldset>
                <legend>
                    Zdjęcia (do {MAX_IMAGES}, JPG/PNG/WebP, do 10 MB każde)
                </legend>

                <p style={{ marginTop: 0 }}>
                    Pierwsze zdjęcie jest okładką. Przeciągaj miniatury, aby zmienić kolejność.
                    Zdjęcia są automatycznie zmniejszane przed wysłaniem.
                </p>

                {items.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                        {items.map((item, index) => (
                            <div
                                key={item.key}
                                draggable
                                onDragStart={() => setDragIndex(index)}
                                onDragEnd={() => setDragIndex(null)}
                                onDragOver={(e) => {
                                    if (dragIndex !== null) e.preventDefault()
                                }}
                                onDrop={(e) => {
                                    if (dragIndex !== null) {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        moveItem(dragIndex, index)
                                        setDragIndex(null)
                                    }
                                }}
                                style={{
                                    width: 100,
                                    textAlign: 'center',
                                    cursor: 'grab',
                                    opacity: dragIndex === index ? 0.4 : 1,
                                    border: index === 0 ? '2px solid #1d4ed8' : '2px solid transparent',
                                    borderRadius: 6,
                                    padding: 2,
                                }}
                            >
                                <img
                                    src={item.previewUrl}
                                    alt=""
                                    draggable={false}
                                    style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 4 }}
                                />
                                <div style={{ fontSize: 12, minHeight: 16 }}>
                                    {index === 0 ? 'Okładka' : ''}
                                </div>
                                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                    {index > 0 && (
                                        <button type="button" onClick={() => moveItem(index, 0)}>
                                            Okładka
                                        </button>
                                    )}
                                    <button type="button" onClick={() => removeItem(item)}>
                                        Usuń
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div
                    onDragOver={(e) => {
                        if (dragIndex === null) {
                            e.preventDefault()
                            setDropActive(true)
                        }
                    }}
                    onDragLeave={() => setDropActive(false)}
                    onDrop={(e) => {
                        if (dragIndex !== null) return
                        e.preventDefault()
                        setDropActive(false)
                        void addFiles(Array.from(e.dataTransfer.files))
                    }}
                    style={{
                        border: '2px dashed ' + (dropActive ? '#1d4ed8' : '#999'),
                        background: dropActive ? '#eef2ff' : 'transparent',
                        borderRadius: 8,
                        padding: 16,
                        textAlign: 'center',
                    }}
                >
                    {processing ? (
                        <p style={{ margin: 0 }}>Przetwarzanie zdjęć...</p>
                    ) : (
                        <>
                            <p style={{ margin: '0 0 8px' }}>Upuść tutaj zdjęcia albo wybierz je z dysku</p>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={(e) => {
                                    void addFiles(Array.from(e.target.files ?? []))
                                    e.target.value = ''
                                }}
                            />
                        </>
                    )}
                </div>
            </fieldset>

            {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving || processing}>
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