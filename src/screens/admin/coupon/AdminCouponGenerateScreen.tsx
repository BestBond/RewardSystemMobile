import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
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
import { AdminHeader } from '../components/AdminHeader';
import type { AdminCouponStackParamList } from '../../../navigation/types';
import { adminUi } from '../../../theme/adminUi';
import { generateCouponBatch, listCoupons } from '../../../api/coupons';
import { isApiError, userFacingApiMessage } from '../../../api/client';
import { ChevronDownSmall } from '../../../assets/svgs';

type Nav = NativeStackNavigationProp<
  AdminCouponStackParamList,
  'AdminCouponGenerate'
>;

const SLAB_OPTIONS = [500, 1000, 2000, 5000, 10000] as const;

function formatInt(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
  );
}

export function AdminCouponGenerateScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [slabPts, setSlabPts] = useState<number | null>(null);
  const [slabOpen, setSlabOpen] = useState(false);
  const [qtyRaw, setQtyRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [recentActiveCoupons, setRecentActiveCoupons] = useState<number | null>(
    null,
  );

  const quantity = useMemo(() => {
    const n = parseInt(qtyRaw.replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  }, [qtyRaw]);

  const totalPts =
    slabPts != null && quantity > 0 ? slabPts * quantity : 0;

  const goDashboard = () => {
    navigation.getParent()?.navigate('AdminHome');
  };

  useEffect(() => {
    let cancelled = false;
    listCoupons({ status: 'ACTIVE', take: 200 })
      .then((rows) => {
        if (!cancelled) setRecentActiveCoupons(rows.length);
      })
      .catch(() => {
        if (!cancelled) setRecentActiveCoupons(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onGenerateBatch = async () => {
    setError(null);
    if (slabPts == null) {
      setError('Select a coupon slab value.');
      return;
    }
    if (quantity < 1) {
      setError('Enter a valid number of coupons.');
      return;
    }
    setGenerating(true);
    try {
      const result = await generateCouponBatch({ points: slabPts, quantity });
      const previewCodes = (result.previewCodes ?? []).slice(0, 80);
      const createdAtIso = result.createdAt ?? new Date().toISOString();
      navigation.navigate('AdminCouponPreview', {
        slabPts,
        quantity,
        totalPts,
        batchId: result.batchId,
        batchNumber: result.batchNumber,
        previewCodes,
        createdAtIso,
      });
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not generate batch. Check server.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AdminHeader title="Generate Coupons" onBack={goDashboard} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 24 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Define the parameters for your new industrial coupon batch. Values
          are calculated instantly.
        </Text>
        {recentActiveCoupons != null ? (
          <Text style={styles.subtleStat}>
            Active coupons in system: {formatInt(recentActiveCoupons)}
          </Text>
        ) : null}

        <Text style={styles.fieldLabel}>COUPON SLAB VALUE</Text>
        <Pressable
          style={({ pressed }) => [
            styles.selectField,
            pressed && styles.selectFieldPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Select coupon slab value"
          onPress={() => setSlabOpen(true)}>
          <Text
            style={
              slabPts != null ? styles.selectValue : styles.selectPlaceholder
            }>
            {slabPts != null
              ? `${formatInt(slabPts)} pts`
              : 'Select Value (e.g., 1000, 2000)'}
          </Text>
          <View style={styles.chevronWrap} pointerEvents="none">
            <ChevronDownSmall width={18} height={18} />
          </View>
        </Pressable>

        <Text style={styles.fieldLabel}>NUMBER OF COUPONS</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Quantity"
          placeholderTextColor={adminUi.labelMuted}
          value={qtyRaw}
          onChangeText={t => {
            setQtyRaw(t);
            setError(null);
          }}
          keyboardType="number-pad"
          returnKeyType="done"
        />

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL VALUE OF THE BATCH</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValueNum}>{formatInt(totalPts)}</Text>
            <Text style={styles.summaryValueUnit}>PTS</Text>
          </View>

          <View style={styles.infoPill}>
            <View style={styles.infoBadge} accessibilityLabel="Info">
              {/* TODO: replace with provided SVG info icon */}
              <View style={styles.infoBadgeDot} />
            </View>
            <Text style={styles.infoText}>
              Generating this batch will authorize{' '}
              <Text style={styles.infoBold}>
                {quantity > 0 ? formatInt(quantity) : '\u2014'} unique codes
              </Text>{' '}
              to be distributed via the partner portal.
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            generating && styles.primaryBtnDisabled,
            pressed && !generating && styles.primaryBtnPressed,
          ]}
          disabled={generating}
          accessibilityRole="button"
          accessibilityLabel="Generate coupon batch"
          onPress={() => { onGenerateBatch().catch(() => {}); }}>
          {generating ? (
            <ActivityIndicator color={adminUi.white} />
          ) : (
            <>
              {/* TODO: replace with provided SVG lightning icon */}
              <View style={styles.primaryIconPlaceholder} />
              <Text style={styles.primaryBtnText}>Generate Batch</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      <Modal
        visible={slabOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSlabOpen(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSlabOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Coupon slab</Text>
            {SLAB_OPTIONS.map(opt => (
              <Pressable
                key={opt}
                style={({ pressed }) => [
                  styles.modalRow,
                  pressed && styles.modalRowPressed,
                  slabPts === opt && styles.modalRowSelected,
                ]}
                onPress={() => {
                  setSlabPts(opt);
                  setSlabOpen(false);
                  setError(null);
                }}>
                <Text style={styles.modalRowText}>{formatInt(opt)} pts</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: adminUi.labelMuted,
    marginBottom: 24,
  },
  subtleStat: {
    fontSize: 12,
    color: adminUi.labelMuted,
    marginTop: -10,
    marginBottom: 18,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: adminUi.labelMuted,
    marginBottom: 8,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminUi.engageBadgeBg,
    borderWidth: 0,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  selectFieldPressed: { opacity: 0.92 },
  selectValue: {
    fontSize: 16,
    fontWeight: '600',
    color: adminUi.navyAlt,
  },
  selectPlaceholder: {
    fontSize: 16,
    color: adminUi.lightGray,
  },
  chevronWrap: { marginLeft: 10 },
  input: {
    backgroundColor: adminUi.engageBadgeBg,
    borderWidth: 0,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: adminUi.navyAlt,
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 22,
    backgroundColor: adminUi.cardBg,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    ...adminUi.shadowCard,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: adminUi.labelMuted,
    marginBottom: 8,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  summaryValueNum: {
    fontSize: 40,
    fontWeight: '900',
    color: adminUi.navyAlt,
  },
  summaryValueUnit: {
    fontSize: 16,
    fontWeight: '800',
    color: adminUi.labelMuted,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminUi.engageBadgeBg,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: adminUi.labelMuted,
  },
  infoBold: { fontWeight: '800' },
  infoBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E9E1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBadgeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C4A882',
  },
  error: {
    color: '#B45309',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: adminUi.accentOrange,
    borderRadius: 999,
    paddingVertical: 16,
    marginTop: 10,
    ...adminUi.shadowCta,
  },
  primaryBtnPressed: { opacity: 0.92 },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryIconPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  primaryBtnText: {
    color: adminUi.white,
    fontSize: 17,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: adminUi.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: adminUi.navyAlt,
    marginBottom: 12,
  },
  modalRow: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminUi.borderGray,
  },
  modalRowPressed: { backgroundColor: adminUi.offWhite },
  modalRowSelected: { backgroundColor: '#FFF7ED' },
  modalRowText: {
    fontSize: 16,
    fontWeight: '600',
    color: adminUi.navyAlt,
  },
});
