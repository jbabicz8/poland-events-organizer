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
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
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

    if (!email.includes('@')) {
      setError('Podaj poprawny adres e-mail')
      return
    }

    if (mode === 'forgot') {
      setBusy(true)
      try {
        await forgotPassword(email)
        setInfo('Jeśli konto o takim adresie istnieje, wysłaliśmy na nie link do zmiany hasła.')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Wystąpił błąd')
      } finally {
        setBusy(false)
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

    setBusy(true)
    try {
      const user =
        mode === 'login'
          ? await login(email, password)
          : await register(email, password, displayName, asOrganizer)
      onSuccess(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setBusy(false)
    }
  }

  const title =
    mode === 'login' ? 'Witaj ponownie' : mode === 'register' ? 'Dołącz do nas' : 'Odzyskiwanie hasła'
  const subtitle =
    mode === 'login'
      ? 'Zaloguj się, aby zapisywać się na wydarzenia.'
      : mode === 'register'
        ? 'Załóż konto w minutę. Jest bezpłatne.'
        : 'Podaj e-mail, a wyślemy ci link do ustawienia nowego hasła.'

  return (
    <div>
      <p className="font-serif text-2xl font-bold">
        Co<span className="text-accent">.</span>Gdzie
      </p>

      {mode === 'forgot' ? (
        <button
          type="button"
          onClick={() => changeMode('login')}
          className="mt-6 border-0 bg-transparent p-0 text-sm text-muted"
        >
          ← Wróć do logowania
        </button>
      ) : (
        <div className="mt-6 grid grid-cols-2 rounded-full border border-line bg-bg p-1">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => changeMode(m)}
              className={
                'rounded-full border-0 py-2 ' +
                (mode === m ? 'bg-surface text-ink shadow' : 'bg-transparent text-muted')
              }
            >
              {m === 'login' ? 'Logowanie' : 'Rejestracja'}
            </button>
          ))}
        </div>
      )}

      <h2 className="mt-6 text-3xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">E-mail</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="jan@example.com"
            className="w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {mode !== 'forgot' && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Hasło</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'register' ? 'Minimum 8 znaków' : 'Twoje hasło'}
                className="w-full pr-20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 border-0 bg-transparent px-3 py-1 text-xs text-muted"
              >
                {showPassword ? 'Ukryj' : 'Pokaż'}
              </button>
            </div>
          </label>
        )}

        {mode === 'register' && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Nazwa wyświetlana</span>
              <input
                placeholder="Jak mamy się do ciebie zwracać?"
                className="w-full"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>

            <div>
              <span className="mb-1.5 block text-sm font-medium">Jak chcesz korzystać z serwisu?</span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { organizer: false, name: 'Uczestnik', desc: 'Przeglądam i zapisuję się' },
                  { organizer: true, name: 'Organizator', desc: 'Dodaję własne wydarzenia' },
                ].map((o) => (
                  <button
                    key={o.name}
                    type="button"
                    aria-pressed={asOrganizer === o.organizer}
                    onClick={() => setAsOrganizer(o.organizer)}
                    className={
                      'rounded-2xl p-3 text-left ' +
                      (asOrganizer === o.organizer
                        ? 'border-accent bg-accent-soft'
                        : 'border-line bg-surface')
                    }
                  >
                    <b className="block text-sm">{o.name}</b>
                    <span className="text-xs font-normal text-muted">{o.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>
        )}
        {info && (
          <p className="rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {info}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy
            ? 'Chwileczkę...'
            : mode === 'login'
              ? 'Zaloguj się'
              : mode === 'register'
                ? 'Załóż konto'
                : 'Wyślij link'}
        </button>

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => changeMode('forgot')}
            className="w-full border-0 bg-transparent text-sm text-muted"
          >
            Nie pamiętam hasła
          </button>
        )}
      </form>
    </div>
  )
}

export default AuthForm
