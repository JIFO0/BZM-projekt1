# Zintegrowane Usługi Backendowe – Kraków bez barier

Ten katalog zawiera kompletną konfigurację wielousługowego środowiska Docker Compose dla projektu **Kraków bez barier**.

Wszystkie usługi spina reverse proxy **Caddy**, udostępniający je pod lokalnymi domenami `.local` (przygotowanymi do natychmiastowego wdrożenia produkcyjnego w domenie `.pl`).

---

## 1. Usługi w Docker Compose (`backend/docker-compose.yml`)

Środowisko składa się z **4 zintegrowanych usług**:

| Usługa | Kontener | Rola i technologia | Domena lokalna | Port wewnętrzny |
| :--- | :--- | :--- | :--- | :--- |
| **`frontend`** | `krakow-frontend` | Aplikacja webowa Expo wyeksportowana do plików statycznych (`expo export -p web`), serwowana przez lekki serwer Caddy | `http://accessible.krakow.local/` | `80` |
| **`api`** | `krakow-api` | Serwer aplikacyjny Node.js / Hono (`@krakow-bez-barier/cli`) obsługujący endpointy API, weryfikację snapshotów i logikę miejską | `http://api.accessible.krakow.local/` | `3000` (i `3000:3000` na hoście) |
| **`graphhopper`** | `krakow-graphhopper` | Samodzielnie hostowany silnik routingu pieszych z obsługą wag dostępności miejskiej (`custom_model`, schody, nawierzchnia, krawężniki). Szczegóły poniżej. | `http://hopper.accessible.krakow.local/` | `8989` (i `8989:8989` na hoście) |
| **`caddy`** | `krakow-gateway` | Brama wejściowa (Reverse Proxy) trasująca ruch według domen, z obsługą nagłówków CORS | `http://*.accessible.krakow.local` oraz `http://localhost` | `80:80` |

---

## 2. Szybki start (Lokalne uruchomienie)

### Krok 1: Wpis w `/etc/hosts` (dla domen `.local`)
Aby przeglądarka i aplikacja mogły rozwiązywać adresy `.local`, dodaj do pliku `/etc/hosts` (lub `C:\Windows\System32\drivers\etc\hosts` na Windows):
```text
127.0.0.1 accessible.krakow.local api.accessible.krakow.local hopper.accessible.krakow.local
```
*(Uwaga: Bez wpisu w `/etc/hosts` możesz otworzyć `http://localhost` – Caddy domyślnie przekieruje Cię na frontend).*

### Krok 2: Uruchomienie kontenerów
```bash
cd backend
docker compose up -d --build
```

### Krok 3: Sprawdzenie stanu usług
```bash
# Logi wszystkich kontenerów
docker compose logs -f

# Sprawdzenie bramy Caddy i frontendu
curl -I http://accessible.krakow.local/

# Sprawdzenie serwera API (Hono)
curl http://api.accessible.krakow.local/status
# Odpowiedź: OK

# Sprawdzenie silnika GraphHopper
curl http://hopper.accessible.krakow.local/health
# Odpowiedź: {"status":"clean"}
```

---

## 3. Przełączenie na produkcję (Domena `.pl` i HTTPS)

Caddyfile w tym katalogu ([`Caddyfile`](file:///home/guzio/Dokumenty/Projekty/BZM-projekt1/backend/Caddyfile)) został zaprojektowany tak, aby wdrożenie produkcyjne dla Urzędu Miasta Krakowa wymagało jedynie dwóch prostych zmian:
1. Zmiany protokołu `http://` na `https://`
2. Zmiany końcówki domen `.local` na `.pl`

Przykład konfiguracji produkcyjnej w `Caddyfile`:
```caddy
https://accessible.krakow.pl {
    reverse_proxy frontend:80
}

https://api.accessible.krakow.pl {
    reverse_proxy api:3000
}

https://hopper.accessible.krakow.pl {
    reverse_proxy graphhopper:8989
}
```
Caddy automatycznie wygeneruje i odnowi darmowe certyfikaty SSL/TLS (Let's Encrypt / ZeroSSL) bez potrzeby zewnętrznych skryptów certbot.

---

## 4. Dane mapowe GraphHopper

- Domyślnie kontener startuje z próbką krakowskiego Starego Miasta (`data/krakow-sample.osm`).
- Aby załadować pełną mapę województwa małopolskiego (~200 MB), uruchom:
  ```bash
  ./download-data.sh
  docker compose restart graphhopper
  ```

**Szczegóły:**


## 5. Backend routingowy GraphHopper

Samodzielnie hostowany silnik routingu pieszych z obsługą dynamicznych wag (`custom_model`), uwzględniający kryteria dostępności miejskiej (schody, nawierzchnie, szerokości, krawężniki).

### Wymagania
- Docker & Docker Compose
- Port 8989 wolny na hoście

### Szybki start (Z małym wycinkiem Krakowa)
W katalogu `backend/data/` znajduje się próbka `krakow-sample.osm` (Stare Miasto w Krakowie).
Aby natychmiast uruchomić silnik:
```bash
docker compose up -d
```
Sprawdzenie statusu i logów:
```bash
docker compose logs -f
curl http://localhost:8989/health
```

### Pobranie pełnego wycinka Małopolski (Geofabrik)
Przed prezentacją lub pełnymi testami pobierz wyciąg `malopolskie-latest.osm.pbf` (~200 MB):
```bash
./download-data.sh
docker compose up -d
```
Skrypt automatycznie pobiera plik do `backend/data/malopolskie-latest.osm.pbf`, czyści ewentualny stary `graph-cache` i instruuje o ponownym starcie kontenera.

### Dynamiczne wagi (Custom Models)
GraphHopper działa z wyłączonym Contraction Hierarchies (`profiles_ch: []`), co pozwala na aplikowanie modeli JSON w locie:
- Parametr w zapytaniu: `"ch.disable": true`
- Przekazywanie wag:
  ```json
  {
    "points": [[19.9365, 50.0615], [19.9375, 50.0625]],
    "profile": "foot",
    "ch.disable": true,
    "points_encoded": false,
    "details": ["surface", "smoothness", "max_width", "footway", "road_class"],
    "custom_model": {
      "priority": [
        { "if": "road_class == STEPS", "multiply_by": "0.0" },
        { "if": "surface == COBBLESTONE", "multiply_by": "0.1" }
      ]
    }
  }
  ```

### Forgiving Routing
Brak danych o nawierzchni lub szerokości w OSM nie blokuje trasy – reguły penalizują wyłącznie jawnie zamapowane przeszkody (np. `road_class == STEPS` czy nawierzchnie brukowe/nieutwardzone).
