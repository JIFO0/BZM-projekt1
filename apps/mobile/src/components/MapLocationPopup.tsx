import {
  FlagBanner,
  MagnifyingGlass,
  MapPin,
  NavigationArrow,
  X,
} from 'phosphor-react-native';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useSession } from '@/state/session';
import { t } from '@/i18n/strings';

export interface MapLocationPopupProps {
  location: {
    lat: number;
    lon: number;
    name: string;
    isLoading?: boolean;
  };
  onSearchPlace: () => void;
  onSetStart: () => void;
  onSetEnd: () => void;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
}

export function MapLocationPopup({
  location,
  onSearchPlace,
  onSetStart,
  onSetEnd,
  onClose,
  style,
}: MapLocationPopupProps) {
  const { colors, fontSize, isHighContrast, locale } = useSession();

  const coordsText = `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`;

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${t(locale, 'mapClickPopupTitle')}: ${location.name}. Koordynaty: ${coordsText}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isHighContrast ? colors.accent : colors.border,
          borderWidth: isHighContrast ? 2.5 : 1.5,
        },
        style,
      ]}
    >
      {/* Header with Title and Close Button */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.pinIconWrapper, { backgroundColor: colors.accent + '1A' }]}>
            <MapPin size={18} weight="fill" color={colors.accent} />
          </View>
          <View style={styles.headerTextCol}>
            <Text
              style={[
                styles.headerTitle,
                { color: colors.muted, fontSize: fontSize(11.5) },
              ]}
            >
              {t(locale, 'mapClickPopupTitle')}
            </Text>
            <View style={styles.nameRow}>
              {location.isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.locationName,
                      { color: colors.text, fontSize: fontSize(14.5) },
                    ]}
                  >
                    {t(locale, 'resolvingAddress')}
                  </Text>
                </View>
              ) : (
                <Text
                  numberOfLines={2}
                  style={[
                    styles.locationName,
                    { color: colors.text, fontSize: fontSize(14.5) },
                  ]}
                >
                  {location.name || t(locale, 'pointOnMap')}
                </Text>
              )}
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(locale, 'close')}
          onPress={onClose}
          hitSlop={8}
          style={[styles.closeBtn, { backgroundColor: colors.border + '66' }]}
        >
          <X size={16} weight="bold" color={colors.text} />
        </Pressable>
      </View>

      {/* Coordinates pill */}
      <View style={styles.coordsRow}>
        <View style={[styles.coordsPill, { backgroundColor: colors.border + '44' }]}>
          <Text style={[styles.coordsText, { color: colors.muted, fontSize: fontSize(11) }]}>
            GPS: {coordsText}
          </Text>
        </View>
      </View>

      {/* 3 Action Buttons */}
      <View style={styles.actionsRow}>
        {/* 1. Search in Place Inspector */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t(locale, 'mapClickActionSearchPlace')}: ${location.name}`}
          onPress={onSearchPlace}
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.accent,
              borderColor: colors.accent,
            },
          ]}
        >
          <MagnifyingGlass size={15} weight="bold" color={colors.surface} />
          <Text
            numberOfLines={1}
            style={[
              styles.actionButtonText,
              { color: colors.surface, fontSize: fontSize(12) },
            ]}
          >
            {t(locale, 'mapClickActionSearchPlace')}
          </Text>
        </Pressable>

        {/* 2. Set as Start Location (A) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t(locale, 'mapClickActionSetStart')}: ${location.name}`}
          onPress={onSetStart}
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.surface,
              borderColor: isHighContrast ? colors.accent : colors.border,
            },
          ]}
        >
          <NavigationArrow size={15} weight="bold" color={colors.accent} />
          <Text
            numberOfLines={1}
            style={[
              styles.actionButtonText,
              { color: colors.text, fontSize: fontSize(12) },
            ]}
          >
            {t(locale, 'mapClickActionSetStart')}
          </Text>
        </Pressable>

        {/* 3. Set as Destination Location (B) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t(locale, 'mapClickActionSetEnd')}: ${location.name}`}
          onPress={onSetEnd}
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.surface,
              borderColor: isHighContrast ? colors.accent : colors.border,
            },
          ]}
        >
          <FlagBanner size={15} weight="fill" color={colors.blockerText} />
          <Text
            numberOfLines={1}
            style={[
              styles.actionButtonText,
              { color: colors.text, fontSize: fontSize(12) },
            ]}
          >
            {t(locale, 'mapClickActionSetEnd')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  pinIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  nameRow: {
    marginTop: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationName: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordsPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coordsText: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 4,
    minHeight: Platform.OS === 'web' ? 36 : 38,
  },
  actionButtonText: {
    fontWeight: '700',
  },
});
