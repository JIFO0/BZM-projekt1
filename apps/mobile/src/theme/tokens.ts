export type ContrastMode =
  | 'standard-light'
  | 'standard-dark'
  | 'hc-yellow-black'
  | 'hc-black-yellow'
  | 'hc-white-black';

export type TextSize = 'normal' | 'medium' | 'large' | 'xlarge';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentText: string;
  focus: string;
  headerBg: string;
  headerText: string;
  govBarBg: string;
  govBarText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;

  // Status colors (WCAG AA & AAA compliant contrast)
  blockerBg: string;
  blockerBorder: string;
  blockerText: string;

  warningBg: string;
  warningBorder: string;
  warningText: string;

  okBg: string;
  okBorder: string;
  okText: string;

  infoBg: string;
  infoBorder: string;
  infoText: string;

  unknownBg: string;
  unknownBorder: string;
  unknownText: string;

  conflictingBg: string;
  conflictingBorder: string;
  conflictingText: string;
}

// 🏛️ Kraków Municipal Official Identity: Błękit Krakowski (#005CA9 - Pantone 2935 C), Granat (#003865)
export const krakowLightColors: ThemeColors = {
  background: '#F0F4F8',
  surface: '#FFFFFF',
  text: '#0F1E2E',
  muted: '#43586C',
  border: '#B6C8D8',
  accent: '#005CA9',
  accentText: '#FFFFFF',
  focus: '#003865',
  headerBg: '#005CA9',
  headerText: '#FFFFFF',
  govBarBg: '#003865',
  govBarText: '#FFFFFF',
  badgeBg: '#E5F1FA',
  badgeBorder: '#005CA9',
  badgeText: '#003865',

  // Statuses (High contrast on light backgrounds)
  blockerBg: '#FEECEC',
  blockerBorder: '#C81E1E',
  blockerText: '#9B1C1C',

  warningBg: '#FEF3C7',
  warningBorder: '#D97706',
  warningText: '#92400E',

  okBg: '#DEF7EC',
  okBorder: '#0E9F6E',
  okText: '#03543F',

  infoBg: '#E1EFFE',
  infoBorder: '#1A56DB',
  infoText: '#1E429F',

  unknownBg: '#F3F4F6',
  unknownBorder: '#4B5563',
  unknownText: '#1F2A37',

  conflictingBg: '#F3E8FF',
  conflictingBorder: '#9333EA',
  conflictingText: '#581C87',
};

// 🌙 Modern Kraków Dark Municipal Palette
export const krakowDarkColors: ThemeColors = {
  background: '#0B131E',
  surface: '#152232',
  text: '#F8FAFC',
  muted: '#94A3B8',
  border: '#2A3F55',
  accent: '#38BDF8',
  accentText: '#0B131E',
  focus: '#7DD3FC',
  headerBg: '#0F1A28',
  headerText: '#F8FAFC',
  govBarBg: '#080E17',
  govBarText: '#94A3B8',
  badgeBg: '#1E293B',
  badgeBorder: '#38BDF8',
  badgeText: '#38BDF8',

  blockerBg: '#3F1212',
  blockerBorder: '#F87171',
  blockerText: '#FEE2E2',

  warningBg: '#3F250A',
  warningBorder: '#FBBF24',
  warningText: '#FEF3C7',

  okBg: '#0A331E',
  okBorder: '#34D399',
  okText: '#D1FAE5',

  infoBg: '#0C2B4E',
  infoBorder: '#60A5FA',
  infoText: '#DBEAFE',

  unknownBg: '#1F2937',
  unknownBorder: '#9CA3AF',
  unknownText: '#F3F4F6',

  conflictingBg: '#2D143D',
  conflictingBorder: '#C084FC',
  conflictingText: '#F3E8FF',
};

