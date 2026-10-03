# Scenariusz Wideo Demonstracyjnego (Demo Script ≤ 3 minuty)

Scenariusz nagrania wideo prezentującego działanie aplikacji **Kraków bez barier** w konkursie HackYeah 2026. Łączny czas: **2 minuty 50 sekund**.

---

### [0:00 – 0:25] Wprowadzenie i Wybór Profilu (Bez pytania o niepełnosprawność)
- **Ekran:** Ekran powitalny / wybór profilu (`/`).
- **Narracja lektora:**
  > *„Dzień dobry! Oto «Kraków bez barier» – aplikacja, która zamiast fałszywych zapewnień o dostępności, dostarcza rzetelne, zweryfikowane fakty o przeszkodach architektonicznych.*
  > *Na start wybieramy profil: Wózek lub Własny. Zauważcie: aplikacja nie pyta o stan zdrowia ani stopień niepełnosprawności, nie wymaga logowania i chroni naszą prywatność. Wybieramy profil Wózek, dla którego schody to bezwzględna blokada, próg krawężnika to maksymalnie 30 mm, a nawierzchnie takie jak kocie łby i piasek są omijane.”*
- **Akcja na ekranie:** Kliknięcie profilu „Wózek”, przejście przyciskiem „Przejdź do wyszukiwania”.

---

### [0:25 – 1:00] Wyszukanie Trasy i Podsumowanie Uczciwości Danych
- **Ekran:** Ekran wyszukiwania (`/search`) → Wynik trasy (`/route`).
- **Narracja lektora:**
  > *„Planujemy spacer z Rynku Głównego na Wawel przez ulicę Grodzką. Korzystamy z szybkiego wyboru trasy demonstracyjnej. Aplikacja pobiera geometrię trasy z Mapy.com, a następnie bada jej korytarz w bazie OpenStreetMap.*
  > *Oto podsumowanie trasy: 920 metrów, 1 wykryta blokada, 1 ostrzeżenie i 1 odcinek z brakującymi danymi. Zobaczcie: aplikacja wprost podaje wskaźnik pokrycia danych dla nawierzchni i krawężników oraz ostrzega o najdłuższym odcinku bez pomiarów. Nigdy nie ukrywa braku danych pod etykietą «dostępne».”*
- **Akcja na ekranie:** Kliknięcie „Trasa 1: Rynek Główny → Wawel”, wyświetlenie karty podsumowania, wskazanie wskaźników pokrycia.

---

### [1:00 – 1:30] Zestawienie Barier z Dowodami i Widok Mapy
- **Ekran:** Lista barier na trasie oraz przełącznik mapy.
- **Narracja lektora:**
  > *„Przeszkody są ułożone chronologicznie w kolejności marszu. Po 120 metrach: zabytkowy bruk na Rynku – ostrzeżenie o trudnej nawierzchni. Po 220 metrach: przejście przez ul. Franciszkańską – krawężnik 15 mm i pasy dotykowe. Status: zweryfikowany z datą badania.*
  > *Rozwińmy «Dlaczego taki status?»: widzimy identyfikator obiektu OSM, licencję ODbL i dokładne tagi. Przełączamy na mapę: korytarz trasy oraz ponumerowane pinezki barier odpowiadające liście.”*
- **Akcja na ekranie:** Rozwinięcie szczegółów dowodowych przy punkcie, kliknięcie „Pokaż mapę z barierami”, przesunięcie mapy.

---

### [1:30 – 1:55] Sprawdzenie Miejsca i Wykrywanie Konfliktów (R7)
- **Ekran:** Powrót do wyszukiwania → Zakładka „Sprawdź miejsce” → Sukiennice oraz Kamienica Grodzka.
- **Narracja lektora:**
  > *„Sprawdźmy konkretny obiekt: Sukiennice. Informacje są podzielone na 4 czytelne grupy: Wejście, Wnętrze, Toaleta przystosowana i Otoczenie. Widzimy pewność dopasowania: 100%.*
  > *A co, jeśli dane w OSM są sprzeczne? Wybierzmy Kamienicę przy Grodzkiej: aplikacja automatycznie wykrywa konflikt – budynek oznaczono jako dostępny, ale wejście ma 5 stromych stopni bez rampy. Aplikacja prezentuje obie wartości i ostrzega użytkownika.”*
- **Akcja na ekranie:** Prezentacja 4 kategorii w Sukiennicach, a następnie kliknięcie scenariusza „Kamienica Grodzka (symulacja R7: dane sprzeczne)”.

---

### [1:55 – 2:20] Odporność na Awarie (R12) i Zgłoszenie Poprawki (R11)
- **Ekran:** Obsługa awarii sieciowej → Zgłoszenie poprawki.
- **Narracja lektora:**
  > *„Co się stanie, gdy serwer Overpass padnie lub przekroczymy limity? Aplikacja nie zawiesza się – wyświetla wyraźny komunikat o awarii źródła i natychmiast serwuje zweryfikowany lokalny snapshot offline.*
  > *Gdy użytkownik zauważy nową barierę w terenie, może zapisać ją w lokalnej kolejce na telefonie lub jednym kliknięciem otworzyć oficjalną notatkę na OpenStreetMap, angażując globalną społeczność mapową.”*
- **Akcja na ekranie:** Pokazanie działania trybu zapasowego offline, przejście do formularza „Zgłoś uwagę”.

---

### [2:20 – 2:50] Dostępność Cyfrowa (WCAG AAA), Skalowalność i Zakończenie
- **Ekran:** Centrum Ułatwień Dostępności cyfrowej (`KrakowHeader` → Ułatwienia) oraz ekran „O danych”.
- **Narracja lektora:**
  > *„Aplikacja spełnia najwyższe normy WCAG 2.2 AAA. Zamiast zbędnych, sztucznych przycisków lektora, interfejs w 100% współpracuje z systemowymi czytnikami ekranu (TalkBack, VoiceOver). Dedykowane Centrum Dostępności oferuje regulację kontrastu, krojów pisma i maskę czytania.*
  > *Rozwiązanie jest w 100% gotowe do uruchomienia w kolejnych miastach – wystarczy jeden plik JSON. Cały kod źródłowy na licencjach permissywnych przekazujemy Gminie Miejskiej Kraków. Dziękujemy!”*
- **Akcja na ekranie:** Otwarcie panelu ułatwień dostępności, pokazanie ekranu „O danych” z licencjami.
