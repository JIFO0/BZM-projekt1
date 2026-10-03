# Backend routingowy GraphHopper dla projektu "Kraków bez barier"

Samodzielnie hostowany silnik routingu pieszych z obsługą dynamicznych wag (`custom_model`), uwzględniający kryteria dostępności miejskiej (schody, nawierzchnie, szerokości, krawężniki).

## Wymagania
- Docker & Docker Compose
- Port 8989 wolny na hoście

## Szybki start (Z małym wycinkiem Krakowa)
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

## Pobranie pełnego wycinka Małopolski (Geofabrik)
Przed prezentacją lub pełnymi testami pobierz wyciąg `malopolskie-latest.osm.pbf` (~200 MB):
```bash
./download-data.sh
docker compose up -d
```
Skrypt automatycznie pobiera plik do `backend/data/malopolskie-latest.osm.pbf`, czyści ewentualny stary `graph-cache` i instruuje o ponownym starcie kontenera.

## Dynamiczne wagi (Custom Models)
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

## Forgiving Routing
Brak danych o nawierzchni lub szerokości w OSM nie blokuje trasy – reguły penalizują wyłącznie jawnie zamapowane przeszkody (np. `road_class == STEPS` czy nawierzchnie brukowe/nieutwardzone).
