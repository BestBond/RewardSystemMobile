import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import { AppChip } from '../../components/ui';
import { listMyRedemptions } from '../../api/rewards';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { MENU_SUBTITLES } from './accountFigmaData';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'GiftDeliveryStatus'>;

const bg = '#F5F6F8';
const text = '#1A1C1E';
const muted = '#707070';

function statusLabel(raw: string): string {
  return raw
    .split('_')
    .map(w => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

function chipVariantFromStatus(status: string): 'success' | 'danger' | 'muted' {
  const normalized = status.toLowerCase();
  if (normalized.includes('delivered') || normalized.includes('shipped')) {
    return 'success';
  }
  if (normalized.includes('cancel')) {
    return 'danger';
  }
  return 'muted';
}

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

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await listMyRedemptions();
      setItems(
        list.map(r => ({
          id: r.id,
          title: r.reward.title ?? 'Reward',
          sub: `Tracking ID #${r.trackingId} · ${r.etaText ?? 'ETA TBD'}`,
          status: statusLabel(r.status),
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load]),
  );

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
        <Text style={styles.headerTitle}>Gift Delivery Status</Text>
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
          <Text style={styles.intro}>{MENU_SUBTITLES.gift}</Text>
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
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.sub}</Text>
              </View>
              <View style={styles.cardRight}>
                <AppChip
                  text={item.status}
                  variant={chipVariantFromStatus(item.status)}
                />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    minHeight: 48,
  },
  backBtn: {
    width: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    marginLeft: 4,
    fontSize: 18,
    fontWeight: '700',
    color: text,
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  intro: {
    fontSize: 14,
    color: muted,
    marginBottom: 16,
  },
  err: { color: '#B91C1C', marginBottom: 12 },
  empty: { color: muted, textAlign: 'center', marginTop: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 12,
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
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: text,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 12,
    color: muted,
  },
  cardRight: { alignItems: 'flex-end' },
});
