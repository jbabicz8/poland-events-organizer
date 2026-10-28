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