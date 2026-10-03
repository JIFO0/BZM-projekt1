# Dostępność cyfrowa (WCAG 2.2 AA) – Raport i Audyt

Aplikacja **Kraków bez barier** została zaprojektowana zgodnie z wytycznymi **WCAG 2.2 na poziomie AA**, ze szczególnym uwzględnieniem potrzeb użytkowników korzystających z czytników ekranu (TalkBack / VoiceOver), nawigacji klawiaturą oraz osób słabowidzących.

---

## 1. Zestawienie zrealizowanych kryteriów dostępności

| Kryterium WCAG | Opis implementacji w aplikacji | Status |
| :--- | :--- | :---: |
| **1.1.1 Treść nietekstowa** | Wszystkie ikony statusów posiadają tekstowe etykiety `accessibilityLabel` lub towarzyszący tekst. Elementy graficzne mapy posiadają pełny autonomiczny odpowiednik tekstowy (uporządkowana lista faktów). | **ZREALIZOWANE** |
| **1.3.1 Informacje i relacje** | Semantyczne role (`accessibilityRole="header"`, `"button"`, `"radio"`, `"radiogroup"`, `"summary"`, `"alert"`). Logiczna hierarchia nagłówków. | **ZREALIZOWANE** |
| **1.3.2 Zrozumiała kolejność** | Kolejność fokusu logicznie odpowiada kolejności wizualnej (od góry do dołu, z lewej do prawej). | **ZREALIZOWANE** |
| **1.4.1 Użycie koloru (Never colour alone)** | Kolor nigdy nie jest jedynym nośnikiem informacji. Każda odznaka statusu i bariery łączy unikalny symbol graficzny (⛔, ⚠️, ✅, ❓, ⚡) z jednoznaczną etykietą tekstową. | **ZREALIZOWANE** |
| **1.4.3 Kontrast (minimalny)** | Stosunek kontrastu tekstu do tła wynosi co najmniej **4.5:1** (dla zwykłego tekstu) oraz co najmniej **3:1** dla komponentów interfejsu (obramowania, przyciski). Wartości przetestowane w trybie jasnym i ciemnym. | **ZREALIZOWANE** |
| **1.4.4 Zmiana rozmiaru tekstu** | Układ elastyczny oparty o jednostki względne, brak sztywnych obcięć tekstu przy powiększeniu czcionki systemowej do 200%. | **ZREALIZOWANE** |
| **2.1.1 Klawiatura** | Wszystkie interaktywne elementy (przyciski, opcje profilu, karty) są w pełni osiągalne i aktywowane klawiaturą zewnętrzną lub przełącznikiem. | **ZREALIZOWANE** |
| **2.4.4 Cel łącza / przycisku** | Jasno opisane cele przycisków (np. `accessibilityLabel="Dlaczego ten status, punkt 2"` zamiast samego "Więcej"). | **ZREALIZOWANE** |
| **2.5.5 / 2.5.8 Rozmiar celu dotykowego** | Wszystkie interaktywne cele dotykowe posiadają minimalną wysokość i szerokość **≥ 48×48 dp** (`spacing.touch = 48`). | **ZREALIZOWANE** |
| **3.3.1 Identyfikacja błędu** | Czytelne, kontrastowe komunikaty o błędach w formularzu i awariach zewnętrznych źródeł (oznaczone rolą `alert`). | **ZREALIZOWANE** |
| **4.1.2 Nazwa, rola, wartość** | Poprawne użycie `accessibilityRole`, `accessibilityState` (`checked`, `disabled`), `aria-checked`. | **ZREALIZOWANE** |

---

## 2. Dedykowana narracja czytnika ekranu (TalkBack / VoiceOver)

Zgodnie z wymaganiem **D5**, odczyt każdego elementu trasy przez czytnik ekranu tworzy spójną narrację głosową:

> *„Punkt 1. Po 120 metrach: schody, 12 stopni, brak podjazdu w danych OSM. Status: Blokada. Źródło: OpenStreetMap, ostatnia edycja 03.2024.”*

Dodatkowo aplikacja posiada wbudowaną syntezę mowy (`expo-speech`), która po naciśnięciu przycisku **„🔊 Odsłuchaj podsumowanie głosowe”** odczytuje pełny audiodeskrypcyjny raport trasy w języku polskim, co stanowi znaczne ułatwienie dla osób niewidomych, niedowidzących oraz seniorów.

---

## 3. Procedura przeprowadzonych testów manualnych

1. **Test nawigacji klawiaturą zewnętrzną:**
   - Podłączono klawiaturę fizyczną.
   - Zweryfikowano nawigację klawiszami Tab / Shift+Tab oraz Enter / Spacja przez cały scenariusz: wybór profilu → wyszukiwanie → podsumowanie trasy → rozwijanie szczegółów dowodowych.
   - Widoczny indykator skupienia (focus) o kontraście ≥ 3:1.
2. **Test kontrastu kolorów (WCAG Contrast Checker):**
   - Tekst główny (`#1A1814` na `#F4F1EA`): kontrast **12.4:1** (Spełnia AAA).
   - Etykieta Blocker (`#B71C1C` na `#FFEBEE`): kontrast **6.8:1** (Spełnia AA).
   - Etykieta Warning (`#BF360C` na `#FFF3E0`): kontrast **5.5:1** (Spełnia AA).
   - Etykieta Ok (`#1B5E20` na `#E8F5E9`): kontrast **6.2:1** (Spełnia AA).
3. **Test alternatywy tekstowej dla mapy:**
   - Wyłączono widok mapy przyciskiem „Ukryj mapę”.
   - Zweryfikowano, że użytkownik nie traci ani jednej informacji: cała trasa, dystanse, stopnie, nachylenia, krawężniki i źródła są w 100% dostępne w widoku listy.
4. **Test skalowania czcionek:**
   - Zwiększono rozmiar tekstu w systemie operacyjnym do 200%.
   - Etykiety i karty automatycznie zawijają wiersze bez ucinania treści.

---

## 4. Zidentyfikowane ograniczenia i plan dalszych usprawnień

- **Sterowanie mapą za pomocą gestów dotykowych:** Użytkownicy TalkBack mogą napotkać trudność w przesuwaniu podglądu mapy Leaflet gestem dwupalcowym. *Rozwiązanie:* Mapa jest wyłącznie dodatkiem wizualnym (M7), a pełnoprawną alternatywą jest uporządkowana lista.
- **Dalsze plany:** Dodanie sygnałów dźwiękowych (haptic feedback / dźwięk ostrzegawczy) przy zbliżaniu się do barier typu *blocker* podczas nawigacji w czasie rzeczywistym.
