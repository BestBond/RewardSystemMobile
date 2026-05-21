import { Platform, StyleSheet } from 'react-native';

export const LEGAL_SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export const legalTypography = StyleSheet.create({
  docTitle: {
    fontFamily: LEGAL_SERIF,
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.3,
  },
  docSubtitle: {
    fontFamily: LEGAL_SERIF,
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginTop: 4,
  },
  docDate: {
    fontFamily: LEGAL_SERIF,
    fontSize: 14,
    fontStyle: 'italic',
    color: '#000000',
    marginTop: 6,
    marginBottom: 14,
  },
  section: {
    fontFamily: LEGAL_SERIF,
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginTop: 14,
    marginBottom: 8,
  },
  subsection: {
    fontFamily: LEGAL_SERIF,
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginTop: 10,
    marginBottom: 6,
  },
  body: {
    fontFamily: LEGAL_SERIF,
    fontSize: 14,
    lineHeight: 22,
    color: '#000000',
  },
  bodyBold: {
    fontFamily: LEGAL_SERIF,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    color: '#000000',
  },
  link: {
    color: '#0056B3',
    textDecorationLine: 'underline',
  },
  bullet: {
    paddingLeft: 4,
    marginBottom: 4,
  },
  numbered: {
    paddingLeft: 4,
    marginBottom: 4,
  },
  label: {
    fontFamily: LEGAL_SERIF,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    color: '#000000',
    marginTop: 8,
  },
});
