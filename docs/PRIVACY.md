# Prywatność

Stan na fundament. Aplikacja nie ma konta, analityki, reklam ani SDK do zgłaszania awarii.

## Czego nie zbieramy

Nie pytamy o niepełnosprawność. Profil to próg barier: wózek, wózek dziecięcy albo własne progi. W tej wersji wybór żyje tylko w pamięci sesji. Trwały zapis na urządzeniu nie jest jeszcze włączony.

Nie prosimy o lokalizację. Przycisk „moja pozycja” pojawi się dopiero przy jawnym geście i z najwęższym uprawnieniem, które wystarczy.

## Co pójdzie do dostawców, gdy analiza będzie włączona

- Mapy.com (Seznam.cz): tekst miejsca oraz współrzędne początku, końca i ewentualnych punktów trasy. Nagłówek z kluczem API. Bez identyfikatora osoby.
- Overpass (operator publicznej instancji OSM): prostokąty otaczające odcinki trasy, nie imię i nie opis użytkownika.

Połączenia tylko po HTTPS.

Zgłoszenia poprawek, gdy powstaną, zostaną na urządzeniu i będą oznaczone jako niezweryfikowane. Aplikacja nie wyśle ich sama do OSM. Użytkownik będzie mógł otworzyć deeplink do notatki OSM.

Klucz Mapy.com w kliencie da się odczytać z paczki aplikacji. To ograniczenie prototypu. Produkcja powinna trzymać klucz za proxy.
