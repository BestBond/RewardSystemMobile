import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { useRefreshOnFocusAndForeground } from '../../hooks/useRefreshOnFocusAndForeground';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient as SvgLinear,
  Rect,
  Stop,
} from 'react-native-svg';
import {
  BackArrowLeft,
  BasketSmall,
  CardStar,
  Earbud,
  Leveling,
  Lifting,
  MapPin,
  RewardsActive,
} from '../../assets/svgs';
import {
  redeemReward,
  getMyGiftTier,
  getReward,
  resolveRewardImageUrl,
  type GiftTier,
  type RewardDto,
} from '../../api/rewards';
import { getMyProfile } from '../../api/users';
import { userFacingApiMessage } from '../../api/client';
import { navigateToProfileEdit } from '../../navigation/rootNavigation';
import type { CartStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { splitDeliveryAddress } from './rewardPointsUtils';
import { AppChip } from '../../components/ui';

type Nav = NativeStackNavigationProp<CartStackParamList, 'RewardCheckout'>;
type R = RouteProp<CartStackParamList, 'RewardCheckout'>;

const screenBg = '#FFF3EA';
const navy = '#1A2B48';

function RewardVisual({ reward }: { reward: RewardDto }) {
  const uri = resolveRewardImageUrl(reward.imageUrl);
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.productImage}
        resizeMode="contain"
      />
    );
  }

  const size = 132;
  const title = reward.title.toLowerCase();
  if (title.includes('lifting')) {
    return <Lifting width={size} height={size} />;
  }
  if (title.includes('levelling') || title.includes('leveling')) {
    return <Leveling width={size} height={size} />;
  }
  return <Earbud width={size} height={size} />;
}

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
  const [isDealer, setIsDealer] = useState(false);
  const [deliveryLabel, setDeliveryLabel] = useState('Delivery');
  const [deliveryLine, setDeliveryLine] = useState('');
  const [walletGiftTier, setWalletGiftTier] = useState<GiftTier>('WORKER');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [r, profile, tierInfo] = await Promise.all([
        getReward(rewardId),
        getMyProfile(),
        getMyGiftTier().catch(() => null),
      ]);
      setReward(r);
      setBalance(profile.loyaltyPoints ?? 0);
      if (tierInfo) setWalletGiftTier(tierInfo.giftTier);
      setIsDealer(
        (profile.roles ?? []).some(
          role => String(role).toUpperCase() === 'DEALER',
        ),
      );
      const split = splitDeliveryAddress(profile.deliveryAddress);
      setDeliveryLabel(split.label);
      setDeliveryLine(split.line);
    } catch (e) {
      setError((e as Error)?.message ?? 'Could not load');
    } finally {
      setLoading(false);
    }
  }, [rewardId]);

  useRefreshOnFocusAndForeground(() => {
    setLoading(true);
    load().catch(() => {});
  });

  const pts = reward?.pointsCost ?? 0;
  const tierOk =
    reward?.tierRedeemable ??
    (reward?.giftTier == null || reward.giftTier === walletGiftTier);
  const canAfford = balance >= pts && pts > 0;
  const canRedeem = reward?.eligible ?? (canAfford && tierOk);
  const tierBlockMessage =
    !isDealer && reward && !tierOk
      ? reward.giftTier === 'CONTRACTOR'
        ? 'Reach Contractor tier (2,000,000+ points balance) to redeem this gift.'
        : 'This gift is for Worker tier only (balance below 2,000,000 points).'
      : null;
  const balanceBlockMessage =
    reward && canAfford === false && tierOk
      ? `You need ${pts.toLocaleString()} points to redeem this gift.`
      : null;

  const onConfirm = async () => {
    if (!reward || !canRedeem || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await redeemReward(reward.id, {
        deliveryLabel: isDealer ? 'In-store pickup' : deliveryLabel,
        deliveryAddress: isDealer ? null : deliveryLine || null,
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
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinear id="checkoutBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primaryOrange} stopOpacity="1" />
            <Stop
              offset="0.34"
              stopColor={colors.primaryOrange}
              stopOpacity="1"
            />
            <Stop offset="0.34" stopColor={screenBg} stopOpacity="1" />
            <Stop offset="1" stopColor={screenBg} stopOpacity="1" />
          </SvgLinear>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#checkoutBg)" />
      </Svg>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            hitSlop={12}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backHit}
          >
            <BackArrowLeft width={22} height={22} />
            <Text style={styles.headerTitle}>Checkout</Text>
          </Pressable>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.ptsPill}>
          <CardStar width={16} height={16} />
          <AppChip
            text={`${balance.toLocaleString()} Pts`}
            variant="accent"
            style={styles.pointsChip}
          />
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
          <Pressable
            style={styles.retry}
            onPress={() => load().catch(() => {})}
          >
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
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.productFrame}>
                <RewardVisual reward={reward} />
              </View>
              <View style={styles.cardPad}>
                <Text style={styles.productTitle}>{reward.title}</Text>
                <Text style={styles.productDesc}>
                  {reward.description ?? ''}
                </Text>
                <View style={styles.pointsRow}>
                  <Text style={styles.pointsBig}>{pts.toLocaleString()}</Text>
                  <Text style={styles.pointsWord}> POINTS</Text>
                </View>
                {tierBlockMessage ? (
                  <Text style={styles.warn}>{tierBlockMessage}</Text>
                ) : null}
                {!tierBlockMessage && balanceBlockMessage ? (
                  <Text style={styles.warn}>{balanceBlockMessage}</Text>
                ) : null}
              </View>
            </View>

            <Text style={styles.sectionLabel}>
              {isDealer ? 'STORE REDEMPTION' : 'DELIVERY DETAILS'}
            </Text>
            <View style={styles.deliveryCard}>
              <View style={styles.pinCircle}>
                <MapPin width={20} height={20} />
              </View>
              <View style={styles.deliveryText}>
                {isDealer ? (
                  <>
                    <Text style={styles.placeName}>Visit nearest store</Text>
                    <Text style={styles.address}>
                      Dealer reward redemptions are reviewed by operations. Once
                      approved, collect your reward at your nearest authorized
                      Best Bond store. No delivery to your profile address
                      applies.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.placeName}>{deliveryLabel}</Text>
                    <Text style={styles.address}>{deliveryLine}</Text>
                  </>
                )}
              </View>
              {!isDealer ? (
                <Pressable hitSlop={8} onPress={() => navigateToProfileEdit()}>
                  <Text style={styles.edit}>Edit</Text>
                </Pressable>
              ) : (
                <View style={styles.editSpacer} />
              )}
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLeft}>Item Total</Text>
                <Text style={styles.summaryRight}>
                  {pts.toLocaleString()} pts
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLeft}>
                  {isDealer ? 'Pickup / approval' : 'Shipping Fee'}
                </Text>
                <Text style={[styles.summaryRight, styles.free]}>
                  {isDealer ? 'In-store' : 'FREE'}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLeft}>Total Redemption</Text>
                <Text style={styles.totalRight}>
                  {pts.toLocaleString()} pts
                </Text>
              </View>
            </View>
            {error ? <Text style={styles.inlineErr}>{error}</Text> : null}
          </ScrollView>

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                (!canRedeem || submitting) && styles.confirmDisabled,
                pressed && canRedeem && !submitting && styles.pressed,
              ]}
              disabled={!canRedeem || submitting}
              onPress={() => {
                onConfirm().catch(() => {});
              }}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.confirmText}>
                    {isDealer
                      ? 'Confirm Redemption'
                      : 'Submit redemption request'}
                  </Text>
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
  root: { flex: 1, backgroundColor: screenBg },
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
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 20,
    marginTop:10
  },
  headerLeft: { flex: 1, justifyContent: 'center' ,  },
  headerRight: { alignItems: 'flex-end' },
  backHit: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: navy,
  },
  ptsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
    pointsChip: { paddingVertical: 5, paddingHorizontal: 10 },

  ptsPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: navy,
  },
  scroll: { paddingHorizontal: 10, paddingTop: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  productFrame: {
    height: 280,
    margin: 14,
    marginBottom: 4,
    borderRadius: 22,
    backgroundColor: '#F7F8F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  cardPad: { padding: 30, paddingTop: 20 },
  productTitle: {
    fontSize: 22,
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
    fontSize: 30,
    fontWeight: '900',
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
    fontWeight: '800',
    letterSpacing: 0.7,
    color: navy,
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  pinCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryText: { flex: 1 },
  placeName: {
    fontSize: 15,
    fontWeight: '700',
    color: navy,
  },
  address: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedGray,
  },
  edit: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryOrange,
  },
  editSpacer: { width: 36 },
  summaryCard: {
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
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
    paddingHorizontal: 10,
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
