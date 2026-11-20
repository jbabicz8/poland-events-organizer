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
        <div>
            <h3>Kategorie</h3>

            {categories.map((c) => (
                <div
                    key={c.id}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        border: '1px solid #ccc',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8,
                    }}
                >
                    <div>
                        <strong>{c.name}</strong>
                        {c.description && <div>{c.description}</div>}
                    </div>
                    <button onClick={() => startEdit(c)}>Edytuj</button>
                </div>
            ))}

            <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}
            >
                <h3>{editingId === null ? 'Dodaj kategorię' : 'Edytuj kategorię'}</h3>
                <input
                    placeholder="Nazwa *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    placeholder="Opis"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}

                <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit">{editingId === null ? 'Dodaj' : 'Zapisz zmiany'}</button>
                    {editingId !== null && (
                        <button type="button" onClick={resetForm}>
                            Anuluj edycję
                        </button>
                    )}
                </div>
            </form>
        </div>
    )
}

export default CategoriesAdmin