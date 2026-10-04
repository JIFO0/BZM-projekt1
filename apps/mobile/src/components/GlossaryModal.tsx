import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BookOpen,
  Check,
  MagnifyingGlass,
  Question,
  Tag,
  X,
} from 'phosphor-react-native';

import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export interface GlossaryEntry {
  id: string;
  abbr: string;
  fullName: {
    pl: string;
    en: string;
    uk: string;
  };
  category: 'wcag' | 'gis' | 'tech';
  desc: {
    pl: string;
    en: string;
    uk: string;
  };
  wcagRule?: string;
}

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    id: 'wcag',
    abbr: 'WCAG',
    fullName: {
      pl: 'Web Content Accessibility Guidelines (Wytyczne Dostępności Cyfrowej)',
      en: 'Web Content Accessibility Guidelines',
      uk: 'Web Content Accessibility Guidelines (Керівні принципи доступності)',
    },
    category: 'wcag',
    desc: {
      pl: 'Międzynarodowy standard dostępności stron i aplikacji internetowych W3C, określający wymagania ułatwień dla osób ze szczególnymi potrzebami.',
      en: 'International standard for web and digital content accessibility by W3C.',
      uk: 'Міжнародний стандарт доступності цифрового контенту W3C для людей з особливими потребами.',
    },
    wcagRule: 'Standard W3C / ISO/IEC 40500',
  },
  {
    id: 'aaa',
    abbr: 'WCAG AAA',
    fullName: {
      pl: 'Poziom potrójnego A (Level AAA - Enhanced Conformance)',
      en: 'Level AAA Conformance (Enhanced Accessibility)',
      uk: 'Рівень AAA (Найвищий рівень доступності)',
    },
    category: 'wcag',
    desc: {
      pl: 'Najwyższy, rygorystyczny poziom dostępności cyfrowej. Wymaga m.in. kontrastu wzmocnionego ≥ 7:1, powiększonych celów dotykowych (≥ 44 px), słowniczka pojęć i skrótów oraz braku ograniczeń czasowych.',
      en: 'The highest conformance level of WCAG. Requires 7:1 enhanced contrast, ≥ 44 px touch targets, abbreviations glossary, and no timing restrictions.',
      uk: 'Найвищий рівень доступності. Вимагає посиленого контрасту 7:1, збільшених кнопок (≥ 44 px), словничка скорочень та відсутності лімітів часу.',
    },
    wcagRule: 'WCAG 2.2 Kryteria 1.4.6, 2.5.5, 3.1.3, 3.1.4',
  },
  {
    id: 'aa',
    abbr: 'WCAG AA',
    fullName: {
      pl: 'Poziom podwójnego A (Level AA - Standard Publiczny)',
      en: 'Level AA Conformance (Public Sector Standard)',
      uk: 'Рівень AA (Стандарт для публічного сектора)',
    },
    category: 'wcag',
    desc: {
      pl: 'Standardowy, wymagany prawem (Ustawa o dostępności cyfrowej z 2019 r., norma EN 301 549) poziom zgodności dla aplikacji i stron instytucji publicznych (kontrast ≥ 4.5:1, obsługa czytników ekranu).',
      en: 'Legally required conformance level for public services (contrast ≥ 4.5:1, screen reader support, keyboard operable).',
      uk: 'Законодавчо обов’язковий рівень доступності для державних установ (контраст ≥ 4.5:1, підтримка скрінрідерів).',
    },
    wcagRule: 'Ustawa o dostępności cyfrowej z 2019 r. / EN 301 549',
  },
  {
    id: 'osm',
    abbr: 'OSM',
    fullName: {
      pl: 'OpenStreetMap (Otwarta Mapa Świata)',
      en: 'OpenStreetMap',
      uk: 'OpenStreetMap (Вільна географічна база)',
    },
    category: 'gis',
    desc: {
      pl: 'Otwarta, tworzona społecznościowo baza danych przestrzennych. Aplikacja pobiera z niej fakty o schodach (steps), wysokości krawężników (kerb), typie nawierzchni (surface) i nachyleniach (incline).',
      en: 'Open spatial database maintained by volunteers worldwide. Provides facts on steps, kerb heights, surface materials, and inclines.',
      uk: 'Відкрита просторова база даних. Додаток отримує з неї відомості про сходинки, бордюри, типи покриття та нахили.',
    },
    wcagRule: 'Open Database License (ODbL)',
  },
  {
    id: 'overpass',
    abbr: 'Overpass API',
    fullName: {
      pl: 'Overpass API (Silnik zapytań przestrzennych OSM)',
      en: 'Overpass API',
      uk: 'Overpass API (Сервер просторових запитів OSM)',
    },
    category: 'tech',
    desc: {
      pl: 'Wysokowydajny silnik zapytań do bazy OpenStreetMap, pozwalający wyciąć obiekty i przeszkody architektoniczne w buforze geometrii trasy pieszej w Krakowie.',
      en: 'High-performance query engine for OpenStreetMap used to extract spatial barriers along route corridors.',
      uk: 'Високопродуктивний сервер запитів для вибірки бар’єрів уздовж коридору маршруту.',
    },
  },
  {
    id: 'odbl',
    abbr: 'ODbL',
    fullName: {
      pl: 'Open Database License (Otwarta Licencja Bazy Danych)',
      en: 'Open Database License',
      uk: 'Open Database License (Вільна ліцензія бази даних)',
    },
    category: 'gis',
    desc: {
      pl: 'Licencja wolnego udostępniania danych OpenStreetMap, gwarantująca wolność korzystania, wzbogacania i jawnego podawania autorstwa.',
      en: 'Open Database License governing OpenStreetMap data, ensuring transparency and open attribution.',
      uk: 'Ліцензія відкритих даних OpenStreetMap, що гарантує вільне використання та обов’язкове зазначення авторства.',
    },
  },
  {
    id: 'bdot10k',
    abbr: 'BDOT10k',
    fullName: {
      pl: 'Baza Danych Obiektów Topograficznych (1:10 000)',
      en: 'Topographic Objects Database 1:10 000 (Geoportal Poland)',
      uk: 'База топографічних об’єктів 1:10 000 (Польський геопортал)',
    },
    category: 'gis',
    desc: {
      pl: 'Urzędowy rejestr geodezyjny prowadzony przez Główny Urząd Geodezji i Kartografii (GUGiK). Wykorzystywany w aplikacji jako niezależne źródło weryfikacji geometrii chodników i ulic Krakowa.',
      en: 'Official Polish topographic database from the Head Office of Geodesy and Cartography, used for street cross-referencing.',
      uk: 'Офіційний польський реєстр топографічних об’єктів для верифікації міської геометрії.',
    },
  },
  {
    id: 'gnss',
    abbr: 'GNSS / GPS',
    fullName: {
      pl: 'Global Navigation Satellite System (Satelitarna Nawigacja Globalna)',
      en: 'Global Navigation Satellite System / GPS',
      uk: 'Глобальна навігаційна супутникова система',
    },
    category: 'tech',
    desc: {
      pl: 'System pozycjonowania satelitarnego. Aplikacja pobiera pozycję wyłącznie na jawne żądanie użytkownika (przycisk z celownikiem), nie śledząc go w tle.',
      en: 'Satellite positioning system. Position is accessed only upon explicit user request without background tracking.',
      uk: 'Система супутникового позиціонування. Використовується лише за явним запитом користувача.',
    },
  },
  {
    id: 'corridor',
    abbr: 'Korytarz buforowy',
    fullName: {
      pl: 'Korytarz geometrii trasy (Buffer Corridor)',
      en: 'Route Geometry Buffer Corridor',
      uk: 'Буферний коридор маршруту',
    },
    category: 'gis',
    desc: {
      pl: 'Pas terenu wzdłuż linii trasy pieszej (domyślnie 20 metrów), wewnątrz którego algorytm aplikacji analizuje wszelkie przecinające go przeszkody, schody i krawężniki.',
      en: 'A 20-meter corridor along the walking route analyzed for architectural barriers, steps, and facilities.',
      uk: '20-метрова зона вздовж пішохідної лінії, у межах якої алгоритм шукає перешкоди та зручності.',
    },
  },
  {
    id: 'screen_readers',
    abbr: 'TalkBack / VoiceOver',
    fullName: {
      pl: 'Systemowe czytniki ekranu dla systemów Android i iOS',
      en: 'System Screen Readers (TalkBack for Android, VoiceOver for iOS)',
      uk: 'Системні скрінрідери (TalkBack на Android, VoiceOver на iOS)',
    },
    category: 'wcag',
    desc: {
      pl: 'Wbudowane w system operacyjny oprogramowanie asystujące, które przekształca zawartość ekranu w mowę syntetyczną lub sygnały na monitorze brajlowskim.',
      en: 'Built-in assistive technologies converting visual elements into speech or braille display output.',
      uk: 'Вбудовані асистентні технології, які озвучують елементи екрана для незрячих користувачів.',
    },
    wcagRule: 'WCAG 2.2 Kryterium 1.1.1, 1.3.1, 4.1.2',
  },
  {
    id: 'etr',
    abbr: 'ETR',
    fullName: {
      pl: 'Easy-to-Read (Tekst łatwy do czytania i zrozumienia)',
      en: 'Easy-to-Read Format',
      uk: 'Easy-to-Read (Текст, простий для читання та розуміння)',
    },
    category: 'wcag',
    desc: {
      pl: 'Standard uproszczonego języka i przejrzystej typografii wspierający osoby z niepełnosprawnością intelektualną, seniorów oraz osoby nieposługujące się biegle językiem urzędowym.',
      en: 'Simplified language and visual format supporting cognitive accessibility and seniors.',
      uk: 'Формат спрощеної мови для людей з когнітивними труднощами та людей похилого віку.',
    },
    wcagRule: 'WCAG 2.2 Kryterium 3.1.5 (Reading Level)',
  },
  {
    id: 'pjm',
    abbr: 'PJM',
    fullName: {
      pl: 'Polski Język Migowy',
      en: 'Polish Sign Language',
      uk: 'Польська жестова мова',
    },
    category: 'wcag',
    desc: {
      pl: 'Naturalny, wizualno-przestrzenny język społeczności Głuchych w Polsce, posiadający własną strukturę gramatyczną niezależną od języka polskiego mówionego.',
      en: 'Natural visual-spatial language of the Deaf community in Poland with its own grammar.',
      uk: 'Природна візуально-просторова мова спільноти глухих у Польщі.',
    },
    wcagRule: 'WCAG 2.2 Kryterium 1.2.6 (Sign Language)',
  },
  {
    id: 'graphhopper',
    abbr: 'GraphHopper',
    fullName: {
      pl: 'Silnik routingu pieszego GraphHopper',
      en: 'GraphHopper Routing Engine',
      uk: 'Навігаційний рушій GraphHopper',
    },
    category: 'tech',
    desc: {
      pl: 'Otwarty silnik wyznaczania tras pieszych, dostosowany w projekcie do uwzględniania wag dostępności architektonicznej (omijanie stromizn i schodów).',
      en: 'Open source routing engine customized with accessibility penalties to avoid stairs and steep inclines.',
      uk: 'Рушій маршрутизації з вагами доступності для оминання крутих схилів і сходів.',
    },
  },
  {
    id: 'hap',
    abbr: 'HAP',
    fullName: {
      pl: 'HarmonyOS Ability Package',
      en: 'HarmonyOS Ability Package (OpenHarmony)',
      uk: 'HarmonyOS Ability Package (Пакет додатку HarmonyOS)',
    },
    category: 'tech',
    desc: {
      pl: 'Oficjalny format binarnego pakietu aplikacji dla ekosystemu Huawei HarmonyOS / OpenHarmony (API 24), kompilowany za pomocą narzędzia hvigorw.',
      en: 'Official application package format for Huawei OpenHarmony ecosystem (API 24) built with hvigorw.',
      uk: 'Офіційний формат інсталяційного пакета для платформи Huawei OpenHarmony.',
    },
  },
  {
    id: 'umk',
    abbr: 'UMK',
    fullName: {
      pl: 'Urząd Miasta Krakowa',
      en: 'Municipality of Cracow (City Hall)',
      uk: 'Мерія міста Кракова',
    },
    category: 'gis',
    desc: {
      pl: 'Jednostka samorządu terytorialnego odpowiedzialna za przestrzeń publiczną, program „Kraków bez barier” oraz wdrażanie miejskich standardów dostępności.',
      en: 'Cracow municipal administration responsible for accessible urban infrastructure programs.',
      uk: 'Орган місцевого самоврядування Кракова, відповідальний за програму безбар’єрності.',
    },
  },
];

