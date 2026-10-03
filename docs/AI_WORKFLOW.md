# Jak powstał kod

Fundament repozytorium złożył agent w Cursor (Grok 4.7) 3 października 2026 na podstawie:

- promptu budowy „Kraków bez barier” (React Native + Expo),
- `tasks/HackYeah 2026 - Rules for Participants/kraków streszcz.txt`,
- PDF `KRYTERIA Kraków Bez Barier.pdf`,
- PDF `RULES Cracow Without Barriers.pdf`.

Przed scaffoldem sprawdzono dokumentację Expo SDK 55 (monorepo, `react-native-maps`), OpenAPI routingu i geokodowania Mapy.com, stronę atrybucji i kafelków Mapy.com, wiki Overpass oraz Tile Usage Policy OSM. Adresów, których odpowiedź była błędem HTTP, nie wpisano do kodu.

Testy jednostkowe odpalane są lokalnie przez `npm run verify`. Nie uruchomiono jeszcze aplikacji na telefonie ani emulatorze. Nie wolno twierdzić, że mapa albo trasa działa, dopóki ktoś z zespołu tego nie przejdzie.

Agent nie wysyła zapytań do Mapy.com (brak klucza, ochrona kredytów) i nie wysyła zapytań Overpass w tej fazie.
