import { useState } from 'react'
import { forgotPassword, login, register, type User } from './auth'

type Props = {
    onSuccess: (user: User) => void
}

type Mode = 'login' | 'register' | 'forgot'

function AuthForm({ onSuccess }: Props) {
    const [mode, setMode] = useState<Mode>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [asOrganizer, setAsOrganizer] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [info, setInfo] = useState<string | null>(null)

    function changeMode(newMode: Mode) {
        setMode(newMode)
        setError(null)
        setInfo(null)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setInfo(null)

        // Walidacja po stronie klienta (NF4)
        if (!email.includes('@')) {
            setError('Podaj poprawny adres e-mail')
            return
        }

        if (mode === 'forgot') {
            try {
                await forgotPassword(email)
                setInfo('Jeśli konto o takim adresie istnieje, wysłaliśmy na nie link do zmiany hasła.')
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Wystąpił błąd')
            }
            return
        }

        if (mode === 'register' && password.length < 8) {
            setError('Hasło musi mieć co najmniej 8 znaków')
            return
        }
        if (mode === 'register' && !displayName.trim()) {
            setError('Podaj nazwę użytkownika')
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
            <h2>
                {mode === 'login' && 'Logowanie'}
                {mode === 'register' && 'Rejestracja'}
                {mode === 'forgot' && 'Odzyskiwanie hasła'}
            </h2>

            <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            {mode !== 'forgot' && (
                <input
                    type="password"
                    placeholder="Hasło"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            )}

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
            {info && <p style={{ color: 'green', margin: 0 }}>{info}</p>}

            <button type="submit">
                {mode === 'login' && 'Zaloguj'}
                {mode === 'register' && 'Zarejestruj'}
                {mode === 'forgot' && 'Wyślij link do zmiany hasła'}
            </button>

            {mode === 'login' && (
                <button type="button" onClick={() => changeMode('forgot')}>
                    Nie pamiętam hasła
                </button>
            )}

            <button
                type="button"
                onClick={() => changeMode(mode === 'register' ? 'login' : mode === 'login' ? 'register' : 'login')}
            >
                {mode === 'login' ? 'Nie mam konta' : mode === 'register' ? 'Mam już konto' : 'Wróć do logowania'}
            </button>
        </form>
    )
}

export default AuthForm