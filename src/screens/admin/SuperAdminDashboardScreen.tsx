import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BasketSmall, CartActive, TxTicketOrange } from '../../assets/svgs';
import {
  getAdminDashboard,
  type AdminDashboardResponse,
} from '../../api/admin';
import { getAuthMe, getMyProfile } from '../../api/users';
import { isApiError, userFacingApiMessage } from '../../api/client';
import type { AdminTabParamList } from '../../navigation/types';
import { adminUi } from '../../theme/adminUi';
import { isOperationalOnly } from './adminRole';

type AdminHomeNav = BottomTabNavigationProp<AdminTabParamList, 'AdminHome'>;

function greetingLabel(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

function displayName(fullName: string | null, email: string): string {
  const t = fullName?.trim();
  if (t) return t.split(/\s+/)[0] ?? t;
  const e = email?.split('@')[0];
  return e || 'Admin';
}

function formatInt(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
  );
}

function TrendFoot({ percent }: { percent: number }) {
  const positive = percent >= 0;
  return (
    <View style={styles.trendFoot}>
      <Text
        style={[
          styles.trendArrowSmall,
          { color: positive ? adminUi.successGreen : adminUi.pointsDebit },
        ]}>
        {positive ? '\u2197' : '\u2198'}
      </Text>
      <Text
        style={[
          styles.trendFootText,
          { color: positive ? adminUi.successGreen : adminUi.pointsDebit },
        ]}>
        {positive ? '+' : ''}
        {percent}% increase in last week
      </Text>
    </View>
  );
}

