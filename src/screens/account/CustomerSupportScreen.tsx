import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRightOrange,
  BackArrowLeft,
  ChatBubbleWhite,
  PhoneHandsetWhite,
} from '../../assets/svgs';
import { AppButton } from '../../components/ui';
import { getSupportInfo } from '../../api/support';
import type { ProfileStackParamList } from '../../navigation/types';
import { SUPPORT } from './accountFigmaData';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'CustomerSupport'>;

const text = '#1A1C1E';
const muted = '#74777F';
const hero = '#DDE2EE';
const orange = '#E87033';
const underlineBlue = '#3B82F6';

export function CustomerSupportScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState<string | null>(SUPPORT.fallbackPhone);
  const [email, setEmail] = useState<string | null>(SUPPORT.email);
  const [whatsapp, setWhatsapp] = useState<string | null>(SUPPORT.fallbackWhatsapp);

  useEffect(() => {
    let cancelled = false;
    getSupportInfo()
      .then(s => {
        if (cancelled) return;
        if (s.phone != null) setPhone(s.phone);
        if (s.email != null) setEmail(s.email);
        if (s.whatsapp != null) setWhatsapp(s.whatsapp);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onCall = () => {
    const p = phone?.replace(/\s/g, '') ?? '';
    if (!p) return;
    Linking.openURL(`tel:${p}`).catch(() => {});
  };

  const onWhatsApp = () => {
    const w = whatsapp?.replace(/\D/g, '') ?? '';
    if (!w) return;
    Linking.openURL(`https://wa.me/${w}`).catch(() => {});
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
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
        <Text style={styles.headerTitle}>Customer Support</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={orange} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <Text style={styles.heroText}>We're here to</Text>
            <View style={styles.heroLineWrap}>
              <Text style={styles.heroText}>help you.</Text>
              <View style={styles.heroUnderline} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTag}>{SUPPORT.callTag}</Text>
            <View style={styles.cardIconCircle}>
              <PhoneHandsetWhite width={22} height={22} />
            </View>
            <Text style={styles.cardTitle}>{SUPPORT.callTitle}</Text>
            <Text style={styles.cardBody}>{SUPPORT.callBody}</Text>
            <AppButton
              text="Call Now"
              variant="neutral"
              style={styles.callBtn}
              leftIcon={<ArrowRightOrange width={18} height={18} />}
              onPress={onCall}
              disabled={!phone}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTag}>{SUPPORT.waTag}</Text>
            <View style={[styles.cardIconCircle, styles.whatsappCircle]}>
              <ChatBubbleWhite width={22} height={22} />
            </View>
            <Text style={styles.cardTitle}>{SUPPORT.waTitle}</Text>
            <Text style={styles.cardBody}>{SUPPORT.waBody}</Text>
            <AppButton
              text="Chat on WhatsApp"
              variant="neutral"
              style={styles.callBtn}
              leftIcon={<ArrowRightOrange width={18} height={18} />}
              onPress={onWhatsApp}
              disabled={!whatsapp}
            />
          </View>

          <View style={styles.emailRow}>
            <Text style={styles.emailMuted}>Reach Us at </Text>
            <Pressable
              onPress={() =>
                email && Linking.openURL(`mailto:${email}`).catch(() => {})
              }>
              <Text style={styles.emailLink}>{email ?? '—'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const cardShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      }
    : { elevation: 4 };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  hero: {
    display: 'none',
  },
  heroWrap: { marginBottom: 26, marginTop: 18 },
  heroText: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '800',
    color: hero,
    letterSpacing: -0.8,
  },
  heroLineWrap: { position: 'relative', alignSelf: 'flex-start' },
  heroUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: underlineBlue,
    bottom: 8,
    borderRadius: 2,
    opacity: 0.95,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F1F4',
    position: 'relative',
    ...cardShadow,
  },
  cardTag: {
    position: 'absolute',
    top: 18,
    right: 18,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#9CA3AF',
  },
  cardIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1A1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: text,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: muted,
    marginBottom: 18,
  },
  whatsappCircle: {
    backgroundColor: '#065F46',
  },
  callBtn: {
    borderColor: '#EEF0F4',
    marginTop: 2,
  },
  emailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  emailMuted: {
    fontSize: 14,
    color: muted,
  },
  emailLink: {
    fontSize: 14,
    fontWeight: '700',
    color: orange,
    textDecorationLine: 'underline',
  },
});
