import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BackArrowLeft,
  ChevronRight,
  IconReceiptDocOrange,
  IconShieldOrange,
} from '../../assets/svgs';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { figma } from '../../theme/figmaTokens';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'TermsPrivacyHub'>;

export function TermsPrivacyHubScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

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
        <Text style={styles.headerTitle}>Terms & Privacy Policies</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.watermarkWrap} pointerEvents="none">
          <Text style={styles.watermark}>Our Reward App Policies</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() =>
            navigation.navigate('LegalDocument', { document: 'terms' })
          }>
          <IconReceiptDocOrange width={24} height={24} />
          <Text style={styles.rowTitle}>Terms & Conditions</Text>
          <ChevronRight strokeColor="#64748B" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() =>
            navigation.navigate('LegalDocument', { document: 'privacy' })
          }>
          <IconShieldOrange width={24} height={24} />
          <Text style={styles.rowTitle}>Privacy Policy</Text>
          <ChevronRight strokeColor="#64748B" />
        </Pressable>
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
    paddingTop: 8,
  },
  watermarkWrap: {
    marginBottom: 28,
    alignItems: 'center',
  },
  watermark: {
    fontSize: 26,
    fontWeight: '800',
    color: '#C8D0DC',
    textAlign: 'center',
    lineHeight: 32,
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: figma.radiusScreenCard,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: figma.borderSoft,
    ...figma.shadowSoft,
  },
  rowTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: figma.textBody,
  },
  pressed: { opacity: 0.92 },
});
