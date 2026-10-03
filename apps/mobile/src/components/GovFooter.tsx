import { StyleSheet, Text, View } from 'react-native';

import { KrakowCoatOfArms } from '@/components/KrakowCoatOfArms';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';

export function GovFooter() {
  const { locale, colors, isHighContrast, fontSize } = useSession();

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel="Informacje urzędowe i deklaracja dostępności Miasta Kraków"
      style={[
        styles.footer,
        {
          backgroundColor: isHighContrast ? colors.surface : colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <KrakowCoatOfArms size="small" showTitle={true} />
        <Text
          style={[
            styles.footerLead,
            {
              color: colors.text,
              fontSize: fontSize(12),
            },
          ]}
        >
          {t(locale, 'krakowMunicipalFooter')}
        </Text>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.tag,
              {
                backgroundColor: isHighContrast ? colors.background : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.tagText, { color: colors.muted, fontSize: fontSize(10.5) }]}>
              🛡️ {t(locale, 'wcagBadge')}
            </Text>
          </View>
          <View
            style={[
              styles.tag,
              {
                backgroundColor: isHighContrast ? colors.background : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.tagText, { color: colors.muted, fontSize: fontSize(10.5) }]}>
              🔒 100% Prywatności (P1–P5)
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 2,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  content: {
    gap: 12,
  },
  footerLead: {
    lineHeight: 18,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontWeight: '700',
  },
});
