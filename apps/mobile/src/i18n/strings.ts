export type Locale = 'pl' | 'en' | 'uk';

const pl = {
  appName: 'Kraków bez barier',
  profileTitle: 'Wybór profilu mobilności',
  profileLead:
    'Wybierz profil do analizy barier. Aplikacja nie zbiera danych o niepełnosprawności, nie zakłada kont i działa w 100% lokalnie na urządzeniu.',
  wheelchair: 'Wózek',
  wheelchairHint: 'Schody blokują trasę (blocker). Krawężnik max 3 cm. Omija kocie łby i piasek.',
  custom: 'Profil własny',
  customHint: 'Dostosuj własne limity krawężnika, nachylenia, stopni i nawierzchni.',
  selected: 'Wybrany profil',
  blockedRoadTypesTitle: 'Blokowane typy nawierzchni i dróg',
  blockedRoadTypesSubtitle:
    'Drogi z wybranymi nawierzchniami będą omijane lub oznaczane na trasie jako blokada (brak przejazdu).',
  surfaceCobblestone: 'Kocie łby / Bruk',
  surfaceGravel: 'Żwir / Szuter',
  surfaceSand: 'Piasek',
  surfaceDirt: 'Grunt / Ziemia',
  surfaceUnpaved: 'Nieutwardzona',
  surfaceCompacted: 'Ubity żwir',
  surfacePavingStones: 'Kostka / Płyty',
  surfaceSteps: 'Schody piesze',
  blockedStatusBlocked: 'ZABLOKOWANA',
  blockedStatusAllowed: 'DOZWOLONA',
  stepsAllowed: 'Dozwolone',
  continue: 'Przejdź do wyszukiwania',
  privacy:
    'Współrzędne trasy wysyłane są wyłącznie do Mapy.com (geometria trasy) oraz publicznego API Overpass / OpenStreetMap (dane o barierach). Aplikacja nie wysyła żadnych identyfikatorów użytkownika ani danych osobowych.',
  searchTitle: 'Trasa lub miejsce',
  searchLead:
    'Zaplanuj trasę pieszą A - B w Krakowie lub sprawdź dostępność konkretnego miejsca.',
  routeTab: 'Trasa A - B',
  placeTab: 'Sprawdź miejsce',
  from: 'Punkt początkowy (A)',
  to: 'Punkt docelowy (B)',
  placeLabel: 'Nazwa lub adres miejsca',
  fromPlaceholder: 'np. Rynek Główny',
  toPlaceholder: 'np. Wawel',
  placePlaceholder: 'np. Sukiennice, Katedra Wawelska',
  myLocation: 'Użyj mojej lokalizacji',
  searchButton: 'Nawiguj',
  searchPlaceButton: 'Sprawdź miejsce',
  demoScenarios: 'Przykładowe trasy testowe (Demo):',
  demoRoute1: 'Rynek Główny - Wawel (ul. Grodzka)',
  demoRoute2: 'Kazimierz (Plac Nowy) - Planty',
  demoPlace1: 'Sukiennice (pełna dostępność)',
  demoPlace2: 'Kamienica Grodzka (symulacja: dane sprzeczne)',
  demoPlace3: 'Restauracja Staromiejska (symulacja: dane przedawnione)',
  notReady: 'Analiza w toku...',
  routeReportTitle: 'Raport barier na trasie',
  summaryCardTitle: 'Podsumowanie trasy',
  routeLength: 'Długość trasy',
  routeDuration: 'Czas przejścia',
  blockersCount: 'Blokady (brak przejazdu)',
  warningsCount: 'Ostrzeżenia (utrudnienia)',
  infoCount: 'Udogodnienia / Informacje',
  unknownCount: 'Nierozpoznane odcinki',
  longestUnknownStretch: 'Najdłuższy odcinek bez danych',
  dataCoverage: 'Pokrycie danymi wzdłuż trasy',
  coverageRatio: 'pokrycie',
  noBarriersFound:
    'Nie znaleziono przeszkód w dostępnych danych. Uwaga: dane OSM mogą być niekompletne.',
  caveatNotice:
    'Pamiętaj: brak zgłoszonej przeszkody w OpenStreetMap nie gwarantuje jej braku w rzeczywistości.',
  showMap: 'Pokaż mapę z barierami',
  hideMap: 'Ukryj mapę (widok listy)',
  readAloud: 'Odsłuchaj podsumowanie głosowe',
  stopSpeech: 'Zatrzymaj czytanie',
  shareSummary: 'Udostępnij raport tekstowy',
  findingsListTitle: 'Zestawienie barier w kolejności trasy',
  distanceFromStart: 'Dystans od startu',
  whyThisStatus: 'Dlaczego taki status?',
  reportCorrection: 'Zgłoś uwagę lub błąd w danych',
  placeDetailTitle: 'Dostępność miejsca',
  matchConfidence: 'Pewność dopasowania do OSM',
  confidentMatch: 'Dopasowano obiekt z bazy OpenStreetMap',
  noPlaceData:
    'Brak danych o dostępności tego miejsca w OpenStreetMap. Zgodnie z zasadami aplikacji nie oznaczamy miejsca jako dostępne.',
  catEntrance: 'Wejście do budynku',
  catInside: 'Wnętrze i korytarze',
  catToilet: 'Toaleta przystosowana',
  catSurroundings: 'Otoczenie i dojście',
  emptyCategory: 'Brak szczegółowych informacji w tej kategorii',
  reportTitle: 'Zgłoszenie korekty danych',
  reportLead:
    'Zauważyłeś barierę lub nieścisłość? Twoje zgłoszenie zostanie zapisane lokalnie w kolejce weryfikacji. Możesz też dodać notatkę bezpośrednio na OpenStreetMap.',
  reportObstacleDesc: 'Opis przeszkody lub uwagi',
  reportObstaclePlaceholder: 'np. uszkodzony podjazd, stopień 15 cm przy wejściu...',
  reportSubmit: 'Zapisz zgłoszenie lokalnie',
  reportSavedSuccess: 'Zgłoszenie zapisane w pamięci urządzenia (oznaczone jako niezweryfikowane).',
  openOsmNote: 'Dodaj notatkę na OpenStreetMap (zewnętrzny link)',
  osmNoteDisclaimer:
    'Aplikacja nigdy nie wysyła danych automatycznie do bazy OSM. Otworzysz oficjalną mapę OSM, aby dodać publiczną notatkę jako użytkownik.',
  localReportsQueue: 'Lokalne zgłoszenia użytkownika (niezweryfikowane):',
  noLocalReports: 'Brak oczekujących zgłoszeń lokalnych.',
  debugPanel: 'Panel Symulacji i Testów (Demo)',
  simulateOverpassFail: 'Symuluj awarię Overpass API (błąd 503 / timeout)',
  simulateMapyFail: 'Symuluj błąd Mapy.com API (błąd 429 limit zapytań)',
  simulateOffline: 'Wymuś tryb offline (użyj lokalnego snapshotu)',
  resetSimulation: 'Wyłącz symulacje (przywróć działanie online)',
  sampleDataBanner: 'DANE PRZYKŁADOWE (Offline Demo Snapshot Kraków)',
  simulationActiveBanner: 'AKTYWNA SYMULACJA AWARII: ',
  sourceFailedMessage:
    'Nie udało się pobrać danych z zewnętrznego źródła. Pokazano dane zapasowe / snapshot demo.',
  about: 'O danych i licencjach',
  aboutTitle: 'Skąd biorą się informacje',
  aboutLead:
    'Każdy fakt w aplikacji posiada wartość, status, źródło, datę aktualizacji oraz wyjaśnienie. Brak danych jest zawsze prezentowany jako brak informacji, nigdy jako brak barier.',
  mapyUses: 'Trasy piesze oraz geokodowanie i wyszukiwanie adresów.',
  osmUses: 'Geometria barier, nawierzchni, schodów, krawężników i obiektów.',
  copyrightLabel: 'Informacja o prawach autorskich',
  logoLabel: 'Wymagane logo Mapy.com',
  demoArea: 'Obszar demonstracyjny HackYeah 2026',
  provisional: 'Obszar demonstracyjny: Rynek Główny - Kazimierz - Wawel - Planty.',
  language: 'Polski',
  back: 'Wróć',
  close: 'Zamknij',

  // Kraków Municipal & Gov branding
  krakowOfficialHeader: 'Oficjalny System Dostępności Przestrzennej',
  krakowGovSub: 'Projekt drużyny Burza z Mózgów',
  krakowCityBadge: 'Miasto Kraków',
  wcagBadge: 'Standard WCAG 2.2 AAA',
  krakowMunicipalFooter:
    'Prototyp miejski zrealizowany w ramach Programu Kraków Bez Barier • Zgodność z Europejskim Aktem o Dostępności (EAA) i normą PN-EN 301 549 (WCAG 2.2 AAA)',

  // Accessibility Panel & Controls
  accessibilityMenuBtn: 'Dostępność',
  accessibilityHeaderButton: 'Ułatwienia dostępu (WCAG)',
  quickA11yToolbar: 'Pasek szybkiego dostępu WCAG',
  accessibilityPanelTitle: 'Centrum Ułatwień Dostępności',
  accessibilityPanelDesc:
    'Dostosuj interfejs do swoich indywidualnych potrzeb wzrokowych, poznawczych i motorycznych zgodnie z wymogami Ustawy o dostępności cyfrowej.',
  contrastSectionTitle: 'Kontrast i barwy (WCAG 2.2 AAA)',
  contrastModeStandardLight: 'Standardowy jasny (Błękit Krakowski)',
  contrastModeStandardDark: 'Standardowy ciemny (Tryb nocny)',
  contrastModeYellowBlack: 'Pełny wysoki kontrast: Żółty na czarnym',
  contrastModeBlackYellow: 'Pełny wysoki kontrast: Czarny na żółtym',
  contrastModeWhiteBlack: 'Pełny wysoki kontrast: Biały na czarnym',
  contrastModeMonochrome: 'Monochromatyczny (Skala szarości)',
  contrastModeMonochromeHint: 'Usuwa nasycenie barw, redukując zmęczenie wzroku i światłowstręt.',
  textSizeSectionTitle: 'Skalowanie tekstu',
  textSizeNormal: '100% (Standardowy)',
  textSizeMedium: '115% (Powiększony)',
  textSizeLarge: '130% (Duży)',
  textSizeXLarge: '150% (Bardzo duży)',
  textSizeXXLarge: '175% (Maksymalny)',
  textSizeBtnDecrease: 'Zmniejsz tekst (A-)',
  textSizeBtnIncrease: 'Zwiększ tekst (A+)',
  fontFamilySectionTitle: 'Krój pisma',
  fontFamilySystem: 'Krój systemowy standardowy',
  fontFamilyDyslexic: 'Krój o podwyższonej czytelności (Dyslexic)',
  fontFamilyMono: 'Krój o stałej szerokości (Monospace)',
  lineSpacingTitle: 'Odstępy między wierszami (Interlinia)',
  lineSpacingNormal: 'Standardowa (1.45)',
  lineSpacingIncreased: 'Zwiększona (1.80)',
  lineSpacingLoose: 'Luźna (2.20)',
  letterSpacingTitle: 'Odstępy międzyliterowe (Kerning)',
  letterSpacingNormal: 'Standardowe',
  letterSpacingIncreased: 'Zwiększone (+1.2)',
  letterSpacingWide: 'Szerokie (+2.5)',
  readabilitySectionTitle: 'Czytelność i percepcja',
  dyslexicMode: 'Tryb ułatwionego czytania tekstu',
  dyslexicModeHint: 'Zwiększa światło między znakami oraz wysokość wiersza dla łatwiejszego czytania.',
  motorSectionTitle: 'Sprawność motoryczna (Target Size)',
  increasedSpacing: 'Powiększone strefy dotykowe (min. 56 px)',
  increasedSpacingHint:
    'Zwiększa marginesy między elementami interaktywnymi, minimalizując ryzyko omyłkowego naciśnięcia.',
  visualFocusSectionTitle: 'Skupienie wzroku i uwaga',
  highlightInteractive: 'Wyraziste wyróżnienie linków i przycisków',
  highlightInteractiveHint:
    'Dodaje trwałe obramowania 4 px oraz podkreślenia elementów klikalnych (WCAG 1.4.1).',
  readingRuler: 'Linijka do czytania (Prowadnica wiersza)',
  readingRulerHint:
    'Wyświetla poziomą prowadnicę ułatwiającą śledzenie tekstu wiersz po wierszu.',
  readingMask: 'Maska skupienia tekstu',
  readingMaskHint: 'Przyciemnia górną i dolną część ekranu, izolując czytany fragment tekstu.',
  speechSectionTitle: 'Synteza mowy (Lektor)',
  speechAssistant: 'Lektor ekranowy (Synteza mowy)',
  speechRateTitle: 'Tempo mowy lektora',
  speechRateSlow: '0.8x (Wolne)',
  speechRateNormal: '1.0x (Standardowe)',
  speechRateFast: '1.2x (Szybkie)',
  readCurrentScreen: 'Odczytaj zawartość ekranu',
  stopCurrentSpeech: 'Zatrzymaj odczytywanie',
  resetAccessibilityBtn: 'Przywróć domyślne',
  applyAndClose: 'Zapisz i zamknij',
  accessibilityDeclaration: 'Deklaracja dostępności cyfrowej',
  screenReaderReady: 'Zoptymalizowano pod kątem czytników ekranu (TalkBack / VoiceOver)',
  facilitiesCount: 'Udogodnienia',

  // Badges
  statusVerified: 'Zweryfikowano',
  statusCommunity: 'Społeczność OSM',
  statusReported: 'Zgłoszenie lokalne',
  statusUnknown: 'Brak danych',
  statusConflicting: 'Dane sprzeczne',
  severityBlocker: 'Blokada',
  severityWarning: 'Ostrzeżenie',
  severityInfo: 'Informacja',
  severityOk: 'Dostępne',

  // Language selectors
  languageSectionTitle: 'Język interfejsu',
  switchLanguage: 'Przełącz język',
  langPl: 'Polski',
  langEn: 'English',
  langUk: 'Українська',

  // Newly unified UI & action keys
  reader: 'Lektor',
  stop: 'Stop',
  openPlaceCard: 'Otwórz pełną kartę miejsca',
  showFullReportAndManeuvers: 'Pokaż pełny raport i manewry',
  fastDemoRoutes: 'SZYBKIE TRASY DEMO (KRAKÓW):',
  popularDemoPlaces: 'POPULARNE MIEJSCA DEMO:',
  selectProfile: 'Wybierz profil mobilności:',
  customThresholdsTitle: 'Progi barier dla profilu własnego:',
  maxKerb: 'Maksymalny krawężnik:',
  kerbLow: 'Niski (3 cm)',
  kerbMedium: 'Średni (7 cm)',
  kerbHigh: 'Wysoki (14 cm)',
  stepsTreatment: 'Traktowanie stopni:',
  toggleStepsStatus: 'Przełącz status schodów',
  reportObstacleHeading: 'Zgłoś przeszkodę lub nieaktualną barierę:',
  openFullOsmForm: 'Przejdź do pełnego formularza OSM',
  collapseMenu: 'Zwiń dolne menu',
  expandMenu: 'Rozwiń menu',
  hideMenu: 'Ukryj menu',
  searchPlaceholderUnified: 'Dokąd w Krakowie? Szukaj trasy lub miejsca...',
  surfacesChip: 'Nawierzchnie',
  tabRoute: 'Trasa',
  tabPlace: 'Miejsce',
  tabProfile: 'Profil',
  tabReport: 'Zgłoś',
  myLocationShort: 'Moja lokalizacja',
  myLocationCenter: 'Moja lokalizacja (Centrum)',
  myLocationCenterKrakow: 'Moja lokalizacja (Centrum Krakowa)',
  toastCenteredKrakow: 'Wycentrowano mapę na Rynku Głównym w Krakowie.',
  routeErrorTitle: 'Błąd wyznaczania trasy',
  routeErrorMsg: 'Nie udało się obliczyć trasy.',
  placeErrorTitle: 'Błąd sprawdzania miejsca',
  placeErrorMsg: 'Nie udało się pobrać danych.',
  errorTitle: 'Błąd',
  warningTitle: 'Uwaga',
  reportDescRequired: 'Wpisz opis przeszkody przed zapisem.',
  reportPopupTitle: 'Zgłoś przeszkodę',
  reportLocationLabel: 'Miejsce przeszkody',
  reportLocationRequired: 'Wskaż miejsce przeszkody na mapie albo użyj swojej lokalizacji.',
  routeEndpointsRequired: 'Wskaż początek i cel trasy.',
  btnCenterKrakow: 'Wycentruj na centrum Krakowa',
  btnChangeProfile: 'Zmień profil poruszania się',
  btnClearRoute: 'Wyczyść aktywną trasę',
  btnShowRouteSummary: 'Pokaż podsumowanie aktywnej trasy',
  gpsFetching: 'Pobieranie Twojej lokalizacji GPS...',
  gpsCenteredSuccess: 'Wycentrowano mapę na Twojej lokalizacji.',
  gpsStartPointSet: 'Ustawiono punkt startowy na Twoją lokalizację.',
  gpsUnavailableTitle: 'Lokalizacja niedostępna',
  gpsUnavailableDesc: 'Nie udało się pobrać Twojej obecnej lokalizacji. Upewnij się, że masz włączony GPS i przyznane uprawnienia.',
  gpsUnavailableSearchDesc: 'Nie udało się pobrać Twojej lokalizacji GPS. Wpisz adres początkowy ręcznie lub wybierz Centrum Krakowa.',
  btnCenterKrakowAction: 'Centrum Krakowa',
  rynekGlowny: 'Rynek Główny',
  cancel: 'Anuluj',
  accessibilityShowMyLocation: 'Pokaż moją obecną lokalizację',
  noSelectedPlace: 'Brak wybranego miejsca.',
  municipalObjectKrakow: 'OBIEKT MIEJSKI KRAKÓW',
  readAloudPlace: 'Odsłuchaj opis miejsca',
  conflictingDataTitle: 'Wykryto sprzeczne dane w OpenStreetMap (R7):',
  conflictingDataDesc:
    'Różne obiekty OSM (np. budynek vs węzeł wejścia) podają sprzeczne informacje dla tego samego miejsca. Poniżej przedstawiono obie wartości:',
  criterion: 'Kryterium',
  source: 'Źródło',
  value: 'Wartość',
  staleDataTitle: 'Uwaga: Przedawnione dane w OpenStreetMap (R8):',
  staleDataDesc:
    'Niektóre informacje o tym miejscu nie były weryfikowane ani edytowane od ponad 24 miesięcy. Stan faktyczny mógł ulec zmianie.',
  noActiveRouteReport: 'Brak aktywnego raportu trasy.',
  backToSearch: 'Wróć do wyszukiwania',
  krakowRouteTag: 'KRAKÓW TRASA',
  metresContinuousNoData: 'metrów ciągłego braku danych',
  orderedByDistance: 'Uporządkowane rosnąco według odległości od startu:',
  noElementsInCorridor: 'Brak zarejestrowanych elementów w OpenStreetMap w korytarzu tej trasy.',
  dateConfirmed: 'potwierdzono',
  dateOsmEdit: 'ostatnia edycja OSM',
  dateRetrieved: 'pobrano',
  noDate: 'brak daty',
  noVerificationDate: 'brak daty weryfikacji',
  afterDistance: 'Po',
  hideDetails: 'Ukryj szczegóły',
  osmEvidenceDetails: 'Szczegóły dowodowe z OpenStreetMap:',
  objectId: 'Identyfikator obiektu',
  credibilityStatus: 'Status wiarygodności',
  credibilityIndex: 'Indeks',
  credibilityLegendTitle: 'Indeks wiarygodności danych',
  credibilityLegendLead:
    'Wyżej znaczy mocniejszy dowód. Zgłoszenia zgodne (5+ albo 3+ ze zdjęciem) są nad źródłami. Pojedyncze zgłoszenie nie potwierdza, że bariera jest albo że jej nie ma. W OSM status zweryfikowany dają tylko tagi check_date i survey:date — data edycji nią nie jest.',
  credibilityRankCorroborated: 'zgodne zgłoszenia (5+ lub 3+ ze zdjęciem)',
  credibilityRankOsmVerified: 'OSM, data kontroli',
  credibilityRankOfficialCity: 'BIP / krakow.pl, deklaracja dostępności',
  credibilityRankMsipZdmk: 'MSIP Kraków / ZDMK',
  credibilityRankWawel: 'audyt Zamku na Wawelu',
  credibilityRankFieldAudit: 'audyt terenowy',
  credibilityRankOsmCommunity: 'OSM bez daty kontroli',
  credibilityRankGeoportal: 'Geoportal BDOT10k, podkład mapy',
  credibilityRankPartialReport: 'zgłoszenia częściowo zgodne',
  credibilityRankConflicting: 'dane sprzeczne',
  credibilityRankUnspecified: 'źródło nieprzypisane',
  credibilityRankSingleReport: 'pojedyncze zgłoszenie',
  credibilityRankUnknown: 'brak danych',
  credibilityCaveatSingle: 'Nie potwierdza, że bariera jest albo że jej nie ma.',
  credibilityCaveatPartial: 'Poniżej progu 5 zgłoszeń albo 3 ze zdjęciem.',
  credibilityCaveatOsmEdit: 'Data edycji OSM nie jest datą kontroli w terenie.',
  evidenceDetails: 'Szczegóły źródła',
  dataLicense: 'Licencja danych',
  geometricMatchConfidence: 'Pewność dopasowania geometrycznego',
  sourceUrl: 'URL źródła',
  less: 'Mniej',
  objectLabel: 'Miejsce',
  licenseLabel: 'Licencja',
  confirmationDateLabel: 'Data potwierdzenia (check_date)',
  noCheckDateLabel:
    'Brak tagu potwierdzenia (check_date). Data edycji nie jest datą weryfikacji.',
  placeMatchConfidenceLabel: 'Pewność dopasowania do miejsca',
  zoomIn: 'Przybliż mapę',
  zoomOut: 'Oddal mapę',
  noMeasurementPoints: 'brak punktów pomiarowych',
  coverageParam: 'Pokrycie parametru',
  noDetailedManeuvers: 'Brak szczegółowych manewrów.',
  debugDesc:
    'Symulacja stanów awaryjnych i brzegowych wymaganych przez regulamin HackYeah (R7, R8, R12):',
  footerA11yLabel: 'Informacje urzędowe i deklaracja dostępności Miasta Kraków',
  privacyTag: '100% Prywatności (P1–P5)',
  coatOfArmsA11y:
    'Herb Stołecznego Królewskiego Miasta Krakowa: mury ceglane z trzema basztami, korona i orzeł w otwartej bramie',
  localReportUnverified: 'Zgłoszenie lokalne (niezweryfikowane)',
  simOverpassFailShort: 'Awaria Overpass (503)',
  simMapyFailShort: 'Błąd Mapy.com (429)',
  simOfflineShort: 'Wymuszony Offline',
  fallbackDataDisplayed: 'Wyświetlono dane zapasowe',
  activeFailureSimulation: 'AKTYWNA SYMULACJA AWARII:',
  cityHallKrakow: 'Urząd Miasta Krakowa',
  distanceLabel: 'Dystans',
  coverageKerbs: 'Krawężniki na przejściach',
  coverageSurface: 'Dane o nawierzchni',
  coverageSteps: 'Stopnie i schody',
  coverageWidth: 'Szerokość przejścia',
  coverageIncline: 'Nachylenie',
  chooseStartPoint: 'Wybierz punkt początkowy',
  chooseEndPoint: 'Wybierz punkt docelowy',
  pointA: 'Punkt A (Start)',
  pointB: 'Punkt B (Cel)',
  swapPoints: 'Zamień punkt startowy i docelowy',
  enterCoordinates: 'Wprowadź współrzędne',
  hideCoordinates: 'Ukryj wprowadzanie współrzędnych',
  latitude: 'Szerokość (Lat)',
  longitude: 'Długość (Lon)',
  latitudePlaceholder: 'np. 50.0619',
  longitudePlaceholder: 'np. 19.9373',
  applyCoordinates: 'Zastosuj współrzędne',
  invalidCoordinates: 'Nieprawidłowe współrzędne (szerokość: -90..90, długość: -180..180).',
  coordinatesApplied: 'Współrzędne zostały ustawione.',
  pickOnMap: 'Wskaż na mapie',
  pickingOnMapStart: 'Dotknij mapy, aby wybrać punkt początkowy (A)',
  pickingOnMapEnd: 'Dotknij mapy, aby wybrać punkt docelowy (B)',
  cancelMapPick: 'Anuluj wybieranie na mapie',
  osmSuggestionsTitle: 'Adresy i miejsca',
  osmAttributionLabel: 'Źródło: OpenStreetMap',
  clearSelection: 'Wyczyść pole',
  customRoute: 'Własna trasa',
  coordinatesBadge: 'Współrzędne',
  directRouteFallback: 'Wyznaczono trasę bezpośrednią na podstawie współrzędnych OpenStreetMap.',
  searchPromptOsm: 'Szukaj ulicy, miejsca lub wpisz współrzędne...',
  selectedCoordinates: 'Wybrane współrzędne',
  searchQueryMatches: 'Znalezione lokalizacje OSM',
  noOsmResultsFound: 'Nie znaleziono lokalizacji w OpenStreetMap.',

  // Konto użytkownika (Mockup konta e-mail)
  userAccount: 'Konto',
  userAccountSubtitle: 'Lokalne konto demonstracyjne (mockup)',
  userAccountLoginTitle: 'Logowanie / Rejestracja',
  userAccountLoginDesc:
    'Załóż konto lub zaloguj się za pomocą adresu e-mail. Jako że jest to wersja demonstracyjna (mockup), możesz podać dowolne poświadczenia.',
  userAccountMockupNotice:
    'Żadne dane użytkownika nie będą zapisywane na serwerze. Logowanie i sesja działają wyłącznie lokalnie w pamięci urządzenia — możesz zalogować się dowolnymi poświadczeniami.',
  userAccountEmailLabel: 'Adres e-mail',
  userAccountEmailPlaceholder: 'np. jan.kowalski@example.com',
  userAccountNameLabel: 'Imię lub pseudonim (opcjonalnie)',
  userAccountNamePlaceholder: 'np. Jan Kowalski',
  userAccountPasswordLabel: 'Hasło',
  userAccountPasswordPlaceholder: 'Wpisz dowolne hasło (mockup)',
  userAccountLoginBtn: 'Zaloguj się / Załóż konto',
  userAccountQuickDemoBtn: 'Wypełnij przykładowe dane',
  userAccountLoggedInTitle: 'Twoje konto',
  userAccountStatusActive: 'Status: Zalogowany (konto lokalne)',
  userAccountVerifiedResident: 'Zalogowany użytkownik',
  userAccountValidUntil: 'Sesja aktywna',
  userAccountLogout: 'Wyloguj się',
  userAccountBenefitsTitle: 'Informacje o koncie:',
  userAccountBenefit1: 'Prywatność danych: Żadne dane użytkownika nie są zapisywane na serwerze.',
  userAccountBenefit2: 'Wszystkie preferencje dostępności i zgłoszenia powiązane są z Twoim profilem lokalnym.',
  userAccountBenefit3: 'Możliwość testowania z dowolnymi poświadczeniami (mockup demonstracyjny).',
  userAccountClose: 'Zamknij',
  userAccountVerifiedBadge: 'Zalogowany',
  userAccountReportNoticeVerified:
    'Zgłaszasz jako zalogowany użytkownik. Twoje zgłoszenie jest powiązane z Twoim kontem lokalnym.',
  userAccountReportNoticeAnon:
    'Zgłaszasz anonimowo. Zaloguj się adresem e-mail, aby powiązać zgłoszenie ze swoim kontem.',

  // Kompatybilność wsteczna kluczy krakowCard
  krakowCard: 'Konto',
  krakowCardSubtitle: 'Lokalne konto demonstracyjne (mockup)',
  krakowCardLoginTitle: 'Logowanie / Rejestracja',
  krakowCardLoginDesc:
    'Załóż konto lub zaloguj się za pomocą adresu e-mail. Jako że jest to wersja demonstracyjna (mockup), możesz podać dowolne poświadczenia.',
  krakowCardMockupNotice:
    'Żadne dane użytkownika nie będą zapisywane na serwerze. Logowanie i sesja działają wyłącznie lokalnie w pamięci urządzenia — możesz zalogować się dowolnymi poświadczeniami.',
  krakowCardIdentifierLabel: 'Adres e-mail',
  krakowCardIdentifierPlaceholder: 'np. jan.kowalski@example.com',
  krakowCardNameLabel: 'Imię lub pseudonim (opcjonalnie)',
  krakowCardNamePlaceholder: 'np. Jan Kowalski',
  krakowCardPasswordLabel: 'Hasło',
  krakowCardPasswordPlaceholder: 'Wpisz dowolne hasło (mockup)',
  krakowCardLoginBtn: 'Zaloguj się / Załóż konto',
  krakowCardQuickDemoBtn: 'Wypełnij przykładowe dane',
  krakowCardLoggedInTitle: 'Twoje konto',
  krakowCardStatusActive: 'Status: Zalogowany (konto lokalne)',
  krakowCardVerifiedResident: 'Zalogowany użytkownik',
  krakowCardValidUntil: 'Sesja aktywna',
  krakowCardLogout: 'Wyloguj się',
  krakowCardBenefitsTitle: 'Informacje o koncie:',
  krakowCardBenefit1: 'Prywatność danych: Żadne dane użytkownika nie są zapisywane na serwerze.',
  krakowCardBenefit2: 'Wszystkie preferencje dostępności i zgłoszenia powiązane są z Twoim profilem lokalnym.',
  krakowCardBenefit3: 'Możliwość testowania z dowolnymi poświadczeniami (mockup demonstracyjny).',
  krakowCardClose: 'Zamknij',
  krakowCardVerifiedBadge: 'Zalogowany',
  krakowCardReportNoticeVerified:
    'Zgłaszasz jako zalogowany użytkownik. Twoje zgłoszenie jest powiązane z Twoim kontem lokalnym.',
  krakowCardReportNoticeAnon:
    'Zgłaszasz anonimowo. Zaloguj się adresem e-mail, aby powiązać zgłoszenie ze swoim kontem.',
  barrierViewModeLabel: 'Widok barier na mapie',
  barrierModeRoute: 'Bariery',
  barrierModeAll: 'Wszystkie',
  barrierModeNone: 'Bez barier',
  barrierModeRouteHint: 'Pokaż bariery architektoniczne na trasie',
  barrierModeAllHint: 'Pokaż wszystkie znane bariery architektoniczne w Krakowie',
  barrierModeNoneHint: 'Ukryj znaczniki barier na mapie',
  noActiveRouteForBarriers: 'Brak aktywnej trasy. Zaplanuj trasę, aby zobaczyć jej bariery.',
  mapClickPopupTitle: 'Wybrany punkt na mapie',
  pointOnMap: 'Punkt na mapie',
  mapClickActionSearchPlace: 'Wyszukaj miejsce',
  mapClickActionSetStart: 'Start (A)',
  mapClickActionSetEnd: 'Cel (B)',
  resolvingAddress: 'Ustalanie adresu...',
};

