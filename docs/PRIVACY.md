# Polityka Prywatności i Bezpieczeństwo Danych (Privacy & Security)

Aplikacja **Kraków bez barier** została zbudowana w oparciu o fundamentalną zasadę **Privacy by Design** (ochrona prywatności w fazie projektowania) oraz rygorystyczne wymagania konkursowe (Sekcja 7 P1–P5).

---

## 1. Brak Zbierania Danych Osobowych i Wrażliwych (P1, P2)

- **Zero pytań o stan zdrowia:** Aplikacja nigdy nie pyta użytkownika o rodzaj lub stopień niepełnosprawności, diagnozy medyczne czy sytuację rodzinną. Użytkownik wybiera wyłącznie techniczne progi fizyczne trasy (np. tolerancję wysokości krawężnika).
- **Brak kont użytkowników:** Aplikacja nie wymaga i nie oferuje rejestracji, logowania ani tworzenia profilu użytkownika.
- **Brak zewnętrznych SDK analitycznych i reklamowych:** W kodzie nie ma żadnych bibliotek śledzących (Google Analytics, Firebase, Facebook SDK) ani narzędzi zbierających telemetrię o awariach (Sentry, Crashlytics).
- **Przechowywanie lokalne (On-Device):** Wybrany profil mobilności oraz historia lokalnych zgłoszeń korekt przechowywane są wyłącznie w pamięci podręcznej urządzenia użytkownika.

---

## 2. Wykorzystanie Lokalizacji (P3)

- Aplikacja nie żąda uprawnień do lokalizacji w tle.
- Pobranie aktualnej pozycji następuje **wyłącznie po jawnym dotknięciu przycisku „📍 Użyj mojej lokalizacji”** na ekranie wyszukiwania.

---

## 3. Komunikacja Sieciowa i Podmioty Trzecie (P4, P5)

Wszelka komunikacja sieciowa odbywa się wyłącznie za pośrednictwem szyfrowanego protokołu **HTTPS**:

1. **Mapy.com (Seznam.cz, a.s.):**
   - Wysyłane dane: tekst zapytania w wyszukiwarce (np. „Rynek Główny”) oraz współrzędne geograficzne punktu startowego i docelowego w celu wyznaczenia trasy pieszej.
   - Brak jakichkolwiek identyfikatorów użytkownika czy urządzenia.
2. **OpenStreetMap / Overpass API (OpenStreetMap Foundation):**
   - Wysyłane dane: współrzędne prostokątów korytarza trasy (bounding box) lub otoczenia punktu (around: 40m).
   - Nie są przesyłane żadne dane o użytkowniku.
3. **Zgłoszenia korekt:**
   - Zgłoszenia pozostają lokalnie na telefonie (oznaczone jako niezweryfikowane).
   - Opcjonalne dodanie notatki publicznej na OpenStreetMap następuje poprzez otwarcie oficjalnego adresu OSM Note w przeglądarce, na wyłączną decyzję użytkownika.

---

## 4. Transparentność w Aplikacji

Wszystkie powyższe zasady są wprost przedstawione użytkownikowi na ekranie początkowym profilu (`/`) oraz na dedykowanym ekranie „O danych i licencjach” (`/about`).
