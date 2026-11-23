import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

function initialTheme(): Theme {
    try {
        const saved = localStorage.getItem('theme')
        if (saved === 'dark' || saved === 'light') return saved
    } catch {
        // brak dostępu do localStorage, bierzemy ustawienie systemu
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(initialTheme)

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        try {
            localStorage.setItem('theme', theme)
        } catch {
            // ignorujemy
        }
    }, [theme])

    return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
}