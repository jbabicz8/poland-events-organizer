import { useEffect, useState } from 'react'
import { api } from './api'
import type { User } from './auth'

type Category = {
  id: number
  name: string
  description: string | null
}

type Props = {
  user: User
  onChanged: () => void
}

function CategoriesAdmin({ user, onChanged }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  // editingId === null oznacza dodawanie nowej kategorii
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    api<Category[]>(user, '/api/admin/categories')
      .then(setCategories)
      .catch((e) => setError(e.message))
  }, [user, reload])

  function startEdit(c: Category) {
    setEditingId(c.id)
    setName(c.name)
    setDescription(c.description ?? '')
    setError(null)
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setDescription('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setError('Podaj nazwę kategorii')
      return
    }

    try {
      if (editingId === null) {
        await api(user, '/api/admin/categories', 'POST', { name, description })
      } else {
        await api(user, `/api/admin/categories/${editingId}`, 'PUT', { name, description })
      }
      setError(null)
      resetForm()
      setReload((r) => r + 1)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-3">
        {categories.map((c) => (
          <div
            key={c.id}
            className={
              'flex items-center justify-between gap-4 rounded-2xl border bg-surface p-4 ' +
              (editingId === c.id ? 'border-accent' : 'border-line')
            }
          >
            <div className="min-w-0">
              <b className="font-serif text-lg">{c.name}</b>
              {c.description && <p className="truncate text-sm text-muted">{c.description}</p>}
            </div>
            <button onClick={() => startEdit(c)} className="btn-ghost shrink-0">
              Edytuj
            </button>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-line bg-surface p-6 lg:sticky lg:top-24"
      >
        <h3 className="text-2xl font-semibold">
          {editingId === null ? 'Dodaj kategorię' : 'Edytuj kategorię'}
        </h3>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Nazwa<span className="ml-0.5 text-accent">*</span>
          </span>
          <input className="w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Opis</span>
          <input className="w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            {editingId === null ? 'Dodaj' : 'Zapisz zmiany'}
          </button>
          {editingId !== null && (
            <button type="button" onClick={resetForm} className="btn-ghost">
              Anuluj edycję
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default CategoriesAdmin
