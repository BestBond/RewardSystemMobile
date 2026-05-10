import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  createDealerStoreRedemption,
  searchAdminDealers,
  type DealerSearchItem,
} from '../../api/adminRedemptions';
import { isApiError, userFacingApiMessage } from '../../api/client';
import { listRewards, type RewardDto } from '../../api/rewards';
import type { AdminApprovalsStackParamList } from '../../navigation/types';
import { adminUi } from '../../theme/adminUi';
import { AdminHeader } from './components/AdminHeader';

type Nav = NativeStackNavigationProp<
  AdminApprovalsStackParamList,
  'AdminRecordDealerRedemption'
>;

export function AdminRecordDealerRedemptionScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<Nav>();
  const [dealerQuery, setDealerQuery] = useState('');
  const [dealers, setDealers] = useState<DealerSearchItem[]>([]);
  const [dealerLoading, setDealerLoading] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<DealerSearchItem | null>(
    null,
  );
  const [rewards, setRewards] = useState<RewardDto[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<RewardDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRewardsLoading(true);
    listRewards()
      .then((r) => {
        if (!cancelled) setRewards(r.filter((x) => x.isActive));
      })
      .catch(() => {
        if (!cancelled) setRewards([]);
      })
      .finally(() => {
        if (!cancelled) setRewardsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = dealerQuery.trim();
      if (q.length < 2) {
        setDealers([]);
        setDealerLoading(false);
        return;
      }
      setDealerLoading(true);
      searchAdminDealers({ q, take: 30, offset: 0 })
        .then((res) => {
          setDealers(res.items);
        })
        .catch(() => {
          setDealers([]);
        })
        .finally(() => {
          setDealerLoading(false);
        });
    }, 320);
    return () => clearTimeout(t);
  }, [dealerQuery]);

  /** Affordable rewards first (by cost), then the rest — avoids an all-grey list. */
  const displayRewards = useMemo(() => {
    if (!selectedDealer) {
      return [...rewards].sort((a, b) => a.pointsCost - b.pointsCost);
    }
    const bal = selectedDealer.loyaltyPoints;
    const ok = rewards.filter((r) => r.pointsCost <= bal);
    const no = rewards.filter((r) => r.pointsCost > bal);
    ok.sort((a, b) => a.pointsCost - b.pointsCost);
    no.sort((a, b) => a.pointsCost - b.pointsCost);
    return [...ok, ...no];
  }, [rewards, selectedDealer]);

  const hasAffordableReward = useMemo(() => {
    if (!selectedDealer) return true;
    return rewards.some((r) => r.pointsCost <= selectedDealer.loyaltyPoints);
  }, [rewards, selectedDealer]);

  const onSubmit = useCallback(async () => {
    setError(null);
    setDoneMsg(null);
    if (!selectedDealer || !selectedReward) {
      setError('Select a dealer and a reward.');
      return;
    }
    if (selectedDealer.loyaltyPoints < selectedReward.pointsCost) {
      setError('Dealer does not have enough points for this reward.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createDealerStoreRedemption({
        dealerUserId: selectedDealer.id,
        rewardId: selectedReward.id,
      });
      setDoneMsg(
        `Recorded. Tracking ${res.trackingId}. It is now in the approval queue.`,
      );
      setSelectedDealer(null);
      setSelectedReward(null);
      setDealerQuery('');
      setDealers([]);
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not record redemption.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedDealer, selectedReward]);

  const insufficientPoints =
    !!selectedDealer &&
    !!selectedReward &&
    selectedDealer.loyaltyPoints < selectedReward.pointsCost;

  const canSubmit =
    !!selectedDealer &&
    !!selectedReward &&
    !insufficientPoints &&
    !submitting;

  return (
    <View style={[styles.root, { paddingBottom: tabBarHeight }]}>
      <AdminHeader
        title="Record dealer redemption"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 28 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>
          Search for a dealer account, choose the reward they are redeeming at
          the counter, and submit. Points are debited immediately; the request
          joins the dealer approval queue.
        </Text>

        {error ? <Text style={styles.err}>{error}</Text> : null}
        {doneMsg ? <Text style={styles.ok}>{doneMsg}</Text> : null}

        <Text style={styles.section}>Dealer</Text>
        <TextInput
          style={styles.input}
          placeholder="Name, email, or phone (min 2 characters)"
          placeholderTextColor={adminUi.labelMuted}
          value={dealerQuery}
          onChangeText={setDealerQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {dealerLoading ? (
          <ActivityIndicator color={adminUi.accentOrange} style={styles.mini} />
        ) : null}
        {dealers.map((item) => {
          const on = selectedDealer?.id === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.row, on && styles.rowOn]}
              onPress={() => {
                setSelectedDealer(item);
                setSelectedReward((prev) => {
                  if (!prev) return null;
                  if (prev.pointsCost > item.loyaltyPoints) return null;
                  return prev;
                });
              }}>
              <Text style={styles.rowTitle}>{item.fullName}</Text>
              <Text style={styles.rowSub}>
                {item.email}
                {item.phone ? ` · ${item.phone}` : ''}
              </Text>
              <Text style={styles.rowPts}>
                {item.loyaltyPoints.toLocaleString()} pts
              </Text>
            </Pressable>
          );
        })}

        <Text style={styles.section}>Reward</Text>
        {selectedDealer ? (
          <Text style={styles.balanceHint}>
            {selectedDealer.fullName ?? 'Dealer'} has{' '}
            {selectedDealer.loyaltyPoints.toLocaleString()} pts. Only rewards at
            or below that can be submitted.
          </Text>
        ) : null}
        {selectedDealer && !rewardsLoading && !hasAffordableReward ? (
          <Text style={styles.noAffordableBanner}>
            No catalog reward fits this balance yet. Choose a dealer with more
            points, or add points to this dealer first.
          </Text>
        ) : null}
        {rewardsLoading ? (
          <ActivityIndicator color={adminUi.accentOrange} />
        ) : (
          displayRewards.map((r) => {
            const on = selectedReward?.id === r.id;
            const unaffordable =
              !!selectedDealer &&
              r.pointsCost > selectedDealer.loyaltyPoints;
            const short =
              unaffordable && selectedDealer
                ? r.pointsCost - selectedDealer.loyaltyPoints
                : 0;
            return (
              <Pressable
                key={r.id}
                style={[
                  styles.row,
                  unaffordable && styles.rowUnaffordable,
                  on && styles.rowOn,
                ]}
                onPress={() => setSelectedReward(r)}>
                <Text style={styles.rowTitle}>{r.title}</Text>
                <Text style={styles.rowPts}>
                  {r.pointsCost.toLocaleString()} pts
                </Text>
                {unaffordable ? (
                  <Text style={styles.rowShortfall}>
                    {short.toLocaleString()} pts over balance — cannot submit
                  </Text>
                ) : null}
              </Pressable>
            );
          })
        )}

        {insufficientPoints && selectedDealer && selectedReward ? (
          <Text style={styles.insufficientBanner}>
            {selectedDealer.fullName ?? 'This dealer'} has{' '}
            {selectedDealer.loyaltyPoints.toLocaleString()} pts, but{' '}
            {selectedReward.title} costs{' '}
            {selectedReward.pointsCost.toLocaleString()} pts. Pick a lower-cost
            reward or a dealer with enough balance.
          </Text>
        ) : null}

        <Pressable
          style={[
            styles.cta,
            !canSubmit && styles.ctaDisabled,
          ]}
          disabled={!canSubmit}
          onPress={() => {
            onSubmit().catch(() => {});
          }}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaTxt}>Submit store redemption</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: adminUi.labelMuted,
    marginBottom: 16,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: adminUi.sectionTitle,
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    borderRadius: adminUi.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: adminUi.sectionTitle,
    backgroundColor: adminUi.cardBg,
  },
  mini: { marginVertical: 8 },
  row: {
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    borderRadius: adminUi.radiusMd,
    padding: 12,
    marginBottom: 8,
    backgroundColor: adminUi.cardBg,
  },
  rowOn: {
    borderColor: adminUi.accentOrange,
    backgroundColor: 'rgba(253, 186, 116, 0.12)',
  },
  rowUnaffordable: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  balanceHint: {
    fontSize: 13,
    lineHeight: 18,
    color: adminUi.labelMuted,
    marginBottom: 10,
    fontWeight: '600',
  },
  noAffordableBanner: {
    marginBottom: 12,
    padding: 12,
    borderRadius: adminUi.radiusMd,
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.45)',
    color: '#9A3412',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  rowShortfall: {
    fontSize: 12,
    fontWeight: '700',
    color: adminUi.suspendAccent,
    marginTop: 6,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: adminUi.sectionTitle },
  rowSub: { fontSize: 13, color: adminUi.labelMuted, marginTop: 4 },
  rowPts: {
    fontSize: 13,
    fontWeight: '600',
    color: adminUi.accentOrange,
    marginTop: 6,
  },
  err: { color: adminUi.suspendAccent, marginBottom: 8, fontSize: 14 },
  ok: { color: adminUi.successGreen, marginBottom: 8, fontSize: 14 },
  insufficientBanner: {
    marginTop: 16,
    padding: 12,
    borderRadius: adminUi.radiusMd,
    backgroundColor: 'rgba(209, 67, 67, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(209, 67, 67, 0.35)',
    color: adminUi.suspendAccent,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  cta: {
    marginTop: 24,
    backgroundColor: adminUi.accentOrange,
    borderRadius: adminUi.radiusMd,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
