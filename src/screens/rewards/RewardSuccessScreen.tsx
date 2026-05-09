import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackArrowLeft, CelebrationBackground, ReceiptOutline } from '../../assets/svgs';
import { AppButton } from '../../components/ui';
import type { CartStackParamList, MainTabParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SUPPORT } from '../account/accountFigmaData';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<CartStackParamList, 'RewardSuccess'>,
  BottomTabNavigationProp<MainTabParamList>
>;
type R = RouteProp<CartStackParamList, 'RewardSuccess'>;

/** Figma Rewards & Redemption — success screen tokens */
const textPrimary = '#1A1C1E';
const textLabel = '#8E9094';
const accentOrange = '#D97706';
const screenBg = '#F9FAFB';
const cardBorder = '#E5E7EB';

function formatTrackingId(id: string): string {
  const t = id.trim();
  return t.startsWith('#') ? t : `#${t}`;
}

export function RewardSuccessScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { trackingId, eta, status } = params;

  const statusLabel =
    status === 'PROCESSING' ? 'Processing' : status.replace(/_/g, ' ');

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: screenBg }]}>
      <StatusBar barStyle="dark-content" />
      <Pressable
        style={[styles.backWrap, { top: insets.top + 8 }]}
        hitSlop={12}
        onPress={() => navigation.popToTop()}>
        <BackArrowLeft width={24} height={24} />
      </Pressable>

      <View style={[styles.inner, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.hero}>
          <View style={styles.celebrationLayer} pointerEvents="none">
            <CelebrationBackground width={280} height={150} />
          </View>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </View>

        <Text style={styles.headline}>Request Successful!</Text>
        <Text style={styles.sub}>Your reward is being processed.</Text>

        <View style={styles.infoCard}>
          <View style={styles.receiptIcon}>
            <ReceiptOutline width={26} height={26} />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>REWARD STATUS</Text>
            <View style={styles.statusRow}>
              <View style={styles.orangeDot} />
              <Text style={styles.infoValue}>{statusLabel}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TRACKING ID</Text>
            <Text style={styles.infoValue}>{formatTrackingId(trackingId)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EST. DELIVERY</Text>
            <Text style={styles.infoValue}>{eta}</Text>
          </View>
        </View>

        <AppButton
          text="Go to Wallet"
          variant="neutral"
          style={styles.walletBtn}
          onPress={() =>
            navigation.navigate('Profile', { screen: 'TransactionHistory' })
          }
        />

        <View style={styles.supportRow}>
          <Text style={styles.supportMuted}>For Updates </Text>
          <Pressable onPress={() => Linking.openURL(`mailto:${SUPPORT.email}`)}>
            <Text style={styles.supportLink}>Contact Support</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backWrap: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
    padding: 8,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  hero: {
    width: 280,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  celebrationLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  checkMark: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '700',
    marginTop: -2,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: textPrimary,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: -0.3,
  },
  sub: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
    color: textLabel,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  infoCard: {
    width: '100%',
    marginTop: 32,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: cardBorder,
    position: 'relative',
  },
  receiptIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: textLabel,
  },
  infoValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  orangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: accentOrange,
  },
  walletBtn: {
    marginTop: 32,
    width: '100%',
    borderColor: cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  supportRow: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportMuted: {
    fontSize: 15,
    color: textLabel,
  },
  supportLink: {
    fontSize: 15,
    color: accentOrange,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
