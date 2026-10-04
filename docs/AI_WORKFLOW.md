# Ujawnienie Wykorzystania Sztucznej Inteligencji (AI Workflow Disclosure)

Zgodnie z wymaganiami regulaminu konkursu HackYeah 2026 (Sekcja 8 L5 wytycznych), niniejszy dokument opisuje narzędzia AI, główne zapytania, procedurę weryfikacji i testowania oraz ograniczenia.

---

## 1. Wykorzystane narzędzia i modele AI

- **Środowiska programistyczne:** Antigravity IDE / Cursor.
- **Wykorzystane modele językowe:** Gemini 3.8 Flash (Advanced Agentic Coding), Grok 4.7.
- **Rola AI:** Pair programming, asystent pisania czystego kodu TypeScript, generowanie testów jednostkowych dla algorytmów geometrycznych, redakcja dokumentacji technicznej i scenariusza prezentacji.

---

## 2. Główne instrukcje i wytyczne (Prompty)

1. **Główny prompt konkursowy:** *„STRICT PROMPT: Kraków bez barier (React Native + Expo)”* definiujący rygorystyczne wymagania architektoniczne, zasadę *Never colour alone*, brak pytań o niepełnosprawność, ujednolicony model faktu oraz obsługę awarii.
2. **Kryteria regulaminowe HackYeah 2026:**
   - `tasks/HackYeah 2026 - Rules for Participants/kraków streszcz.txt`
   - Wytyczne wyzwania Huawei / OpenHarmony: *Imagine what's next (Human-Centric Technology)* – celowanie w API 20+, wykorzystanie natywnych usług systemowych oraz weryfikowalność paczki `.hap`.
3. **Zasady Expo i React Native:** Standardy Expo SDK 55, Expo Router, TypeScript strict, zakaz tworzenia ręcznych katalogów `android/` i `ios/` (Continuous Native Generation).
4. **Integracja OpenHarmony / HarmonyOS:**
   - Kontener ArkTS / ArkUI w module `entry/` (API 24, DevEco Studio 6.1.1).
   - Mostek JavaScriptProxy (`HarmonyBridge`) łączący webowy frontend z natywnym modułem `@kit.SensorServiceKit` (`vibrator`).
   - Implementacja subtelnego, dotykowego sprzężenia zwrotnego (haptic feedback) dla kluczowych akcji dostępnościowych (znalezienie trasy, zgłoszenie przeszkody, centrowanie GPS).

---

## 3. Metodologia weryfikacji i testowania wytworzonego kodu

Żaden fragment kodu nie został zaakceptowany bez automatycznej weryfikacji i testów:

1. **Statyczna analiza typów (Typecheck):**
   `npm run typecheck` (`tsc --noEmit` we wszystkich pakietach roboczych monorepo) – 0 błędów typowania.
2. **Linter jakości kodu (ESLint):**
   `npm run lint` (`expo lint`) – 0 błędów i 0 ostrzeżeń.
3. **Testy jednostkowe (Jest):**
   `npm test` – **20 zestawów testowych, 121 testów jednostkowych** badających warunki brzegowe (T1–T8: wykrywanie schodów, ocena krawężników, wykrywanie sprzeczności R7, przedawnienia R8, odporność na awarie R12, walidacja JSON Schema, custom routing).
4. **Weryfikacja kompilacji OpenHarmony:**
   `npm run build:hap` – pełna kompilacja ArkTS i budowa paczki `entry/build/default/outputs/default/entry-default-unsigned.hap` (API 24, BUILD SUCCESSFUL).
5. **Weryfikacja CLI i snapshotu:**
   Uruchomienie skryptu walidacji snapshotu offline weryfikującego integralność danych demonstracyjnych.

---

## 4. Ograniczenia i odpowiedzialność ludzka

- Wszystkie decyzje produktowe (progi parametrów dla profilu wózka i wózka dziecięcego, bufor korytarza 18 metrów, minimalne pokrycie danych 0.8, czasy trwania impulsów haptycznych 30-55 ms) zostały podjęte przez zespół projektowy i są w pełni edytowalne w pliku konfiguracyjnym `cities/krakow.json` oraz serwisie `apps/mobile/src/services/haptics.ts`.
- Kod źródłowy jest czytelny, zwięzły, wolny od nieudokumentowanych bibliotek i gotowy do obrony przed jury konkursowym.
