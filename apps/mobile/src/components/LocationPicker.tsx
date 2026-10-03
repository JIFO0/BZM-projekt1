import {
  formatCoordinates,
  isValidCoordinate,
  parseCoordinates,
  type LonLat,
  type PlaceHit,
} from '@krakow-bez-barier/core';
import {
  Check,
  Compass,
  Crosshair,
  MagnifyingGlass,
  MapPin,
  NavigationArrow,
  X,
} from 'phosphor-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { t } from '@/i18n/strings';
import { reverseGeocodeLocation, suggestPlaces } from '@/services/api';
import { useSession } from '@/state/session';


export interface LocationPoint {
  name: string;
  position: LonLat;
}

export interface LocationPickerProps {
  label: string;
  badge?: string;
  badgeColor?: string;
  point: LocationPoint;
  onChangePoint: (point: LocationPoint) => void;
  placeholder?: string;
  showMyLocation?: boolean;
  onUseMyLocation?: () => void;
  onPickOnMap?: () => void;
  isPickingOnMap?: boolean;
}

export function LocationPicker({
  label,
  badge,
  badgeColor,
  point,
  onChangePoint,
  placeholder,
  showMyLocation = false,
  onUseMyLocation,
  onPickOnMap,
  isPickingOnMap = false,
}: LocationPickerProps) {
  const { colors, fontSize, isHighContrast, locale } = useSession();

  const [queryText, setQueryText] = useState(point.name || '');
  const [isFocused, setIsFocused] = useState(false);
  const [showCoordInputs, setShowCoordInputs] = useState(false);
  const [latInput, setLatInput] = useState(point.position.lat.toFixed(5));
  const [lonInput, setLonInput] = useState(point.position.lon.toFixed(5));
  const [coordError, setCoordError] = useState<string | null>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<PlaceHit[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Sync internal text when external point changes
  useEffect(() => {
    setQueryText(point.name);
    setLatInput(point.position.lat.toFixed(5));
    setLonInput(point.position.lon.toFixed(5));
  }, [point.name, point.position.lat, point.position.lon]);

  // Debounced OSM search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (text: string) => {
    setQueryText(text);

    // If text directly contains valid coordinates, show suggestion immediately
    const directCoords = parseCoordinates(text);
    if (directCoords) {
      setSuggestions([
        {
          id: 'parsed-coord',
          name: `${directCoords.lat.toFixed(5)}, ${directCoords.lon.toFixed(5)}`,
          label: `${t(locale, 'coordinatesBadge')}: ${directCoords.lat.toFixed(5)}, ${directCoords.lon.toFixed(5)}`,
          position: directCoords,
          kind: 'coordinate',
        },
      ]);
      setShowDropdown(true);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!text.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoadingSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await suggestPlaces(text, locale);
        setSuggestions(results);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
        setShowDropdown(true);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = (item: PlaceHit) => {
    setQueryText(item.name);
    setLatInput(item.position.lat.toFixed(5));
    setLonInput(item.position.lon.toFixed(5));
    onChangePoint({
      name: item.name,
      position: item.position,
    });
    setShowDropdown(false);
  };

  const handleApplyCoordinates = async () => {
    const lat = parseFloat(latInput.replace(',', '.'));
    const lon = parseFloat(lonInput.replace(',', '.'));

    if (!isValidCoordinate(lat, lon)) {
      setCoordError(t(locale, 'invalidCoordinates'));
      return;
    }

    setCoordError(null);
    setShowCoordInputs(false);

    // Try reverse geocoding to get human friendly street/name
    let resolvedName = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    try {
      const rev = await reverseGeocodeLocation(lat, lon, locale);
      if (rev?.name) {
        resolvedName = rev.name;
      }
    } catch {}

    setQueryText(resolvedName);
    onChangePoint({
      name: resolvedName,
      position: { lat, lon },
    });
  };

  const handleClear = () => {
    setQueryText('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <View style={styles.container}>
      {/* Header Row: Label & Actions */}
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          {badge ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: badgeColor || colors.accent,
                  borderColor: isHighContrast ? colors.text : 'transparent',
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: '#FFFFFF', fontSize: fontSize(11) }]}>
                {badge}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.label, { color: colors.text, fontSize: fontSize(13.5) }]}>
            {label}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {showMyLocation && onUseMyLocation ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'myLocation')}
              onPress={onUseMyLocation}
              style={[
                styles.smallActionBtn,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <NavigationArrow size={12} weight="bold" color={colors.accent} />
              <Text style={[styles.smallActionText, { color: colors.accent, fontSize: fontSize(11.5) }]}>
                {t(locale, 'myLocationShort')}
              </Text>
            </Pressable>
          ) : null}

          {onPickOnMap ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPickingOnMap ? t(locale, 'cancelMapPick') : t(locale, 'pickOnMap')}
              onPress={onPickOnMap}
              style={[
                styles.smallActionBtn,
                {
                  backgroundColor: isPickingOnMap ? colors.accent : colors.background,
                  borderColor: isPickingOnMap ? colors.accent : colors.border,
                },
              ]}
            >
              <Crosshair
                size={12}
                weight="bold"
                color={isPickingOnMap ? colors.accentText : colors.accent}
              />
              <Text
                style={[
                  styles.smallActionText,
                  {
                    color: isPickingOnMap ? colors.accentText : colors.accent,
                    fontSize: fontSize(11.5),
                  },
                ]}
              >
                {t(locale, 'pickOnMap')}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              showCoordInputs ? t(locale, 'hideCoordinates') : t(locale, 'enterCoordinates')
            }
            onPress={() => setShowCoordInputs(!showCoordInputs)}
            style={[
              styles.smallActionBtn,
              {
                backgroundColor: showCoordInputs ? colors.accent : colors.background,
                borderColor: showCoordInputs ? colors.accent : colors.border,
              },
            ]}
          >
            <Compass
              size={12}
              weight="bold"
              color={showCoordInputs ? colors.accentText : colors.text}
            />
            <Text
              style={[
                styles.smallActionText,
                {
                  color: showCoordInputs ? colors.accentText : colors.text,
                  fontSize: fontSize(11.5),
                },
              ]}
            >
              {t(locale, 'coordinatesBadge')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Picking on map banner */}
      {isPickingOnMap ? (
        <View
          style={[
            styles.pickNoticeBanner,
            { backgroundColor: colors.warningBg, borderColor: colors.warningBorder },
          ]}
        >
          <Crosshair size={15} weight="bold" color={colors.warningText} />
          <Text style={[styles.pickNoticeText, { color: colors.warningText, fontSize: fontSize(12.5) }]}>
            {badge === 'A' ? t(locale, 'pickingOnMapStart') : t(locale, 'pickingOnMapEnd')}
          </Text>
          {onPickOnMap ? (
            <Pressable onPress={onPickOnMap} style={styles.cancelNoticeBtn}>
              <X size={14} weight="bold" color={colors.warningText} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Coordinate Input Mode */}
      {showCoordInputs ? (
        <View
          style={[
            styles.coordInputsBox,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: isHighContrast ? 2 : 1.5,
            },
          ]}
        >
          <View style={styles.coordInputsRow}>
            <View style={styles.coordField}>
              <Text style={[styles.coordFieldLabel, { color: colors.muted, fontSize: fontSize(11.5) }]}>
                {t(locale, 'latitude')}
              </Text>
              <TextInput
                value={latInput}
                onChangeText={setLatInput}
                placeholder={t(locale, 'latitudePlaceholder')}
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                style={[
                  styles.coordInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    fontSize: fontSize(13.5),
                  },
                ]}
              />
            </View>

            <View style={styles.coordField}>
              <Text style={[styles.coordFieldLabel, { color: colors.muted, fontSize: fontSize(11.5) }]}>
                {t(locale, 'longitude')}
              </Text>
              <TextInput
                value={lonInput}
                onChangeText={setLonInput}
                placeholder={t(locale, 'longitudePlaceholder')}
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                style={[
                  styles.coordInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    fontSize: fontSize(13.5),
                  },
                ]}
              />
            </View>
          </View>

          {coordError ? (
            <Text style={[styles.coordErrorText, { color: colors.blockerText, fontSize: fontSize(12) }]}>
              {coordError}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={handleApplyCoordinates}
            style={[styles.applyCoordsBtn, { backgroundColor: colors.accent }]}
          >
            <Check size={14} weight="bold" color={colors.accentText} />
            <Text style={[styles.applyCoordsText, { color: colors.accentText, fontSize: fontSize(12.5) }]}>
              {t(locale, 'applyCoordinates')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Main Search Input */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.background,
            borderColor: isFocused ? colors.accent : colors.border,
            borderWidth: isHighContrast ? 2.5 : isFocused ? 2 : 1.5,
          },
        ]}
      >
        <MagnifyingGlass
          size={16}
          weight="bold"
          color={isFocused ? colors.accent : colors.muted}
          style={styles.searchIcon}
        />
        <TextInput
          value={queryText}
          onChangeText={handleQueryChange}
          onFocus={() => {
            setIsFocused(true);
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
            if (suggestions.length > 0 || queryText.trim().length >= 3) setShowDropdown(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
            blurTimerRef.current = setTimeout(() => setShowDropdown(false), 280);
          }}
          placeholder={placeholder || t(locale, 'searchPromptOsm')}
          placeholderTextColor={colors.muted}
          style={[
            styles.textInput,
            {
              color: colors.text,
              fontSize: fontSize(14.5),
            },
          ]}
        />
        {loadingSuggestions ? (
          <ActivityIndicator size="small" color={colors.accent} style={styles.inputSpinner} />
        ) : queryText.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'clearSelection')}
            onPress={handleClear}
            style={styles.clearBtn}
          >
            <X size={15} weight="bold" color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {/* Active Position Info Chip */}
      {point.position && point.position.lat && point.position.lon ? (
        <View style={styles.activePositionRow}>
          <MapPin size={12} weight="bold" color={colors.accent} />
          <Text style={[styles.activePositionText, { color: colors.muted, fontSize: fontSize(11.5) }]}>
            {formatCoordinates(point.position, 5)}
          </Text>
          <View style={[styles.osmTag, { borderColor: colors.border }]}>
            <Text style={[styles.osmTagText, { color: colors.muted, fontSize: fontSize(10) }]}>
              OSM
            </Text>
          </View>
        </View>
      ) : null}

      {/* Address and place suggestions */}
      {showDropdown && (suggestions.length > 0 || (queryText.trim().length >= 3 && !loadingSuggestions)) ? (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: isHighContrast ? 2.5 : 1.5,
            },
          ]}
        >
          <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.dropdownTitle, { color: colors.muted, fontSize: fontSize(11.5) }]}>
              {t(locale, 'osmSuggestionsTitle')}
            </Text>
            <Pressable onPress={() => setShowDropdown(false)}>
              <X size={13} weight="bold" color={colors.muted} />
            </Pressable>
          </View>

          {suggestions.length === 0 ? (
            <Text style={[styles.emptySuggestions, { color: colors.muted, fontSize: fontSize(12.5) }]}>
              {t(locale, 'noOsmResultsFound')}
            </Text>
          ) : null}

          {suggestions.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.label}`}
              onPressIn={() => {
                if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                handleSelectSuggestion(item);
              }}
              style={({ pressed }) => [
                styles.suggestionItem,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: pressed ? colors.background : colors.surface,
                },
              ]}
            >
              <View style={styles.suggestionLeft}>
                {item.kind === 'coordinate' ? (
                  <Compass size={16} weight="bold" color={colors.accent} />
                ) : (
                  <MapPin size={16} weight="bold" color={colors.accent} />
                )}
                <View style={styles.suggestionTexts}>
                  <Text
                    numberOfLines={1}
                    style={[styles.suggestionName, { color: colors.text, fontSize: fontSize(13.5) }]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.suggestionLabel, { color: colors.muted, fontSize: fontSize(11.5) }]}
                  >
                    {item.label}
                  </Text>
                </View>
              </View>
              <Text style={[styles.suggestionCoord, { color: colors.muted, fontSize: fontSize(11) }]}>
                {item.position.lat.toFixed(4)}, {item.position.lon.toFixed(4)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 5,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: '900',
  },
  label: {
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  smallActionText: {
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    minHeight: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    fontWeight: '600',
  },
  inputSpinner: {
    marginLeft: 6,
  },
  clearBtn: {
    padding: 6,
  },
  activePositionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  activePositionText: {
    fontWeight: '600',
  },
  osmTag: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 4,
  },
  osmTagText: {
    fontWeight: '700',
  },
  pickNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  pickNoticeText: {
    flex: 1,
    fontWeight: '700',
  },
  cancelNoticeBtn: {
    padding: 2,
  },
  coordInputsBox: {
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  coordInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  coordField: {
    flex: 1,
    gap: 3,
  },
  coordFieldLabel: {
    fontWeight: '700',
  },
  coordInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontWeight: '700',
  },
  coordErrorText: {
    fontWeight: '700',
  },
  applyCoordsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 6,
  },
  applyCoordsText: {
    fontWeight: '800',
  },
  dropdown: {
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
    boxShadow: '0 3px 6px rgba(0,0,0,0.15)',
    elevation: 4,
    zIndex: 100,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
  },
  dropdownTitle: {
    fontWeight: '700',
  },
  emptySuggestions: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 0.8,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  suggestionTexts: {
    flex: 1,
  },
  suggestionName: {
    fontWeight: '700',
  },
  suggestionLabel: {
    fontWeight: '500',
  },
  suggestionCoord: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
