# Wykaz licencji bibliotek zewnętrznych (Third-Party Licenses)

Zgodnie z wymaganiami regulaminu konkursu HackYeah 2026 i zasadami przekazania autorskich praw majątkowych na rzecz Gminy Miejskiej Kraków (Sekcja 8 wytycznych), projekt korzysta **wyłącznie z oprogramowania na licencjach permissywnych** (MIT, Apache-2.0, BSD, ISC). Nie użyto żadnych bibliotek na licencjach copyleft (GPL / AGPL).

---

## 1. Zależności bezpośrednie w `apps/mobile`

| Pakiet | Wersja | Licencja | Przeznaczenie |
| :--- | :---: | :---: | :--- |
| `expo` | `~55.0.31` | **MIT** | Główny framework aplikacji mobilnej |
| `expo-router` | `~55.0.18` | **MIT** | Deklaratywny system nawigacji oparty o strukturę plików |
| `expo-status-bar` | `~55.0.6` | **MIT** | Kontrola paska stanu urządzenia |
| `expo-speech` | `~55.0.0` | **MIT** | Synteza mowy dla czytania audiodeskrypcji (WOW) |
| `react-native-webview` | `~13.13.5` | **MIT** | Komponent do bezpiecznego renderowania widoków internetowych i map |
| `react-native` | `0.83.10` | **MIT** | Silnik komponentów natywnych |
| `react` | `19.2.0` | **MIT** | Biblioteka UI |
| `react-native-safe-area-context` | `~5.6.2` | **MIT** | Obsługa wycięć ekranu (notch / safe area) |
| `react-native-screens` | `~4.23.0` | **MIT** | Natywna optymalizacja pamięciowa ekranów |
| `react-native-gesture-handler` | `~2.30.0` | **MIT** | Wydajna obsługa gestów dotykowych |

---

## 2. Pakiety pomocnicze i deweloperskie (DevDependencies)

| Pakiet | Wersja | Licencja | Przeznaczenie |
| :--- | :---: | :---: | :--- |
| `typescript` | `~5.9.2` | **Apache-2.0** | Statyczna analiza typów |
| `jest` | `^29.7.0` | **MIT** | Środowisko testów jednostkowych |
| `ts-jest` | `^29.4.1` | **MIT** | Transpiler TypeScript dla testów Jest |
| `eslint` | `^9.39.5` | **MIT** | Analizator jakości kodu |
| `eslint-config-expo` | `~55.0.1` | **MIT** | Reguły lintera dla projektów Expo |
| `@types/jest` | `^29.5.14` | **MIT** | Definicje typów dla testów Jest |
| `@types/node` | `^26.6.4` | **MIT** | Typy środowiska uruchomieniowego Node.js |

---

## 3. Źródła danych i warunki licencyjne

| Źródło | Właściciel | Licencja / Regulamin | Wymogi atrybucji |
| :--- | :--- | :--- | :--- |
| **OpenStreetMap** | OpenStreetMap Foundation | **Open Database License (ODbL) 1.0** | Wymagany napis: *„© OpenStreetMap contributors”* z linkiem do https://www.openstreetmap.org/copyright |
| **Mapy.com API** | Seznam.cz, a.s. | **Regulamin API Mapy.cz / Mapy.com** | Wymagane wyświetlanie logo Mapy.com oraz odnośnika do strony operatora |
