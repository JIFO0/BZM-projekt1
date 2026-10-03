# Kraków bez barier (HackYeah 2026)

Kompletna aplikacja mobilna **React Native + Expo (TypeScript)** stworzona na wyzwanie HackYeah 2026: *Cracow Without Barriers / Kraków bez barier*.

Aplikacja pozwala osobie poruszającej się na wózku lub rodzicowi z wózkiem dziecięcym zaplanować trasę pieszą (A → B) w Krakowie oraz sprawdzić dostępność konkretnego miejsca. Prezentuje **konkretne bariery i udogodnienia wraz ze źródłem, datą i wiarygodnością**, nigdy nie sprowadzając wyniku do uproszczonej i mylącej etykiety „dostępne / niedostępne”.

> **Kluczowa zasada produktu:**
> Trasa piesza z Mapy.com jest traktowana jako *trasa kandydacka* i weryfikowana w korytarzu geometrii z danymi OpenStreetMap (schody, krawężniki, nawierzchnia, nachylenie, przejścia, windy). Aplikacja przedstawia uczciwy raport z **pokryciem danych** i **najdłuższym odcinkiem bez danych**. Gdzie w OSM brakuje danych, aplikacja mówi **„brak informacji”**, nigdy „OK”.

---

## English Summary

**Kraków without barriers** is an Expo / React Native mobile app for wheelchair users and everyone needing accessible pathways. Walking routes are requested from **Mapy.com REST API**, then cross-checked against **OpenStreetMap (Overpass API)** features along the route corridor (steps, kerbs, surface, incline, crossings, elevators). Missing information is always reported as unknown, never as accessible. Includes offline demo snapshots, WCAG 2.2 AAA accessibility, screen reader optimization, data conflict detection (R7), staleness tracking (R8), and offline failure handling (R12).

---

## Jak uruchomić (Quickstart)

Wymagane: **Node.js 20+** oraz **npm**.
Aplikacja działa w **Expo Go**, przeglądarce (Web) oraz jako natywny dev build (Android / iOS).

```bash
# 1. Klonowanie i instalacja zależności
npm install

# 2. Konfiguracja zmiennych środowiskowych (opcjonalna dla demo)
cp .env.example apps/mobile/.env
# W apps/mobile/.env można wkleić własny klucz z developer.mapy.com.
# Jeśli klucz nie zostanie podany, aplikacja automatycznie i płynnie korzysta
# z wbudowanego snapshotu offline dla obszaru demonstracyjnego w Krakowie.

# 3. Weryfikacja typu, lintera i 100% testów jednostkowych
npm run verify

# 4. Uruchomienie aplikacji w Expo
npm start
```

