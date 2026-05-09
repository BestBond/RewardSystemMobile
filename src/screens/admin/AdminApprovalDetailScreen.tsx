import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AdminApprovalsStackParamList } from '../../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { adminUi } from '../../theme/adminUi';
import { AdminHeader } from './components/AdminHeader';
import {
  approveAdminRedemption,
  deliverAdminRedemption,
  getAdminRedemptionById,
  rejectAdminRedemption,
  type AdminRedemptionDetail,
} from '../../api/adminRedemptions';
import { isApiError, userFacingApiMessage } from '../../api/client';
import { getAuthMe } from '../../api/users';
import { isOperationalOnly } from './adminRole';

type Props = NativeStackScreenProps<
  AdminApprovalsStackParamList,
  'AdminApprovalDetail'
>;
type Nav = NativeStackNavigationProp<AdminApprovalsStackParamList>;

export function AdminApprovalDetailScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();
  const [doneOpen, setDoneOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminRedemptionDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [operationalOnly, setOperationalOnly] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const me = await getAuthMe().catch(() => ({ user: null }));
      setOperationalOnly(isOperationalOnly(me.user ?? null));
      const d = await getAdminRedemptionById(params.requestId);
      setDetail(d);
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not load request.');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [params.requestId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().catch(() => {});
    }, [load]),
  );

  const canApprove = useMemo(
    () => !!detail && !operationalOnly && detail.status === 'PROCESSING' && !submitting,
    [detail, operationalOnly, submitting],
  );

  const canReject = useMemo(
    () => !!detail && !operationalOnly && detail.status === 'PROCESSING' && !submitting,
    [detail, operationalOnly, submitting],
  );

  const canDeliver = useMemo(() => !!detail && detail.status === 'SHIPPED' && !submitting, [detail, submitting]);

  const onApprove = useCallback(async () => {
    if (!detail || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await approveAdminRedemption(detail.id);
      // Update local state so banner matches “moved to dispatch”
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: 'SHIPPED',
              statusLabel: 'Approved (In Dispatch)',
              statusMessage:
                'This request has been approved and moved to dispatch.',
            }
          : prev,
      );
      setDoneOpen(true);
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not approve request.');
    } finally {
      setSubmitting(false);
    }
  }, [detail, submitting]);

  const onReject = useCallback(async () => {
    if (!detail || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await rejectAdminRedemption(detail.id);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: 'CANCELLED',
              statusLabel: 'Rejected / Cancelled',
              statusMessage: 'This request has been rejected or cancelled.',
            }
          : prev,
      );
      setRejectOpen(true);
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not reject request.');
    } finally {
      setSubmitting(false);
    }
  }, [detail, submitting]);

  const onDeliver = useCallback(async () => {
    if (!detail || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await deliverAdminRedemption(detail.id);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: 'DELIVERED',
              statusLabel: 'Delivered to Dealer',
              statusMessage: 'The reward has been delivered to the dealer.',
            }
          : prev,
      );
      setDeliverOpen(true);
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not mark as delivered.');
    } finally {
      setSubmitting(false);
    }
  }, [detail, submitting]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AdminHeader title="Approval Request Details" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={adminUi.accentOrange} />
          </View>
        ) : null}

        {error ? <Text style={styles.err}>{error}</Text> : null}

        {!loading && !detail && !error ? (
          <Text style={styles.err}>Request not found.</Text>
        ) : null}

        {detail ? (
          <>
            <View style={styles.alertBanner}>
          <View style={styles.alertIcon}>
            <Text style={styles.alertIconTxt}>!</Text>
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Status: {detail.statusLabel}</Text>
            {detail.statusMessage ? (
              <Text style={styles.alertSub}>{detail.statusMessage}</Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.rewardCard, adminUi.shadowCard]}>
          <View style={styles.thumb} />
          <Text style={styles.rewardTitle}>{detail.reward.title ?? 'Reward'}</Text>
          <Text style={styles.rewardPts}>{formatInt(detail.reward.points)} PTS</Text>
        </View>

        <View style={[styles.infoCard, adminUi.shadowCard]}>
          <Text style={styles.infoTitle}>Requester Information</Text>
          <Text style={styles.lbl}>Full Name</Text>
          <Text style={styles.val}>{detail.requester.fullName}</Text>
          <Text style={[styles.lbl, styles.gap]}>Mobile Number</Text>
          <Text style={styles.val}>{detail.requester.phone ?? '—'}</Text>
          <Text style={[styles.lbl, styles.gap]}>Address</Text>
          <Text style={styles.val}>
            {detail.requester.address ?? '—'}
          </Text>
          <Pressable
            style={styles.linkRow}
            accessibilityRole="button"
            accessibilityLabel="View requester account"
            onPress={() => {
              const userId = detail.requester.id;
              if (!userId) return;
              // Navigate to Admin Users → User Detail from the approvals stack.
              navigation
                .getParent()
                ?.navigate('AdminUsers', { screen: 'AdminUserDetail', params: { userId } });
            }}>
            <Text style={styles.linkTxt}>View Account</Text>
            <Text style={styles.linkExt}>{'\u2197'}</Text>
          </Pressable>
        </View>

        <View style={styles.flagAcct}>
          <Text style={styles.flagEx}>{'!'}</Text>
          <Text style={styles.flagTxt}>Flag the Account</Text>
        </View>

        {!operationalOnly ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.approve,
                (!canApprove || submitting) && styles.btnDisabled,
                pressed && { opacity: 0.92 },
              ]}
              disabled={!canApprove || submitting}
              accessibilityRole="button"
              accessibilityLabel="Approve and dispatch request"
              onPress={() => {
                onApprove().catch(() => {});
              }}>
              {submitting ? (
                <ActivityIndicator color={adminUi.white} />
              ) : (
                <Text style={styles.approveTxt}>Approve & Dispatch</Text>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.reject,
                (!canReject || submitting) && styles.btnDisabled,
                pressed && { opacity: 0.92 },
              ]}
              disabled={!canReject || submitting}
              accessibilityRole="button"
              accessibilityLabel="Reject request"
              onPress={() => {
                onReject().catch(() => {});
              }}>
              <Text style={styles.rejectTxt}>Reject Request</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.roleHint}>
            Operational admin can update dispatch and delivery status only.
          </Text>
        )}

        {/* Operational Admin action: visible only after SHIPPED */}
        {detail.status === 'SHIPPED' ? (
          <Pressable
            style={({ pressed }) => [
              styles.deliverBtn,
              (!canDeliver || submitting) && styles.btnDisabled,
              pressed && { opacity: 0.92 },
            ]}
            disabled={!canDeliver || submitting}
            accessibilityRole="button"
            accessibilityLabel="Mark request as delivered"
            onPress={() => { onDeliver().catch(() => {}); }}>
            {submitting ? (
              <ActivityIndicator color={adminUi.white} />
            ) : (
              <Text style={styles.deliverTxt}>
                {'\u2713'} Mark as Delivered to Dealer
              </Text>
            )}
          </Pressable>
        ) : null}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={doneOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>{'\u2713'}</Text>
            </View>
            <Text style={styles.modalTitle}>Request Approved!</Text>
            <Text style={styles.modalSub}>
              Request #{detail?.code ?? '—'} has been moved to dispatch.
            </Text>
            <Pressable
              style={styles.modalBtn}
              accessibilityRole="button"
              accessibilityLabel="Return to approvals list"
              onPress={() => {
                setDoneOpen(false);
                navigation.navigate('AdminApprovalsList');
              }}>
              <Text style={styles.modalBtnTxt}>Return to Approval List</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={rejectOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.checkCircle, styles.rejectCircle]}>
              <Text style={styles.rejectMark}>{'\u2715'}</Text>
            </View>
            <Text style={styles.modalTitle}>Request Rejected</Text>
            <Text style={styles.modalSub}>
              Request #{detail?.code ?? '—'} has been cancelled.
            </Text>
            <Pressable
              style={styles.modalBtn}
              accessibilityRole="button"
              accessibilityLabel="Return to approvals list"
              onPress={() => {
                setRejectOpen(false);
                navigation.navigate('AdminApprovalsList');
              }}>
              <Text style={styles.modalBtnTxt}>Return to Approval List</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delivered confirmation modal */}
      <Modal visible={deliverOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.checkCircle, styles.deliverCircle]}>
              <Text style={styles.deliverCheckMark}>{'\u2713'}</Text>
            </View>
            <Text style={styles.modalTitle}>Delivered!</Text>
            <Text style={styles.modalSub}>
              Reward #{detail?.code ?? '—'} has been marked as delivered to the dealer.
            </Text>
            <Pressable
              style={styles.modalBtn}
              accessibilityRole="button"
              accessibilityLabel="Return to approvals list"
              onPress={() => {
                setDeliverOpen(false);
                navigation.navigate('AdminApprovalsList');
              }}>
              <Text style={styles.modalBtnTxt}>Return to Approval List</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatInt(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  loader: { paddingVertical: 18, alignItems: 'center' },
  err: {
    color: adminUi.pointsDebit,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: adminUi.radiusMd,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.35)',
    gap: 12,
  },
  alertIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconTxt: {
    fontWeight: '900',
    color: adminUi.sectionTitle,
    fontSize: 16,
  },
  alertBody: { flex: 1 },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: adminUi.sectionTitle,
  },
  alertSub: {
    fontSize: 12,
    color: adminUi.labelMuted,
    marginTop: 4,
    lineHeight: 17,
  },
  rewardCard: {
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 16,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  rewardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminUi.sectionTitle,
  },
  rewardPts: {
    fontSize: 18,
    fontWeight: '800',
    color: adminUi.accentOrange,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginBottom: 12,
  },
  lbl: {
    fontSize: 11,
    fontWeight: '700',
    color: adminUi.labelMuted,
    letterSpacing: 0.3,
  },
  gap: { marginTop: 12 },
  val: {
    fontSize: 15,
    fontWeight: '600',
    color: adminUi.sectionTitle,
    marginTop: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  linkTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: adminUi.accentOrange,
  },
  linkExt: { fontSize: 14, color: adminUi.accentOrange, fontWeight: '800' },
  flagAcct: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  flagEx: {
    color: adminUi.pointsDebit,
    fontWeight: '900',
    fontSize: 16,
  },
  flagTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: adminUi.pointsDebit,
  },
  approve: {
    backgroundColor: adminUi.accentOrange,
    borderRadius: adminUi.radiusPill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  approveTxt: {
    color: adminUi.white,
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: { opacity: 0.6 },
  reject: {
    marginTop: 12,
    borderRadius: adminUi.radiusPill,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: adminUi.white,
  },
  rejectTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: adminUi.sectionTitle,
  },
  roleHint: {
    fontSize: 13,
    color: adminUi.labelMuted,
    textAlign: 'center',
    marginTop: 14,
  },
  rejectCircle: { backgroundColor: '#FEE2E2' },
  rejectMark: { color: adminUi.pointsDebit, fontWeight: '900', fontSize: 22 },
  deliverBtn: {
    marginTop: 12,
    backgroundColor: adminUi.successGreen,
    borderRadius: adminUi.radiusPill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deliverTxt: {
    color: adminUi.white,
    fontSize: 15,
    fontWeight: '800',
  },
  deliverCircle: { backgroundColor: '#DCFCE7' },
  deliverCheckMark: { color: adminUi.successGreen, fontWeight: '900', fontSize: 22 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: adminUi.white,
    borderRadius: adminUi.radiusLg,
    padding: 24,
    alignItems: 'center',
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E7E5E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkMark: {
    fontSize: 28,
    color: adminUi.dangerBrown,
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 14,
    color: adminUi.labelMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalBtn: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: adminUi.radiusPill,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: adminUi.sectionTitle,
  },
});
