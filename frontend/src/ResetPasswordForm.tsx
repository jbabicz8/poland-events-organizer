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
  const [busy, setBusy] = useState(false)

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

    setBusy(true)
    try {
      await resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setBusy(false)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-semibold">Hasło zmienione</h2>
        <p className="mt-2 text-muted">Możesz się teraz zalogować nowym hasłem.</p>
        <button onClick={onDone} className="btn-primary mt-8 w-full py-3">
          Przejdź do logowania
        </button>
      </div>
    )
  }

  return (
    <div>
      <p className="font-serif text-2xl font-bold">
        Co<span className="text-accent">.</span>Gdzie
      </p>
      <h2 className="mt-6 text-3xl font-semibold">Ustaw nowe hasło</h2>
      <p className="mt-1 text-sm text-muted">Wybierz hasło, które ma co najmniej 8 znaków.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Nowe hasło</span>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Powtórz nowe hasło</span>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
          />
        </label>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy ? 'Chwileczkę...' : 'Zmień hasło'}
        </button>
      </form>
    </div>
  )
}

export default ResetPasswordForm
