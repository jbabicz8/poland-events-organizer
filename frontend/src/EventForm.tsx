import { useEffect, useRef, useState } from 'react'
import { api, apiUpload } from './api'
import type { User } from './auth'
import type { EventSummary, ImageItem } from './types'
import EventCard from './EventCard'

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
  websiteUrl?: string | null
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
  showPreview?: boolean
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

function Section({
                   n,
                   title,
                   hint,
                   children,
                 }: {
  n: number
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="mb-6 flex items-start gap-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft font-serif text-lg font-semibold text-accent">
          {n}
        </span>
          <div>
            <h3 className="text-2xl font-semibold leading-tight">{title}</h3>
            {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
          </div>
        </div>
        <div className="space-y-5">{children}</div>
      </section>
  )
}

function Field({
                 label,
                 required,
                 hint,
                 children,
               }: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
      <label className="block">
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-accent">*</span>}
      </span>
        {children}
        {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      </label>
  )
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
                     showPreview = false,
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
  const [websiteUrl, setWebsiteUrl] = useState(initial?.websiteUrl ?? '')
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
    if (websiteUrl.trim() && !/^https?:\/\/\S+\.\S+/i.test(websiteUrl.trim())) {
      return 'Link musi zaczynać się od http:// lub https://'
    }
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
        websiteUrl: websiteUrl.trim() || null,
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

  const previewEvent = {
    id: 0,
    title: title || 'Nazwa twojego wydarzenia',
    city: city || 'Miejscowość',
    startDate: startDate || new Date().toISOString(),
    voivodeship: voivodeships.find((v) => String(v.id) === voivodeshipId)?.name ?? 'Województwo',
    categories: categories.filter((c) => categoryIds.includes(c.id)).map((c) => c.name),
    images: items.slice(0, 1).map((i) => ({ id: 0, url: i.previewUrl })),
    capacity: capacity ? Number(capacity) : null,
    participantCount: 0,
  } as unknown as EventSummary

  return (
      <div>
        <h2 className="text-4xl font-semibold">{heading}</h2>
        <p className="mt-2 text-muted">Pola oznaczone gwiazdką są wymagane.</p>

        <div className={'mt-8 grid items-start gap-8 ' + (showPreview ? 'lg:grid-cols-[1fr_340px]' : '')}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Section n={1} title="Co to za wydarzenie?" hint="Krótko i konkretnie, ludzie przeglądają dużo ofert.">
              {withOrganizerName && (
                  <Field label="Organizator (osoba lub organizacja)" required>
                    <input
                        className="w-full"
                        value={organizerName}
                        onChange={(e) => setOrganizerName(e.target.value)}
                    />
                  </Field>
              )}
              <Field label="Nazwa" required>
                <input
                    className="w-full"
                    placeholder="np. Wieczór jazzowy w Filharmonii"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              <Field label="Opis" hint="Napisz, czego uczestnik może się spodziewać.">
              <textarea
                  rows={5}
                  className="w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
              />
              </Field>
              <Field
                  label="Link do strony lub profilu"
                  hint="Strona wydarzenia, Facebook, sprzedaż biletów. Zacznij od https://"
              >
                <input
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    className="w-full"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </Field>
              <div>
              <span className="mb-2 block text-sm font-medium">
                Kategorie<span className="ml-0.5 text-accent">*</span>
                <span className="ml-2 font-normal text-muted">wybierz jedną lub więcej</span>
              </span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const on = categoryIds.includes(c.id)
                    return (
                        <label
                            key={c.id}
                            className={
                                'cursor-pointer rounded-full border px-4 py-2 text-sm transition ' +
                                (on
                                    ? 'border-strong bg-strong text-on-strong'
                                    : 'border-line bg-surface hover:border-accent')
                            }
                        >
                          <input
                              type="checkbox"
                              className="sr-only"
                              checked={on}
                              onChange={() => toggleCategory(c.id)}
                          />
                          {c.name}
                        </label>
                    )
                  })}
                </div>
              </div>
            </Section>

            <Section n={2} title="Kiedy?">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Rozpoczęcie" required>
                  <input
                      type="datetime-local"
                      className="w-full"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                  />
                </Field>
                <Field label="Zakończenie" hint="Opcjonalnie">
                  <input
                      type="datetime-local"
                      className="w-full"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            <Section n={3} title="Gdzie?">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Miejscowość" required>
                  <input className="w-full" value={city} onChange={(e) => setCity(e.target.value)} />
                </Field>
                <Field label="Województwo" required>
                  <select
                      className="w-full"
                      value={voivodeshipId}
                      onChange={(e) => setVoivodeshipId(e.target.value)}
                  >
                    <option value="">Wybierz...</option>
                    {voivodeships.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Adres" hint="Ulica, numer, nazwa miejsca">
                <input className="w-full" value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
            </Section>

            <Section n={4} title="Ile osób może przyjść?">
              <Field label="Liczba miejsc" hint="Zostaw puste, jeśli nie ma limitu.">
                <input
                    type="number"
                    min={1}
                    className="w-full sm:w-48"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                />
              </Field>
            </Section>

            <Section
                n={5}
                title="Zdjęcia"
                hint={`Do ${MAX_IMAGES} zdjęć (JPG, PNG, WebP, do 10 MB). Pierwsze jest okładką. Przeciągaj miniatury, aby zmienić kolejność.`}
            >
              {items.length > 0 && (
                  <div className="flex flex-wrap gap-3">
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
                            className={
                                'group relative h-28 w-28 cursor-grab overflow-hidden rounded-2xl border-2 transition ' +
                                (index === 0 ? 'border-accent' : 'border-transparent') +
                                (dragIndex === index ? ' opacity-40' : '')
                            }
                        >
                          <img
                              src={item.previewUrl}
                              alt=""
                              draggable={false}
                              className="h-full w-full object-cover"
                          />
                          {index === 0 && (
                              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-accent">
                        Okładka
                      </span>
                          )}
                          <button
                              type="button"
                              onClick={() => removeItem(item)}
                              aria-label="Usuń zdjęcie"
                              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full border-0 bg-black/60 p-0 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            ✕
                          </button>
                          {index > 0 && (
                              <button
                                  type="button"
                                  onClick={() => moveItem(index, 0)}
                                  className="absolute inset-x-1.5 bottom-1.5 rounded-full border-0 bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 transition hover:text-white group-hover:opacity-100"
                              >
                                Ustaw okładkę
                              </button>
                          )}
                        </div>
                    ))}
                  </div>
              )}

              <label
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
                  className={
                      'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ' +
                      (dropActive ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent')
                  }
              >
                {processing ? (
                    <span className="text-muted">Przetwarzanie zdjęć...</span>
                ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="h-8 w-8 text-accent" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                      </svg>
                      <span className="font-medium">Upuść tutaj zdjęcia albo kliknij, aby wybrać</span>
                      <span className="text-xs text-muted">Zdjęcia zmniejszamy automatycznie przed wysłaniem.</span>
                    </>
                )}
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      void addFiles(Array.from(e.target.files ?? []))
                      e.target.value = ''
                    }}
                />
              </label>
            </Section>

            {error && (
                <p className="rounded-2xl bg-red-500/10 px-5 py-4 text-sm text-red-600">{error}</p>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving || processing} className="btn-primary px-8 py-3">
                {saving ? 'Zapisywanie...' : submitLabel}
              </button>
              {onCancel && (
                  <button type="button" onClick={onCancel} className="btn-ghost px-6 py-3">
                    Anuluj
                  </button>
              )}
            </div>
          </form>

          {showPreview && (
              <aside className="hidden lg:sticky lg:top-24 lg:block">
                <p className="mb-3 text-sm font-medium text-muted">Tak zobaczą to inni (podgląd na żywo)</p>
                <EventCard event={previewEvent} index={0} onOpen={() => {}} />
              </aside>
          )}
        </div>
      </div>
  )
}

export default EventForm