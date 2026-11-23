import type { User } from './auth'
import type { Theme } from './theme'

export type View = 'events' | 'map' | 'details' | 'new' | 'mine' | 'admin' | 'participations'

type Props = {
  user: User | null
  view: View
  theme: Theme
  onToggleTheme: () => void
  onNavigate: (view: View) => void
  onLoginClick: () => void
  onLogout: () => void
}

function Header({ user, view, theme, onToggleTheme, onNavigate, onLoginClick, onLogout }: Props) {
  const links: { view: View; label: string }[] = [{ view: 'events', label: 'Wydarzenia' }]
  links.push({ view: 'map', label: 'Mapa' })
  if (user?.role === 'USER') links.push({ view: 'participations', label: 'Biorę udział' })
  if (user?.role === 'ORGANIZER') {
    links.push({ view: 'new', label: 'Dodaj wydarzenie' })
    links.push({ view: 'mine', label: 'Moje zgłoszenia' })
  }
  if (user?.role === 'ADMIN') links.push({ view: 'admin', label: 'Panel administratora' })

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 sm:px-8">
        <button
          onClick={() => onNavigate('events')}
          className="border-0 bg-transparent p-0 font-serif text-2xl font-bold tracking-tight hover:text-ink"
        >
          Co<span className="text-accent">.</span>Gdzie
        </button>

        <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
          {links.map((l) => (
            <button
              key={l.view}
              onClick={() => onNavigate(l.view)}
              className={
                'whitespace-nowrap border-0 bg-transparent px-4 ' +
                (view === l.view ? 'text-accent' : 'text-muted')
              }
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            aria-label="Przełącz tryb jasny/ciemny"
            className="grid h-10 w-10 place-items-center !rounded-full !p-0 hover:rotate-12"
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            )}
          </button>

          {user ? (
            <>
              <span className="hidden text-sm text-muted sm:inline">{user.displayName ?? user.email}</span>
              <button className="btn-ghost" onClick={onLogout}>Wyloguj</button>
            </>
          ) : (
            <button className="btn-primary" onClick={onLoginClick}>Zaloguj się</button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
