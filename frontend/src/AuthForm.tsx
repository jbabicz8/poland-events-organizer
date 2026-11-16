import { useState } from 'react'
import { login, register, type User } from './auth'

type Props = {
    onSuccess: (user: User) => void
}

function AuthForm({ onSuccess }: Props) {
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [asOrganizer, setAsOrganizer] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        // Walidacja po stronie klienta (NF4)
        if (!email.includes('@')) {
            setError('Podaj poprawny adres e-mail')
            return
        }
        if (mode === 'register' && password.length < 8) {
            setError('Hasło musi mieć co najmniej 8 znaków')
            return
        }
        if (mode === 'register' && !displayName.trim()) {
            setError('Podaj nazwę użytkownika.')
            return
        }

        try {
            const user =
                mode === 'login'
                    ? await login(email, password)
                    : await register(email, password, displayName, asOrganizer)
            onSuccess(user)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił błąd')
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxWidth: 320,
                margin: '16px 0',
                padding: 16,
                border: '1px solid #ccc',
                borderRadius: 8,
                background: '#fff',
            }}
        >
            <h2>{mode === 'login' ? 'Logowanie' : 'Rejestracja'}</h2>

            <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            {mode === 'register' && (
                <>
                    <input
                        placeholder="Nazwa wyświetlana"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <label>
                        <input
                            type="checkbox"
                            checked={asOrganizer}
                            onChange={(e) => setAsOrganizer(e.target.checked)}
                        />{' '}
                        Chcę dodawać wydarzenia (konto organizatora)
                    </label>
                </>
            )}

            {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}

            <button type="submit">{mode === 'login' ? 'Zaloguj' : 'Zarejestruj'}</button>

            <button
                type="button"
                onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login')
                    setError(null)
                }}
            >
                {mode === 'login' ? 'Nie mam konta' : 'Mam już konto'}
            </button>
        </form>
    )
}

export default AuthForm