const en: typeof pl = {
  appName: 'Kraków without barriers',
  profileTitle: 'Mobility profile selection',
  profileLead:
    'Select a profile for barrier analysis. The app does not collect disability data, does not require accounts, and runs 100% locally on your device.',
  wheelchair: 'Wheelchair',
  wheelchairHint: 'Steps block route (blocker). Kerb max 3 cm. Avoids cobblestone and sand.',
  custom: 'Custom profile',
  customHint: 'Configure custom thresholds for kerb, incline, steps and surfaces.',
  selected: 'Selected profile',
  blockedRoadTypesTitle: 'Blocked road and surface types',
  blockedRoadTypesSubtitle:
    'Ways with selected surfaces will be avoided or flagged as impassable blockers on your route.',
  surfaceCobblestone: 'Cobblestone',
  surfaceGravel: 'Gravel',
  surfaceSand: 'Sand',
  surfaceDirt: 'Dirt / Ground',
  surfaceUnpaved: 'Unpaved',
  surfaceCompacted: 'Compacted gravel',
  surfacePavingStones: 'Paving stones',
  surfaceSteps: 'Pedestrian steps',
  blockedStatusBlocked: 'Blocked',
  blockedStatusAllowed: 'Allowed',
  stepsAllowed: 'Allowed',
  continue: 'Continue to search',
  privacy:
    'Route coordinates are sent strictly to Mapy.com (route geometry) and public Overpass / OpenStreetMap API (barrier analysis). No personal or user identifiers are ever sent.',
  searchTitle: 'Route or place',
  searchLead: 'Plan a walking route A - B in Kraków or inspect accessibility of a specific place.',
  routeTab: 'Route A - B',
  placeTab: 'Check place',
  from: 'Origin (A)',
  to: 'Destination (B)',
  placeLabel: 'Place name or address',
  fromPlaceholder: 'e.g. Main Square',
  toPlaceholder: 'e.g. Wawel Castle',
  placePlaceholder: 'e.g. Cloth Hall, Wawel Cathedral',
  myLocation: 'Use my current location',
  searchButton: 'Navigate',
  searchPlaceButton: 'Check place accessibility',
  demoScenarios: 'Sample demo scenarios:',
  demoRoute1: 'Main Square - Wawel Castle (Grodzka St.)',
  demoRoute2: 'Kazimierz (Plac Nowy) - Planty',
  demoPlace1: 'Cloth Hall / Sukiennice (accessible)',
  demoPlace2: 'Grodzka Tenement (simulation: conflicting data)',
  demoPlace3: 'Old Town Restaurant (simulation: stale data)',
  notReady: 'Analyzing barriers...',
  routeReportTitle: 'Route barrier report',
  summaryCardTitle: 'Route summary',
  routeLength: 'Route length',
  routeDuration: 'Estimated duration',
  blockersCount: 'Blockers (impassable)',
  warningsCount: 'Warnings (obstacles)',
  infoCount: 'Facilities / Info',
  unknownCount: 'Unknown stretches',
  longestUnknownStretch: 'Longest stretch without data',
  dataCoverage: 'Data coverage along route',
  coverageRatio: 'coverage',
  noBarriersFound:
    'No barriers found in available data. Notice: OSM data may still be incomplete.',
  caveatNotice:
    'Remember: absence of reported barriers in OpenStreetMap does not guarantee complete absence in physical reality.',
  showMap: 'Show map with barrier pins',
  hideMap: 'Hide map (list view)',
  readAloud: 'Read aloud audio summary',
  stopSpeech: 'Stop speech',
  shareSummary: 'Share text summary',
  findingsListTitle: 'Itemized findings in route order',
  distanceFromStart: 'Distance from start',
  whyThisStatus: 'Why this status?',
  reportCorrection: 'Report correction or barrier',
  placeDetailTitle: 'Place accessibility',
  matchConfidence: 'OSM match confidence',
  confidentMatch: 'Matched object from OpenStreetMap',
  noPlaceData:
    'No accessibility data for this place in OpenStreetMap. Following app rules, unknown is never reported as accessible.',
  catEntrance: 'Building entrance',
  catInside: 'Inside & corridors',
  catToilet: 'Accessible toilet',
  catSurroundings: 'Surroundings & approach',
  emptyCategory: 'No specific data in this category',
  reportTitle: 'Report data correction',
  reportLead:
    'Spotted an obstacle or incorrect tag? Your report will be stored locally in the verification queue. You can also file a note directly on OpenStreetMap.',
  reportObstacleDesc: 'Obstacle or correction description',
  reportObstaclePlaceholder: 'e.g. damaged ramp, 15 cm step at entrance...',
  reportSubmit: 'Save report locally',
  reportSavedSuccess: 'Report saved to local device queue (marked as unverified).',
  openOsmNote: 'Add note on OpenStreetMap (external link)',
  osmNoteDisclaimer:
    'The app never posts to OSM automatically. You will open the official OpenStreetMap website to post a public note as a user.',
  localReportsQueue: 'Local user reports (unverified):',
  noLocalReports: 'No pending local reports.',
  debugPanel: 'Simulation & Demo Panel',
  simulateOverpassFail: 'Simulate Overpass API failure (503 / timeout)',
  simulateMapyFail: 'Simulate Mapy.com API failure (429 rate limit)',
  simulateOffline: 'Force offline mode (use bundled snapshot)',
  resetSimulation: 'Reset simulations (resume live mode)',
  sampleDataBanner: 'SAMPLE DATA (Offline Demo Snapshot Kraków)',
  simulationActiveBanner: 'ACTIVE FAILURE SIMULATION: ',
  sourceFailedMessage:
    'Failed to fetch data from external source. Fallback / demo snapshot displayed.',
  about: 'About data & licences',
  aboutTitle: 'Where data comes from',
  aboutLead:
    'Every fact shows value, status, source, update date and evidence. Missing data is always shown as unknown, never as accessible.',
  mapyUses: 'Walking routing and address geocoding.',
  osmUses: 'Barriers, surface, steps, kerbs and amenities geometry.',
  copyrightLabel: 'Copyright notice',
  logoLabel: 'Required Mapy.com logo',
  demoArea: 'HackYeah 2026 demo area',
  provisional: 'Demo area: Main Square - Kazimierz - Wawel - Planty.',
  language: 'English',
  back: 'Back',
  close: 'Close',

  // Kraków Municipal & Gov branding
  krakowOfficialHeader: 'Official Spatial Accessibility System',
  krakowGovSub: 'Projekt drużyny Burza z Mózgów',
  krakowCityBadge: 'City of Kraków',
  wcagBadge: 'WCAG 2.2 AAA Standard',
  krakowMunicipalFooter:
    'Municipal prototype built for Kraków Without Barriers Program • Complies with European Accessibility Act (EAA) & PN-EN 301 549 (WCAG 2.2 AAA)',

  // Accessibility Panel & Controls
  accessibilityMenuBtn: 'Accessibility',
  accessibilityHeaderButton: 'Accessibility Options (WCAG)',
  quickA11yToolbar: 'WCAG Quick Access',
  accessibilityPanelTitle: 'Accessibility Center',
  accessibilityPanelDesc:
    'Customize the interface according to your vision, cognitive and motor requirements compliant with the Digital Accessibility Act.',
  contrastSectionTitle: 'Contrast & Colors (WCAG 2.2 AAA)',
  contrastModeStandardLight: 'Standard Light (Kraków Municipal Blue)',
  contrastModeStandardDark: 'Standard Dark (Night mode)',
  contrastModeYellowBlack: 'High Contrast: Yellow on Black',
  contrastModeBlackYellow: 'High Contrast: Black on Yellow',
  contrastModeWhiteBlack: 'High Contrast: White on Black',
  contrastModeMonochrome: 'Monochrome (Greyscale)',
  contrastModeMonochromeHint: 'Removes all color saturation to minimize eye strain and photophobia.',
  textSizeSectionTitle: 'Text Scaling',
  textSizeNormal: '100% (Standard)',
  textSizeMedium: '115% (Medium)',
  textSizeLarge: '130% (Large)',
  textSizeXLarge: '150% (Extra Large)',
  textSizeXXLarge: '175% (Maximum)',
  textSizeBtnDecrease: 'Decrease Text (A-)',
  textSizeBtnIncrease: 'Increase Text (A+)',
  fontFamilySectionTitle: 'Font Type',
  fontFamilySystem: 'Standard System Font',
  fontFamilyDyslexic: 'Dyslexic Readability Font',
  fontFamilyMono: 'Monospace Font',
  lineSpacingTitle: 'Line Height',
  lineSpacingNormal: 'Standard (1.45)',
  lineSpacingIncreased: 'Increased (1.80)',
  lineSpacingLoose: 'Loose (2.20)',
  letterSpacingTitle: 'Letter Spacing',
  letterSpacingNormal: 'Standard',
  letterSpacingIncreased: 'Increased (+1.2)',
  letterSpacingWide: 'Wide (+2.5)',
  readabilitySectionTitle: 'Readability & Cognition',
  dyslexicMode: 'Dyslexic reading assistance',
  dyslexicModeHint: 'Increases spacing between characters and lines for easier readability.',
  motorSectionTitle: 'Motor Assistance (Target Size)',
  increasedSpacing: 'Expanded Touch Targets (min. 56 px)',
  increasedSpacingHint: 'Expands spacing between clickable elements to prevent accidental mis-taps.',
  visualFocusSectionTitle: 'Visual Focus & Attention',
  highlightInteractive: 'Highlight interactive links & buttons',
  highlightInteractiveHint:
    'Adds distinct 4 px borders and underlines to all clickable elements (WCAG 1.4.1).',
  readingRuler: 'Reading Guide / Ruler',
  readingRulerHint: 'Shows a horizontal guide strip to track text line by line.',
  readingMask: 'Reading Mask (Focus Window)',
  readingMaskHint: 'Dims upper and lower areas of the screen to isolate active reading text.',
  speechSectionTitle: 'Voice Assistant (TTS)',
  speechAssistant: 'Screen Voice Assistant',
  speechRateTitle: 'Voice Speech Rate',
  speechRateSlow: '0.8x (Slow)',
  speechRateNormal: '1.0x (Standard)',
  speechRateFast: '1.2x (Fast)',
  readCurrentScreen: 'Read screen aloud',
  stopCurrentSpeech: 'Stop voice speech',
  resetAccessibilityBtn: 'Reset to defaults',
  applyAndClose: 'Save & Close',
  accessibilityDeclaration: 'Digital Accessibility Declaration',
  screenReaderReady: 'Optimized for screen readers (TalkBack / VoiceOver)',
  facilitiesCount: 'Facilities',

  // Badges
  statusVerified: 'Verified',
  statusCommunity: 'OSM Community',
  statusReported: 'Local Report',
  statusUnknown: 'No data',
  statusConflicting: 'Conflicting data',
  severityBlocker: 'Blocker',
  severityWarning: 'Warning',
  severityInfo: 'Information',
  severityOk: 'Accessible',

  // Language selectors
  languageSectionTitle: 'Interface Language',
  switchLanguage: 'Switch language',
  langPl: 'Polski (Polish)',
  langEn: 'English',
  langUk: 'Українська (Ukrainian)',

  // Newly unified UI & action keys
  reader: 'Voice',
  stop: 'Stop',
  openPlaceCard: 'Open place card',
  showFullReportAndManeuvers: 'Show full report & maneuvers',
  fastDemoRoutes: 'QUICK DEMO ROUTES (KRAKÓW):',
  popularDemoPlaces: 'POPULAR DEMO PLACES:',
  selectProfile: 'Select mobility profile:',
  customThresholdsTitle: 'Custom profile barrier limits:',
  maxKerb: 'Max kerb height:',
  kerbLow: 'Low (3 cm)',
  kerbMedium: 'Medium (7 cm)',
  kerbHigh: 'High (14 cm)',
  stepsTreatment: 'Steps treatment:',
  toggleStepsStatus: 'Toggle steps status',
  reportObstacleHeading: 'Report obstacle or outdated barrier:',
  openFullOsmForm: 'Go to full OSM form',
  collapseMenu: 'Collapse bottom menu',
  expandMenu: 'Expand menu',
  hideMenu: 'Hide menu',
  searchPlaceholderUnified: 'Where in Kraków? Search route or place...',
  surfacesChip: 'Surfaces',
  tabRoute: 'Route',
  tabPlace: 'Place',
  tabProfile: 'Profile',
  tabReport: 'Report',
  myLocationShort: 'My location',
  myLocationCenter: 'My location (City Centre)',
  myLocationCenterKrakow: 'My location (Kraków Centre)',
  toastCenteredKrakow: 'Map centered on the Main Market Square in Kraków.',
  routeErrorTitle: 'Route calculation error',
  routeErrorMsg: 'Could not calculate route.',
  placeErrorTitle: 'Place inspection error',
  placeErrorMsg: 'Failed to fetch data.',
  errorTitle: 'Error',
  warningTitle: 'Warning',
  reportDescRequired: 'Please enter obstacle description before saving.',
  reportPopupTitle: 'Report an obstacle',
  reportLocationLabel: 'Obstacle location',
  reportLocationRequired: 'Mark the obstacle on the map or use your location.',
  routeEndpointsRequired: 'Set a start and a destination.',
  btnCenterKrakow: 'Center on Kraków centre',
  btnChangeProfile: 'Change mobility profile',
  btnClearRoute: 'Clear active route',
  btnShowRouteSummary: 'Show active route summary',
  gpsFetching: 'Fetching your GPS location...',
  gpsCenteredSuccess: 'Map centered on your location.',
  gpsStartPointSet: 'Start point set to your location.',
  gpsUnavailableTitle: 'Location unavailable',
  gpsUnavailableDesc: 'Could not retrieve your current location. Please ensure GPS is enabled and permissions are granted.',
  gpsUnavailableSearchDesc: 'Could not retrieve your GPS location. Please enter a starting address manually or choose Kraków Center.',
  btnCenterKrakowAction: 'Kraków Center',
  rynekGlowny: 'Main Market Square',
  cancel: 'Cancel',
  accessibilityShowMyLocation: 'Show my current location',
  noSelectedPlace: 'No place selected.',
  municipalObjectKrakow: 'KRAKÓW MUNICIPAL PLACE',
  readAloudPlace: 'Listen to place description',
  conflictingDataTitle: 'Conflicting data detected in OpenStreetMap (R7):',
  conflictingDataDesc:
    'Different OSM objects (e.g. building vs entrance node) provide conflicting information for the same place. Both values are shown below:',
  criterion: 'Criterion',
  source: 'Source',
  value: 'Value',
  staleDataTitle: 'Notice: Stale data in OpenStreetMap (R8):',
  staleDataDesc:
    'Some information about this place has not been verified or edited in over 24 months. Actual conditions may have changed.',
  noActiveRouteReport: 'No active route report.',
  backToSearch: 'Back to search',
  krakowRouteTag: 'KRAKÓW ROUTE',
  metresContinuousNoData: 'metres of continuous missing data',
  orderedByDistance: 'Ordered ascending by distance from start:',
  noElementsInCorridor: 'No elements registered in OpenStreetMap within this route corridor.',
  dateConfirmed: 'confirmed',
  dateOsmEdit: 'last OSM edit',
  dateRetrieved: 'retrieved',
  noDate: 'no date',
  noVerificationDate: 'no verification date',
  afterDistance: 'After',
  hideDetails: 'Hide details',
  osmEvidenceDetails: 'Evidence details from OpenStreetMap:',
  objectId: 'Object identifier',
  credibilityStatus: 'Credibility status',
  credibilityIndex: 'Index',
  credibilityLegendTitle: 'Data credibility index',
  credibilityLegendLead:
    'Higher means stronger evidence. Matching reports (5+, or 3+ with a photo) sit above providers. A single report does not confirm that a barrier exists or does not. On OSM, verified status comes only from check_date and survey:date tags — an edit date is not a survey.',
  credibilityRankCorroborated: 'matching reports (5+ or 3+ with a photo)',
  credibilityRankOsmVerified: 'OSM, survey date',
  credibilityRankOfficialCity: 'BIP / krakow.pl accessibility declaration',
  credibilityRankMsipZdmk: 'MSIP Kraków / ZDMK',
  credibilityRankWawel: 'Wawel Castle audit',
  credibilityRankFieldAudit: 'field audit',
  credibilityRankOsmCommunity: 'OSM without a survey date',
  credibilityRankGeoportal: 'Geoportal BDOT10k basemap',
  credibilityRankPartialReport: 'partly matching reports',
  credibilityRankConflicting: 'conflicting data',
  credibilityRankUnspecified: 'source not classified',
  credibilityRankSingleReport: 'single report',
  credibilityRankUnknown: 'no data',
  credibilityCaveatSingle: 'Does not confirm that a barrier exists or does not.',
  credibilityCaveatPartial: 'Below the threshold of 5 reports, or 3 with a photo.',
  credibilityCaveatOsmEdit: 'An OSM edit date is not a field survey date.',
  evidenceDetails: 'Source details',
  dataLicense: 'Data license',
  geometricMatchConfidence: 'Geometric match confidence',
  sourceUrl: 'Source URL',
  less: 'Less',
  objectLabel: 'Place',
  licenseLabel: 'License',
  confirmationDateLabel: 'Confirmation date (check_date)',
  noCheckDateLabel:
    'No confirmation tag (check_date). Edit date is not verification date.',
  placeMatchConfidenceLabel: 'Place match confidence',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  noMeasurementPoints: 'no measurement points',
  coverageParam: 'Coverage of parameter',
  noDetailedManeuvers: 'No detailed maneuvers.',
  debugDesc:
    'Simulation of emergency and edge states required by HackYeah regulations (R7, R8, R12):',
  footerA11yLabel: 'Official information and digital accessibility declaration of the City of Kraków',
  privacyTag: '100% Privacy (P1–P5)',
  coatOfArmsA11y:
    'Coat of arms of the Royal Capital City of Kraków: brick walls with three towers, crown and eagle in open gate',
  localReportUnverified: 'Local report (unverified)',
  simOverpassFailShort: 'Overpass failure (503)',
  simMapyFailShort: 'Mapy.com error (429)',
  simOfflineShort: 'Forced Offline',
  fallbackDataDisplayed: 'Fallback data displayed',
  activeFailureSimulation: 'ACTIVE FAILURE SIMULATION:',
  cityHallKrakow: 'Kraków City Hall',
  distanceLabel: 'Distance',
  coverageKerbs: 'Kerbs at crossings',
  coverageSurface: 'Surface data',
  coverageSteps: 'Steps and stairs',
  coverageWidth: 'Passage width',
  coverageIncline: 'Incline',
  chooseStartPoint: 'Choose starting point',
  chooseEndPoint: 'Choose destination',
  pointA: 'Point A (Start)',
  pointB: 'Point B (Destination)',
  swapPoints: 'Swap origin and destination',
  enterCoordinates: 'Enter coordinates',
  hideCoordinates: 'Hide coordinates input',
  latitude: 'Latitude (Lat)',
  longitude: 'Longitude (Lon)',
  latitudePlaceholder: 'e.g. 50.0619',
  longitudePlaceholder: 'e.g. 19.9373',
  applyCoordinates: 'Apply coordinates',
  invalidCoordinates: 'Invalid coordinates (lat: -90..90, lon: -180..180).',
  coordinatesApplied: 'Coordinates have been set.',
  pickOnMap: 'Pick on map',
  pickingOnMapStart: 'Tap the map to set starting point (A)',
  pickingOnMapEnd: 'Tap the map to set destination (B)',
  cancelMapPick: 'Cancel map selection',
  osmSuggestionsTitle: 'Addresses and places',
  osmAttributionLabel: 'Source: OpenStreetMap',
  clearSelection: 'Clear input',
  customRoute: 'Custom route',
  coordinatesBadge: 'Coordinates',
  directRouteFallback: 'Direct walking route generated using OpenStreetMap coordinates.',
  searchPromptOsm: 'Search street, place or enter coordinates...',
  selectedCoordinates: 'Selected coordinates',
  searchQueryMatches: 'Matching OSM locations',
  noOsmResultsFound: 'No locations found in OpenStreetMap.',

  // User Account (Mockup email account)
  userAccount: 'Account',
  userAccountSubtitle: 'Local demonstration account (mockup)',
  userAccountLoginTitle: 'Sign In / Register',
  userAccountLoginDesc:
    'Create an account or sign in with your email address. Since this is a demo mockup, you can use any credentials.',
  userAccountMockupNotice:
    'No user data will be stored on the server. Sign-in and session run strictly locally in your device memory — you can sign in with any credentials.',
  userAccountEmailLabel: 'Email address',
  userAccountEmailPlaceholder: 'e.g. user@example.com',
  userAccountNameLabel: 'Full name or alias (optional)',
  userAccountNamePlaceholder: 'e.g. John Doe',
  userAccountPasswordLabel: 'Password',
  userAccountPasswordPlaceholder: 'Enter any password (mockup)',
  userAccountLoginBtn: 'Sign In / Create Account',
  userAccountQuickDemoBtn: 'Fill sample credentials',
  userAccountLoggedInTitle: 'Your Account',
  userAccountStatusActive: 'Status: Signed In (local account)',
  userAccountVerifiedResident: 'Signed-in User',
  userAccountValidUntil: 'Active session',
  userAccountLogout: 'Sign Out',
  userAccountBenefitsTitle: 'Account Details:',
  userAccountBenefit1: 'Data privacy: No user data is transmitted or stored on any server.',
  userAccountBenefit2: 'Accessibility preferences and reports are linked to your profile.',
  userAccountBenefit3: 'Free testing with arbitrary credentials (mockup prototype).',
  userAccountClose: 'Close',
  userAccountVerifiedBadge: 'Signed In',
  userAccountReportNoticeVerified:
    'Submitting as a signed-in user. Your report is linked to your local account.',
  userAccountReportNoticeAnon:
    'Submitting anonymously. Sign in with an email to link the report to your account.',

  // Backward compatibility keys
  krakowCard: 'Account',
  krakowCardSubtitle: 'Local demonstration account (mockup)',
  krakowCardLoginTitle: 'Sign In / Register',
  krakowCardLoginDesc:
    'Create an account or sign in with your email address. Since this is a demo mockup, you can use any credentials.',
  krakowCardMockupNotice:
    'No user data will be stored on the server. Sign-in and session run strictly locally in your device memory — you can sign in with any credentials.',
  krakowCardIdentifierLabel: 'Email address',
  krakowCardIdentifierPlaceholder: 'e.g. user@example.com',
  krakowCardNameLabel: 'Full name or alias (optional)',
  krakowCardNamePlaceholder: 'e.g. John Doe',
  krakowCardPasswordLabel: 'Password',
  krakowCardPasswordPlaceholder: 'Enter any password (mockup)',
  krakowCardLoginBtn: 'Sign In / Create Account',
  krakowCardQuickDemoBtn: 'Fill sample credentials',
  krakowCardLoggedInTitle: 'Your Account',
  krakowCardStatusActive: 'Status: Signed In (local account)',
  krakowCardVerifiedResident: 'Signed-in User',
  krakowCardValidUntil: 'Active session',
  krakowCardLogout: 'Sign Out',
  krakowCardBenefitsTitle: 'Account Details:',
  krakowCardBenefit1: 'Data privacy: No user data is transmitted or stored on any server.',
  krakowCardBenefit2: 'Accessibility preferences and reports are linked to your profile.',
  krakowCardBenefit3: 'Free testing with arbitrary credentials (mockup prototype).',
  krakowCardClose: 'Close',
  krakowCardVerifiedBadge: 'Signed In',
  krakowCardReportNoticeVerified:
    'Submitting as a signed-in user. Your report is linked to your local account.',
  krakowCardReportNoticeAnon:
    'Submitting anonymously. Sign in with an email to link the report to your account.',
  barrierViewModeLabel: 'Barrier view on map',
  barrierModeRoute: 'Barriers',
  barrierModeAll: 'All',
  barrierModeNone: 'No barriers',
  barrierModeRouteHint: 'Show barriers along the planned route',
  barrierModeAllHint: 'Show all known architectural barriers across Kraków',
  barrierModeNoneHint: 'Hide barrier markers on map',
  noActiveRouteForBarriers: 'No active route. Plan a route to see its barriers.',
  mapClickPopupTitle: 'Selected point on map',
  pointOnMap: 'Point on map',
  mapClickActionSearchPlace: 'Search place',
  mapClickActionSetStart: 'Start (A)',
  mapClickActionSetEnd: 'Destination (B)',
  resolvingAddress: 'Resolving address...',
};

