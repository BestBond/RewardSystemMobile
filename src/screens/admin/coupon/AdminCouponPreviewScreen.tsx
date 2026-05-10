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
import QRCode from 'react-native-qrcode-svg';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminHeader } from '../components/AdminHeader';
import type { AdminCouponStackParamList } from '../../../navigation/types';
import { adminUi } from '../../../theme/adminUi';
import { formatBatchCreatedLabel } from './couponGenerationUtils';
import { ChevronRight, Scanner, TxTicketOrange } from '../../../assets/svgs';
import CouponPhoneScan from '../../../assets/svgs/originals/coupon_phone_scan.svg';
import BestBondManLogo from '../../../assets/svgs/originals/BestBondman.svg';

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
    // Match PDF copy: "5,000 Points" (locale-formatted slab value).
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

  // Match PDF front canvas 660×245: white strip 220px, orange panel 440px.
  const bannerAspect = 660 / 245;
  const bannerW = Math.min(screenW - 24, 720);
  const bannerH = bannerW / bannerAspect;
  const scale = bannerW / 660;
  const leftW = (220 / 660) * bannerW;
  const rightW = bannerW - leftW;

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
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeModal}
            accessibilityRole="button"
            accessibilityLabel="Dismiss coupon preview"
          />
          <View
            style={[styles.couponFrame, { width: bannerW, height: bannerH }]}
            pointerEvents="box-none">
            <View style={styles.couponCard}>
              <View
                style={[
                  styles.couponLeft,
                  { width: leftW, paddingTop: 14 * scale },
                ]}>
                <View style={styles.couponLeftTop}>
                  <CouponPhoneScan width={28 * scale} height={28 * scale} />
                </View>
                <View style={[styles.qrWrap, { marginTop: 10 * scale }]}>
                  {selectedCode ? (
                    <QRCode
                      value={selectedCode}
                      size={150 * scale}
                      quietZone={2}
                      backgroundColor="#FFFFFF"
                      color="#111827"
                    />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.couponId,
                    { fontSize: 13 * scale, marginTop: 14 * scale },
                  ]}>
                  ID: {selectedCode ?? ''}
                </Text>
              </View>

              <View style={[styles.couponRight, { width: rightW, height: bannerH }]}>
                <Svg
                  width={rightW}
                  height={bannerH}
                  viewBox="0 0 440 245"
                  preserveAspectRatio="none"
                  style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient
                      id="couponOrangeGrad"
                      x1="0"
                      y1="0"
                      x2="440"
                      y2="245"
                      gradientUnits="userSpaceOnUse">
                      <Stop offset="0" stopColor="#F97316" />
                      <Stop offset="1" stopColor="#EA6A12" />
                    </LinearGradient>
                  </Defs>
                  <Rect width="440" height="245" fill="url(#couponOrangeGrad)" />
                  <Path
                    d="M40 18C80 50 150 78 240 96C315 111 365 132 420 162V0H0v245h440v-26c-62-8-126-30-190-66C140 126 80 72 40 18Z"
                    fill="#000"
                    opacity={0.06}
                  />
                </Svg>

                <View
                  style={[
                    styles.brandBadge,
                    { top: 14 * scale, right: 10 * scale },
                  ]}
                  pointerEvents="none">
                  <BestBondManLogo
                    width={50 * scale}
                    height={75 * scale}
                  />
                </View>

                <View
                  style={[
                    styles.pdfFrontContent,
                    { paddingTop: 76 * scale, paddingHorizontal: 12 * scale },
                  ]}>
                  <View
                    style={[
                      styles.pointsPill,
                      {
                        width: 330 * scale,
                        height: 74 * scale,
                        borderRadius: 37 * scale,
                      },
                    ]}>
                    <Text
                      style={[styles.pointsPillText, { fontSize: 36 * scale }]}>
                      {redeemPointsLabel}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.scanSubtitle,
                      {
                        fontSize: 14 * scale,
                        marginTop: 34 * scale,
                        paddingHorizontal: 8 * scale,
                      },
                    ]}>
                    Scan in the Best Bond app to redeem
                  </Text>
                </View>
              </View>
            </View>

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
        </View>
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

  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: adminUi.white,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  couponLeftTop: {
    alignItems: 'center',
    width: '100%',
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
    overflow: 'hidden',
    position: 'relative',
  },
  brandBadge: {
    position: 'absolute',
    alignItems: 'flex-end',
    zIndex: 5,
  },
  pdfFrontContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  pointsPill: {
    backgroundColor: adminUi.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsPillText: {
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
  },
  scanSubtitle: {
    fontWeight: '600',
    color: adminUi.white,
    textAlign: 'center',
  },
});
