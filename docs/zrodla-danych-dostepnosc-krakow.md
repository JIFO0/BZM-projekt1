# Źródła danych o dostępności dla osób niepełnosprawnych w Krakowie

> Dokument na potrzeby opensourcowego projektu. Wszystkie źródła poniżej udostępniają dane publicznie lub poprzez oficjalne API — ich użycie jest legalne przy zachowaniu podanych licencji i zasad atrybucji.

---

## 1. OpenStreetMap (OSM) — Overpass API

**Status prawny:** ✅ W pełni otwarta licencja **ODbL v1.0** — idealna dla open source  
**URL:** https://www.openstreetmap.org / https://overpass-turbo.eu  
**API endpoint:** `https://overpass-api.de/api/interpreter`

### Co zawiera (tagi istotne dla dostępności)
| Tag | Znaczenie |
|-----|-----------|
| `wheelchair=yes/limited/no` | Ogólna dostępność dla wózków |
| `kerb=lowered/raised/flush` | Obniżone krawężniki |
| `tactile_paving=yes/no` | Chodniki dotykowe / płyty prowadzące |
| `ramp=yes` | Rampy wjazdowe |
| `elevator=yes` | Windy |
| `toilet:wheelchair=yes` | Toalety przystosowane |
| `surface=asphalt/cobblestone/...` | Nawierzchnia (ważne dla wózków) |
| `incline=*` | Nachylenie terenu |

### Przykładowe zapytanie Overpass QL — miejsca dostępne w Krakowie
```
[out:json][timeout:60];
area[name="Kraków"]->.searchArea;
(
  nwr["wheelchair"="yes"](area.searchArea);
  nwr["wheelchair"="limited"](area.searchArea);
);
out body;
>;
out skel qt;
```

### Zapytanie — obniżone krawężniki i płyty prowadzące
```
[out:json][timeout:60];
area[name="Kraków"]->.searchArea;
(
  node["kerb"="lowered"](area.searchArea);
  node["tactile_paving"="yes"](area.searchArea);
);
out body;
>;
out skel qt;
```

### Wymagania licencyjne
- Atrybucja: `© OpenStreetMap contributors`
- Link do: https://openstreetmap.org/copyright
- Jeśli tworzysz pochodną bazę danych → musisz udostępnić ją też na ODbL

---

## 2. Portal Otwartych Danych Krakowa (UM Kraków)

**Status prawny:** ✅ Dane sektora publicznego — ponowne wykorzystanie dozwolone  
**URL:** https://otwartedane.um.krakow.pl  
**Format:** GeoJSON, SHP (Shapefile), WFS, WMS

### Co może być dostępne (do weryfikacji na portalu)
- Warstwy GIS infrastruktury pieszej (Standardy Infrastruktury Pieszej Krakowa)
- Lokalizacje inwestycji drogowych (w tym dostosowania)
- Mapy stref i planowania przestrzennego

### Dostęp techniczny
- **WFS (Web Feature Service):** Pozwala na programatyczne pobieranie warstw przestrzennych
- **WMS:** Tylko wizualizacja (obrazy kafelkowe)
- **Pobieranie plików:** GeoJSON / SHP przez interfejs portalu

### Jak korzystać z WFS
```
https://msip.um.krakow.pl/msip/geoserver/...?
  service=WFS
  &version=2.0.0
  &request=GetFeature
  &typeName=<nazwa_warstwy>
  &outputFormat=application/json
```

> **Uwaga:** Konkretne nazwy warstw trzeba pobrać z katalogu MSIP: https://msip.krakow.pl

---

## 3. MSIP — Miejski System Informacji Przestrzennej

**Status prawny:** ✅ Dane publiczne UM Kraków  
**URL:** https://msip.krakow.pl  
**Format:** WFS, WMS, GeoJSON, SHP, DXF

### Co zawiera (warstwy GIS)
- Infrastruktura drogowa i chodniki
- Parkingi (w tym koperty dla niepełnosprawnych)
- Budynki użyteczności publicznej
- Zieleń miejska, obiekty małej architektury

### Jak pobrać dane
1. Wejdź na https://msip.krakow.pl/katalog-danych
2. Wyszukaj interesującą warstwę (np. „parkingi", „chodniki")
3. Pobierz w formacie GeoJSON lub użyj linku WFS w swojej aplikacji

---

## 4. ZTP Kraków — Zarząd Transportu Publicznego (ArcGIS Hub)

**Status prawny:** ✅ Otwarte dane publiczne  
**URL:** https://ztp.krakow.pl/dane-otwarte  
**Platform:** ArcGIS Hub  
**Format:** GeoJSON, CSV, KML, Shapefile, WFS/WMS

### Dostępne zbiory danych
| Zbiór | Relevancja dla dostępności |
|-------|---------------------------|
| Lokalizacje wiat przystankowych | Dostępność przystanków |
| Mapy dojść pieszych do przystanków | Trasy piesze, bariery |
| Punkty mobilności (rowery, P+R) | Intermodalność |
| Strefy płatnego parkowania | Lokalizacja kopert |
| Parkingi P+R z napełnieniem | Real-time |
| Elementy Systemu Informacji Miejskiej (SIM) | Tablice, słupki |