const uk: typeof pl = {
  appName: 'Краків без бар’єрів',
  profileTitle: 'Вибір профілю мобільності',
  profileLead:
    'Виберіть профіль для аналізу бар’єрів. Додаток не збирає дані про інвалідність, не створює облікових записів і працює на 100% локально на пристрої.',
  wheelchair: 'Крісло колісне',
  wheelchairHint: 'Сходи блокують маршрут (blocker). Бордюр макс. 3 см.',
  custom: 'Власний профіль',
  customHint: 'Налаштуйте власні ліміти бордюрів, нахилу та сходинок.',
  selected: 'Вибраний профіль',
  blockedRoadTypesTitle: 'Заблоковані типи покриття та доріг',
  blockedRoadTypesSubtitle:
    'Дороги з вибраними покриттями будуть оминатися або позначатися на маршруті як непрохідні (блокада).',
  surfaceCobblestone: 'Бруківка / Кругляк',
  surfaceGravel: 'Гравій / Щебінь',
  surfaceSand: 'Пісок',
  surfaceDirt: 'Ґрунт / Земля',
  surfaceUnpaved: 'Невимощена',
  surfaceCompacted: 'Утрамбований гравій',
  surfacePavingStones: 'Бруківка / Плитка',
  surfaceSteps: 'Пішохідні сходи',
  blockedStatusBlocked: 'ЗАБЛОКОВАНО',
  blockedStatusAllowed: 'ДОЗВОЛЕНО',
  stepsAllowed: 'Дозволено',
  continue: 'Перейти до пошуку',
  privacy:
    'Координати маршруту надсилаються виключно до Mapy.com (геометрія маршруту) та публічного API Overpass / OpenStreetMap (дані про бар’єри). Додаток не передає жодних ідентифікаторів користувача чи персональних даних.',
  searchTitle: 'Маршрут або місце',
  searchLead:
    'Сплануйте пішохідний маршрут А - Б у Кракові або перевірте доступність конкретного місця.',
  routeTab: 'Маршрут А - Б',
  placeTab: 'Перевірити місце',
  from: 'Початкова точка (А)',
  to: 'Кінцева точка (Б)',
  placeLabel: 'Назва або адреса місця',
  fromPlaceholder: 'наприклад, Площа Ринок',
  toPlaceholder: 'наприклад, Вавель',
  placePlaceholder: 'наприклад, Сукенниці, Вавельський собор',
  myLocation: 'Використати моє розташування',
  searchButton: 'Навігація',
  searchPlaceButton: 'Перевірити доступність місця',
  demoScenarios: 'Приклади тестових маршрутів (Демо):',
  demoRoute1: 'Площа Ринок - Вавель (вул. Гродзька)',
  demoRoute2: 'Казімєж (Нова площа) - Планти',
  demoPlace1: 'Сукенниці (повна доступність)',
  demoPlace2: 'Кам’яниця на Гродзькій (симуляція: суперечливі дані)',
  demoPlace3: 'Староміський ресторан (симуляція: застарілі дані)',
  notReady: 'Аналіз триває...',
  routeReportTitle: 'Звіт про бар’єри на маршруті',
  summaryCardTitle: 'Підсумок маршруту',
  routeLength: 'Довжина маршруту',
  routeDuration: 'Орієнтовний час',
  blockersCount: 'Блокади (непрохідно)',
  warningsCount: 'Попередження (труднощі)',
  infoCount: 'Зручності / Інформація',
  unknownCount: 'Невідомі ділянки',
  longestUnknownStretch: 'Найдовша ділянка без даних',
  dataCoverage: 'Покриття даними вздовж маршруту',
  coverageRatio: 'покриття',
  noBarriersFound:
    'У наявних даних перешкод не знайдено. Увага: дані OSM можуть бути неповними.',
  caveatNotice:
    'Пам’ятайте: відсутність зареєстрованої перешкоди в OpenStreetMap не гарантує її відсутності в дійсності.',
  showMap: 'Показати карту з бар’єрами',
  hideMap: 'Сховати карту (список)',
  readAloud: 'Прослухати голосовий підсумок',
  stopSpeech: 'Зупинити читання',
  shareSummary: 'Поділитися текстовим звітом',
  findingsListTitle: 'Перелік бар’єрів за порядком маршруту',
  distanceFromStart: 'Відстань від старту',
  whyThisStatus: 'Чому такий статус?',
  reportCorrection: 'Повідомити про помилку або бар’єр',
  placeDetailTitle: 'Доступність місця',
  matchConfidence: 'Точність зіставлення з OSM',
  confidentMatch: 'Об’єкт зіставлено з базою OpenStreetMap',
  noPlaceData:
    'В OpenStreetMap немає даних про доступність цього місця. Згідно з правилами додатка, невідоме місце не позначається як доступне.',
  catEntrance: 'Вхід до будівлі',
  catInside: 'Інтер’єр та коридори',
  catToilet: 'Пристосований туалет',
  catSurroundings: 'Територія та підхід',
  emptyCategory: 'Немає детальної інформації в цій категорії',
  reportTitle: 'Повідомлення про виправлення даних',
  reportLead:
    'Помітили бар’єр або неточність? Ваше повідомлення буде збережено локально в черзі перевірки. Ви також можете додати нотатку безпосередньо в OpenStreetMap.',
  reportObstacleDesc: 'Опис перешкоди або зауваження',
  reportObstaclePlaceholder: 'наприклад, пошкоджений пандус, сходинка 15 см біля входу...',
  reportSubmit: 'Зберегти повідомлення локально',
  reportSavedSuccess:
    'Повідомлення збережено в пам’яті пристрою (позначено як неперевірене).',
  openOsmNote: 'Додати нотатку в OpenStreetMap (зовнішнє посилання)',
  osmNoteDisclaimer:
    'Додаток ніколи не надсилає дані автоматично до бази OSM. Ви відкриєте офіційний сайт OpenStreetMap, щоб створити публічну нотатку як користувач.',
  localReportsQueue: 'Локальні повідомлення користувача (неперевірені):',
  noLocalReports: 'Немає очікуваних локальних повідомлень.',
  debugPanel: 'Панель симуляції та тестів (Демо)',
  simulateOverpassFail: 'Симулювати збій Overpass API (помилка 503 / тайм-аут)',
  simulateMapyFail: 'Симулювати помилку Mapy.com API (помилка 429 ліміт запитів)',
  simulateOffline: 'Увімкнути режим офлайн (використовувати знімок даних)',
  resetSimulation: 'Вимкнути симуляції (відновити роботу онлайн)',
  sampleDataBanner: 'ЗРАЗКОВІ ДАНІ (Офлайн Демо-знімок Краків)',
  simulationActiveBanner: 'АКТИВНА СИМУЛЯЦІЯ ЗБОЮ: ',
  sourceFailedMessage:
    'Не вдалося завантажити дані із зовнішнього джерела. Показано резервні дані / демо-знімок.',
  about: 'Про дані та ліцензії',
  aboutTitle: 'Звідки надходить інформація',
  aboutLead:
    'Кожен факт у додатку містить значення, статус, джерело, дату оновлення та пояснення. Відсутність даних завжди показується як невідомо, ніколи як доступно.',
  mapyUses: 'Пішохідні маршрути та геокодування адрес.',
  osmUses: 'Геометрія бар’єрів, покриття, сходів, бордюрів та об’єктів.',
  copyrightLabel: 'Інформація про авторські права',
  logoLabel: 'Обов’язковий логотип Mapy.com',
  demoArea: 'Демонстраційна зона HackYeah 2026',
  provisional: 'Демонстраційна зона: Площа Ринок - Казімєж - Вавель - Планти.',
  language: 'Українська',
  back: 'Назад',
  close: 'Закрити',

  // Kraków Municipal & Gov branding
  krakowOfficialHeader: 'Офіційна система просторової доступності',
  krakowGovSub: 'Проєкт команди Burza z Mózgów',
  krakowCityBadge: 'Місто Краків',
  wcagBadge: 'Стандарт WCAG 2.2 AAA',
  krakowMunicipalFooter:
    'Міський прототип у межах Програми Краків Без Бар’єрів • Відповідність Європейському акту про доступність (EAA) та стандарту PN-EN 301 549 (WCAG 2.2 AAA)',

  // Accessibility Panel & Controls
  accessibilityMenuBtn: 'Доступність',
  accessibilityHeaderButton: 'Налаштування доступності (WCAG)',
  quickA11yToolbar: 'Панель швидкого доступу WCAG',
  accessibilityPanelTitle: 'Центр налаштування доступності',
  accessibilityPanelDesc:
    'Налаштуйте інтерфейс відповідно до своїх зорових, когнітивних та моторних потреб згідно з вимогами Закону про цифрову доступність.',
  contrastSectionTitle: 'Контраст та кольори (WCAG 2.2 AAA)',
  contrastModeStandardLight: 'Стандартний світлий (Краківський синій)',
  contrastModeStandardDark: 'Стандартний темний (Нічний режим)',
  contrastModeYellowBlack: 'Високий контраст: Жовтий на чорному',
  contrastModeBlackYellow: 'Високий контраст: Чорний на жовтому',
  contrastModeWhiteBlack: 'Високий контраст: Білий на чорному',
  contrastModeMonochrome: 'Монохромний (Відтінки сірого)',
  contrastModeMonochromeHint:
    'Вимикає насиченість кольорів, зменшуючи втому очей та світлобоязнь.',
  textSizeSectionTitle: 'Масштабування тексту',
  textSizeNormal: '100% (Стандартний)',
  textSizeMedium: '115% (Збільшений)',
  textSizeLarge: '130% (Великий)',
  textSizeXLarge: '150% (Дуже великий)',
  textSizeXXLarge: '175% (Максимальний)',
  textSizeBtnDecrease: 'Зменшити текст (A-)',
  textSizeBtnIncrease: 'Збільшити текст (A+)',
  fontFamilySectionTitle: 'Шрифт',
  fontFamilySystem: 'Стандартний системний шрифт',
  fontFamilyDyslexic: 'Шрифт підвищеної читабельності (Dyslexic)',
  fontFamilyMono: 'Моноширинний шрифт',
  lineSpacingTitle: 'Міжрядковий інтервал',
  lineSpacingNormal: 'Стандартний (1.45)',
  lineSpacingIncreased: 'Збільшений (1.80)',
  lineSpacingLoose: 'Вільний (2.20)',
  letterSpacingTitle: 'Міжлітерний інтервал',
  letterSpacingNormal: 'Стандартний',
  letterSpacingIncreased: 'Збільшений (+1.2)',
  letterSpacingWide: 'Широкий (+2.5)',
  readabilitySectionTitle: 'Читабельність та сприйняття',
  dyslexicMode: 'Режим полегшеного читання',
  dyslexicModeHint: 'Збільшує відстань між символами та рядками для легшого читання.',
  motorSectionTitle: 'Моторна підтримка (Розмір цілей)',
  increasedSpacing: 'Збільшені зони натискання (мін. 56 px)',
  increasedSpacingHint:
    'Збільшує відступи між інтерактивними елементами для запобігання випадковим натисканням.',
  visualFocusSectionTitle: 'Фокус зору та увага',
  highlightInteractive: 'Виразне виділення посилань і кнопок',
  highlightInteractiveHint:
    'Додає чітку рамку 4 px та підкреслення до клікабельних елементів (WCAG 1.4.1).',
  readingRuler: 'Лінійка для читання (Напрямна рядка)',
  readingRulerHint:
    'Відображає горизонтальну лінійку для відстеження тексту рядок за рядком.',
  readingMask: 'Маска фокусування на тексті',
  readingMaskHint: 'Затемнює верхню та нижню частини екрана, ізолюючи активний фрагмент тексту.',
  speechSectionTitle: 'Синтез мовлення (Голосовий супровід)',
  speechAssistant: 'Екранний диктор (Синтез мовлення)',
  speechRateTitle: 'Швидкість мовлення диктора',
  speechRateSlow: '0.8x (Повільна)',
  speechRateNormal: '1.0x (Стандартна)',
  speechRateFast: '1.2x (Швидка)',
  readCurrentScreen: 'Прочитати вміст екрана',
  stopCurrentSpeech: 'Зупинити читання',
  resetAccessibilityBtn: 'Скинути до стандартних',
  applyAndClose: 'Зберегти та закрити',
  accessibilityDeclaration: 'Декларація цифрової доступності',
  screenReaderReady: 'Оптимізовано для програм зчитування з екрана (TalkBack / VoiceOver)',
  facilitiesCount: 'Зручності',

  // Badges
  statusVerified: 'Перевірено',
  statusCommunity: 'Спільнота OSM',
  statusReported: 'Локальне повідомлення',
  statusUnknown: 'Немає даних',
  statusConflicting: 'Суперечливі дані',
  severityBlocker: 'Блокада',
  severityWarning: 'Попередження',
  severityInfo: 'Інформація',
  severityOk: 'Доступно',

  // Language selectors
  languageSectionTitle: 'Мова інтерфейсу',
  switchLanguage: 'Змінити мову',
  langPl: 'Polski (Польська)',
  langEn: 'English (Англійська)',
  langUk: 'Українська',

  // Newly unified UI & action keys
  reader: 'Голос',
  stop: 'Стоп',
  openPlaceCard: 'Відкрити повну картку місця',
  showFullReportAndManeuvers: 'Показати повний звіт та маневри',
  fastDemoRoutes: 'ШВИДКІ ДЕМО-МАРШРУТИ (КРАКІВ):',
  popularDemoPlaces: 'ПОПУЛЯРНІ ДЕМО-МІСЦЯ:',
  selectProfile: 'Виберіть профіль мобільності:',
  customThresholdsTitle: 'Пороги бар’єрів для власного профілю:',
  maxKerb: 'Максимальний бордюр:',
  kerbLow: 'Низький (3 см)',
  kerbMedium: 'Середній (7 см)',
  kerbHigh: 'Високий (14 см)',
  stepsTreatment: 'Обробка сходинок:',
  toggleStepsStatus: 'Змінити статус сходинок',
  reportObstacleHeading: 'Повідомити про перешкоду або застарілий бар’єр:',
  openFullOsmForm: 'Перейти до повної форми OSM',
  collapseMenu: 'Згорнути нижнє меню',
  expandMenu: 'Розгорнути меню',
  hideMenu: 'Сховати меню',
  searchPlaceholderUnified: 'Куди в Кракові? Шукати маршрут або місце...',
  surfacesChip: 'Покриття',
  tabRoute: 'Маршрут',
  tabPlace: 'Місце',
  tabProfile: 'Профіль',
  tabReport: 'Повідомити',
  myLocationShort: 'Моє розташування',
  myLocationCenter: 'Моє розташування (Центр)',
  myLocationCenterKrakow: 'Моє розташування (Центр Кракова)',
  toastCenteredKrakow: 'Карту відцентровано на площі Ринок у Кракові.',
  routeErrorTitle: 'Помилка прокладання маршруту',
  routeErrorMsg: 'Не вдалося прокласти маршрут.',
  placeErrorTitle: 'Помилка перевірки місця',
  placeErrorMsg: 'Не вдалося завантажити дані.',
  errorTitle: 'Помилка',
  warningTitle: 'Увага',
  reportDescRequired: 'Введіть опис перешкоди перед збереженням.',
  reportPopupTitle: 'Повідомити про перешкоду',
  reportLocationLabel: 'Місце перешкоди',
  reportLocationRequired: 'Вкажіть місце перешкоди на карті або використайте свою локацію.',
  routeEndpointsRequired: 'Вкажіть початок і ціль маршруту.',
  btnCenterKrakow: 'Відцентрувати на центр Кракова',
  btnChangeProfile: 'Змінити профіль пересування',
  btnClearRoute: 'Очистити активний маршрут',
  btnShowRouteSummary: 'Показати підсумок активного маршруту',
  gpsFetching: 'Отримання вашої геопозиції GPS...',
  gpsCenteredSuccess: 'Карту відцентровано за вашою локацією.',
  gpsStartPointSet: 'Початкову точку встановлено за вашою локацією.',
  gpsUnavailableTitle: 'Геолокація недоступна',
  gpsUnavailableDesc: 'Не вдалося отримати вашу поточну геопозицію. Переконайтеся, що GPS увімкнено та надано дозволи.',
  gpsUnavailableSearchDesc: 'Не вдалося отримати вашу GPS-геолокацію. Введіть початкову адресу вручну або виберіть Центр Кракова.',
  btnCenterKrakowAction: 'Центр Кракова',
  rynekGlowny: 'Площа Ринок',
  cancel: 'Скасувати',
  accessibilityShowMyLocation: 'Показати мою поточну локацію',
  noSelectedPlace: 'Місце не вибрано.',
  municipalObjectKrakow: 'МІСЬКИЙ ОБ’ЄКТ КРАКІВ',
  readAloudPlace: 'Прослухати опис місця',
  conflictingDataTitle: 'Виявлено суперечливі дані в OpenStreetMap (R7):',
  conflictingDataDesc:
    'Різні об’єкти OSM (наприклад, будівля та точка входу) надають суперечливу інформацію про одне й те саме місце. Нижче наведено обидва значення:',
  criterion: 'Критерій',
  source: 'Джерело',
  value: 'Значення',
  staleDataTitle: 'Увага: Застарілі дані в OpenStreetMap (R8):',
  staleDataDesc:
    'Деяка інформація про це місце не перевірялася і не редагувалася понад 24 місяці. Фактичний стан міг змінитися.',
  noActiveRouteReport: 'Немає активного звіту маршруту.',
  backToSearch: 'Повернутися до пошуку',
  krakowRouteTag: 'КРАКІВ МАРШРУТ',
  metresContinuousNoData: 'метрів безперервної відсутності даних',
  orderedByDistance: 'Впорядковано за зростанням відстані від старту:',
  noElementsInCorridor: 'У коридорі цього маршруту не зареєстровано елементів в OpenStreetMap.',
  dateConfirmed: 'підтверджено',
  dateOsmEdit: 'останнє редагування OSM',
  dateRetrieved: 'отримано',
  noDate: 'немає дати',
  noVerificationDate: 'немає дати перевірки',
  afterDistance: 'Через',
  hideDetails: 'Сховати деталі',
  osmEvidenceDetails: 'Доказові деталі з OpenStreetMap:',
  objectId: 'Ідентифікатор об’єкта',
  credibilityStatus: 'Статус достовірності',
  credibilityIndex: 'Індекс',
  credibilityLegendTitle: 'Індекс достовірності даних',
  credibilityLegendLead:
    'Вище означає сильніший доказ. Узгоджені повідомлення (5+ або 3+ зі світлиною) стоять над джерелами. Одне повідомлення не підтверджує, що бар’єр є або його немає. У OSM статус перевірено дають лише теги check_date і survey:date — дата редагування не є оглядом.',
  credibilityRankCorroborated: 'узгоджені повідомлення (5+ або 3+ зі світлиною)',
  credibilityRankOsmVerified: 'OSM, дата огляду',
  credibilityRankOfficialCity: 'BIP / krakow.pl, декларація доступності',
  credibilityRankMsipZdmk: 'MSIP Kraków / ZDMK',
  credibilityRankWawel: 'аудит Вавельського замку',
  credibilityRankFieldAudit: 'польовий аудит',
  credibilityRankOsmCommunity: 'OSM без дати огляду',
  credibilityRankGeoportal: 'Geoportal BDOT10k, підкладка карти',
  credibilityRankPartialReport: 'частково узгоджені повідомлення',
  credibilityRankConflicting: 'суперечливі дані',
  credibilityRankUnspecified: 'джерело не класифіковано',
  credibilityRankSingleReport: 'одне повідомлення',
  credibilityRankUnknown: 'немає даних',
  credibilityCaveatSingle: 'Не підтверджує, що бар’єр є або його немає.',
  credibilityCaveatPartial: 'Нижче порогу 5 повідомлень або 3 зі світлиною.',
  credibilityCaveatOsmEdit: 'Дата редагування OSM не є датою огляду на місці.',
  evidenceDetails: 'Деталі джерела',
  dataLicense: 'Ліцензія даних',
  geometricMatchConfidence: 'Впевненість геометричного зіставлення',
  sourceUrl: 'URL джерела',
  less: 'Менше',
  objectLabel: 'Місце',
  licenseLabel: 'Ліцензія',
  confirmationDateLabel: 'Дата підтвердження (check_date)',
  noCheckDateLabel:
    'Немає тегу підтвердження (check_date). Дата редагування не є датою перевірки.',
  placeMatchConfidenceLabel: 'Впевненість зіставлення з місцем',
  zoomIn: 'Приблизити карту',
  zoomOut: 'Віддалити карту',
  noMeasurementPoints: 'немає точок вимірювання',
  coverageParam: 'Покриття параметра',
  noDetailedManeuvers: 'Немає детальних маневрів.',
  debugDesc:
    'Симуляція аварійних та граничних станів за регламентом HackYeah (R7, R8, R12):',
  footerA11yLabel: 'Офіційна інформація та декларація доступності міста Краків',
  privacyTag: '100% Конфіденційність (P1–P5)',
  coatOfArmsA11y:
    'Герб столичного королівського міста Кракова: цегляні мури з трьома вежами, корона та орел у відкритій брамі',
  localReportUnverified: 'Локальне повідомлення (неперевірене)',
  simOverpassFailShort: 'Збій Overpass (503)',
  simMapyFailShort: 'Помилка Mapy.com (429)',
  simOfflineShort: 'Примусовий офлайн',
  fallbackDataDisplayed: 'Відображено резервні дані',
  activeFailureSimulation: 'АКТИВНА СИМУЛЯЦІЯ ЗБОЮ:',
  cityHallKrakow: 'Мерія міста Краків',
  distanceLabel: 'Дистанція',
  coverageKerbs: 'Бордюри на переходах',
  coverageSurface: 'Дані про покриття',
  coverageSteps: 'Сходинки та сходи',
  coverageWidth: 'Ширина проходу',
  coverageIncline: 'Нахил',
  chooseStartPoint: 'Виберіть початкову точку',
  chooseEndPoint: 'Виберіть пункт призначення',
  pointA: 'Точка A (Старт)',
  pointB: 'Точка B (Ціль)',
  swapPoints: 'Поміняти місцями старт і фініш',
  enterCoordinates: 'Ввести координати',
  hideCoordinates: 'Сховати введення координат',
  latitude: 'Широта (Lat)',
  longitude: 'Довгота (Lon)',
  latitudePlaceholder: 'напр. 50.0619',
  longitudePlaceholder: 'напр. 19.9373',
  applyCoordinates: 'Застосувати координати',
  invalidCoordinates: 'Недійсні координати (широта: -90..90, довгота: -180..180).',
  coordinatesApplied: 'Координати встановлено.',
  pickOnMap: 'Вказати на мапі',
  pickingOnMapStart: 'Торкніться карти, щоб вибрати точку A',
  pickingOnMapEnd: 'Торкніться карти, щоб вибрати точку B',
  cancelMapPick: 'Скасувати вибір на карті',
  osmSuggestionsTitle: 'Адреси та місця',
  osmAttributionLabel: 'Джерело: OpenStreetMap',
  clearSelection: 'Очистити поле',
  customRoute: 'Власний маршрут',
  coordinatesBadge: 'Координати',
  directRouteFallback: 'Побудовано прямий маршрут за координатами OpenStreetMap.',
  searchPromptOsm: 'Шукайте вулицю, місце або введіть координати...',
  selectedCoordinates: 'Вибрані координати',
  searchQueryMatches: 'Знайдені локації OSM',
  noOsmResultsFound: 'Локацій в OpenStreetMap не знайдено.',

  // User Account (Mockup email account)
  userAccount: 'Акаунт',
  userAccountSubtitle: 'Локальний демонстраційний акаунт (mockup)',
  userAccountLoginTitle: 'Вхід / Реєстрація',
  userAccountLoginDesc:
    'Створіть акаунт або увійдіть за адресою email. Оскільки це демонстраційний макет (mockup), можна вказати будь-які дані.',
  userAccountMockupNotice:
    'Жодні дані користувача не зберігатимуться на сервері. Вхід та сесія працюють виключно в пам’яті пристрою — ви можете увійти з будь-якими даними.',
  userAccountEmailLabel: 'Електронна адреса',
  userAccountEmailPlaceholder: 'напр. petro@example.com',
  userAccountNameLabel: 'Ім’я або псевдонім (необов’язково)',
  userAccountNamePlaceholder: 'напр. Петро Шевченко',
  userAccountPasswordLabel: 'Пароль',
  userAccountPasswordPlaceholder: 'Введіть будь-який пароль (mockup)',
  userAccountLoginBtn: 'Увійти / Зареєструватися',
  userAccountQuickDemoBtn: 'Заповнити зразковими даними',
  userAccountLoggedInTitle: 'Ваш акаунт',
  userAccountStatusActive: 'Статус: Увійшов (локальний акаунт)',
  userAccountVerifiedResident: 'Авторизований користувач',
  userAccountValidUntil: 'Активна сесія',
  userAccountLogout: 'Вийти з акаунта',
  userAccountBenefitsTitle: 'Інформація про акаунт:',
  userAccountBenefit1: 'Конфіденційність: Жодні дані користувача не надсилаються і не зберігаються на сервері.',
  userAccountBenefit2: 'Налаштування доступності та повідомлення пов’язані з вашим профілем.',
  userAccountBenefit3: 'Тестування з будь-якими обліковими даними (mockup).',
  userAccountClose: 'Закрити',
  userAccountVerifiedBadge: 'Авторизований',
  userAccountReportNoticeVerified:
    'Ви надсилаєте повідомлення як авторизований користувач.',
  userAccountReportNoticeAnon:
    'Анонімне надсилання. Увійдіть за допомогою email, щоб пов’язати повідомлення з акаунтом.',

  // Backward compatibility keys
  krakowCard: 'Акаунт',
  krakowCardSubtitle: 'Локальний демонстраційний акаунт (mockup)',
  krakowCardLoginTitle: 'Вхід / Реєстрація',
  krakowCardLoginDesc:
    'Створіть акаунт або увійдіть за адресою email. Оскільки це демонстраційний макет (mockup), можна вказати будь-які дані.',
  krakowCardMockupNotice:
    'Жодні дані користувача не зберігатимуться на сервері. Вхід та сесія працюють виключно в пам’яті пристрою — ви можете увійти з будь-якими даними.',
  krakowCardIdentifierLabel: 'Електронна адреса',
  krakowCardIdentifierPlaceholder: 'напр. petro@example.com',
  krakowCardNameLabel: 'Ім’я або псевдонім (необов’язково)',
  krakowCardNamePlaceholder: 'напр. Петро Шевченко',
  krakowCardPasswordLabel: 'Пароль',
  krakowCardPasswordPlaceholder: 'Введіть будь-який пароль (mockup)',
  krakowCardLoginBtn: 'Увійти / Зареєструватися',
  krakowCardQuickDemoBtn: 'Заповнити зразковими даними',
  krakowCardLoggedInTitle: 'Ваш акаунт',
  krakowCardStatusActive: 'Статус: Увійшов (локальний акаунт)',
  krakowCardVerifiedResident: 'Авторизований користувач',
  krakowCardValidUntil: 'Активна сесія',
  krakowCardLogout: 'Вийти з акаунта',
  krakowCardBenefitsTitle: 'Інформація про акаунт:',
  krakowCardBenefit1: 'Конфіденційність: Жодні дані користувача не надсилаються і не зберігаються на сервері.',
  krakowCardBenefit2: 'Налаштування доступності та повідомлення пов’язані з вашим профілем.',
  krakowCardBenefit3: 'Тестування з будь-якими обліковими даними (mockup).',
  krakowCardClose: 'Закрити',
  krakowCardVerifiedBadge: 'Авторизований',
  krakowCardReportNoticeVerified:
    'Ви надсилаєте повідомлення як авторизований користувач.',
  krakowCardReportNoticeAnon:
    'Анонімне надсилання. Увійдіть за допомогою email, щоб пов’язати повідомлення з акаунтом.',
  barrierViewModeLabel: 'Вигляд бар\'єрів на карті',
  barrierModeRoute: 'Бар’єри',
  barrierModeAll: 'Всі',
  barrierModeNone: 'Без бар\'єрів',
  barrierModeRouteHint: 'Показати бар’єри вздовж запланованого маршруту',
  barrierModeAllHint: 'Показати всі відомі архітектурні бар\'єри в Кракові',
  barrierModeNoneHint: 'Приховати маркери бар\'єрів на карті',
  noActiveRouteForBarriers: 'Немає активного маршруту. Сплануйте маршрут, щоб побачити бар\'єри.',
  mapClickPopupTitle: 'Вибрана точка на карті',
  pointOnMap: 'Точка на карті',
  mapClickActionSearchPlace: 'Пошук місця',
  mapClickActionSetStart: 'Старт (A)',
  mapClickActionSetEnd: 'Ціль (B)',
  resolvingAddress: 'Визначення адреси...',
};