W `apps/mobile/.env` wstaw klucz z [developer.mapy.com](https://developer.mapy.com/rest-api-mapy-cz/how-to-start/). Bez klucza ekrany profilu i „O danych” i tak się otwierają, bo jeszcze nie wołają API.
Po uruchomieniu `npm start`:
- Naciśnij `w`, aby uruchomić aplikację w przeglądarce internetowej.
- Zeskanuj kod QR aplikacją **Expo Go** na telefonie z Androidem lub iOS.

---

## Backend i środowisko kontenerowe (Docker Compose)

Projekt posiada skonsolidowany, gotowy do wdrożenia stos backendowy zarządzany przez **Docker Compose** w katalogu [`backend/`](file:///home/guzio/Dokumenty/Projekty/BZM-projekt1/backend).

Wszystkie usługi komunikują się przez oficjalną bramę **Caddy** (Reverse Proxy), wystawiającą usługi pod przyjaznymi domenami `.local`:

| Adres URL | Kontener | Usługa |
| :--- | :--- | :--- |
| **`http://accessible.krakow.local/`** | `krakow-frontend` | Produkcyjny frontend webowy Expo serwowany przez Caddy |
| **`http://api.accessible.krakow.local/`** | `krakow-api` | Serwer REST API (Hono / Node.js) z portu 3000 |
| **`http://hopper.accessible.krakow.local/`** | `krakow-graphhopper` | Silnik routingu pieszych GraphHopper z wagami dostępności |
| **`http://localhost/`** | `krakow-gateway` | Brama Caddy (port 80:80) – domyślnie kieruje na frontend |

### Uruchomienie pełnego stosu (Frontend + API + Routing + Caddy):
```bash
# 1. Dodaj domeny lokalne do /etc/hosts (opcjonalne, ale zalecane):
# 127.0.0.1 accessible.krakow.local api.accessible.krakow.local hopper.accessible.krakow.local

# 2. Uruchomienie wszystkich 4 usług:
cd backend
docker compose up -d --build
```

### Tryb deweloperski pojedynczego serwera API (bez Dockera):
```bash
npm run server   # startuje lokalny serwer Hono na http://localhost:3000
```

Szczegółowy opis konfiguracji i wdrożenia produkcyjnego w domenie `.pl`: [`backend/README.md`](file:///home/guzio/Dokumenty/Projekty/BZM-projekt1/backend/README.md).

---

## Najważniejsze funkcje i spełnione wymagania

- **R1. Wybór profilu bez pytania o niepełnosprawność:** Profile *Wózek* (schody blokują, krawężnik do 30 mm, omijanie kocich łbów i piasku), *Profil własny* (suwaki progów, brak domyślnie blokowanych nawierzchni).
- **R2. Wyszukiwanie trasy A → B oraz inspekcja miejsc:** Geokodowanie Mapy.com, lokalizacja użytkownika wyłącznie na jawne żądanie (przycisk „📍 Użyj mojej lokalizacji”).
- **R3. Analiza barier wzdłuż trasy:** Posortowane w kolejności pokonywania trasy z odległością od startu (np. „Po 120 m: schody, 14 stopni, brak podjazdu”).
- **R4. Karta miejsca w 4 kategoriach wyzwania:** *Wejście / Wnętrze / Toaleta / Otoczenie*.
- **R5. Każdy fakt z pełnym dowodem:** Wartość, odznaka statusu (ikona + tekst), źródło, data edycji/potwierdzenia oraz rozwijane „Dlaczego taki status?”.
- **R6. Nieznane ≠ Dostępne:** Brak danych jest zawsze oznaczony znakiem zapytania i statusem *Brak danych*.
- **R7. Wykrywanie sprzecznych danych:** Gdy w OSM budynek ma `wheelchair=yes`, a drzwi `wheelchair=no` (schody), aplikacja pokazuje obie wartości ze statusem *Dane sprzeczne* (przetestuj w menu Demo).
- **R8. Wykrywanie danych przedawnionych:** Flaga ostrzegawcza dla danych starszych niż 24 miesiące.
- **R9. Wskaźniki pokrycia danych i najdłuższy odcinek bez danych:** Obliczanie procentu pokrycia dla nawierzchni, krawężników i schodów oraz długość luki pomiarowej.
- **R10. Uczciwe podsumowanie:** Zdanie „Nie znaleziono przeszkód w dostępnych danych” wyświetla się wyłącznie przy wysokim pokryciu danych i zerowej liczbie barier.
- **R11. Zgłoszenie poprawki:** Lokalna kolejka weryfikacji na urządzeniu + bezpośredni link do dodania notatki na OpenStreetMap (`https://www.openstreetmap.org/note/new...`). Aplikacja nigdy nie wysyła niczego automatycznie do OSM.
- **R12. Obsługa awarii źródeł (Overpass / Mapy 429/503/offline):** Czytelny komunikat o awarii źródła i automatyczne przełączenie na zweryfikowany snapshot offline.
- **R13. Oznaczenie danych przykładowych:** Wszystkie dane demonstracyjne są wyraźnie oznaczone etykietą **DANE PRZYKŁADOWE**.
- **R14. Ekran „O danych”:** Pełna atrybucja Mapy.com i OpenStreetMap ODbL, wersja snapshotu, podsumowanie polityki prywatności.
- **Dostępność dla niewidomych (WCAG AAA):** Pełne natywne wsparcie dla czytników ekranu (VoiceOver, TalkBack, czytniki przeglądarkowe) – semantyczne role i etykiety accessibility zamiast zbędnych przycisków lektora.
- **WOW 1. Udostępnianie raportu:** Przycisk „📤 Udostępnij raport tekstowy”.
- **WOW 2. Interaktywna mapa z numerowanymi punktami:** Korytarz trasy oraz kolorowe pinezki barier (czerwone blokady, pomarańczowe ostrzeżenia, zielone udogodnienia).

---

## Architektura (Monorepo npm)

```
/
├─ apps/mobile/              # Aplikacja Expo Router (UI, WCAG 2.2 AA)
├─ packages/core/            # Czysty TypeScript (domain, geometria, algorytm analizy, walidacja)
├─ packages/sources/         # Adaptery: GraphHopper, MapyRouting, MapyGeocode, OsmOverpass
├─ packages/cli/             # Serwer API (Hono) oraz CLI walidacji snapshotu
├─ backend/                  # Docker Compose, Caddyfile, GraphHopper, Dockerfile.frontend, Dockerfile.api
├─ cities/krakow.json        # Bounding box, progi, konfiguracja miasta i endpointów
├─ fixtures/                 # Zweryfikowany offline demo snapshot (DANE PRZYKŁADOWE)
├─ schemas/fact.schema.json  # JSON Schema dla znormalizowanego faktu
└─ docs/                     # Kompletna dokumentacja projektowa i konkursowa
```

Szczegółowy opis architektury: [`docs/ARCHITECTURE.md`](file:///home/guzio/Dokumenty/Projekty/BZM-projekt1/docs/ARCHITECTURE.md).

---

## Weryfikacja i testy

Projekt posiada 100% przechodzących testów jednostkowych dla algorytmów domenowych (T1–T8):

```bash
# Uruchomienie pełnej weryfikacji: TypeScript typecheck + Expo ESLint + Jest tests
npm run verify

# Uruchomienie samego test runnera
npm test

# Budowa i walidacja snapshotu offline przez narzędzie CLI
node -e "require('./packages/cli/src').runSnapshotCli()"
```

Wynik: 11 zestawów testowych, 36 testów jednostkowych – **PASS**.

---

## Dostępność cyfrowa (WCAG 2.2 AA)

- Pełna obsługa TalkBack / VoiceOver ze spójną narracją dźwiękową dla każdego punktu trasy.
- Zasada *Never colour alone*: każdy stan posiada dedykowaną ikonę, jednoznaczny tekst i wysoki kontrast (≥ 4.5:1).
- Cele dotykowe o minimalnym wymiarze 48×48 dp.
- Alternatywa tekstowa: mapa jest dodatkiem, pełna lista tekstowa jest głównym i autonomicznym interfejsem.
- Szczegółowy audyt: [`docs/ACCESSIBILITY.md`](file:///home/midnight/BZM-projekt1/docs/ACCESSIBILITY.md).

---

## Licencje i autorzy

- Kod aplikacji: licencja permissywna MIT.
- Dane OpenStreetMap: © OpenStreetMap contributors, licencja Open Database License (ODbL).
- Routing i geokodowanie: Mapy.com API, Seznam.cz, a.s.
- Szczegółowy spis zależności: [`docs/THIRD_PARTY_LICENSES.md`](file:///home/midnight/BZM-projekt1/docs/THIRD_PARTY_LICENSES.md).