export function GlossaryModal() {
  const {
    locale,
    colors,
    isHighContrast,
    fontSize,
    glossaryModalVisible,
    setGlossaryModalVisible,
  } = useSession();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'wcag' | 'gis' | 'tech'>('all');

  const filteredEntries = GLOSSARY_ENTRIES.filter((entry) => {
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const abbrMatches = entry.abbr.toLowerCase().includes(query);
    const nameMatches = (entry.fullName[locale] || entry.fullName.pl).toLowerCase().includes(query);
    const descMatches = (entry.desc[locale] || entry.desc.pl).toLowerCase().includes(query);
    return abbrMatches || nameMatches || descMatches;
  });

  const getCategoryLabel = (cat: 'wcag' | 'gis' | 'tech') => {
    switch (cat) {
      case 'wcag':
        return locale === 'pl' ? 'Dostępność (WCAG)' : locale === 'uk' ? 'Доступність (WCAG)' : 'Accessibility (WCAG)';
      case 'gis':
        return locale === 'pl' ? 'Kartografia i miasto' : locale === 'uk' ? 'Картографія та місто' : 'Cartography & City';
      case 'tech':
        return locale === 'pl' ? 'Technologia' : locale === 'uk' ? 'Технології' : 'Technology';
    }
  };

  return (
    <Modal
      visible={glossaryModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setGlossaryModalVisible(false)}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: isHighContrast ? 2.5 : 1.5,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: isHighContrast ? colors.background : colors.govBarBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerRow}>
                <BookOpen size={20} weight="bold" color={colors.govBarText} />
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.headerTitle,
                    {
                      color: colors.govBarText,
                      fontSize: fontSize(17.5),
                    },
                  ]}
                >
                  {t(locale, 'glossaryTitle')}
                </Text>
              </View>
              <Text
                style={[
                  styles.headerSub,
                  {
                    color: isHighContrast ? colors.text : 'rgba(255,255,255,0.85)',
                    fontSize: fontSize(11.5),
                  },
                ]}
              >
                {locale === 'pl'
                  ? 'Standard WCAG 2.2 AAA (Kryteria 3.1.3 i 3.1.4: Nietypowe słowa i skróty)'
                  : locale === 'uk'
                    ? 'Стандарт WCAG 2.2 AAA (Критерії 3.1.3 та 3.1.4: Незвичні слова та скорочення)'
                    : 'WCAG 2.2 AAA Standard (Criteria 3.1.3 & 3.1.4: Unusual Words & Abbreviations)'}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'close')}
              onPress={() => setGlossaryModalVisible(false)}
              style={[
                styles.closeBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.18)',
                },
              ]}
            >
              <X size={18} weight="bold" color={colors.govBarText} />
            </Pressable>
          </View>

          {/* Search and Filters */}
          <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: isHighContrast ? 2 : 1,
                },
              ]}
            >
              <MagnifyingGlass size={18} weight="bold" color={colors.muted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t(locale, 'glossarySearchPlaceholder')}
                placeholderTextColor={colors.muted}
                accessibilityRole="search"
                accessibilityLabel={t(locale, 'glossarySearchPlaceholder')}
                style={[
                  styles.searchInput,
                  {
                    color: colors.text,
                    fontSize: fontSize(14),
                  },
                ]}
              />
              {searchQuery ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Wyczyść wyszukiwanie"
                  onPress={() => setSearchQuery('')}
                  style={styles.clearBtn}
                >
                  <X size={14} weight="bold" color={colors.text} />
                </Pressable>
              ) : null}
            </View>

            {/* Category tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {[
                { id: 'all', label: locale === 'pl' ? 'Wszystkie' : locale === 'uk' ? 'Усі' : 'All' },
                { id: 'wcag', label: locale === 'pl' ? 'Dostępność (WCAG)' : locale === 'uk' ? 'Доступність' : 'WCAG' },
                { id: 'gis', label: locale === 'pl' ? 'Dane miejskie (OSM)' : locale === 'uk' ? 'Міські дані' : 'GIS & City' },
                { id: 'tech', label: locale === 'pl' ? 'Technologie' : locale === 'uk' ? 'Технології' : 'Tech' },
              ].map((tab) => {
                const isSelected = selectedCategory === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${tab.label}. ${isSelected ? t(locale, 'selected') : ''}`}
                    onPress={() => setSelectedCategory(tab.id as any)}
                    style={[
                      styles.categoryTab,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.background,
                        borderColor: isSelected ? colors.focus : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryTabText,
                        {
                          color: isSelected ? colors.accentText : colors.text,
                          fontSize: fontSize(12),
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* List of Entries */}
          <ScrollView contentContainerStyle={styles.bodyContent}>
            {filteredEntries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Question size={36} color={colors.muted} weight="duotone" />
                <Text style={[styles.emptyText, { color: colors.muted, fontSize: fontSize(14) }]}>
                  {t(locale, 'glossaryEmpty')}
                </Text>
              </View>
            ) : (
              filteredEntries.map((item) => {
                const fullName = item.fullName[locale] || item.fullName.pl;
                const desc = item.desc[locale] || item.desc.pl;
                const catLabel = getCategoryLabel(item.category);

                return (
                  <View
                    key={item.id}
                    accessibilityRole="summary"
                    accessibilityLabel={`Skrót: ${item.abbr}. Rozwinięcie: ${fullName}. Kategoria: ${catLabel}. Definicja: ${desc}.${item.wcagRule ? ` Wytyczna: ${item.wcagRule}.` : ''}`}
                    style={[
                      styles.entryCard,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        borderWidth: isHighContrast ? 2 : 1,
                      },
                    ]}
                  >
                    {/* Top Row: Abbr badge + Category */}
                    <View style={styles.entryHeaderRow}>
                      <View
                        accessibilityRole="text"
                        accessibilityLabel={`Skrót: ${item.abbr}, czyli ${fullName}`}
                        style={[
                          styles.abbrBadge,
                          {
                            backgroundColor: colors.badgeBg,
                            borderColor: colors.badgeBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.abbrBadgeText,
                            {
                              color: colors.badgeText,
                              fontSize: fontSize(13.5),
                            },
                          ]}
                        >
                          {item.abbr}
                        </Text>
                      </View>

                      <View
                        accessibilityRole="text"
                        accessibilityLabel={`Kategoria: ${catLabel}`}
                        style={[
                          styles.catBadge,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Tag size={12} weight="bold" color={colors.muted} />
                        <Text style={[styles.catBadgeText, { color: colors.muted, fontSize: fontSize(11) }]}>
                          {catLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Full Name */}
                    <Text
                      style={[
                        styles.entryFullName,
                        {
                          color: colors.text,
                          fontSize: fontSize(14.5),
                        },
                      ]}
                    >
                      {fullName}
                    </Text>

                    {/* Description */}
                    <Text
                      style={[
                        styles.entryDesc,
                        {
                          color: colors.muted,
                          fontSize: fontSize(13),
                          lineHeight: fontSize(18.5),
                        },
                      ]}
                    >
                      {desc}
                    </Text>

                    {/* WCAG Rule footnote if present */}
                    {item.wcagRule ? (
                      <View style={styles.ruleFooter}>
                        <Check size={14} weight="bold" color={colors.okBorder || colors.accent} />
                        <Text
                          style={[
                            styles.ruleText,
                            {
                              color: colors.okText || colors.text,
                              fontSize: fontSize(11.5),
                            },
                          ]}
                        >
                          {item.wcagRule}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}

            {/* Note about WCAG 3.1.3 and 3.1.4 */}
            <View
              style={[
                styles.footerNote,
                {
                  backgroundColor: colors.infoBg,
                  borderColor: colors.infoBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.footerNoteText,
                  {
                    color: colors.infoText,
                    fontSize: fontSize(12),
                    lineHeight: fontSize(16.5),
                  },
                ]}
              >
                {locale === 'pl'
                  ? '💡 Słowniczek ten stanowi oficjalny mechanizm zgodności z kryterium WCAG 2.2 AAA 3.1.4 (Skróty) oraz 3.1.3 (Nietypowe słowa). Pozwala użytkownikom i czytnikom ekranu zapoznać się ze specjalistycznym słownictwem bez przeciążania widoku mapy i nawigacji.'
                  : locale === 'uk'
                    ? '💡 Цей словничок реалізує вимоги стандарту WCAG 2.2 AAA (Критерії 3.1.4 та 3.1.3), надаючи доступні пояснення термінів без перевантаження інтерфейсу.'
                    : '💡 This glossary provides the compliance mechanism for WCAG 2.2 AAA Success Criteria 3.1.4 (Abbreviations) and 3.1.3 (Unusual Words), offering accessible definitions without visual interface clutter.'}
              </Text>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View
            style={[
              styles.modalFooter,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'close')}
              onPress={() => setGlossaryModalVisible(false)}
              style={[
                styles.closeButtonFull,
                {
                  backgroundColor: colors.accent,
                  borderColor: colors.focus,
                  minHeight: spacing.touch,
                },
              ]}
            >
              <Text
                style={[
                  styles.closeButtonText,
                  {
                    color: colors.accentText,
                    fontSize: fontSize(14),
                  },
                ]}
              >
                {t(locale, 'close')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1.5,
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontWeight: '800',
  },
  headerSub: {
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 6,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabText: {},
  bodyContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  entryCard: {
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  abbrBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  abbrBadgeText: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  catBadgeText: {
    fontWeight: '700',
  },
  entryFullName: {
    fontWeight: '800',
  },
  entryDesc: {
    fontWeight: '500',
  },
  ruleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  ruleText: {
    fontWeight: '700',
  },
  footerNote: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 6,
  },
  footerNoteText: {
    fontWeight: '600',
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1.5,
  },
  closeButtonFull: {
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  closeButtonText: {
    fontWeight: '800',
  },
});
