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
import { goBackInApp } from '../../navigation/goBackInApp';
import { figma } from '../../theme/figmaTokens';
import { LegalFormattedBody } from './legal/LegalFormattedBody';
import {
  LEGAL_UPDATED_ON,
  PRIVACY_POLICY_BODY,
  PRIVACY_POLICY_TITLE,
  TERMS_AND_CONDITIONS_BODY,
  TERMS_AND_CONDITIONS_TITLE,
} from './legal/legalCopy';
import { legalTypography } from './legal/legalTypography';
import {
  stripPrivacyPreamble,
  stripTermsPreamble,
} from './legal/stripLegalPreamble';

type Props = NativeStackScreenProps<ProfileStackParamList, 'LegalDocument'>;
type Nav = NativeStackNavigationProp<ProfileStackParamList, 'LegalDocument'>;

const DOC_SUBTITLE = 'BestBond Rewards Program Mobile Application';

export function LegalDocumentScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const doc = route.params.document;

  const { docTitle, body } = useMemo(() => {
    if (doc === 'privacy') {
      return {
        docTitle: PRIVACY_POLICY_TITLE.toUpperCase(),
        body: stripPrivacyPreamble(PRIVACY_POLICY_BODY),
      };
    }
    return {
      docTitle: 'TERMS & CONDITIONS',
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
          onPress={() => goBackInApp(navigation)}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <BackArrowLeft width={24} height={24} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {doc === 'terms' ? TERMS_AND_CONDITIONS_TITLE : PRIVACY_POLICY_TITLE}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator>
        <Text style={legalTypography.docTitle}>{docTitle}</Text>
        <Text style={legalTypography.docSubtitle}>{DOC_SUBTITLE}</Text>
        <Text style={legalTypography.docDate}>
          Last Updated: {LEGAL_UPDATED_ON}
        </Text>
        <LegalFormattedBody body={body.trim()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    minHeight: 48,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: figma.borderSoft,
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
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
