export type Locale = 'pl' | 'en';

const pl = {
  appName: 'Kraków bez barier',
  profileTitle: 'Jakie bariery sprawdzamy surowiej?',
  profileLead:
    'Wybierz progi dla trasy. Nie pytamy o niepełnosprawność i nie zakładamy konta.',
  wheelchair: 'Wózek',
  wheelchairHint: 'Schody blokują trasę. Krawężnik do 30 mm.',
  stroller: 'Wózek dziecięcy',
  strollerHint: 'Schody są ostrzeżeniem. Krawężnik do 60 mm.',
  custom: 'Własne progi',
  customHint: 'Na razie takie same jak dla wózka. Edycja progów nie jest jeszcze dostępna.',
  selected: 'Wybrany profil',
  continue: 'Dalej, do wyszukiwania',
  privacy:
    'Gdy analiza będzie podłączona, współrzędne początku i końca pójdą do Mapy.com, a otoczenie trasy do publicznego Overpass (OpenStreetMap). Nie wysyłamy identyfikatora osoby.',
  searchTitle: 'Miejsce albo trasa',
  searchLead:
    'Wyszukiwanie adresu i analiza barier nie są jeszcze podłączone. Brak wyniku nie oznacza, że miejsce albo trasa jest dostępna.',
  from: 'Skąd',
  to: 'Dokąd',
  fromPlaceholder: 'Adres lub miejsce',
  toPlaceholder: 'Adres lub miejsce',
  notReady: 'Analiza nie jest jeszcze dostępna',
  about: 'O danych',
  aboutTitle: 'Skąd biorą się informacje',
  aboutLead:
    'Każdy fakt ma mieć wartość, status, źródło i datę. Brak danych pokazujemy jako brak danych, nie jako brak barier.',
  mapyUses: 'Trasy piesze i wyszukiwanie miejsc.',
  osmUses: 'Bariery i udogodnienia wzdłuż geometrii trasy.',
  copyrightLabel: 'Informacja o prawach',
  logoLabel: 'Logo Mapy.com, wymagane przy danych Mapy.com',
  demoArea: 'Obszar demonstracyjny',
  provisional: 'Wstępny, do potwierdzenia przez zespół.',
  language: 'English',
  back: 'Wróć',
};

const en: typeof pl = {
  appName: 'Kraków without barriers',
  profileTitle: 'Which barriers should we treat strictly?',
  profileLead: 'Choose route thresholds. We do not ask about disability and we do not create accounts.',
  wheelchair: 'Wheelchair',
  wheelchairHint: 'Steps block the route. Kerb up to 30 mm.',
  stroller: 'Stroller',
  strollerHint: 'Steps are a warning. Kerb up to 60 mm.',
  custom: 'Custom thresholds',
  customHint: 'Same as wheelchair for now. Editing thresholds is not available yet.',
  selected: 'Selected profile',
  continue: 'Continue to search',
  privacy:
    'When analysis is connected, start and end coordinates go to Mapy.com, and the area around the route goes to the public Overpass API (OpenStreetMap). We do not send a personal identifier.',
  searchTitle: 'A place or a route',
  searchLead:
    'Address search and barrier analysis are not connected yet. No result does not mean the place or route is accessible.',
  from: 'From',
  to: 'To',
  fromPlaceholder: 'Address or place',
  toPlaceholder: 'Address or place',
  notReady: 'Analysis is not available yet',
  about: 'About the data',
  aboutTitle: 'Where the information comes from',
  aboutLead:
    'Every fact is meant to show a value, a status, a source and a date. Missing data stays missing. It is not shown as an absence of barriers.',
  mapyUses: 'Walking routes and place search.',
  osmUses: 'Barriers and facilities along the route geometry.',
  copyrightLabel: 'Copyright notice',
  logoLabel: 'Mapy.com logo, required wherever Mapy.com data is shown',
  demoArea: 'Demo area',
  provisional: 'Provisional, pending confirmation by the team.',
  language: 'Polski',
  back: 'Back',
};

export function t(locale: Locale, key: keyof typeof pl): string {
  return (locale === 'en' ? en : pl)[key];
}
