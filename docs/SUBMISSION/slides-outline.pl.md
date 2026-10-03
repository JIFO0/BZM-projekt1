# Prezentacja Konkursowa (Plan Slajdów ≤ 10) – Kraków bez barier

Plan prezentacji przygotowany na finał HackYeah 2026 w kategorii *Cracow Without Barriers*. Układ precyzyjnie odpowiada kryteriom oceniania regulaminu (Pomysł 30% · Technika 30% · Architektura i skalowalność 20% · Relacja z kategorią 10% · Efekt WOW 10%).

---

### Slajd 1: Tytuł i Misja (Relacja z kategorią 10%)
- **Tytuł:** Kraków bez barier – Prawdziwa dostępność bez fałszywych obietnic.
- **Kluczowy przekaz:** Osoba z niepełnosprawnością lub rodzic z wózkiem nie potrzebuje zielonej plakietki „dostępne”, która zawodzi w terenie. Potrzebuje **rzetelnych, weryfikowalnych faktów o barierach z datą i źródłem**.
- **Identyfikator zespołu:** [TEAM ID] • Kategoria: Cracow Without Barriers.

---

### Slajd 2: Problem i Istota Rozwiązania (Pomysł 30%)
- **Problem:** Popularne aplikacje mapowe (Google Maps, Mapy.cz) wyznaczają trasy piesze, ale ignorują przeszkody architektoniczne (wysokie krawężniki, schody bez podjazdu, zabytkowy bruk). Z kolei aplikacje dedykowane często ukrywają brak danych pod fałszywym „OK”.
- **Nasza Innowacja:** Wykorzystujemy Mapy.com jako trasę *kandydacką*, a następnie badamy jej korytarz za pomocą bazy OpenStreetMap.
- **Złota reguła:** Brak danych to zawsze *„brak informacji”*, nigdy *„dostępne”*.

---

### Slajd 3: Profile i Poszanowanie Godności (Pomysł 30%)
- **Zero pytań o niepełnosprawność:** Użytkownik wybiera progi parametrów fizycznych (Wózek: schody = blokada, krawężnik ≤ 30 mm, omijanie kocich łbów i piasku; Profil własny: brak domyślnie blokowanych nawierzchni, indywidualne suwaki progów).
- **Całkowita prywatność:** Brak rejestracji, brak kont, brak przechowywania danych w chmurze – 100% lokalnie na urządzeniu.

---

### Slajd 4: Algorytm Analizy Trasy (Technika 30%)
- **Geometria korytarza:** Rzutowanie przestrzenne (haversine + segment projection) punktów i odcinków OSM na trasę z Mapy.com.
- **Klasyfikacja surowości:** Blocker / Warning / Info / Ok / Unknown w zależności od aktywnego profilu.
- **Pokrycie danych:** Jawny wskaźnik pokrycia (np. nawierzchnia znana dla 75% długości) oraz najdłuższy odcinek bez pomiarów.

---

### Slajd 5: Rozwiązywanie Konfliktów i Przedawnienia (Technika 30%)
- **Wykrywanie sprzeczności (R7):** Gdy budynek ma `wheelchair=yes`, ale wejście ma schody `wheelchair=no`, aplikacja prezentuje obie wartości ze statusem *Dane sprzeczne*.
- **Wykrywanie danych przedawnionych (R8):** Automatyczna flaga ostrzegawcza dla danych starszych niż 24 miesiące.
- **Odznaki statusu:** Zawsze ikona + tekst (Never colour alone).

---

### Slajd 6: Karta Miejsca i Match Confidence (Technika 30%)
- **4 grupy informacji:** *Wejście / Wnętrze / Toaleta / Otoczenie*.
- **Pewność dopasowania (Match Confidence):** Procentowa zgodność odległości i nazwy. Przy braku pewności aplikacja uczciwie informuje: *„Brak danych o dostępności”*, eliminując zgadywanie.

---

### Slajd 7: Architektura i Gotowość Wdrożeniowa (Architektura 20%)
- **Monorepo TypeScript:** Rygorystyczny podział – `packages/core` (czysta logika bez zależności od UI), `packages/sources` (adaptery Mapy.com i OSM), `apps/mobile` (Expo React Native).
- **100% testów:** 36 testów jednostkowych (T1–T8) badających wszystkie warunki brzegowe.
- **Odporność na awarie (R12):** Wbudowany offline demo snapshot dla Krakowa działający bez internetu i bez kluczy API.

---

### Slajd 8: Dostępność Cyfrowa (WCAG 2.2 AA)
- Pełna obsługa TalkBack / VoiceOver z audiodeskrypcyjną narracją każdego punktu trasy.
- Zapewniony wysoki kontrast (≥ 4.5:1), cele dotykowe ≥ 48 dp.
- Pełna alternatywa tekstowa – mapa jest dodatkiem, interfejs tekstowy jest całkowicie autonomiczny.

---

### Slajd 9: Skalowalność i Model dla Miasta (Architektura 20%)
- **Wdrożenie nowego miasta w 5 minut:** Wystarczy dodać plik `cities/<id>.json` z granicami i progami.
- **Model Backendless:** Zerowe koszty serwerów bazy danych dla UMK, proste utrzymanie i wdrożenie.
- **Kolejka poprawek (R11):** Integracja ze społecznością OpenStreetMap (OSM Notes) bez konieczności moderowania zgłoszeń przez urzędników.

---

### Slajd 10: Efekt WOW i Korzyści Biznesowe (WOW 10%)
- **WOW 1: Centrum Ułatwień Dostępności (WCAG 2.2 AAA):** Kompleksowe narzędzie z regulacją kontrastów, krojów dla dyslektyków, linijką czytania i pełną integracją z czytnikami ekranu.
- **WOW 2: Narzędzie dla krakowskiej turystyki:** Możliwość osadzenia widżetu w portalach krakowskich hoteli, muzeów i punktów InfoKraków.
- **Przekazanie praw:** Kod w 100% na licencjach permissywnych, w pełni gotowy do przekazania Gminie Miejskiej Kraków.
