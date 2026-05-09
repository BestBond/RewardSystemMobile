import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  useWindowDimensions,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminHeader } from '../components/AdminHeader';
import type { AdminCouponStackParamList } from '../../../navigation/types';
import { adminUi } from '../../../theme/adminUi';
import { formatBatchCreatedLabel } from './couponGenerationUtils';
import { ChevronRight, Scanner, TxTicketOrange } from '../../../assets/svgs';
import QrCodeBlack from '../../../assets/svgs/originals/qr_code_black.svg';
import CouponPhoneScan from '../../../assets/svgs/originals/coupon_phone_scan.svg';
import CouponSteps from '../../../assets/svgs/originals/coupon_steps.svg';
import BestBond from '../../../assets/svgs/originals/best_bond.svg';

type Nav = NativeStackNavigationProp<
  AdminCouponStackParamList,
  'AdminCouponPreview'
>;
type R = RouteProp<AdminCouponStackParamList, 'AdminCouponPreview'>;

function formatInt(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
  );
}

export function AdminCouponPreviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { slabPts, quantity, totalPts, batchId, batchNumber, previewCodes, createdAtIso } = params;
  const { width: screenW } = useWindowDimensions();

  const visibleCodes = previewCodes;
  const moreCount = Math.max(0, quantity - visibleCodes.length);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const redeemPointsLabel = useMemo(() => {
    // Coupon design shows a single redeem value; for each coupon use the slab value.
    return `${formatInt(slabPts)} Points`;
  }, [slabPts]);

  const onConfirm = () => {
    navigation.navigate('AdminCouponExport', {
      batchId,
      createdAtLabel: formatBatchCreatedLabel(new Date(createdAtIso)),
      totalCoupons: quantity,
      totalPts,
      slabPts,
    });
  };

  const onDiscard = () => {
    navigation.goBack();
  };

  const closeModal = () => setSelectedCode(null);

  // Match the banner design resolution (660x245) while fitting on mobile screens.
  const bannerAspect = 660 / 245;
  const bannerW = Math.min(screenW - 12, 720);
  const bannerH = bannerW / bannerAspect;
  const scale = bannerW / 660;
  const leftW = 330 * scale; // exact half of 660 design
  const rightW = bannerW - leftW;
  const downloadStripW = 72 * scale;
  const rightPadR = downloadStripW + 22 * scale;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AdminHeader title="Coupon Batch Preview" />
      <View style={[styles.content, { paddingBottom: insets.bottom }]}>
        <View style={styles.heroCard}>
          <View style={styles.heroAccent} />
          <View style={styles.heroBody}>
            <Text style={styles.heroLabel}>NO OF COUPONS</Text>
            <Text style={styles.heroCount}>{formatInt(quantity)}</Text>
            <Text style={styles.heroSub}>Coupons Generated</Text>
            <View style={styles.valueBadge}>
              {/* If you want a different icon, share the SVG and I’ll swap it. */}
              <TxTicketOrange width={18} height={18} />
              <Text style={styles.valueBadgeText}>
                Value: {formatInt(slabPts)} Pts each
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Live Preview</Text>

        <View style={styles.listWrap}>
          <View style={styles.listCard}>
            <FlatList
              data={visibleCodes}
              keyExtractor={(item, index) => `${item}-${index}`}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.rowSep} />}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => setSelectedCode(item)}>
                  <View style={styles.qrCircle}>
                    <Scanner width={22} height={22} />
                  </View>
                  <View style={styles.rowMid}>
                    <Text style={styles.code}>{item}</Text>
                    <Text style={styles.batchSub}>
                      Active Batch #{batchNumber}
                    </Text>
                  </View>
                  <ChevronRight strokeColor={adminUi.lightGray} />
                </Pressable>
              )}
              ListFooterComponent={
                moreCount > 0 ? (
                  <Text style={styles.moreHint}>
                    + {formatInt(moreCount)} more in this batch (shown in export)
                  </Text>
                ) : (
                  <View style={{ height: 8 }} />
                )
              }
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Confirm coupon batch preview"
            onPress={onConfirm}>
            <Text style={styles.primaryBtnText}>Confirm</Text>
          </Pressable>
          <Pressable
            onPress={onDiscard}
            style={styles.discardWrap}
            accessibilityRole="button"
            accessibilityLabel="Discard coupon batch preview">
            <Text style={styles.discard}>Cancel/Discard</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={selectedCode != null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <View style={[styles.couponFrame, { width: bannerW, height: bannerH }]}>
            <Pressable style={styles.couponCard} onPress={() => {}}>
              <View
                style={[
                  styles.couponLeft,
                  { width: leftW },
                  { paddingTop: 18 * scale, paddingHorizontal: 18 * scale },
                ]}>
                <View style={[styles.couponLeftTop, { marginBottom: 10 * scale }]}>
                  <CouponPhoneScan width={34 * scale} height={34 * scale} />
                </View>
                <View style={styles.qrWrap}>
                  <QrCodeBlack width={175 * scale} height={175 * scale} />
                </View>
                <Text
                  style={[
                    styles.couponId,
                    { fontSize: 14 * scale, marginTop: 12 * scale },
                  ]}>
                  ID: {selectedCode ?? ''}
                </Text>
              </View>

              <View
                style={[
                  styles.couponRight,
                  {
                    width: rightW,
                    paddingLeft: 44 * scale,
                    paddingRight: rightPadR,
                  },
                ]}>
                <View style={[styles.couponRightTopRow, { marginTop: 22 * scale }]}>
                  <Text style={[styles.redeemLabel, { fontSize: 28 * scale }]}>
                    Redeem:
                  </Text>
                  <View
                    style={[
                      styles.redeemPill,
                      {
                        marginLeft: 16 * scale,
                        paddingHorizontal: 30 * scale,
                        paddingVertical: 12 * scale,
                      },
                    ]}>
                    <Text style={[styles.redeemPillText, { fontSize: 28 * scale }]}>
                      {redeemPointsLabel}
                    </Text>
                  </View>
                </View>

                <View style={[styles.stepsWrap, { marginTop: 28 * scale }]}>
                  <CouponSteps width={390 * scale} height={120 * scale} />
                </View>

                <View style={[styles.brandBadge, { top: 16 * scale, right: 18 * scale }]}>
                  <BestBond width={86 * scale} height={54 * scale} />
                </View>

                <View
                  style={[
                    styles.downloadCard,
                    {
                      right: 14 * scale,
                      top: 18 * scale,
                      width: downloadStripW,
                      height: bannerH - 36 * scale,
                      borderRadius: 14 * scale,
                      paddingVertical: 10 * scale,
                      paddingHorizontal: 8 * scale,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.downloadText,
                      {
                        fontSize: 14 * scale,
                        width: (bannerH - 36 * scale) * 1.05,
                        marginTop: (bannerH - 36 * scale) * 0.42,
                      },
                    ]}>
                    Download the app
                  </Text>
                  <View
                    style={[
                      styles.downloadQr,
                      {
                        width: 54 * scale,
                        height: 54 * scale,
                        borderRadius: 10 * scale,
                        marginTop: 12 * scale,
                      },
                    ]}>
                    <QrCodeBlack width={44 * scale} height={44 * scale} />
                  </View>
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={closeModal}
              accessibilityRole="button"
              accessibilityLabel="Close coupon preview"
              style={[
                styles.modalClose,
                {
                  top: -10 * scale,
                  right: -10 * scale,
                  width: 34 * scale,
                  height: 34 * scale,
                  borderRadius: 17 * scale,
                },
              ]}>
              <Text style={[styles.modalCloseText, { fontSize: 22 * scale }]}>×</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  heroCard: {
    flexDirection: 'row',
    borderRadius: 26,
    backgroundColor: adminUi.creamCard,
    borderWidth: 1,
    borderColor: adminUi.creamCardBorder,
    overflow: 'hidden',
    marginBottom: 22,
  },
  heroAccent: {
    width: 6,
    backgroundColor: adminUi.accentOrange,
  },
  heroBody: { flex: 1, padding: 18 },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: adminUi.sectionTitle,
    marginBottom: 6,
  },
  heroCount: {
    fontSize: 44,
    fontWeight: '900',
    color: adminUi.navyAlt,
    lineHeight: 48,
  },
  heroSub: {
    fontSize: 15,
    color: adminUi.labelMuted,
    marginBottom: 14,
  },
  valueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: adminUi.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: adminUi.radiusPill,
    borderWidth: 1,
    borderColor: adminUi.borderGray,
  },
  valueBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminUi.navyAlt,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginBottom: 12,
  },
  listWrap: { flex: 1, minHeight: 140 },
  listCard: {
    borderRadius: 26,
    backgroundColor: adminUi.cardBg,
    ...adminUi.shadowCard,
    flex: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: adminUi.cardBg,
  },
  rowPressed: { backgroundColor: adminUi.offWhite },
  rowSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: adminUi.borderGray,
    marginLeft: 74,
  },
  qrCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowMid: { flex: 1 },
  code: {
    fontSize: 16,
    fontWeight: '800',
    color: adminUi.navyAlt,
  },
  batchSub: {
    fontSize: 13,
    color: adminUi.labelMuted,
    marginTop: 2,
  },
  footer: { paddingTop: 14, },
  primaryBtn: {
    backgroundColor: adminUi.accentOrange,
    borderRadius: adminUi.radiusPill,
    paddingVertical: 16,
    alignItems: 'center',
    ...adminUi.shadowCta,
  },
  primaryBtnPressed: { opacity: 0.92 },
  primaryBtnText: {
    color: adminUi.white,
    fontSize: 17,
    fontWeight: '800',
  },
  discardWrap: {
    marginTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  discard: {
    fontSize: 15,
    fontWeight: '700',
    color: adminUi.labelMuted,
  },
  moreHint: {
    fontSize: 13,
    color: adminUi.labelMuted,
    textAlign: 'center',
    marginVertical: 12,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  couponFrame: { position: 'relative' },
  couponCard: {
    borderRadius: 22,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: adminUi.white,
    flex: 1,
  },
  modalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { fontSize: 22, fontWeight: '800', color: '#111827' },

  couponLeft: {
    width: '42%',
    backgroundColor: adminUi.white,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  couponLeftTop: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  qrWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  couponId: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.2,
  },

  couponRight: {
    width: '58%',
    backgroundColor: '#1F2A37',
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  brandBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'flex-end',
    zIndex: 5,
  },
  couponRightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 0,
  },
  redeemLabel: { fontSize: 18, fontWeight: '800', color: adminUi.white },
  redeemPill: {
    backgroundColor: '#F97316',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  redeemPillText: { fontSize: 18, fontWeight: '900', color: adminUi.white },
  stepsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  downloadCard: {
    position: 'absolute',
    right: 12,
    top: 22,
    backgroundColor: adminUi.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  downloadText: {
    fontWeight: '700',
    color: '#374151',
    transform: [{ rotate: '-90deg' }],
    textAlign: 'center',
    marginBottom: 10,
  },
  downloadQr: {
    backgroundColor: adminUi.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});