// 🟡⚫ WCAG AAA High Contrast: Yellow on Black (for severe visual impairment)
export const hcYellowBlackColors: ThemeColors = {
  background: '#000000',
  surface: '#000000',
  text: '#FFFF00',
  muted: '#FFFF66',
  border: '#FFFF00',
  accent: '#FFFF00',
  accentText: '#000000',
  focus: '#FFFFFF',
  headerBg: '#000000',
  headerText: '#FFFF00',
  govBarBg: '#000000',
  govBarText: '#FFFF00',
  badgeBg: '#000000',
  badgeBorder: '#FFFF00',
  badgeText: '#FFFF00',

  blockerBg: '#000000',
  blockerBorder: '#FF4D4D',
  blockerText: '#FF4D4D',

  warningBg: '#000000',
  warningBorder: '#FFA500',
  warningText: '#FFA500',

  okBg: '#000000',
  okBorder: '#00FF66',
  okText: '#00FF66',

  infoBg: '#000000',
  infoBorder: '#00FFFF',
  infoText: '#00FFFF',

  unknownBg: '#000000',
  unknownBorder: '#FFFFFF',
  unknownText: '#FFFFFF',

  conflictingBg: '#000000',
  conflictingBorder: '#FF77FF',
  conflictingText: '#FF77FF',
};

// ⚫🟡 WCAG AAA High Contrast: Black on Yellow (Alternative high contrast)
export const hcBlackYellowColors: ThemeColors = {
  background: '#FFFF00',
  surface: '#FFFF00',
  text: '#000000',
  muted: '#1F1F00',
  border: '#000000',
  accent: '#000000',
  accentText: '#FFFF00',
  focus: '#000088',
  headerBg: '#FFFF00',
  headerText: '#000000',
  govBarBg: '#FFFF00',
  govBarText: '#000000',
  badgeBg: '#FFFF00',
  badgeBorder: '#000000',
  badgeText: '#000000',

  blockerBg: '#FFFF00',
  blockerBorder: '#990000',
  blockerText: '#990000',

  warningBg: '#FFFF00',
  warningBorder: '#773300',
  warningText: '#773300',

  okBg: '#FFFF00',
  okBorder: '#005500',
  okText: '#005500',

  infoBg: '#FFFF00',
  infoBorder: '#000088',
  infoText: '#000088',

  unknownBg: '#FFFF00',
  unknownBorder: '#000000',
  unknownText: '#000000',

  conflictingBg: '#FFFF00',
  conflictingBorder: '#550055',
  conflictingText: '#550055',
};

// ⚪⚫ WCAG AAA High Contrast: White on Black (Monochrome / Inverted)
export const hcWhiteBlackColors: ThemeColors = {
  background: '#000000',
  surface: '#0A0A0A',
  text: '#FFFFFF',
  muted: '#D4D4D4',
  border: '#FFFFFF',
  accent: '#FFFFFF',
  accentText: '#000000',
  focus: '#00FFFF',
  headerBg: '#000000',
  headerText: '#FFFFFF',
  govBarBg: '#000000',
  govBarText: '#FFFFFF',
  badgeBg: '#000000',
  badgeBorder: '#FFFFFF',
  badgeText: '#FFFFFF',

  blockerBg: '#000000',
  blockerBorder: '#FFFFFF',
  blockerText: '#FFFFFF',

  warningBg: '#000000',
  warningBorder: '#FFFFFF',
  warningText: '#FFFFFF',

  okBg: '#000000',
  okBorder: '#FFFFFF',
  okText: '#FFFFFF',

  infoBg: '#000000',
  infoBorder: '#FFFFFF',
  infoText: '#FFFFFF',

  unknownBg: '#000000',
  unknownBorder: '#FFFFFF',
  unknownText: '#FFFFFF',

  conflictingBg: '#000000',
  conflictingBorder: '#FFFFFF',
  conflictingText: '#FFFFFF',
};

export function getColors(mode: ContrastMode): ThemeColors {
  switch (mode) {
    case 'standard-dark':
      return krakowDarkColors;
    case 'hc-yellow-black':
      return hcYellowBlackColors;
    case 'hc-black-yellow':
      return hcBlackYellowColors;
    case 'hc-white-black':
      return hcWhiteBlackColors;
    case 'standard-light':
    default:
      return krakowLightColors;
  }
}

// Backward-compatible defaults
export const lightColors = krakowLightColors;
export const darkColors = krakowDarkColors;

export const spacing = {
  screen: 20,
  stack: 14,
  touch: 48,
  touchExpanded: 56,
};

export function getTextSizeMultiplier(size: TextSize): number {
  switch (size) {
    case 'medium':
      return 1.2;
    case 'large':
      return 1.4;
    case 'xlarge':
      return 1.65;
    case 'normal':
    default:
      return 1.0;
  }
}

export function scaleFontSize(baseSize: number, size: TextSize): number {
  return Math.round(baseSize * getTextSizeMultiplier(size));
}
