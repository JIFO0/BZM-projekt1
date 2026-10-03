# Kraków bez barier

Prototyp mobilny na HackYeah 2026, wyzwanie *Cracow without barriers*. Aplikacja ma pomóc osobie na wózku albo rodzicowi z wózkiem dziecięcym ocenić trasę pieszą w Krakowie po konkretnych barierach, a nie po etykiecie „dostępne / niedostępne”.

To jest fundament (monorepo, model faktu, progi profili, szkielet ekranów). Analiza trasy na żywych danych OSM i Mapy.com **nie jest jeszcze podłączona**. Brak wyniku na ekranie wyszukiwania nie oznacza, że trasa jest dostępna.

## English

Mobile prototype for the HackYeah 2026 challenge. Walking routes will come from Mapy.com and then be checked against OpenStreetMap. Missing data must stay missing. This repository currently contains the foundation only: workspaces, the fact model, profile thresholds, and a small Expo shell.

## Jak uruchomić

Wymagane: Node.js z npm (projekt używa `package-lock.json`, nie Bun). Expo SDK **55** (`expo` ~55.0.31).

```bash
npm install
cp .env.example apps/mobile/.env
npm run verify
npm start
```

W `apps/mobile/.env` wstaw klucz z [developer.mapy.com](https://developer.mapy.com/rest-api-mapy-cz/how-to-start/). Bez klucza ekrany profilu i „O danych” i tak się otwierają, bo jeszcze nie wołają API.

Aplikacja startuje z `apps/mobile` przez Expo Router. Mapa nie jest jeszcze podłączona. Docelowa biblioteka to `react-native-maps`, bo jest w Expo Go na SDK 55 ([dokumentacja](https://docs.expo.dev/versions/v55.0.0/sdk/map-view)). Nie sprawdzono jej jeszcze na urządzeniu.

## Co już jest

- Monorepo npm: `apps/mobile`, `packages/core`, `packages/sources`, `packages/cli`.
- Konfiguracja miasta tylko w `cities/krakow.json`.
- Reguły: nieznane nie jest „OK”, konflikt zostawia obie wartości, data edycji OSM nie jest datą potwierdzenia.
- Ekran profilu (wózek / wózek dziecięcy / własne progi) bez pytania o niepełnosprawność.
- Ekran „O danych” z atrybucją Mapy.com i OpenStreetMap.

## Czego jeszcze nie ma

Trasa A→B, lista barier, pokrycie danych, karta miejsca, zgłoszenie poprawki, panel symulacji awarii, snapshot CLI, test na czytniku ekranu. Szczegóły w `docs/ARCHITECTURE.md`.

## Testy

`npm run verify` uruchamia typecheck, lint i testy jednostkowe bez sieci i bez klucza API.