const dictionaries: Record<Locale, typeof pl> = { pl, en, uk };

export function t(locale: Locale, key: keyof typeof pl): string {
  const dict = dictionaries[locale] ?? pl;
  return dict[key] ?? pl[key] ?? '';
}

export function getLocalizedCoverageCriterion(criterion: string, locale: Locale): string {
  const c = criterion.toLowerCase().trim();
  if (c.includes('krawężnik') || c.includes('kerb')) {
    return t(locale, 'coverageKerbs');
  }
  if (c.includes('nawierzchni') || c.includes('surface')) {
    return t(locale, 'coverageSurface');
  }
  if (c.includes('schody') || c.includes('stopnie') || c.includes('step')) {
    return t(locale, 'coverageSteps');
  }
  if (c.includes('szerokoś') || c.includes('width')) {
    return t(locale, 'coverageWidth');
  }
  if (c.includes('nachyleni') || c.includes('incline')) {
    return t(locale, 'coverageIncline');
  }
  return criterion;
}

export function getLocalizedFindingType(type: string, locale: Locale): string {
  const tKey = type.toLowerCase().trim();
  if (tKey === 'kerb' || tKey.includes('krawężnik')) {
    return locale === 'pl' ? 'Krawężnik' : locale === 'uk' ? 'Бордюр' : 'Kerb';
  }
  if (tKey === 'surface' || tKey.includes('nawierzchni')) {
    return locale === 'pl' ? 'Nawierzchnia' : locale === 'uk' ? 'Покриття' : 'Surface';
  }
  if (tKey === 'steps' || tKey.includes('schody')) {
    return locale === 'pl' ? 'Schody' : locale === 'uk' ? 'Сходи' : 'Steps';
  }
  if (tKey === 'crossing' || tKey.includes('przejście')) {
    return locale === 'pl' ? 'Przejście dla pieszych' : locale === 'uk' ? 'Пішохідний перехід' : 'Crossing';
  }
  if (tKey === 'width' || tKey.includes('szerokoś')) {
    return locale === 'pl' ? 'Szerokość przejścia' : locale === 'uk' ? 'Ширина проходу' : 'Passage width';
  }
  if (tKey === 'elevator' || tKey.includes('winda')) {
    return locale === 'pl' ? 'Winda' : locale === 'uk' ? 'Ліфт' : 'Elevator';
  }
  if (tKey === 'ramp' || tKey.includes('rampa')) {
    return locale === 'pl' ? 'Rampa / pochylnia' : locale === 'uk' ? 'Пандус' : 'Ramp';
  }
  if (tKey === 'report') {
    return locale === 'pl' ? 'Zgłoszenie' : locale === 'uk' ? 'Повідомлення' : 'Report';
  }
  return type;
}

