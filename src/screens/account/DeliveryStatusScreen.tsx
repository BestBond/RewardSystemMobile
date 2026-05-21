import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
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
  BoxAdd,
  ChevronRight,
  MapPin,
  ReceiptOutline,
} from '../../assets/svgs';
import { cancelMyRedemption, listMyRedemptions } from '../../api/rewards';
import { AccountGradientBackground } from '../../components/account/AccountGradientBackground';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import {
  redemptionEstDeliveryDisplay,
  redemptionIsDealerPickup,
  redemptionTimelineStep2Detail,
} from '../../utils/redemptionUi';
import { useRefreshOnFocusAndForeground } from '../../hooks/useRefreshOnFocusAndForeground';
import { RewardImageBlock } from '../rewards/RewardImageBlock';
import { splitDeliveryAddress } from '../rewards/rewardPointsUtils';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'DeliveryStatus'>;
type R = RouteProp<ProfileStackParamList, 'DeliveryStatus'>;

const text = '#1A2B48';
const navy = colors.navyAlt;
const muted = '#74777F';
const labelGrey = '#6B7280';
const ptsSuffix = '#8A94A6';
const orange = colors.primaryOrange;
const timelineOnGradientText = 'rgba(255, 255, 255, 0.88)';
const TAB_BAR_SCROLL_PAD = 100;

const CANCEL_REASONS_DELIVERY = [
  "I don't want this reward anymore",
  'I will wait for a better reward',
  'Mistake in the address',
] as const;

const CANCEL_REASONS_PICKUP = [
  "I don't want this reward anymore",
  'I will wait for a better reward',
  'Submitted by mistake',
] as const;

type CancelReason =
  | (typeof CANCEL_REASONS_DELIVERY)[number]
  | (typeof CANCEL_REASONS_PICKUP)[number];

type TimelineStep = {
  title: string;
  detail: string;
  active: boolean;
  icon: React.ReactNode;
};

/** Format ISO timestamps only; pass through ETA sentences from API. */
function formatPlacedDate(raw: string | null) {
  if (!raw?.trim()) return 'TBD';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function deliveryAddressLines(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];
  if (trimmed.includes('\n')) {
    return trimmed.split(/\n/).map(l => l.trim()).filter(Boolean);
  }
  const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts;
  return [trimmed];
}

