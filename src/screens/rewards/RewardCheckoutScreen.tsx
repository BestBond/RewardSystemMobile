import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
  BasketSmall,
  MapPin,
  RewardsActive,
} from '../../assets/svgs';
import { redeemReward, getReward, type RewardDto } from '../../api/rewards';
import { getMyProfile } from '../../api/users';
import { userFacingApiMessage } from '../../api/client';
import type { CartStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { RewardImageBlock } from './RewardImageBlock';
import { splitDeliveryAddress } from './rewardPointsUtils';

type Nav = NativeStackNavigationProp<CartStackParamList, 'RewardCheckout'>;
type R = RouteProp<CartStackParamList, 'RewardCheckout'>;

const screenBg = '#F2F2F7';
const navy = '#1A2B48';

export function RewardCheckoutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { rewardId } = params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reward, setReward] = useState<RewardDto | null>(null);
  const [balance, setBalance] = useState(0);
  const [deliveryLabel, setDeliveryLabel] = useState('Delivery');
  const [deliveryLine, setDeliveryLine] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [r, profile] = await Promise.all([
        getReward(rewardId),
        getMyProfile(),
      ]);
      setReward(r);
      setBalance(profile.loyaltyPoints ?? 0);
      const split = splitDeliveryAddress(profile.deliveryAddress);
      setDeliveryLabel(split.label);
      setDeliveryLine(split.line);
    } catch (e) {
      setError((e as Error)?.message ?? 'Could not load');
    } finally {
      setLoading(false);
    }
  }, [rewardId]);

  React.useEffect(() => {
    setLoading(true);
    load().catch(() => {});
  }, [load]);

  const pts = reward?.pointsCost ?? 0;
  const canAfford = balance >= pts;

  const onConfirm = async () => {
    if (!reward || !canAfford || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await redeemReward(reward.id, {
        deliveryLabel,
        deliveryAddress: deliveryLine || null,
      });
      navigation.replace('RewardSuccess', {
        trackingId: res.trackingId,
        eta: res.eta,
        status: res.status,
      });
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Redemption failed';
      setError(userFacingApiMessage(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: screenBg }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <Pressable
            hitSlop={12}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <BackArrowLeft width={22} height={22} />
          </Pressable>
        </View>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={[styles.headerSide, styles.headerSideRight]}>
          <View style={styles.ptsPill}>
            <RewardsActive width={16} height={16} />
            <Text style={styles.ptsPillText}>
              {balance.toLocaleString()} Pts
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primaryOrange} />
        </View>
      ) : error && !reward ? (
        <View style={styles.center}>
          <Text style={styles.errText}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => load().catch(() => {})}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : reward ? (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: 120 + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <View style={styles.triptychCard}>
                <RewardImageBlock imageUrl={reward.imageUrl} minHeight={160} />
              </View>
              <View style={styles.cardPad}>
                <Text style={styles.productTitle}>{reward.title}</Text>
                <Text style={styles.productDesc}>{reward.description ?? ''}</Text>
                <View style={styles.pointsRow}>
                  <Text style={styles.pointsBig}>{pts.toLocaleString()}</Text>
                  <Text style={styles.pointsWord}> POINTS</Text>
                </View>
                {!canAfford ? (
                  <Text style={styles.warn}>
                    You need {(pts - balance).toLocaleString()} more points to
                    redeem this reward.
                  </Text>
                ) : null}
              </View>
            </View>

            <Text style={styles.sectionLabel}>DELIVERY DETAILS</Text>
            <View style={styles.deliveryCard}>
              <View style={styles.pinCircle}>
                <MapPin width={20} height={20} />
              </View>
              <View style={styles.deliveryText}>
                <Text style={styles.placeName}>{deliveryLabel}</Text>
                <Text style={styles.address}>{deliveryLine}</Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() =>
                  navigation
                    .getParent()
                    ?.navigate('Profile', { screen: 'UserProfile' })
                }>
                <Text style={styles.edit}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLeft}>Item Total</Text>
                <Text style={styles.summaryRight}>{pts.toLocaleString()} pts</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLeft}>Shipping Fee</Text>
                <Text style={[styles.summaryRight, styles.free]}>FREE</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLeft}>Total Redemption</Text>
                <Text style={styles.totalRight}>{pts.toLocaleString()} pts</Text>
              </View>
            </View>
            {error ? (
              <Text style={styles.inlineErr}>{error}</Text>
            ) : null}
          </ScrollView>

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}>
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                (!canAfford || submitting) && styles.confirmDisabled,
                pressed && canAfford && !submitting && styles.pressed,
              ]}
              disabled={!canAfford || submitting}
              onPress={() => {
                onConfirm().catch(() => {});
              }}>
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.confirmText}>Confirm Redemption</Text>
                  <BasketSmall width={22} height={22} />
                </>
              )}
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errText: { color: colors.mutedGray, textAlign: 'center' },
  inlineErr: {
    marginTop: 12,
    color: '#B91C1C',
    textAlign: 'center',
    fontSize: 14,
  },
  retry: { marginTop: 12 },
  retryText: { color: colors.primaryOrange, fontWeight: '700' },
  warn: {
    marginTop: 12,
    fontSize: 14,
    color: '#B45309',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: screenBg,
  },
  headerSide: { width: 100, justifyContent: 'center' },
  headerSideRight: { alignItems: 'flex-end' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: navy,
  },
  ptsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.badgeTint,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 18,
    gap: 4,
  },
  ptsPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: navy,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  triptychCard: {
    backgroundColor: '#E8E8E8',
    padding: 12,
  },
  cardPad: { padding: 16 },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: navy,
  },
  productDesc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: colors.mutedGray,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
  },
  pointsBig: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryOrange,
  },
  pointsWord: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryOrange,
    letterSpacing: 0.5,
  },
  sectionLabel: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: colors.labelGray,
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGray,
    padding: 14,
    gap: 12,
  },
  pinCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryText: { flex: 1 },
  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: navy,
  },
  address: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedGray,
  },
  edit: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryOrange,
  },
  summaryCard: {
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGray,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLeft: {
    fontSize: 15,
    color: colors.mutedGray,
  },
  summaryRight: {
    fontSize: 15,
    fontWeight: '600',
    color: navy,
  },
  free: {
    fontWeight: '800',
    color: navy,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderGray,
    marginVertical: 6,
  },
  totalLeft: {
    fontSize: 16,
    fontWeight: '800',
    color: navy,
  },
  totalRight: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryOrange,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: screenBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderGray,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primaryOrange,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: colors.primaryOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmDisabled: {
    opacity: 0.55,
  },
  confirmText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: { opacity: 0.94 },
});
