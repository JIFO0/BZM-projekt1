# Wdrożenie, Utrzymanie i Skalowalność (Deployment & Scaling)

Dokument opisuje architekturę wdrożeniową, model kosztowy, zarządzanie bezpieczeństwem kluczy API oraz procedurę skalowania rozwiązania na inne miasta.

---

## 1. Model hostingu i infrastruktury

Aplikacja mobilna **Kraków bez barier** działa w modelu **Backendless / Client-Side First**, co oznacza minimalne koszty operacyjne i brak konieczności budowy oraz utrzymywania dedykowanego serwera bazy danych przez Urząd Miasta Krakowa (UMK):

1. **Aplikacja mobilna:**
   - Dystrybucja przez Google Play Store oraz Apple App Store (zbudowana za pomocą EAS Build / Expo CLI).
   - Aktualizacje bezprzewodowe (OTA Updates) przez EAS Update dla natychmiastowego wdrażania poprawek bez konieczności ponownej recenzji w sklepach.
2. **Koszty infrastruktury:**
   - **Baza danych użytkowników:** 0 PLN (brak kont, brak logowania, przechowywanie wyłącznie lokalne na urządzeniu).
   - **Serwery aplikacji:** 0 PLN (brak serwera aplikacyjnego, architektura bezstanowa).
   - **OpenStreetMap (Overpass API):** Darmowy dostęp publiczny; w przypadku dużego ruchu zalecana instalacja dedykowanego mirrora Overpass w chmurze miejskiej lub usłudze Docker (~150–300 PLN/miesiąc).
   - **Mapy.com API:** Darmowa pula zapytań dla projektów niekomercyjnych / publicznych; elastyczny model taryfowy Seznam.cz w przypadku komercyjnego wykorzystania na dużą skalę.

---

## 2. Zabezpieczenie klucza API Mapy.com (Production Thin Proxy)

W wersji prototypowej klucz API pobierany jest ze zmiennej środowiskowej `EXPO_PUBLIC_MAPY_API_KEY`. Zgodnie z zasadami bezpieczeństwa opisanymi w wytycznych konkursowych:

- Klucz umieszczony bezpośrednio w aplikacji klienckiej można wyekstrahować. Jako wstępne zabezpieczenie stosowane jest ograniczenie domenowe/pakietowe w portalu Mapy.com.
- **Docelowe rozwiązanie produkcyjne:** Wdrożenie mikro-proxy (Cloudflare Worker lub AWS Lambda / Cloud Run) pośredniczącego w zapytaniach do `api.mapy.com`:
  - Proxy wstrzykuje klucz API po stronie bezpiecznego środowiska chmurowego.
  - Proxy ogranicza częstotliwość zapytań (Rate Limiting per IP) i chroni budżet zapytań.
  - Kod aplikacji mobilnej pozostaje w 100% zgodny dzięki interfejsowi `RoutingProvider` (wystarczy podmienić URL `apiBase` w pliku konfiguracyjnym miasta).

---

## 3. Zarządzanie zgłoszeniami użytkowników (Correction Queue)

1. **Lokalna kolejka weryfikacji:** Zgłoszenia użytkowników zapisywane są lokalnie w pamięci urządzenia ze statusem `reported` (niezweryfikowane).
2. **Bezpośrednie zgłoszenie do OpenStreetMap:** Przycisk „Dodaj notatkę na OpenStreetMap” przenosi użytkownika do oficjalnego formularza OSM Note ze współrzędnymi danej bariery. Dzięki temu to globalna społeczność OSM weryfikuje i nanosi poprawki na mapę, co natychmiast zasila dane w aplikacji.
3. **Opcjonalna integracja miejska (Krakowskie Centrum Kontaktu / Naprawmyto.pl):** Wersja produkcyjna może przekazywać zgłoszenia do miejskich systemów zarządzania infrastrukturą (ZDMK) poprzez otwarte miejskie API zgłoszeń.

---

## 4. Skalowanie na inne miasta (Instrukcja wdrożenia nowego miasta)

Architektura aplikacji została rygorystycznie oddzielona od specyfiki Krakowa. Żadne współrzędne ani nazwy własne nie są zaszyte na stałe w kodzie TypeScript.

Aby uruchomić aplikację dla drugiego miasta (np. **Warszawa**, **Wrocław**, **Gdańsk**):

1. **Utworzenie pliku konfiguracyjnego `cities/<id>.json`:**
   ```json
   {
     "id": "warszawa",
     "displayName": "Warszawa",
     "defaultLanguage": "pl",
     "languages": ["pl", "en"],
     "teamId": null,
     "demoArea": {
       "label": "Stare Miasto – Trakt Królewski",
       "provisional": false
     },
     "bbox": {
       "minLon": 20.85,
       "minLat": 52.10,
       "maxLon": 21.25,
       "maxLat": 52.35,
       "note": "Granice administracyjne Warszawy"
     },
     "stalenessMonths": 24,
     "corridorMeters": 18,
     "placeMatchMaxMetres": 40,
     "minCoverageForNoBarrierWording": 0.8,
     "adapters": {
       "routing": "mapy",
       "geocoding": "mapy",
       "accessibility": "osm-overpass",
       "tiles": "mapy"
     },
     "profiles": { ... },
     "overpass": {
       "endpoint": "https://overpass-api.de/api/interpreter",
       "userAgent": "WarszawaBezBarier/1.0"
     },
     "mapy": {
       "apiBase": "https://api.mapy.com",
       "routeType": "foot_fast",
       "geometryFormat": "geojson",
       "language": "pl",
       "tileMapset": "basic"
     }
   }
   ```
2. **Podmiana importu w `apps/mobile/src/config/city.ts`:**
   Zmień `cities/krakow.json` na `cities/warszawa.json`.
3. **Wygenerowanie snapshotu offline:**
   Uruchom narzędzie CLI: `npm run build-snapshot` w celu zebrania barier z nowego obszaru.
4. **Gotowe!** Aplikacja natychmiast działa dla nowego miasta bez jakichkolwiek modyfikacji kodu algorytmów czy interfejsu użytkownika.