export function DeliveryStatusScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [redemption, setRedemption] = useState<{
    id: string;
    title: string;
    points: number;
    imageUrl: string | null;
    trackingId: string;
    statusRaw: string;
    createdAt: string;
    etaText: string | null;
    addressLabel: string;
    addressSub: string;
    isDealerPickup: boolean;
  } | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<CancelReason | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const list = await listMyRedemptions();
      const r = list.find(x => x.id === route.params.redemptionId) ?? null;
      if (!r) {
        setRedemption(null);
        setErr('Order not found.');
      } else {
        const isDealerPickup = redemptionIsDealerPickup(r);
        const addr = splitDeliveryAddress(r.deliveryAddress);
        setRedemption({
          id: r.id,
          title: r.reward.title ?? 'Reward',
          points: r.reward.pointsCost,
          imageUrl: r.reward.imageUrl ?? null,
          trackingId: r.trackingId,
          statusRaw: r.status,
          createdAt: r.createdAt,
          etaText: r.etaText ?? null,
          addressLabel: isDealerPickup
            ? 'In-store pickup'
            : r.deliveryLabel?.trim() || addr.label,
          addressSub: isDealerPickup
            ? 'Visit your authorized Best Bond store once operations approves this request; staff will hand over the gift in person.'
            : addr.line,
          isDealerPickup,
        });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load.');
      setRedemption(null);
    } finally {
      setLoading(false);
    }
  }, [route.params.redemptionId]);

  useRefreshOnFocusAndForeground(() => load());

  const steps = useMemo((): TimelineStep[] => {
    if (!redemption) return [];
    const raw = redemption.statusRaw;
    const cancelled = raw === 'CANCELLED';
    const step2Active =
      raw === 'SHIPPED' || raw === 'DELIVERED';
    const inStore = redemption.isDealerPickup;

    const step2Title = inStore
      ? raw === 'DELIVERED'
        ? 'Collected at store'
        : raw === 'SHIPPED'
          ? 'Ready to collect'
          : 'Expected pickup'
      : raw === 'DELIVERED'
        ? 'Delivered'
        : cancelled
          ? 'Expected delivery'
          : 'Expected Delivery';

    return [
      {
        title: inStore ? 'Request submitted' : 'Placed order',
        detail: formatPlacedDate(redemption.createdAt),
        active: !cancelled,
        icon: (
          <ReceiptOutline width={26} height={26} stroke={colors.white} />
        ),
      },
      {
        title: step2Title,
        detail: redemptionTimelineStep2Detail(
          raw,
          redemption.etaText,
          inStore,
        ),
        active: step2Active && !cancelled,
        icon: <BoxAdd width={26} height={26} fill={colors.white} />,
      },
    ];
  }, [redemption]);

  const heroHeadline = useMemo(() => {
    if (!redemption) return '';
    const raw = redemption.statusRaw;
    if (redemption.isDealerPickup) {
      if (raw === 'DELIVERED') return 'Reward collected';
      if (raw === 'SHIPPED') return 'Visit the store to collect';
      if (raw === 'CANCELLED') return 'Request cancelled';
      return 'Waiting for store approval';
    }
    if (raw === 'DELIVERED') return 'Delivered';
    if (raw === 'SHIPPED') return 'On the way';
    if (raw === 'CANCELLED') return 'Order cancelled';
    return "We're packing your order";
  }, [redemption]);

  const estDelivery = useMemo(() => {
    if (!redemption) return '';
    return redemptionEstDeliveryDisplay(
      redemption.statusRaw,
      redemption.etaText,
      redemption.isDealerPickup,
    );
  }, [redemption]);

  const estDeliveryIsLong = estDelivery.length > 36;

  const cancelReasons = useMemo(
    () =>
      redemption?.isDealerPickup ? CANCEL_REASONS_PICKUP : CANCEL_REASONS_DELIVERY,
    [redemption?.isDealerPickup],
  );

  const canCancelDelivery = redemption?.statusRaw === 'PROCESSING';

  const screenTitle = redemption?.isDealerPickup
    ? 'Pickup Status'
    : 'Delivery Status';

  const isCancelled = redemption?.statusRaw === 'CANCELLED';
  const headerOnWhite = !isCancelled;
  const addressLines = redemption
    ? deliveryAddressLines(redemption.addressSub)
    : [];

  return (
    <AccountGradientBackground style={styles.root}>
      <StatusBar barStyle={headerOnWhite ? 'dark-content' : 'light-content'} />
      <View style={[styles.orangeZone, { paddingTop: insets.top + 6 }]}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            hitSlop={12}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <BackArrowLeft
              width={24}
              height={24}
              stroke={headerOnWhite ? navy : colors.white}
            />
          </Pressable>
          <Text
            style={[
              styles.headerTitle,
              headerOnWhite ? styles.headerTitleNavy : styles.headerTitleWhite,
            ]}>
            {screenTitle}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        {!loading ? (
          <Text style={styles.hero}>{heroHeadline}</Text>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primaryOrange} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: TAB_BAR_SCROLL_PAD + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}>
          {err ? <Text style={styles.err}>{err}</Text> : null}

          {redemption ? (
            <>
              <Text
                style={[
                  styles.sectionLabel,
                  isCancelled && styles.sectionLabelOnGradient,
                ]}>
                REWARD STATUS
              </Text>
              <View style={styles.timeline}>
                {steps.map((st, i) => (
                  <View key={st.title} style={styles.stepRow}>
                    <View style={styles.stepRail}>
                      {isCancelled ? (
                        <View style={styles.dotGradient} />
                      ) : st.active && i === 0 ? (
                        <View style={styles.dotRing}>
                          <View style={styles.dotRingInner} />
                        </View>
                      ) : (
                        <View style={styles.dotSolid} />
                      )}
                      {i < steps.length - 1 ? (
                        <View
                          style={[
                            styles.rail,
                            isCancelled
                              ? styles.railGradient
                              : steps[0]?.active
                                ? styles.railActive
                                : styles.railIdle,
                          ]}
                        />
                      ) : null}
                    </View>
                    <View style={styles.stepText}>
                      <Text
                        style={[
                          styles.stepTitle,
                          isCancelled && styles.stepTitleGradient,
                        ]}>
                        {st.title}
                      </Text>
                      <Text
                        style={[
                          styles.stepDetail,
                          isCancelled && styles.stepDetailGradient,
                        ]}>
                        {st.detail}
                      </Text>
                    </View>
                    <View style={styles.stepIcon}>{st.icon}</View>
                  </View>
                ))}
              </View>

              <View style={styles.rewardCard}>
                <View style={styles.rewardThumb}>
                  <RewardImageBlock
                    imageUrl={redemption.imageUrl}
                    padded={false}
                    style={styles.rewardThumbFill}
                  />
                </View>
                <View style={styles.rewardMid}>
                  <Text style={styles.rewardTitle}>{redemption.title}</Text>
                  <Text style={styles.rewardPts}>
                    <Text style={styles.rewardPtsValue}>
                      {redemption.points.toLocaleString()}
                    </Text>
                    <Text style={styles.rewardPtsSuffix}> PTS</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>TRACKING ID</Text>
                  <Text style={styles.metaValue}>#{redemption.trackingId}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>
                    {redemption.isDealerPickup
                      ? 'PICKUP STATUS'
                      : 'EST. DELIVERY'}
                  </Text>
                  <Text
                    style={[
                      styles.metaValue,
                      estDeliveryIsLong && styles.metaValueLong,
                    ]}>
                    {estDelivery}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>
                {redemption.isDealerPickup
                  ? 'PICKUP DETAILS'
                  : 'DELIVERY DETAILS'}
              </Text>
              <View style={styles.addressCard}>
                <View style={styles.addressIconWrap}>
                  <MapPin width={22} height={22} />
                </View>
                <View style={styles.addressBody}>
                  <Text style={styles.addressTitle}>
                    {redemption.addressLabel}
                  </Text>
                  {addressLines.map(line => (
                    <Text key={line} style={styles.addressSub}>
                      {line}
                    </Text>
                  ))}
                </View>
              </View>

              <Text style={styles.sectionLabel}>NEED TO MAKE CHANGES</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.rowBtn,
                  pressed && canCancelDelivery && styles.pressed,
                ]}
                disabled={!canCancelDelivery}
                onPress={() => {
                  setCancelReason(null);
                  setCancelOpen(true);
                }}>
                <Text
                  style={[
                    styles.rowBtnText,
                    !canCancelDelivery && styles.rowBtnTextDisabled,
                  ]}>
                  {canCancelDelivery
                    ? redemption.isDealerPickup
                      ? 'Cancel pickup request'
                      : 'Cancel Delivery'
                    : 'Cancellation unavailable'}
                </Text>
                {canCancelDelivery ? (
                  <ChevronRight strokeColor="#94A3B8" />
                ) : null}
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.rowBtn, pressed && styles.pressed]}
                onPress={() => navigation.navigate('CustomerSupport')}>
                <Text style={styles.rowBtnText}>
                  Need More Help?{' '}
                  <Text style={styles.link}>Contact Support</Text>
                </Text>
                <ChevronRight strokeColor="#94A3B8" />
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      )}

      <Modal
        visible={cancelOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelOpen(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCancelOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}} accessibilityRole="none">
            <Text style={styles.sheetTitle}>
              Do you confirm you want to{'\n'}cancel this order?
            </Text>
            <View style={styles.reasonList}>
              {cancelReasons.map(r => {
                const selected = cancelReason === r;
                return (
                  <Pressable
                    key={r}
                    style={({ pressed }) => [
                      styles.reasonRow,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setCancelReason(r)}>
                    <View style={styles.radioOuter}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <Text style={styles.reasonText}>{r}</Text>
                  </Pressable>
                );
              })}
            </View>
            {cancelErr ? (
              <Text style={styles.cancelErr}>{cancelErr}</Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                cancelReason ? styles.confirmBtnEnabled : styles.confirmBtnDisabled,
                pressed && cancelReason && styles.confirmBtnPressed,
              ]}
              disabled={!cancelReason || cancelling}
              onPress={async () => {
                if (!cancelReason || !redemption || cancelling) return;
                setCancelling(true);
                setCancelErr(null);
                try {
                  await cancelMyRedemption(redemption.id);
                  setCancelOpen(false);
                  load().catch(() => {});
                } catch (e) {
                  setCancelErr(
                    e instanceof Error ? e.message : 'Could not cancel.',
                  );
                } finally {
                  setCancelling(false);
                }
              }}>
              {cancelling ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text
                  style={[
                    styles.confirmText,
                    cancelReason && styles.confirmTextEnabled,
                  ]}>
                  Confirm
                </Text>
              )}
            </Pressable>
            <Pressable onPress={() => setCancelOpen(false)} hitSlop={12}>
              <Text style={styles.dismissText}>Dismiss for now</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AccountGradientBackground>
  );
}

const cardShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      }
    : { elevation: 5 };

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orangeZone: {
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backBtn: { width: 40, justifyContent: 'center' },
  headerSpacer: { width: 40 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
  },
  headerTitleNavy: { color: navy },
  headerTitleWhite: { color: colors.white },
  hero: {
    marginTop: 14,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.6,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  err: { color: '#B91C1C', marginBottom: 12, fontWeight: '600' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: text,
    marginTop: 14,
    marginBottom: 10,
  },
  sectionLabelOnGradient: {
    color: labelGrey,
  },
  timeline: {
    paddingVertical: 2,
    marginBottom: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 16,
    minHeight: 52,
  },
  stepRail: { width: 20, alignItems: 'center' },
  dotRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: text,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotRingInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: text,
  },
  dotSolid: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: text,
    marginTop: 3,
  },
  dotGradient: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.white,
  },
  rail: {
    width: 2,
    flex: 1,
    minHeight: 36,
    marginTop: 4,
  },
  railIdle: { backgroundColor: '#E5E7EB' },
  railActive: { backgroundColor: text },
  railGradient: { backgroundColor: 'rgba(255, 255, 255, 0.65)' },
  stepText: { flex: 1, minWidth: 0 },
  stepTitle: { fontSize: 15, fontWeight: '800', color: text },
  stepTitleGradient: {
    color: timelineOnGradientText,
    fontWeight: '800',
  },
  stepDetail: {
    marginTop: 4,
    fontSize: 13,
    color: muted,
    fontWeight: '500',
    lineHeight: 18,
  },
  stepDetailGradient: {
    color: timelineOnGradientText,
    fontWeight: '500',
  },
  stepIcon: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 14,
    marginTop: 4,
    ...cardShadow,
    backgroundColor: colors.white,
  },
  rewardThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: '#F5F6FA',
  },
  rewardThumbFill: { width: '100%', height: '100%' },
  rewardMid: { flex: 1, minWidth: 0 },
  rewardTitle: { fontSize: 16, fontWeight: '800', color: text },
  rewardPts: { marginTop: 6, fontSize: 14 },
  rewardPtsValue: { fontWeight: '800', color: text },
  rewardPtsSuffix: { fontWeight: '800', color: ptsSuffix },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 16,
  },
  metaCol: { flex: 1, minWidth: 0 },
  metaLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: labelGrey,
  },
  metaValue: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: '900',
    color: text,
  },
  metaValueLong: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 24,
    padding: 16,
    backgroundColor: colors.white,
    gap: 14,
    ...cardShadow,
  },
  addressIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressBody: { flex: 1 },
  addressTitle: { fontSize: 15, fontWeight: '800', color: text },
  addressSub: { marginTop: 4, fontSize: 13, color: muted, lineHeight: 20 },
  rowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowBtnText: { fontSize: 15, fontWeight: '700', color: text },
  rowBtnTextDisabled: { color: '#9CA3AF', fontWeight: '600' },
  link: { color: orange, fontWeight: '800', textDecorationLine: 'underline' },
  pressed: { opacity: 0.85 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 20,
    ...cardShadow,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: text,
    marginBottom: 16,
    lineHeight: 24,
  },
  reasonList: { gap: 12, marginBottom: 16 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: orange,
  },
  reasonText: { flex: 1, fontSize: 14, color: muted, fontWeight: '500' },
  confirmBtn: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: '#E5E7EB' },
  confirmBtnEnabled: { backgroundColor: orange },
  confirmBtnPressed: { opacity: 0.92 },
  confirmText: { fontSize: 16, fontWeight: '800', color: '#9CA3AF' },
  confirmTextEnabled: { color: colors.white },
  dismissText: {
    marginTop: 16,
    fontSize: 14,
    color: muted,
    textAlign: 'center',
    fontWeight: '600',
  },
  cancelErr: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
});
