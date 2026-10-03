# Model Biznesowy i Plan Skalowania Komercyjnego (Business Model)

Projekt **Kraków bez barier** łączy misję społeczną (dostępność przestrzeni publicznej) ze zrównoważonym modelem biznesowym opartym na mikrousługach B2B i integracjach miejskich.

---

## 1. Grupy Klientów Płacących (Segmenty Rynku)

1. **Hotele, Pensjonaty i Apartamenty w Krakowie:**
   - **Potrzeba:** Branża HoReCa traci rezerwacje od osób z niepełnosprawnościami i rodzin z dziećmi z powodu braku wiarygodnych informacji o dojściu z dworca/lotniska lub o progach w zabytkowych kamienicach.
   - **Produkt:** Widżet „Jak do nas dotrzeć bez barier” instalowany na stronie hotelu lub w potwierdzeniu rezerwacji (Booking/Airbnb).
2. **Instytucje Kultury, Muzea i Teatry:**
   - **Potrzeba:** Realizacja wymogów Ustawy o zapewnianiu dostępności osobom ze szczególnymi potrzebami.
   - **Produkt:** Certyfikowany raport dostępności obiektu w 4 kategoriach wyzwania wraz z dynamiczną mapą dojścia dla odwiedzających.
3. **Organizatorzy Wydarzeń, Kongresów i Festiwali (np. ICE Kraków, Tauron Arena):**
   - **Potrzeba:** Bezpieczne wyznaczenie tras pieszych z przystanków komunikacji miejskiej do wejść dla uczestników konferencji i koncertów.
   - **Produkt:** Czasowe pakiety nawigacji eventowej z uwzględnieniem tymczasowych barier (np. remonty, schody).
4. **Miasto i Spółki Miejskie (Gmina Miejska Kraków, ZDMK, MPK):**
   - **Potrzeba:** Narzędzie audytu infrastruktury drogowej wskazujące czarne punkty (np. wysokie krawężniki przy przystankach) na podstawie danych gromadzonych przez mieszkańców.
   - **Produkt:** Dedykowany pulpit analityczny (Dashboard GIS) pokazujący luki w dostępności w poszczególnych dzielnicach Krakowa.

---

## 2. Strumienie Przychodów (Monetyzacja)

- **Model B2B SaaS (Widżet Dostępności):** Miesięczny abonament (od 99 PLN/miesiąc za obiekt) za osadzenie interaktywnego komponentu trasy bez barier na stronie komercyjnej.
- **Dostęp do API (B2B API):** Licencjonowanie silnika analitycznego `core` (zapytanie o ocenę trasy z konkretnymi dowodami) dla zewnętrznych aplikacji turystycznych, miejskich i systemów przewodników.
- **Audyty Dostępności dla Nieruchomości Komercyjnych:** Automatycznie generowane raporty zgodności z kryteriami dostępności dla zarządców biurowców i galerii handlowych.

---

## 3. Koszty Utrzymania i Prowadzenia Projektu

- **Infrastruktura podstawowa:** Dzięki architekturze Client-Side First oraz integracji z otwartą bazą OpenStreetMap, koszty początkowe wynoszą **poniżej 300 PLN miesięcznie** (koszt utrzymania bezpiecznego proxy API i domeny).
- **Zasoby ludzkie:** Brak konieczności ręcznego wprowadzania danych przez pracowników urzędu – aktualizacje pochodzą bezpośrednio z ekosystemu OpenStreetMap oraz zgłoszeń użytkowników weryfikowanych społecznościowo.

---

## 4. Przewagi Konkurencyjne (Unfair Advantage)

1. **Uczciwość danych:** Żadna inna aplikacja nie podaje wprost wskaźnika pokrycia danych i najdłuższej luki bez pomiaru.
2. **Prywatność i zerowe tarcie:** Brak rejestracji, brak zbierania danych wrażliwych o zdrowiu, natychmiastowe działanie.
3. **Gotowość licencyjna:** Pełne przekazanie praw majątkowych dla Gminy Miejskiej Kraków – miasto otrzymuje gotowy, stabilny produkt, który może rozwijać pod własną marką.