### Dane GTFS (rozkłady jazdy)
**URL:** https://gtfs.ztp.krakow.pl  
**Format:** GTFS Static + GTFS Realtime  
Zawiera informacje o przystankach i połączeniach, które można łączyć z danymi o dostępności.

### Mapa kopert parkingowych (ZDMK)
**Prowadzący:** Zarząd Dróg Miasta Krakowa  
**Platforma:** ArcGIS Online  
Oficjalna mapa miejsc parkingowych dla osób z niepełnosprawnościami — dostępna przez serwis ArcGIS (link aktualizowany w aktualnościach na zdmk.krakow.pl).

---

## 5. BIP i Magiczny Kraków — Dostępność architektoniczna budynków publicznych

**Status prawny:** ✅ Informacja publiczna — ponowne wykorzystanie dozwolone  
**URL:** https://bip.krakow.pl / https://www.krakow.pl (Magiczny Kraków)

### Co zawierają
Każda jednostka publiczna ma obowiązek (ustawa o dostępności cyfrowej, Dz.U. 2019 poz. 848) publikować **Deklarację Dostępności** zawierającą:
- Dostępność architektoniczna budynku (podjazdy, windy, platformy przyschodowe, schodołazy)
- Dostępność informacyjno-komunikacyjna (pętle indukcyjne, tłumacz języka migowego)
- Przystosowanie toalet
- Możliwość obsługi poza budynkiem

### Główne lokalizacje danych
- **UM Kraków (wszystkie wydziały):** https://www.krakow.pl/dostepnosc
- **Raport o stanie zapewniania dostępności:** https://bip.krakow.pl (publikowany co 3 lata)
- **Sprawyspoleczne.krakow.pl:** Dane dot. wsparcia osób z niepełnosprawnościami

### Jak scraping jest tu legalny
- Dane są informacją publiczną (art. 61 Konstytucji RP)
- Ustawa o ponownym wykorzystywaniu informacji sektora publicznego (Dz.U. 2016 poz. 352 ze zm.) gwarantuje prawo do dalszego użycia
- Projekt non-profit / open source — najniższe ryzyko prawne
- ⚠️ Unikaj pobierania danych osobowych (imiona/nazwiska urzędników)

---

## 6. Dostępna Małopolska

**Status prawny:** ✅ Portal publiczny, dane informacyjne  
**URL:** https://dostepna.malopolska.pl

### Co zawiera
- Deklaracje dostępności podmiotów z całego regionu
- Raporty o stanie dostępności
- Baza instytucji z informacją o ich dostępności architektonicznej

---

## Podsumowanie — Które źródło do czego

| Źródło | Typ danych | Licencja | Sposób dostępu | Priorytet |
|--------|-----------|---------|---------------|-----------|
| **OpenStreetMap** | POI, infrastruktura, atrybuty dostępności | ODbL | Overpass API | ⭐⭐⭐ Wysoki |
| **Portal Otwartych Danych UM** | GIS, infrastruktura | Open Gov | WFS / pobieranie | ⭐⭐⭐ Wysoki |
| **MSIP** | Warstwy przestrzenne | Open Gov | WFS / pobieranie | ⭐⭐ Średni |
| **ZTP / ArcGIS Hub** | Transport, przystanki | Open Gov | REST API / pobieranie | ⭐⭐⭐ Wysoki |
| **GTFS ZTP** | Rozkłady jazdy | Open | GTFS feed | ⭐⭐ Średni |
| **BIP / Magiczny Kraków** | Dostępność budynków | Inf. publiczna | Scraping HTML | ⭐⭐ Średni |
| **Dostępna Małopolska** | Deklaracje dostępności | Inf. publiczna | Scraping HTML | ⭐ Niski |

---

## Uwagi prawne i techniczne

### Zasady scrapingu
1. **Sprawdź `robots.txt`** każdej strony przed scrapingiem
2. **Nie przeciążaj serwerów** — stosuj opóźnienia między requestami (min. 1s)
3. **Używaj API gdzie dostępne** — zamiast scrapować HTML
4. **Nie zbieraj danych osobowych** — tylko dane o miejscach/infrastrukturze
5. **Dodaj User-Agent** identyfikujący projekt w nagłówkach HTTP

### Atrybucja wymagana w projekcie
```
Dane: © OpenStreetMap contributors (ODbL)
Dane miejskie: Urząd Miasta Krakowa, ZTP Kraków
Dane przestrzenne: MSIP Kraków
```

### Przydatne narzędzia do pobierania danych OSM
- **Overpass Turbo** (GUI): https://overpass-turbo.eu
- **osmium-tool** (CLI): do przetwarzania dużych plików OSM
- **osm2geojson** (Python/JS): konwersja do GeoJSON
- **pyrosm** (Python): wczytywanie danych OSM do GeoPandas

---

*Ostatnia aktualizacja: październik 2026*
