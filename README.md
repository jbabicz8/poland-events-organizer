# Aplikacja do rejestracji, moderacji i wyszukiwania wydarzeń

## Uruchomienie (wymagany Docker)

```bash
docker compose up -d --build
```

Pierwsze uruchomienie trwa kilka minut (pobieranie bibliotek i budowanie).

| Adres | Co to jest |
|---|---|
| http://localhost:3000 | aplikacja |
| http://localhost:8025 | Mailpit (skrzynka z mailami, np. link do resetu hasła) |
| http://localhost:8080 | API (backend) |

Konto administratora: `admin@events.local` / `Admin12345`
(zmiana: zmienne `ADMIN_EMAIL`, `ADMIN_PASSWORD` w pliku `.env`).
Konta organizatora i użytkownika zakłada się przez formularz rejestracji.

## Zatrzymanie

```bash
docker compose down        # zatrzymuje, dane zostają
docker compose down -v     # zatrzymuje i usuwa dane (czysty start)
```

## Tryb deweloperski

Tylko baza i poczta w Dockerze, backend w IDE, frontend przez Vite:

```bash
docker compose up -d db mailpit
cd frontend && npm install && npm run dev
```