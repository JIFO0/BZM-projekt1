# Model biznesowy

Szkic dla zespołu. Nie jest decyzją. Brief miasta daje temu 20% oceny, więc trzeba go dopisać przed zgłoszeniem.

## Do uzupełnienia

- Kto jest klientem płacącym w pierwszym roku: hotel, organizator wydarzenia, zarządca budynku, system rezerwacji, albo dostawca mapy.
- Za co płaci: raport miejsca, widget na stronę obiektu, API z tym samym modelem faktu, czy abonament miasta.
- Kto hostuje po hackathonie, kto płaci za kredyty Mapy.com i za instancję Overpass albo ekstrakt OSM, kto odpowiada za zgłoszenia.
- Jak drugie miasto dostaje własny `cities/<id>.json` bez kopiowania kodu Krakowa.
- Czego świadomie nie robimy w 24 godziny: konta, płatności, panel właściciela obiektu.

Miasto nie utrzymuje bazy ręcznie. Dane jadą z OSM, Mapy.com i później z otwartych zbiorów, których licencję sprawdzimy per zasób. Zgłoszenie użytkownika nie jest potwierdzeniem urzędowym.