export function getLocalizedSurfaceName(surface: string, locale: Locale): string {
  if (!surface) return '';
  const norm = surface.trim().toLowerCase();
  const surfaceMap: Record<string, Record<Locale, string>> = {
    cobblestone: {
      pl: 'Kocie łby / bruk',
      en: 'Cobblestone',
      uk: 'Бруківка / кругляк',
    },
    sett: {
      pl: 'Kostka kamienna',
      en: 'Stone sett',
      uk: 'Кам’яна бруківка',
    },
    paving_stones: {
      pl: 'Kostka brukowa / płyty',
      en: 'Paving stones',
      uk: 'Бруківка / плитка',
    },
    asphalt: {
      pl: 'Asfalt',
      en: 'Asphalt',
      uk: 'Асфальт',
    },
    concrete: {
      pl: 'Beton',
      en: 'Concrete',
      uk: 'Бетон',
    },
    gravel: {
      pl: 'Żwir / szuter',
      en: 'Gravel',
      uk: 'Гравій / щебінь',
    },
    fine_gravel: {
      pl: 'Drobny żwir',
      en: 'Fine gravel',
      uk: 'Дрібний гравій',
    },
    sand: {
      pl: 'Piasek',
      en: 'Sand',
      uk: 'Пісок',
    },
    dirt: {
      pl: 'Grunt / ziemia',
      en: 'Dirt / ground',
      uk: 'Ґрунт / земля',
    },
    earth: {
      pl: 'Ziemia',
      en: 'Earth',
      uk: 'Земля',
    },
    ground: {
      pl: 'Grunt',
      en: 'Ground',
      uk: 'Ґрунт',
    },
    grass: {
      pl: 'Trawa',
      en: 'Grass',
      uk: 'Трава',
    },
    wood: {
      pl: 'Drewno',
      en: 'Wood',
      uk: 'Дерево',
    },
    compacted: {
      pl: 'Ubity żwir / utwardzona',
      en: 'Compacted gravel',
      uk: 'Утрамбований гравій',
    },
    unpaved: {
      pl: 'Nieutwardzona',
      en: 'Unpaved',
      uk: 'Невимощена',
    },
    paved: {
      pl: 'Utwardzona',
      en: 'Paved',
      uk: 'Вимощена',
    },
  };

  if (surfaceMap[norm]) {
    return surfaceMap[norm][locale];
  }
  return surface;
}

