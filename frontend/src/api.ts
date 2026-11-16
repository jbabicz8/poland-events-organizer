import type { User } from './auth'

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

    if (!res.ok) {
        if (res.status === 400) throw new Error('Sprawdź poprawność wpisanych danych')
        if (res.status === 401) throw new Error('Sesja wygasła, zaloguj się ponownie')
        if (res.status === 403) throw new Error('Brak uprawnień do tej operacji')
        if (res.status === 404) throw new Error('Nie znaleziono')
        if (res.status === 409) throw new Error('Ta operacja nie jest teraz możliwa')
        throw new Error('Błąd serwera (' + res.status + ')')
    }

    if (res.status === 204) return undefined as T
    return res.json()
}