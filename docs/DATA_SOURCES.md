# Źródła Danych (Data Sources)

Niniejszy dokument szczegółowo opisuje źródła danych wykorzystywane przez aplikację **Kraków bez barier**, warunki licencyjne, częstotliwość aktualizacji, metody weryfikacji, zachowanie w przypadku awarii oraz ograniczenia techniczne.

---

## 1. Mapy.com REST API (Routing pieszy i Geokodowanie)

- **Pochodzenie:** Seznam.cz, a.s. / Mapy.com ([developer.mapy.com](https://developer.mapy.com/rest-api-mapy-cz/how-to-start/)).
- **Routing:**
  - Dokumentacja: OpenAPI 2.1.14 (`https://api.mapy.com/v1/docs/routing/openapi.json`), punkt końcowy `GET /v1/routing/route`.
  - Tryb: `foot_fast` (trasa piesza, najszybsza).
  - Weryfikacja: OpenAPI potwierdza brak natywnego profilu wózka lub wózka dziecięcego w silniku Mapy.com – dlatego trasa traktowana jest jako geometria kandydacka.
  - Parametry: `start={lon},{lat}`, `end={lon},{lat}`, `routeType=foot_fast`, `format=geojson`, `lang=pl`.
- **Geokodowanie i Autouzupełnianie:**
  - OpenAPI: `https://api.mapy.com/v1/docs/geocode/openapi.json`.
  - Punkty końcowe: `GET /v1/suggest?query=...&lang=pl&limit=8&locality=pl` oraz `GET /v1/geocode`.
- **Uwierzytelnianie:**
  - Bezpieczny nagłówek HTTP `X-Mapy-Api-Key` (klucz nigdy nie jest przekazywany w query string URL ani logowany).
- **Atrybucja:**
  - Logo Mapy.com, odnośnik do `https://mapy.com/` oraz informacja prawna: *„© Seznam.cz a.s. and others”* ([Zasady atrybucji](https://developer.mapy.com/rest-api-mapy-cz/atribution/)).
- **Limity i Taryfy:**
  - Taryfa darmowa (Basic): 250 000 kredytów miesięcznie. Limit zapytań: 30 req/s dla routingu, 100 req/s dla geokodowania.
- **Obsługa awarii (R12):**
  - Kody HTTP 401, 403, 404, 422, 429, 5xx, timeout mapowane są na typowany `SourceFailure`.
  - W razie awarii aplikacja natychmiast informuje użytkownika i serwuje trasę zapasową z lokalnego snapshotu demo.

---

## 2. OpenStreetMap przez Overpass API (Weryfikacja barier)

- **Pochodzenie:** Społeczność OpenStreetMap, [OpenStreetMap Foundation](https://www.openstreetmap.org/copyright).
- **Licencja:** Open Database License (ODbL 1.0) – wymagana atrybucja *„© OpenStreetMap contributors”*.
- **Punkt końcowy:** Główna instancja Overpass: `https://overpass-api.de/api/interpreter`.
- **Polityka użytkowania:**
  - Aplikacja wysyła unikalny nagłówek `User-Agent: KrakowBezBarier/0.1 (HackYeah 2026 prototype)`.
  - Zapytania są buforowane w korytarzu trasy (`corridorMeters: 18m`), minimalizując obciążenie serwera.
- **Zweryfikowane tagi OSM (według wiki.openstreetmap.org):**
  - Schody: `highway=steps` (wraz z `step_count`, `ramp`, `ramp:stroller`, `handrail`).
  - Krawężniki: `kerb=*`, `barrier=kerb` (wartości: `flush`, `lowered`, `raised` lub pomiar w mm/cm).
  - Przejścia dla pieszych: `highway=crossing` (wraz z `crossing`, `traffic_signals`, `tactile_paving`).
  - Nawierzchnia i stan: `surface=*` (`asphalt`, `paving_stones`, `sett`, `cobblestone`), `smoothness=*`.
  - Udogodnienia: `highway=elevator`, `ramp=*`, `wheelchair=yes|no|limited`.
  - Toalety przystosowane: `toilets:wheelchair=yes|no`.
  - Tagi weryfikacji: `check_date:*`, `survey:date`, `lastcheck`.
- **Weryfikacja i datowanie:**
  - Data ostatniej edycji (`timestamp`) w OSM jest prezentowana jako data edycji, a nie data kontroli (R5).
  - Status `verified` przysługuje tylko obiektom z aktualnym znacznikiem `check_date` (domyślnie ≤ 24 miesiące).
- **Obsługa awarii:**
  - Timeout lub HTTP 429/503 nie są nigdy traktowane jako brak przeszkód – wyświetlany jest czytelny banner o braku możliwości pobrania danych na żywo i załadowaniu snapshotu.

---

## 3. Lokalny Snapshot Demonstracyjny (`fixtures/krakow-demo-snapshot.json`)

- Zbudowany i zwalidowany za pomocą narzędzia `packages/cli` zgodnie ze schematem `schemas/fact.schema.json`.
- Wyraźnie oznaczony etykietą **DANE PRZYKŁADOWE (Offline Demo Snapshot Kraków)**.
- Obejmuje kluczowy historyczny i turystyczny obszar Krakowa: *Rynek Główny – Kazimierz – Wawel – Planty*.
- Zapewnia 100% stabilności prezentacji podczas finałowego demo konkursowego nawet w przypadku braku łączności z internetem.

---

## 4. Dodatkowe źródła miejskie (Rozszerzenie po hackathonie)

System posiada gotowe interfejsy do podłączenia dodatkowych miejskich repozytoriów danych:
- **Portal Otwarte Dane Krakowa:** `https://otwartedane.um.krakow.pl` (np. rejestr dostępności obiektów użyteczności publicznej).
- **Miejski System Informacji Przestrzennej (MSIP Kraków):** `https://msip.krakow.pl` (WMS/WFS – warstwy geodezyjne i remontowe).
- **Krajowy portal dane.gov.pl:** Zbiory danych o dostępności dworców i obiektów państwowych.
