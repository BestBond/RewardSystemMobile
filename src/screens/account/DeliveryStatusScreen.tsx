import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
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
import { BackArrowLeft, ChevronRight } from '../../assets/svgs';
import { cancelMyRedemption, listMyRedemptions } from '../../api/rewards';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'DeliveryStatus'>;
type R = RouteProp<ProfileStackParamList, 'DeliveryStatus'>;

const text = '#1A1C1E';
const muted = '#74777F';
const hero = '#DDE2EE';
const orange = colors.primaryOrange;
const bg = '#FFFFFF';
const cardBorder = '#EEF0F4';

const CANCEL_REASONS = [
  "I don't want this reward anymore",
  'I will wait for a better reward',
  'Mistake in the address',
] as const;

type CancelReason = (typeof CANCEL_REASONS)[number];

function labelCase(s: string) {
  return s
    .split('_')
    .map(w => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function formatDateLabel(raw: string | null) {
  if (!raw) return 'TBD';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
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
    trackingId: string;
    statusRaw: string;
    statusLabel: string;
    createdAt: string;
    etaText: string | null;
    addressLabel: string;
    addressSub: string;
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
        setRedemption({
          id: r.id,
          title: r.reward.title ?? 'Reward',
          points: r.reward.pointsCost,
          trackingId: r.trackingId,
          statusRaw: r.status,
          statusLabel: labelCase(r.status),
          createdAt: r.createdAt,
          etaText: r.etaText ?? null,
          // Backend doesn’t return delivery address yet; keep UI shape.
          addressLabel: r.deliveryLabel ?? 'Delivery',
          addressSub: r.deliveryAddress ?? '—',
        });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load.');
      setRedemption(null);
    } finally {
      setLoading(false);
    }
  }, [route.params.redemptionId]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load]),
  );

  const steps = useMemo(() => {
    const raw = redemption?.statusRaw ?? '';
    const created = formatDateLabel(redemption?.createdAt ?? null);
    const eta = formatDateLabel(redemption?.etaText ?? null);
    const idx =
      raw === 'DELIVERED'
        ? 3
        : raw === 'SHIPPED'
          ? 2
          : raw === 'PROCESSING'
            ? 1
            : raw === 'CANCELLED'
              ? 0
              : 0;
    return [
      { title: 'Placed order', date: created, active: idx >= 0 },
      { title: 'Packing your order', date: created, active: idx >= 1 },
      { title: 'Your order is on the way', date: eta, active: idx >= 2 },
      { title: 'Expected delivery', date: eta, active: idx >= 3 },
    ];
  }, [redemption?.createdAt, redemption?.etaText, redemption?.statusRaw]);

  const canCancelDelivery = redemption?.statusRaw === 'PROCESSING';

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: bg }]}>
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
        <Text style={styles.headerTitle}>Delivery Status</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={orange} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 24 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.hero}>We're packing your order</Text>

          {err ? <Text style={styles.err}>{err}</Text> : null}

          {redemption ? (
            <>
              <Text style={styles.sectionLabel}>REWARD STATUS</Text>
              <View style={styles.timeline}>
                {steps.map((st, i) => (
                  <View key={st.title} style={styles.stepRow}>
                    <View style={styles.stepRail}>
                      <View
                        style={[
                          styles.dot,
                          st.active ? styles.dotActive : styles.dotIdle,
                        ]}
                      />
                      {i < steps.length - 1 ? <View style={styles.rail} /> : null}
                    </View>
                    <View style={styles.stepText}>
                      <Text
                        style={[
                          styles.stepTitle,
                          !st.active && { color: '#9CA3AF' },
                        ]}>
                        {st.title}
                      </Text>
                      <Text style={styles.stepDate}>{st.date}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.rewardCard}>
                <View style={styles.rewardThumb} />
                <View style={styles.rewardMid}>
                  <Text style={styles.rewardTitle}>{redemption.title}</Text>
                  <Text style={styles.rewardPts}>{redemption.points.toLocaleString()} PTS</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>TRACKING ID</Text>
                  <Text style={styles.metaValue}>#{redemption.trackingId}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>STATUS</Text>
                  <Text style={styles.metaValue}>{redemption.statusLabel}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>EXPECTED DELIVERY</Text>
                  <Text style={styles.metaValue}>
                    {formatDateLabel(redemption.etaText)}
                  </Text>
                </View>
                <View style={styles.metaCol} />
              </View>

              <Text style={styles.sectionLabel}>DELIVERY DETAILS</Text>
              <View style={styles.addressCard}>
                <Text style={styles.addressTitle}>{redemption.addressLabel}</Text>
                <Text style={styles.addressSub}>{redemption.addressSub}</Text>
              </View>

              <Text style={styles.sectionLabel}>NEED TO MAKE CHANGES</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.rowBtn,
                  !canCancelDelivery && styles.rowBtnDisabled,
                  pressed && styles.pressed,
                ]}
                disabled={!canCancelDelivery}
                onPress={() => {
                  setCancelReason(null);
                  setCancelOpen(true);
                }}>
                <Text style={styles.rowBtnText}>
                  {canCancelDelivery ? 'Cancel Delivery' : 'Cancellation unavailable'}
                </Text>
                {canCancelDelivery ? <ChevronRight strokeColor="#94A3B8" /> : null}
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
        <Pressable style={styles.modalBackdrop} onPress={() => setCancelOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}} accessibilityRole="none">
            <Text style={styles.sheetTitle}>
              Do you confirm you want to{'\n'}cancel this order?
            </Text>
            <View style={styles.reasonList}>
              {CANCEL_REASONS.map(r => {
                const checked = cancelReason === r;
                return (
                  <Pressable
                    key={r}
                    style={({ pressed }) => [
                      styles.reasonRow,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setCancelReason(r)}>
                    <View style={[styles.checkbox, checked && styles.checkboxOn]} />
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
                (!cancelReason || pressed) && styles.confirmBtnPressed,
                !cancelReason && styles.confirmBtnDisabled,
              ]}
              disabled={!cancelReason || cancelling}
              onPress={async () => {
                if (!cancelReason || !redemption || cancelling) return;
                setCancelling(true);
                setCancelErr(null);
                try {
                  await cancelMyRedemption(redemption.id);
                  setCancelOpen(false);
                  // Refresh to show CANCELLED status
                  load().catch(() => {});
                } catch (e) {
                  setCancelErr(e instanceof Error ? e.message : 'Could not cancel.');
                } finally {
                  setCancelling(false);
                }
              }}>
              {cancelling ? (
                <ActivityIndicator color={orange} />
              ) : (
                <Text style={styles.confirmText}>Confirm</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setCancelOpen(false)} hitSlop={12}>
              <Text style={styles.dismissText}>Dismiss for now</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: text,
  },
  scroll: { paddingHorizontal: 22, paddingTop: 10 },
  hero: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: hero,
    marginBottom: 18,
    letterSpacing: -0.6,
  },
  err: { color: '#B91C1C', marginBottom: 12 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: '#9CA3AF',
    marginTop: 14,
    marginBottom: 10,
  },
  timeline: {
    paddingVertical: 6,
  },
  stepRow: { flexDirection: 'row', gap: 12, paddingBottom: 10 },
  stepRail: { width: 18, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  dotActive: { borderColor: '#111827', backgroundColor: '#FFFFFF' },
  dotIdle: { borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
  rail: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: 4 },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: text },
  stepDate: { marginTop: 2, fontSize: 12, color: muted },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: cardBorder,
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    ...cardShadow,
    backgroundColor: '#FFFFFF',
  },
  rewardThumb: {
    width: 54,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  rewardMid: { flex: 1 },
  rewardTitle: { fontSize: 14, fontWeight: '800', color: text },
  rewardPts: { marginTop: 4, fontSize: 12, fontWeight: '800', color: muted },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: '#9CA3AF' },
  metaValue: { marginTop: 4, fontSize: 16, fontWeight: '900', color: text },
  addressCard: {
    borderWidth: 1,
    borderColor: cardBorder,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    ...cardShadow,
  },
  addressTitle: { fontSize: 14, fontWeight: '800', color: text },
  addressSub: { marginTop: 6, fontSize: 12, color: muted, lineHeight: 18 },
  rowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowBtnDisabled: {
    opacity: 0.45,
  },
  rowBtnText: { fontSize: 14, fontWeight: '700', color: text },
  link: { color: orange, fontWeight: '800' },
  pressed: { opacity: 0.85 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    ...cardShadow,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: text, marginBottom: 14 },
  reasonList: { gap: 10, marginBottom: 14 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  checkboxOn: { backgroundColor: orange, borderColor: orange },
  reasonText: { flex: 1, fontSize: 13, color: muted },
  confirmBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnPressed: { opacity: 0.9 },
  confirmText: { fontSize: 14, fontWeight: '800', color: '#4B5563' },
  dismissText: {
    marginTop: 14,
    fontSize: 13,
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