export function getLocalizedBarrierMessage(
  barrier: { type?: string; severity?: string; value?: string; message?: string },
  locale: Locale,
): string {
  if (!barrier.message) return '';
  if (barrier.type === 'surface') {
    const surfName = getLocalizedSurfaceName(barrier.value || '', locale);
    if (barrier.severity === 'blocker') {
      if (locale === 'pl') return `Zablokowana nawierzchnia (${surfName}) – droga zablokowana dla profilu`;
      if (locale === 'uk') return `Заблоковане покриття (${surfName}) – шлях заблоковано для обраного профілю`;
      return `Blocked surface (${surfName}) – way blocked for selected profile`;
    } else {
      if (locale === 'pl') return `Nawierzchnia (${surfName}) nie znajduje się na liście zalecanych dla profilu`;
      if (locale === 'uk') return `Покриття (${surfName}) не входить до переліку рекомендованих`;
      return `Surface (${surfName}) is not on the recommended list for profile`;
    }
  }
  return barrier.message;
}

export function getLocalizedFactValue(val: string, locale: Locale): string {
  if (!val) return '';

  // Clean up any ugly raw technical tag annotations like (wheelchair=limited), wheelchair=no, etc.
  let cleaned = val.replace(/\s*\(?wheelchair=(limited|no|yes)\)?/gi, (_match, p1) => {
    const v = p1.toLowerCase();
    if (v === 'limited') return locale === 'pl' ? ' (ograniczona dostępność)' : locale === 'uk' ? ' (часткова доступність)' : ' (limited accessibility)';
    if (v === 'no') return locale === 'pl' ? ' (brak dostępności)' : locale === 'uk' ? ' (недоступно)' : ' (not accessible)';
    return locale === 'pl' ? ' (dostępne)' : locale === 'uk' ? ' (доступно)' : ' (accessible)';
  }).trim();

  // If the whole value is just raw wheelchair value or limited/no/yes:
  const lower = cleaned.toLowerCase();
  if (lower === 'limited' || lower === 'wheelchair=limited' || lower === '(wheelchair=limited)') {
    return locale === 'pl' ? 'Ograniczona dostępność' : locale === 'uk' ? 'Обмежена доступність' : 'Limited accessibility';
  }
  if (lower === 'no' || lower === 'wheelchair=no' || lower === '(wheelchair=no)') {
    return locale === 'pl' ? 'Brak dostępności' : locale === 'uk' ? 'Недоступно' : 'Not accessible';
  }
  if (lower === 'yes' || lower === 'wheelchair=yes' || lower === '(wheelchair=yes)') {
    return locale === 'pl' ? 'Dostępne' : locale === 'uk' ? 'Доступно' : 'Accessible';
  }

  // Strip any orphan raw tag key=value strings if present
  cleaned = cleaned.replace(/\s*\([a-z_]+=[a-z_]+\)/gi, '').trim();

  // Direct single-word surface matches
  const directSurface = getLocalizedSurfaceName(cleaned, locale);
  if (directSurface !== cleaned) {
    return directSurface;
  }

  // Common barrier evidence strings from evaluation logic:
  // "Zablokowana nawierzchnia: cobblestone"
  const blockedPrefixMatch = cleaned.match(/^Zablokowana nawierzchnia:\s*(.*)$/i);
  if (blockedPrefixMatch) {
    const rawSurface = blockedPrefixMatch[1].trim();
    const localizedSurface = getLocalizedSurfaceName(rawSurface, locale);
    if (locale === 'pl') return `Zablokowana nawierzchnia: ${localizedSurface}`;
    if (locale === 'uk') return `Заблоковане покриття: ${localizedSurface}`;
    return `Blocked surface: ${localizedSurface}`;
  }

  // "Nawierzchnia utrudniająca poruszanie się: cobblestone"
  const warningPrefixMatch = cleaned.match(/^Nawierzchnia utrudniająca poruszanie się:\s*(.*)$/i);
  if (warningPrefixMatch) {
    const rawSurface = warningPrefixMatch[1].trim();
    const localizedSurface = getLocalizedSurfaceName(rawSurface, locale);
    if (locale === 'pl') return `Nawierzchnia utrudniająca: ${localizedSurface}`;
    if (locale === 'uk') return `Ускладнююче покриття: ${localizedSurface}`;
    return `Difficult surface: ${localizedSurface}`;
  }

  // "Nawierzchnia dopuszczalna: cobblestone"
  const allowedPrefixMatch = cleaned.match(/^Nawierzchnia dopuszczalna:\s*(.*)$/i);
  if (allowedPrefixMatch) {
    const rawSurface = allowedPrefixMatch[1].trim();
    const localizedSurface = getLocalizedSurfaceName(rawSurface, locale);
    if (locale === 'pl') return `Nawierzchnia dopuszczalna: ${localizedSurface}`;
    if (locale === 'uk') return `Допустиме покриття: ${localizedSurface}`;
    return `Allowed surface: ${localizedSurface}`;
  }

  let result = cleaned;
  const knownSurfaces = [
    'cobblestone',
    'paving_stones',
    'sett',
    'asphalt',
    'concrete',
    'gravel',
    'fine_gravel',
    'sand',
    'dirt',
    'compacted',
    'unpaved',
    'paved',
  ];

  for (const s of knownSurfaces) {
    const loc = getLocalizedSurfaceName(s, locale);
    result = result.replace(new RegExp(`\\(${s}\\)`, 'gi'), `(${loc})`);
    result = result.replace(new RegExp(`\\b${s}\\b`, 'gi'), loc);
  }

  if (locale === 'pl') {
    if (result === 'obecny') return 'Krawężnik obecny';
    return result;
  }

  if (locale === 'uk') {
    result = result.replace(/traffic_signals=yes/gi, 'світлофор');
    result = result.replace(/tactile_paving=yes/gi, 'тактильна плитка');
    result = result.replace(/sygnalizacja/gi, 'світлофор');
    result = result.replace(/pasy dotykowe/gi, 'тактильна плитка');
    result = result.replace(/brak rampy/gi, 'без пандуса');
    result = result.replace(/rampa obecna/gi, 'є пандус');
    result = result.replace(/stopni/gi, 'сходинок');
    result = result.replace(/stopnie/gi, 'сходинки');
    result = result.replace(/Kocie łby \/ bruk/gi, 'Бруківка / кругляк');
    result = result.replace(/^obecny$/gi, 'Бордюр наявний');
    result = result.replace(/\bobecny\b/gi, 'наявний');
    return result;
  }

  // English
  result = result.replace(/traffic_signals=yes/gi, 'traffic signals');
  result = result.replace(/tactile_paving=yes/gi, 'tactile paving');
  result = result.replace(/sygnalizacja/gi, 'traffic signals');
  result = result.replace(/pasy dotykowe/gi, 'tactile paving');
  result = result.replace(/brak rampy/gi, 'no ramp');
  result = result.replace(/rampa obecna/gi, 'ramp present');
  result = result.replace(/stopni/gi, 'steps');
  result = result.replace(/stopnie/gi, 'steps');
  result = result.replace(/Kocie łby \/ bruk/gi, 'Cobblestone');
  result = result.replace(/^obecny$/gi, 'Kerb present');
  return result;
}
