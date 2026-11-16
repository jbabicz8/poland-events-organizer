export type User = {
    token: string
    email: string
    displayName: string | null
    role: string
}

const STORAGE_KEY = 'user'

export function loadUser(): User | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as User) : null
    } catch {
        return null
    }
}

export function saveUser(user: User | null) {
    if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
        localStorage.removeItem(STORAGE_KEY)
    }
}

export async function forgotPassword(email: string): Promise<void> {
    const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    })
    if (!res.ok) {
        if (res.status === 400) throw new Error('Podaj poprawny adres e-mail')
        throw new Error('Błąd serwera (' + res.status + ')')
    }
}

export async function resetPassword(token: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
    })
    if (!res.ok) {
        if (res.status === 400) throw new Error('Link jest nieprawidłowy lub wygasł. Poproś o nowy.')
        throw new Error('Błąd serwera (' + res.status + ')')
    }
}

async function send(url: string, body: unknown): Promise<User> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        if (res.status === 401) throw new Error('Nieprawidłowy e-mail lub hasło')
        if (res.status === 409) throw new Error('Konto z takim adresem e-mail już istnieje')
        if (res.status === 400) throw new Error('Sprawdź dane (hasło musi mieć min. 8 znaków)')
        throw new Error('Błąd serwera (' + res.status + ')')
    }

    return res.json()
}

export function login(email: string, password: string) {
    return send('/api/auth/login', { email, password })
}

export function register(
    email: string,
    password: string,
    displayName: string,
    asOrganizer: boolean,
) {
    return send('/api/auth/register', { email, password, displayName, asOrganizer })
}