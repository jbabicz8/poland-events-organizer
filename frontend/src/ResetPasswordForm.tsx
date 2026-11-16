import { useState } from 'react'
import { resetPassword } from './auth'

type Props = {
    token: string
    onDone: () => void
}

function ResetPasswordForm({ token, onDone }: Props) {
    const [password, setPassword] = useState('')
    const [repeat, setRepeat] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (password.length < 8) {
            setError('Hasło musi mieć co najmniej 8 znaków')
            return
        }
        if (password !== repeat) {
            setError('Hasła nie są takie same')
            return
        }

        try {
            await resetPassword(token, password)
            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił błąd')
        }
    }

    if (success) {
        return (
            <div>
                <h2>Hasło zostało zmienione</h2>
                <button onClick={onDone}>Przejdź do logowania</button>
            </div>
        )
    }

    return (
        <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}
        >
            <h2>Ustaw nowe hasło</h2>
            <input
                type="password"
                placeholder="Nowe hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <input
                type="password"
                placeholder="Powtórz nowe hasło"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
            />
            {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}
            <button type="submit">Zmień hasło</button>
        </form>
    )
}

export default ResetPasswordForm