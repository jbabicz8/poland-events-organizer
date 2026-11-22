import type { User } from './auth'

async function toError(res: Response): Promise<Error> {
    try {
        const data = await res.json()
        if (typeof data.message === 'string' && data.message) {
            return new Error(data.message)
        }
    } catch {
        // brak treści JSON, używamy ogólnych komunikatów poniżej
    }

    if (res.status === 400) return new Error('Sprawdź poprawność wpisanych danych')
    if (res.status === 401) return new Error('Sesja wygasła, zaloguj się ponownie')
    if (res.status === 403) return new Error('Brak uprawnień do tej operacji')
    if (res.status === 404) return new Error('Nie znaleziono')
    if (res.status === 409) return new Error('Ta operacja nie jest teraz możliwa')
    return new Error('Błąd serwera (' + res.status + ')')
}

export async function api<T>(
    user: User,
    url: string,
    method = 'GET',
    body?: unknown,
): Promise<T> {
    const res = await fetch(url, {
        method,
        headers: {
            Authorization: 'Bearer ' + user.token,
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) throw await toError(res)

    if (res.status === 204) return undefined as T
    return res.json()
}

export async function apiUpload<T>(user: User, url: string, file: File): Promise<T> {
    const form = new FormData()
    form.append('file', file)

    const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + user.token },
        body: form,
    })

    if (!res.ok) throw await toError(res)
    return res.json()
}