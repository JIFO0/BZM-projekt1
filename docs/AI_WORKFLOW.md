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
   - Pliki PDF z wytycznymi zadania *Cracow Without Barriers*.
3. **Zasady Expo i React Native:** Standardy Expo SDK 55, Expo Router, TypeScript strict, zakaz tworzenia ręcznych katalogów `android/` i `ios/` (Continuous Native Generation).

---

## 3. Metodologia weryfikacji i testowania wytworzonego kodu

Żaden fragment kodu nie został zaakceptowany bez automatycznej weryfikacji i testów:

1. **Statyczna analiza typów (Typecheck):**
   `npm run typecheck` (`tsc --noEmit` we wszystkich pakietach roboczych monorepo) – 0 błędów typowania.
2. **Linter jakości kodu (ESLint):**
   `npm run lint` (`expo lint`) – 0 błędów i 0 ostrzeżeń.
3. **Testy jednostkowe (Jest):**
   `npm test` – **11 zestawów testowych, 36 testów jednostkowych** badających warunki brzegowe (T1–T8: wykrywanie schodów, ocena krawężników, wykrywanie sprzeczności R7, przedawnienia R8, odporność na awarie R12, walidacja JSON Schema).
4. **Weryfikacja CLI i snapshotu:**
   Uruchomienie skryptu walidacji snapshotu offline weryfikującego integralność danych demonstracyjnych.

---

## 4. Ograniczenia i odpowiedzialność ludzka

- Wszystkie decyzje produktowe (progi parametrów dla profilu wózka i wózka dziecięcego, bufor korytarza 18 metrów, minimalne pokrycie danych 0.8) zostały podjęte przez zespół projektowy i są w pełni edytowalne w pliku konfiguracyjnym `cities/krakow.json`.
- Kod źródłowy jest czytelny, zwięzły, wolny od nieudokumentowanych bibliotek i gotowy do obrony przed jury konkursowym.
