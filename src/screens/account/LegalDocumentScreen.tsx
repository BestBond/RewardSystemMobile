import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackArrowLeft } from '../../assets/svgs';
import type { ProfileStackParamList } from '../../navigation/types';
import { figma } from '../../theme/figmaTokens';
import {
  LEGAL_UPDATED_ON,
  PRIVACY_POLICY_BODY,
  PRIVACY_POLICY_TITLE,
  TERMS_AND_CONDITIONS_BODY,
  TERMS_AND_CONDITIONS_TITLE,
} from './legal/legalCopy';
import {
  stripPrivacyPreamble,
  stripTermsPreamble,
} from './legal/stripLegalPreamble';

type Props = NativeStackScreenProps<ProfileStackParamList, 'LegalDocument'>;
type Nav = NativeStackNavigationProp<ProfileStackParamList, 'LegalDocument'>;

const heroFor = (doc: 'terms' | 'privacy') =>
  doc === 'terms' ? 'Our Terms & Conditions' : 'Our Privacy Policy';

export function LegalDocumentScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const doc = route.params.document;

  const { title, body } = useMemo(() => {
    if (doc === 'privacy') {
      return {
        title: PRIVACY_POLICY_TITLE,
        body: stripPrivacyPreamble(PRIVACY_POLICY_BODY),
      };
    }
    return {
      title: TERMS_AND_CONDITIONS_TITLE,
      body: stripTermsPreamble(TERMS_AND_CONDITIONS_BODY),
    };
  }, [doc]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          hitSlop={12}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <BackArrowLeft width={24} height={24} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator>
        <View style={styles.watermarkWrap} pointerEvents="none">
          <Text style={styles.watermark}>{heroFor(doc)}</Text>
        </View>
        <Text style={styles.h2}>{title}</Text>
        <Text style={styles.updated}>Updated on {LEGAL_UPDATED_ON}</Text>
        <Text style={styles.body}>{body.trim()}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: figma.consumerHomeBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    minHeight: 48,
  },
  backBtn: { width: 44, justifyContent: 'center' },
  headerTitle: {
    marginLeft: 4,
    fontSize: 19,
    fontWeight: '800',
    color: figma.textBody,
    flex: 1,
  },
  scroll: {
    paddingHorizontal: figma.spaceGutter,
    paddingTop: 4,
  },
  watermarkWrap: { marginBottom: 16, alignItems: 'center' },
  watermark: {
    fontSize: 26,
    fontWeight: '800',
    color: '#C8D0DC',
    textAlign: 'center',
    lineHeight: 32,
    opacity: 0.85,
  },
  h2: {
    fontSize: 20,
    fontWeight: '800',
    color: figma.textBody,
    marginBottom: 8,
  },
  updated: {
    fontSize: 14,
    fontWeight: '600',
    color: figma.textMuted,
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: figma.textBody,
  },
});
