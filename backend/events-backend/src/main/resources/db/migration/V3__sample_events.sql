INSERT INTO app_user (email, password_hash, display_name, role_name)
VALUES ('organizer@test.pl', 'tymczasowe-haslo', 'Testowy Organizator', 'ORGANIZER');

INSERT INTO event (title, description, start_date, end_date, city, address, status,
                   organizer_id, voivodeship_id)
VALUES
    ('Festiwal Muzyki Folkowej', 'Trzydniowy festiwal muzyki ludowej.',
     '2027-06-12 16:00', '2027-06-14 23:00', 'Bydgoszcz', 'Wyspa Młyńska', 'APPROVED',
     (SELECT id FROM app_user WHERE email = 'organizer@test.pl'),
     (SELECT id FROM voivodeship WHERE name = 'Kujawsko-pomorskie')),
    ('Rekonstrukcja Bitwy pod Grunwaldem', 'Wielka inscenizacja historyczna.',
     '2027-07-17 12:00', NULL, 'Stębark', 'Pole Grunwaldzkie', 'APPROVED',
     (SELECT id FROM app_user WHERE email = 'organizer@test.pl'),
     (SELECT id FROM voivodeship WHERE name = 'Warmińsko-mazurskie')),
    ('Wydarzenie czekające na akceptację', 'To nie powinno być widoczne publicznie.',
     '2027-08-01 18:00', NULL, 'Kraków', 'Rynek Główny', 'PENDING',
     (SELECT id FROM app_user WHERE email = 'organizer@test.pl'),
     (SELECT id FROM voivodeship WHERE name = 'Małopolskie'));

INSERT INTO event_category (event_id, category_id)
SELECT e.id, c.id FROM event e, category c
WHERE (e.title = 'Festiwal Muzyki Folkowej' AND c.name IN ('Festiwal', 'Koncert'))
   OR (e.title = 'Rekonstrukcja Bitwy pod Grunwaldem' AND c.name = 'Rekonstrukcja historyczna');