function MiniBars({ values }: { values: number[] }) {
  const palette = ['#D4C4B0', '#C4A882', '#B8956A', '#A67C52', '#8B5E3C'];
  const max = Math.max(...values, 1);
  return (
    <View style={styles.barsRow}>
      {values.map((v, i) => (
        <View key={i} style={styles.barCell}>
          <View
            style={[
              styles.barFill,
              {
                height: Math.max(8, (v / max) * 48),
                backgroundColor: palette[i % palette.length],
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

function MetricIconWrap({ children }: { children: React.ReactNode }) {
  return <View style={styles.metricIconWrap}>{children}</View>;
}

/** Figma “layers” glyph for Total Points Issued */
function LayersStackIcon() {
  const c = adminUi.accentOrange;
  return (
    <View style={styles.layersGlyph}>
      <View style={[styles.layersBack, { borderColor: c }]} />
      <View style={[styles.layersFront, { borderColor: c }]} />
    </View>
  );
}

export function SuperAdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AdminHomeNav>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headlineName, setHeadlineName] = useState('Admin');
  const [dash, setDash] = useState<AdminDashboardResponse | null>(null);
  const [operationalOnly, setOperationalOnly] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [profile, d] = await Promise.all([
        getMyProfile(),
        getAdminDashboard(),
      ]);
      setHeadlineName(displayName(profile.fullName, profile.email));
      setDash(d);
      const me = await getAuthMe().catch(() => ({ user: null }));
      setOperationalOnly(isOperationalOnly(me.user ?? null));
    } catch (e) {
      if (isApiError(e)) {
        if (e.status === 403 || e.status === 401) {
          setError('You do not have access to the admin dashboard.');
        } else if (e.status === 0) {
          setError(e.message);
        } else {
          setError(userFacingApiMessage(e.message));
        }
      } else {
        setError('Could not load dashboard.');
      }
      setDash(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().catch(() => {});
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load().catch(() => {});
  };

  const openApprovals = () => {
    navigation.navigate('AdminApprovals', { screen: 'AdminApprovalsList' });
  };

  const openOpsApprovals = () => {
    navigation.navigate('AdminUsers', { screen: 'AdminOpsApprovals' });
  };

  const activityPlus =
    dash && dash.couponsScannedToday.last5MinutesCount > 0
      ? `+${Math.min(dash.couponsScannedToday.last5MinutesCount, 99)}`
      : '+0';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 28 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        <Text style={styles.greetSmall}>{greetingLabel()}</Text>
        <Text style={styles.greetName}>{headlineName}</Text>

        {loading && !dash ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={adminUi.accentOrange} />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => {
                load().catch(() => {});
              }}
              accessibilityRole="button"
              accessibilityLabel="Retry loading dashboard"
              hitSlop={12}>
              <Text style={styles.retry}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {dash ? (
          <>
            <View style={[styles.actionCard, adminUi.shadowActionCard]}>
              <View style={styles.actionGlow} pointerEvents="none" />
              <Text style={styles.actionQueueLabel}>ACTION QUEUE</Text>
              <Text style={styles.actionTitle}>
                {operationalOnly ? 'Dispatch Queue' : 'Pending Approvals'}
              </Text>
              <Text style={styles.actionSub}>
                {operationalOnly
                  ? 'Coordinate packing and delivery for approved rewards.'
                  : 'Requires validation for high-value reward redemptions'}
              </Text>
              <View style={styles.actionMetricRow}>
                <Text style={styles.actionCount}>
                  {formatInt(dash.pendingApprovalsCount)}
                </Text>
                <Text style={styles.actionRequests}>requests</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.actionCta,
                  pressed && styles.actionCtaPressed,
                ]}
                onPress={openApprovals}
                accessibilityRole="button"
                accessibilityLabel="Open request queue">
                <Text style={styles.actionCtaText}>
                  {operationalOnly ? 'Open Dispatch Queue' : 'Request Queue'}
                </Text>
                <Text style={styles.actionCtaArrow}>{'\u2192'}</Text>
              </Pressable>
            </View>

            {!operationalOnly ? (
              <View style={[styles.opsCard, adminUi.shadowCard]}>
                <Text style={styles.opsLabel}>OPS ADMIN ONBOARDING</Text>
                <Text style={styles.opsTitle}>Approval Requests</Text>
                <Text style={styles.opsSub}>
                  Review Ops Admin signup requests and approve access.
                </Text>
                <View style={styles.opsMetricRow}>
                  <Text style={styles.opsCount}>
                    {formatInt(dash.pendingOpsAdminApprovalsCount)}
                  </Text>
                  <Text style={styles.opsRequests}>requests</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.opsCta,
                    pressed && { opacity: 0.92 },
                  ]}
                  onPress={openOpsApprovals}
                  accessibilityRole="button"
                  accessibilityLabel="Open Ops Admin approval requests">
                  <Text style={styles.opsCtaText}>Open Approvals</Text>
                  <Text style={styles.opsCtaArrow}>{'\u2192'}</Text>
                </Pressable>
              </View>
            ) : null}

            <Text style={styles.blockTitle}>Key Metrics</Text>

            <View style={[styles.metricCard, adminUi.shadowCard]}>
              <View style={styles.metricTopRow}>
                <MetricIconWrap>
                  <LayersStackIcon />
                </MetricIconWrap>
              </View>
              <Text style={styles.metricLabel}>TOTAL POINTS ISSUED</Text>
              <Text style={styles.metricValue}>
                {formatInt(dash.pointsIssued.totalLast7Days)}
              </Text>
              <TrendFoot percent={dash.pointsIssued.percentVsPriorWeek} />
            </View>

            <View style={[styles.metricCard, styles.metricGap, adminUi.shadowCard]}>
              <View style={styles.metricTopRow}>
                <MetricIconWrap>
                  <CartActive width={22} height={22} />
                </MetricIconWrap>
              </View>
              <Text style={styles.metricLabel}>POINTS REDEEMED</Text>
              <Text style={styles.metricValue}>
                {formatInt(dash.pointsRedeemed.totalLast7Days)}
              </Text>
              <TrendFoot percent={dash.pointsRedeemed.percentVsPriorWeek} />
            </View>

            <Text style={styles.blockTitle}>User Engagement Metrics</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.engageScroll}>
              <View style={[styles.engageCard, adminUi.shadowCard]}>
                <View style={styles.engageCardHead}>
                  <BasketSmall width={22} height={22} />
                  <Text style={styles.badgePill}>REAL-TIME</Text>
                </View>
                <Text style={styles.engageLabel}>TOTAL ACTIVE USERS</Text>
                <Text style={styles.engageValue}>
                  {formatInt(dash.activeUsers.countLast7Days)}
                </Text>
                <MiniBars values={dash.activeUsers.dailyActiveUsersLast5Days} />
              </View>
              <View style={[styles.engageCard, styles.engageCardLast, adminUi.shadowCard]}>
                <View style={styles.engageCardHead}>
                  <TxTicketOrange width={22} height={22} />
                  <Text style={styles.badgePill}>DAILY TOTAL</Text>
                </View>
                <Text style={styles.engageLabel}>COUPONS SCANNED TODAY</Text>
                <Text style={styles.engageValue}>
                  {formatInt(dash.couponsScannedToday.count)}
                </Text>
                <View style={styles.activityRow}>
                  <View style={styles.avatarCluster}>
                    <View style={[styles.avatarDot, styles.avatarDotFirst]} />
                    <View style={[styles.avatarDot, styles.avatarDotOverlap]} />
                    <View style={[styles.avatarDot, styles.avatarDotOverlap]} />
                  </View>
                  <Text style={styles.activityPlus}>{activityPlus}</Text>
                  <Text style={styles.activityLabel}>Last 5 min activity</Text>
                  <Text style={styles.activityArrow}>{'\u2197'}</Text>
                </View>
              </View>
            </ScrollView>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  scroll: { paddingHorizontal: 20, paddingTop: 10 },
  greetSmall: {
    fontSize: 15,
    color: adminUi.labelMuted,
    fontWeight: '500',
  },
  greetName: {
    fontSize: 28,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginTop: 4,
    marginBottom: 20,
  },
  loaderWrap: { paddingVertical: 24, alignItems: 'center' },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: adminUi.radiusMd,
    marginBottom: 16,
  },
  errorText: { color: adminUi.pointsDebit, fontSize: 14, marginBottom: 8 },
  retry: {
    color: adminUi.navyAlt,
    fontWeight: '700',
    fontSize: 14,
  },
  actionCard: {
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusHeroCard,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  actionGlow: {
    position: 'absolute',
    top: -56,
    right: -48,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(239, 132, 65, 0.18)',
  },
  actionQueueLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: adminUi.labelMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: adminUi.sectionTitle,
  },
  actionSub: {
    fontSize: 13,
    color: adminUi.labelMuted,
    marginTop: 6,
    lineHeight: 18,
  },
  actionMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 14,
    gap: 8,
  },
  actionCount: {
    fontSize: 40,
    fontWeight: '800',
    color: adminUi.sectionTitle,
  },
  actionRequests: {
    fontSize: 16,
    fontWeight: '600',
    color: adminUi.labelMuted,
  },
  actionCta: {
    marginTop: 18,
    backgroundColor: adminUi.accentOrange,
    borderRadius: adminUi.radiusPill,
    paddingVertical: 15,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminUi.shadowCta,
  },
  actionCtaPressed: { opacity: 0.92 },
  actionCtaText: {
    color: adminUi.white,
    fontSize: 16,
    fontWeight: '800',
  },
  actionCtaArrow: {
    color: adminUi.white,
    fontSize: 18,
    fontWeight: '700',
  },
  opsCard: {
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusHeroCard,
    padding: 20,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  opsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: adminUi.labelMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  opsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: adminUi.sectionTitle,
  },
  opsSub: {
    fontSize: 13,
    color: adminUi.labelMuted,
    marginTop: 6,
    lineHeight: 18,
  },
  opsMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    gap: 8,
  },
  opsCount: {
    fontSize: 34,
    fontWeight: '900',
    color: adminUi.sectionTitle,
  },
  opsRequests: {
    fontSize: 15,
    fontWeight: '600',
    color: adminUi.labelMuted,
  },
  opsCta: {
    marginTop: 14,
    backgroundColor: '#111827',
    borderRadius: adminUi.radiusPill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  opsCtaText: {
    color: adminUi.white,
    fontSize: 15,
    fontWeight: '900',
  },
  opsCtaArrow: {
    color: adminUi.white,
    fontSize: 18,
    fontWeight: '700',
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginBottom: 14,
  },
  metricCard: {
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 18,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  metricGap: { marginTop: 12 },
  metricTopRow: { marginBottom: 10 },
  metricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 132, 65, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layersGlyph: {
    width: 22,
    height: 22,
    justifyContent: 'center',
  },
  layersBack: {
    height: 9,
    marginBottom: -4,
    marginHorizontal: 3,
    borderWidth: 2,
    borderRadius: 3,
    opacity: 0.5,
  },
  layersFront: {
    height: 9,
    borderWidth: 2,
    borderRadius: 3,
    backgroundColor: adminUi.white,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: adminUi.labelMuted,
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginTop: 6,
  },
  trendFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  trendArrowSmall: {
    fontSize: 14,
    fontWeight: '700',
  },
  trendFootText: {
    fontSize: 13,
    fontWeight: '600',
  },
  engageScroll: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 8,
  },
  engageCard: {
    width: 276,
    backgroundColor: adminUi.engageCardBg,
    borderRadius: adminUi.radiusLg,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  engageCardLast: { marginRight: 4 },
  engageCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgePill: {
    fontSize: 10,
    fontWeight: '800',
    color: adminUi.labelMuted,
    backgroundColor: adminUi.engageBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  engageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: adminUi.labelMuted,
    letterSpacing: 0.5,
  },
  engageValue: {
    fontSize: 26,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginTop: 6,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 14,
    height: 52,
    paddingHorizontal: 2,
  },
  barCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 11,
    borderRadius: 5,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    flexWrap: 'wrap',
    gap: 6,
  },
  avatarCluster: { flexDirection: 'row', alignItems: 'center' },
  avatarDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: adminUi.white,
  },
  avatarDotFirst: { marginLeft: 0 },
  avatarDotOverlap: { marginLeft: -8 },
  activityPlus: {
    fontSize: 13,
    fontWeight: '800',
    color: adminUi.sectionTitle,
  },
  activityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: adminUi.labelMuted,
    flex: 1,
  },
  activityArrow: {
    fontSize: 16,
    color: adminUi.accentOrange,
    fontWeight: '800',
  },
});
