# Źródła danych

Publiczne opublikowanie zbioru nie oznacza zgody na komercyjne pobieranie. Poniżej są tylko źródła, których dokumentację sprawdzono 3 października 2026. Żadne z nich nie jest jeszcze odpytywane z aplikacji.

## Mapy.com REST API

- Pochodzenie: Seznam.cz / Mapy.com, [jak zacząć](https://developer.mapy.com/rest-api-mapy-cz/how-to-start/).
- Routing: [opis](https://developer.mapy.com/rest-api-mapy-cz/function/routing/), OpenAPI `https://api.mapy.com/v1/docs/routing/openapi.json` (wersja 2.1.14). `GET /v1/routing/route`. Typy: `car_fast`, `car_fast_traffic`, `car_short`, `foot_fast`, `foot_hiking`, `bike_road`, `bike_mountain`. Używamy `foot_fast`.
- Geokodowanie: [opis](https://developer.mapy.com/rest-api-mapy-cz/function/geocoding/), OpenAPI `https://api.mapy.com/v1/docs/geocode/openapi.json`. `GET /v1/geocode`, `GET /v1/suggest`, `GET /v1/rgeocode`.
- Uwierzytelnienie: nagłówek `X-Mapy-Api-Key` albo query `apikey`. W kodzie jest tylko nagłówek.
- Kafelki: [opis](https://developer.mapy.com/rest-api-mapy-cz/function/map-tiles/). Zestawy: `basic`, `outdoor`, `aerial`, `names-overlay`, `winter`. Metadane zestawu zwraca tiles.json. Dokładnej ścieżki nie zapisujemy, bo OpenAPI kafelków zwróciło HTTP 500.
- Atrybucja: [strona atrybucji](https://developer.mapy.com/rest-api-mapy-cz/atribution/). Logo `https://api.mapy.com/img/api/logo.svg` (min. 30 px nad mapą, 10 px poza mapą), link `https://mapy.com/`, tekst „Seznam.cz a.s. and others” z linkiem `https://api.mapy.com/copyright`. Dotyczy też routingu i podpowiedzi, nie tylko mapy.
- Limity: routing 30 żądań/s (OpenAPI). Geokodowanie 100 żądań/s, reverse geocode w opisie OpenAPI podaje 200 i niżej 100 — bierzemy ostrożniej 100. Darmowe kredyty: 250 000 w taryfie Basic według [how to start](https://developer.mapy.com/rest-api-mapy-cz/how-to-start/).
- Awaria: 401, 403, 404, 422, 5xx, timeout i nie-JSON stają się `SourceFailure`. To nie jest pusta lista barier.
- Klucz w aplikacji klienckiej da się wyciągnąć. Ograniczyć go w portalu Mapy.com. Docelowo cienki proxy.

## OpenStreetMap przez Overpass

- Dane: [copyright OSM](https://www.openstreetmap.org/copyright), licencja ODbL (`https://opendatacommons.org/licenses/odbl/`).
- API: główna instancja `https://overpass-api.de/api/interpreter`, [wiki](https://wiki.openstreetmap.org/wiki/Overpass_API).
- Zasady z wiki: poniżej 10 000 zapytań i 1 GB dziennie przy jednorazowym użyciu; przy stałej aplikacji dzielić to przez 100. User-Agent identyfikujący aplikację. Bez równoległych skryptów. Po 429 lub 406 odczekać. Użycie komercyjne powinno iść na własną albo płatną instancję. Serwer bywa przeciążony.
- Data ostatniej edycji obiektu nie jest datą potwierdzenia dostępności.
- Tagi OSM (schody, krawężnik, nawierzchnia) nie zostały jeszcze skonfrontowane z wiki. Nie ma jeszcze zapytania Overpass.
- Awaria Overpass: komunikat, że nie udało się pobrać danych. Nie komunikat „brak barier”.

## Kafelki OSM — tylko ewentualne demo

[Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) dla `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. Obowiązkowa atrybucja, własny User-Agent, cache, zakaz zgrywania offline. Domyślne kafelki prototypu to Mapy.com, nie ten serwer.

## Źródła z briefu miasta, jeszcze nieużyte

Można je dodać jako kolejne adaptery po sprawdzeniu konkretnego zbioru i licencji. Samo istnienie portalu nie wystarcza.

- Portal Otwarte Dane Krakowa: https://otwartedane.um.krakow.pl
- MSIP: https://msip.krakow.pl (WMS/WFS — warunki per zasób)
- dane.gov.pl: https://dane.gov.pl

Żaden z tych portali nie jest podłączony. Rozwiązanie nie zakłada dostępu do systemów wewnętrznych UMK ani MJO.
