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
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconReceiptDocOrange, MapPinOrange } from '../../assets/svgs';
import type { AdminUsersStackParamList } from '../../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { adminUi } from '../../theme/adminUi';
import { AdminHeader } from './components/AdminHeader';
import {
  activateAdminUser,
  getAdminUserById,
  suspendAdminUser,
  type AdminUserDetail,
} from '../../api/adminUsers';
import { isApiError, userFacingApiMessage } from '../../api/client';

type Props = NativeStackScreenProps<AdminUsersStackParamList, 'AdminUserDetail'>;
type Nav = NativeStackNavigationProp<AdminUsersStackParamList>;

export function AdminUserDetailScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [u, setU] = useState<AdminUserDetail | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const detail = await getAdminUserById(params.userId);
      setU(detail);
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not load user.');
      setU(null);
    } finally {
      setLoading(false);
    }
  }, [params.userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().catch(() => {});
    }, [load]),
  );

  const initials = useMemo(() => {
    const name = u?.displayName ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  }, [u?.displayName]);

  const statusActive = (u?.status ?? 'ACTIVE') === 'ACTIVE';

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const onConfirmSuspend = useCallback(async () => {
    if (!u || suspendSubmitting) return;
    setSuspendSubmitting(true);
    setActionError(null);
    try {
      await suspendAdminUser(u.id, suspendReason.trim() || undefined);
      setU(prev => prev ? { ...prev, status: 'SUSPENDED' } : prev);
      setSuspendOpen(false);
      setSuspendReason('');
    } catch (e) {
      if (isApiError(e)) setActionError(userFacingApiMessage(e.message));
      else setActionError('Could not suspend account.');
    } finally {
      setSuspendSubmitting(false);
    }
  }, [u, suspendReason, suspendSubmitting]);

  const onActivate = useCallback(async () => {
    if (!u || suspendSubmitting) return;
    setSuspendSubmitting(true);
    setActionError(null);
    try {
      await activateAdminUser(u.id);
      setU(prev => prev ? { ...prev, status: 'ACTIVE' } : prev);
    } catch (e) {
      if (isApiError(e)) setActionError(userFacingApiMessage(e.message));
      else setActionError('Could not activate account.');
    } finally {
      setSuspendSubmitting(false);
    }
  }, [u, suspendSubmitting]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AdminHeader title="User Profile" />
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

        {u ? (
          <>
            <View style={[styles.hero, adminUi.shadowCard]}>
          <View style={styles.heroTop}>
            <View style={[styles.bigAvatar, { backgroundColor: '#E0E7FF' }]}>
              <Text style={styles.bigAvatarTxt}>{initials}</Text>
            </View>
            <Text style={styles.ban} accessibilityLabel="Restrict">
              {'\u2298'}
            </Text>
          </View>
          <Text style={styles.name}>{u.displayName}</Text>
          <View style={styles.roleRow}>
            <MapPinOrange width={18} height={18} />
            <Text style={styles.roleTxt}>{u.profession ?? '—'}</Text>
          </View>
          <View style={[
            styles.statusPill,
            statusActive ? styles.statusPillActive : styles.statusPillSuspended,
          ]}>
            <View style={[
              styles.statusDot,
              statusActive ? styles.statusDotActive : styles.statusDotSuspended,
            ]} />
            <Text style={[
              styles.statusTxt,
              statusActive ? styles.statusTxtActive : styles.statusTxtSuspended,
            ]}>
              STATUS: {statusActive ? 'ACTIVE' : 'SUSPENDED'}
            </Text>
          </View>
        </View>

        <View style={[styles.balanceCard, adminUi.shadowCard]}>
          <View style={styles.balanceGlow} pointerEvents="none" />
          <View style={styles.balanceLeft}>
            <Text style={styles.balanceLbl}>CURRENT BALANCE</Text>
            <Text style={styles.balanceVal}>
              {formatInt(u.loyaltyPoints)} <Text style={styles.pts}>PTS</Text>
            </Text>
            <Text style={styles.updatedLbl}>LAST UPDATED</Text>
            <Text style={styles.updatedVal}>
              {formatDateTime(u.updatedAt)}
            </Text>
          </View>
          <View style={styles.walletIcon}>
            <IconReceiptDocOrange width={36} height={36} />
          </View>
        </View>

        <View style={[styles.infoCard, adminUi.shadowCard]}>
          <View style={styles.infoHead}>
            <Text style={styles.infoHeadIcon}>{'\u2139'}</Text>
            <Text style={styles.infoHeadTxt}>User Information</Text>
          </View>
          <View style={styles.infoDivider} />
          <Text style={styles.fieldLbl}>MOBILE NUMBER</Text>
          <Text style={styles.fieldVal}>{u.phone ?? '—'}</Text>
          <Text style={[styles.fieldLbl, styles.fieldGap]}>ADDRESS</Text>
          <Text style={styles.fieldVal}>
            {u.deliveryAddress ?? '—'}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel="View user transaction ledger"
          onPress={() => navigation.navigate('AdminUserTransactions', { userId: params.userId })}>
          <IconReceiptDocOrange width={22} height={22} />
          <Text style={styles.primaryBtnTxt}>View Transaction Ledger</Text>
        </Pressable>

        {actionError ? (
          <Text style={styles.actionErr}>{actionError}</Text>
        ) : null}

        {statusActive ? (
          <Pressable
            style={[styles.suspendRow, suspendSubmitting && { opacity: 0.5 }]}
            disabled={suspendSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Suspend account"
            onPress={() => { setActionError(null); setSuspendOpen(true); }}>
            <Text style={styles.suspendIcon}>{'\u2298'}</Text>
            <Text style={styles.suspendTxt}>Suspend Account</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.activateRow, suspendSubmitting && { opacity: 0.5 }]}
            disabled={suspendSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Reactivate account"
            onPress={() => { onActivate().catch(() => {}); }}>
            {suspendSubmitting ? (
              <ActivityIndicator color={adminUi.successGreen} />
            ) : (
              <Text style={styles.activateTxt}>Reactivate Account</Text>
            )}
          </Pressable>
        )}
          </>
        ) : null}
      </ScrollView>

      {/* Suspend modal — matches Figma "Suspend this Account?" */}
      <Modal visible={suspendOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Suspend this{'\n'}Account?</Text>
            <Text style={styles.modalFieldLbl}>REASON FOR SUSPENSION</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter the reason for suspension"
              placeholderTextColor={adminUi.labelMuted}
              value={suspendReason}
              onChangeText={setSuspendReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!suspendSubmitting}
            />
            {actionError ? (
              <Text style={styles.modalErr}>{actionError}</Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.modalConfirmBtn,
                pressed && { opacity: 0.92 },
                suspendSubmitting && { opacity: 0.6 },
              ]}
              disabled={suspendSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Confirm account suspension"
              onPress={() => { onConfirmSuspend().catch(() => {}); }}>
              {suspendSubmitting ? (
                <ActivityIndicator color={adminUi.white} />
              ) : (
                <Text style={styles.modalConfirmTxt}>Confirm Suspension</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.modalCancelBtn}
              disabled={suspendSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Dismiss suspension dialog"
              onPress={() => { setSuspendOpen(false); setSuspendReason(''); setActionError(null); }}>
              <Text style={styles.modalCancelTxt}>Dismiss for now</Text>
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

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const t = d.getTime();
  if (!Number.isFinite(t)) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  hero: {
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bigAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigAvatarTxt: { fontSize: 22, fontWeight: '800', color: adminUi.navyAlt },
  ban: { fontSize: 20, color: adminUi.suspendAccent, fontWeight: '700' },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginTop: 12,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  roleTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: adminUi.roleAccent,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: adminUi.radiusPill,
    gap: 8,
  },
  statusPillActive: {
    backgroundColor: adminUi.successBg,
  },
  statusPillSuspended: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: adminUi.successGreen,
  },
  statusDotSuspended: {
    backgroundColor: adminUi.suspendAccent,
  },
  statusTxt: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusTxtActive: {
    color: adminUi.successGreen,
  },
  statusTxtSuspended: {
    color: adminUi.suspendAccent,
  },
  balanceCard: {
    flexDirection: 'row',
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    overflow: 'hidden',
    position: 'relative',
  },
  balanceLeft: { flex: 1 },
  balanceLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: adminUi.labelMuted,
    letterSpacing: 0.5,
  },
  balanceVal: {
    fontSize: 28,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginTop: 6,
  },
  pts: { fontSize: 15, fontWeight: '700', color: adminUi.labelMuted },
  balanceGlow: {
    position: 'absolute',
    top: -40,
    right: -32,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(239, 132, 65, 0.12)',
  },
  updatedLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: adminUi.labelMuted,
    letterSpacing: 0.5,
    marginTop: 12,
  },
  updatedVal: {
    fontSize: 14,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginTop: 4,
  },
  walletIcon: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  infoCard: {
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 16,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoHeadIcon: { fontSize: 18, color: adminUi.labelMuted },
  infoHeadTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: adminUi.labelMuted,
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  fieldLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: adminUi.labelMuted,
    letterSpacing: 0.4,
  },
  fieldGap: { marginTop: 14 },
  fieldVal: {
    fontSize: 15,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginTop: 4,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: adminUi.accentOrange,
    borderRadius: adminUi.radiusPill,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminUi.shadowCta,
  },
  primaryBtnTxt: {
    color: adminUi.white,
    fontSize: 16,
    fontWeight: '700',
  },
  suspendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  suspendIcon: { fontSize: 16, color: adminUi.suspendAccent },
  suspendTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: adminUi.suspendAccent,
  },
  activateRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  activateTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: adminUi.successGreen,
  },
  actionErr: {
    color: adminUi.pointsDebit,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: adminUi.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginBottom: 22,
  },
  modalFieldLbl: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: adminUi.labelMuted,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    borderRadius: adminUi.radiusMd,
    padding: 14,
    fontSize: 15,
    color: adminUi.sectionTitle,
    height: 112,
    backgroundColor: adminUi.screenBg,
    marginBottom: 14,
  },
  modalErr: {
    color: adminUi.pointsDebit,
    fontSize: 13,
    marginBottom: 10,
  },
  modalConfirmBtn: {
    backgroundColor: '#92400E',
    borderRadius: adminUi.radiusPill,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalConfirmTxt: {
    color: adminUi.white,
    fontSize: 16,
    fontWeight: '800',
  },
  modalCancelBtn: {
    borderRadius: adminUi.radiusPill,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  modalCancelTxt: {
    color: adminUi.sectionTitle,
    fontSize: 15,
    fontWeight: '700',
  },
});
