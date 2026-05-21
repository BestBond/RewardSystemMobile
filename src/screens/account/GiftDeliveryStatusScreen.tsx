import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackArrowLeft, IconGiftOrange } from '../../assets/svgs';
import { AccountGradientBackground } from '../../components/account/AccountGradientBackground';
import { listMyRedemptions } from '../../api/rewards';
import { getMyProfile } from '../../api/users';
import type { ProfileStackParamList } from '../../navigation/types';
import { goBackInApp } from '../../navigation/goBackInApp';
import { colors } from '../../theme/colors';
import {
  consumerRedemptionStatusPresentation,
  redemptionIsDealerPickup,
  redemptionListSubline,
} from '../../utils/redemptionUi';
import { MENU_SUBTITLES } from './accountFigmaData';
import { useRefreshOnFocusAndForeground } from '../../hooks/useRefreshOnFocusAndForeground';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'GiftDeliveryStatus'>;

const text = '#1A2B48';
const navy = colors.navyAlt;
const subtitleOnOrange = 'rgba(255, 255, 255, 0.88)';

export function GiftDeliveryStatusScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<
    {
      id: string;
      title: string;
      sub: string;
      status: string;
    }[]
  >([]);
  const [dealerAccount, setDealerAccount] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [list, profile] = await Promise.all([
        listMyRedemptions(),
        getMyProfile().catch(() => null),
      ]);
      const isDealerUser = (profile?.roles ?? []).some(
        role => String(role).toUpperCase() === 'DEALER',
      );
      setDealerAccount(isDealerUser);
      setItems(
        list.map(r => {
          const inStore = redemptionIsDealerPickup(r);
          const pres = consumerRedemptionStatusPresentation(r.status, inStore);
          return {
            id: r.id,
            title: r.reward.title ?? 'Reward',
            sub: redemptionListSubline(r),
            status: pres.label,
          };
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useRefreshOnFocusAndForeground(() => load());

  const listTitle = dealerAccount
    ? 'In-store reward status'
    : 'Gift delivery status';

  return (
    <AccountGradientBackground style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.orangeZone, { paddingTop: insets.top + 6 }]}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            hitSlop={12}
            onPress={() => goBackInApp(navigation)}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <BackArrowLeft width={24} height={24} />
          </Pressable>
          <Text style={styles.headerTitle}>{listTitle}</Text>
        </View>
        <Text style={styles.subtitle}>
          {dealerAccount ? MENU_SUBTITLES.giftDealer : MENU_SUBTITLES.gift}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primaryOrange} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}>
          {error ? <Text style={styles.err}>{error}</Text> : null}
          {items.length === 0 && !error ? (
            <Text style={styles.empty}>No reward orders yet.</Text>
          ) : null}
          {items.map(item => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() =>
                navigation.navigate('DeliveryStatus', { redemptionId: item.id })
              }>
              <View style={styles.iconWrap}>
                <IconGiftOrange width={24} height={24} />
              </View>
              <View style={styles.cardMid}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.cardSub}>{item.sub}</Text>
              </View>
              <Text style={styles.cardStatus}>{item.status}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </AccountGradientBackground>
  );
}

const cardShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      }
    : { elevation: 2 };

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.9 },
  orangeZone: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backBtn: {
    width: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    marginLeft: 2,
    fontSize: 20,
    fontWeight: '800',
    color: navy,
    flex: 1,
  },
  subtitle: {
    marginTop: 6,
    marginLeft: 42,
    fontSize: 14,
    lineHeight: 20,
    color: subtitleOnOrange,
    fontWeight: '500',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  err: { color: '#B91C1C', marginBottom: 12, fontWeight: '600' },
  empty: {
    color: '#707070',
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '500',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EEF0F4',
    ...cardShadow,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF4E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMid: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: text,
  },
  cardSub: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: '#707070',
    fontWeight: '500',
  },
  cardStatus: {
    fontSize: 13,
    fontWeight: '800',
    color: text,
    textAlign: 'right',
    maxWidth: 108,
    lineHeight: 18,
  },
});
