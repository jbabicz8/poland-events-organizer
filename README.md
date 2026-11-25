# Co.Gdzie – aplikacja do rejestracji, moderacji i wyszukiwania wydarzeń kulturalno-rozrywkowych

Aplikacja webowa stworzona w ramach pracy inżynierskiej. Organizatorzy dodają wydarzenia, administrator je moderuje (akceptuje lub odrzuca z podaniem powodu), a użytkownicy wyszukują wydarzenia na liście lub na interaktywnej mapie Polski i zapisują się na nie.

> **Uwaga:** hasła i klucze w tym repozytorium (`docker-compose.yaml`, `application.properties`) to wartości **tylko do uruchomienia lokalnego**. Przy jakimkolwiek prawdziwym wdrożeniu trzeba je zmienić (patrz sekcja *Konfiguracja*).

## Najważniejsze funkcje

**Użytkownik (uczestnik)**
- przeglądanie zaakceptowanych wydarzeń, filtrowanie (kategoria, województwo, daty), sortowanie, stronicowanie,
- osobna strona z mapą Polski – po kliknięciu województwa pojawia się lista jego wydarzeń,
- szczegóły wydarzenia: galeria zdjęć, opis, miejsce z odnośnikiem do Map Google i podglądem mapy, link do strony organizatora,
- zapis na wydarzenie ("Biorę udział") z limitem miejsc i paskiem zapełnienia, lista własnych zapisów,
- rejestracja, logowanie, reset hasła przez e-mail.

**Organizator**
- dodawanie i edycja wydarzeń (kategorie, zdjęcia z przeciąganiem i wyborem okładki, limit miejsc, link do własnej strony / Facebooka, podgląd karty na żywo),
- lista własnych wydarzeń ze statusem moderacji i powodem ewentualnego odrzucenia.

**Administrator**
- kolejka moderacji (akceptacja / odrzucenie z uzasadnieniem), zarządzanie kategoriami, dodawanie wydarzeń.

**Inne:** jasny i ciemny motyw, układ responsywny, współbieżnie bezpieczne zapisy na ostatnie miejsca (brak przekroczenia limitu).

## Technologie

| Warstwa | Stos |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Java 21, Spring Boot 4 (Web, Data JPA, Security, Validation, Mail), JWT |
| Baza danych | PostgreSQL 16, migracje Flyway (`V1`–`V8`) |
| Poczta (lokalnie) | Mailpit |
| Uruchomienie | Docker Compose |
| Testy | JUnit 5, MockMvc, Testcontainers (51 testów) |

## Uruchomienie (wymagany Docker)

```bash
docker compose up -d --build
```

Pierwsze uruchomienie trwa kilka minut (pobieranie bibliotek i budowanie obrazów).

| Adres | Co to jest |
|---|---|
| http://localhost:3000 | aplikacja |
| http://localhost:8025 | Mailpit – skrzynka z mailami (np. link do resetu hasła) |
| http://localhost:8080 | API (backend) |

### Konta

- **Administrator** (tworzony automatycznie): `admin@events.local` / `Admin12345`
- **Organizator i uczestnik**: zakładane przez formularz rejestracji w aplikacji (wybór roli przy rejestracji).

### Zatrzymanie

```bash
docker compose down        # zatrzymuje kontenery, dane zostają
docker compose down -v     # zatrzymuje i usuwa dane (czysty start)
```

## Konfiguracja

Wartości domyślne można nadpisać zmiennymi środowiskowymi, np. w pliku `.env` obok `docker-compose.yaml`:

| Zmienna | Znaczenie | Domyślnie (tylko lokalnie!) |
|---|---|---|
| `JWT_SECRET` | klucz podpisujący tokeny JWT (min. 32 znaki) | wartość przykładowa |
| `ADMIN_EMAIL` | e-mail konta administratora | `admin@events.local` |
| `ADMIN_PASSWORD` | hasło konta administratora | `Admin12345` |

Plik `.env` jest w `.gitignore` i nie trafia do repozytorium.

## Tryb deweloperski

Baza i poczta w Dockerze, backend w IDE, frontend przez Vite:

```bash
docker compose up -d db mailpit

# backend (w drugim terminalu)
cd backend/events-backend
./mvnw spring-boot:run

# frontend (w trzecim terminalu)
cd frontend
npm install
npm run dev
```

## Testy

Testy backendu (51) uruchamiają prawdziwą bazę PostgreSQL w kontenerze (Testcontainers), więc **Docker musi działać**:

```bash
cd backend/events-backend
./mvnw test
```

Zakres: rejestracja i logowanie (w tym hashowanie BCrypt), uprawnienia ról, pełny cykl wydarzenia (utworzenie → moderacja → widoczność → edycja), walidacja danych, zapisy na wydarzenia wraz z limitem miejsc i testem współbieżności (10 użytkowników walczy o 3 miejsca), filtrowanie oraz testy jednostkowe zapisu zdjęć i obsługi JWT.

Kontrola typów i build frontendu:

```bash
cd frontend
npm run build
```

## Struktura repozytorium

```
.
├── backend/events-backend/   # Spring Boot (API, bezpieczeństwo, migracje Flyway, testy)
├── frontend/                 # React + TypeScript (Vite, Tailwind)
├── docs/                     # dokumentacja
├── docker-compose.yaml       # baza + poczta + backend + frontend
└── README.md
```

## Znane ograniczenia

Projekt jest pracą inżynierską i prototypem, nie gotowym produktem produkcyjnym:

- brak ograniczenia liczby prób logowania,
- token JWT przechowywany w `localStorage` przeglądarki,
- brak potwierdzania adresu e-mail przy rejestracji,
- poczta działa tylko lokalnie (Mailpit – maile nie wychodzą na zewnątrz),
- zdjęcia zapisywane na dysku serwera (wolumen Dockera), bez zewnętrznego magazynu plików.

## Autor

Jakub Babicz – Informatyka Stosowana, Politechnika Bydgoska.
