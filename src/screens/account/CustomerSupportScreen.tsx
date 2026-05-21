import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { colors } from '../../theme/colors';
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
import Svg, {
  Defs,
  LinearGradient as SvgLinear,
  Rect,
  Stop,
} from 'react-native-svg';
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
import { goBackInApp } from '../../navigation/goBackInApp';
import { resolveSupportFromApi, SUPPORT } from './accountFigmaData';
import { openWhatsAppChat } from '../../utils/whatsappLink';


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
        const r = resolveSupportFromApi(s);
        setPhone(r.phone);
        setEmail(r.email);
        setWhatsapp(r.whatsapp);

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
    void openWhatsAppChat(whatsapp ?? '');
  };


  return (
    <View style={[styles.root, { paddingTop: insets.top }]}> 
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinear id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F89E30" stopOpacity="1" />
            <Stop offset="0.55" stopColor="#FCA56E" stopOpacity="1" />
            <Stop offset="1" stopColor="#FFE9D9" stopOpacity="1" />
          </SvgLinear>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrad)" />
      </Svg>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          hitSlop={12}
          onPress={() => goBackInApp(navigation)}
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
              <Text style={styles.heroText}>help you.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconCircle}>
                <PhoneHandsetWhite width={22} height={22} />
              </View>
              <Text style={styles.cardTag}>{SUPPORT.callTag}</Text>
            </View>
            <Text style={styles.cardTitle}>{SUPPORT.callTitle}</Text>
            <Text style={styles.cardBody}>{SUPPORT.callBody}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.callCtaBtn,
                  pressed && styles.pressed,
                ]}
                onPress={onCall}
                accessibilityRole="button"
                accessibilityLabel="Call support"
                disabled={!phone}
              >
                <Text style={styles.callCtaText}>{SUPPORT.callCta}</Text>
                <ArrowRightOrange width={18} height={18} />
              </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTopRow}>
            <View style={[styles.cardIconCircle, styles.whatsappCircle]}>
              <ChatBubbleWhite width={22} height={22} />
            </View>
            <Text style={styles.cardTag}>{SUPPORT.waTag}</Text>
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
            <Text style={styles.emailMuted}>Reach us at </Text>
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
  root: { flex: 1, backgroundColor: '#F89E30' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    minHeight: 60,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    marginLeft: 3,
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroWrap: {
    marginBottom: 46,
  },
  heroText: {
    fontSize: 58,
    fontWeight: '900',
    opacity: 0.6,
    lineHeight: 66,
    color: colors.white
  },
 
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    padding: 24,
    marginBottom: 20,
    ...cardShadow,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  cardIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#a5a5a5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1C1E',
    marginBottom: 10,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 24,
    color: '#6B7280',
    marginBottom: 20,
  },
  cardSmall: {
    backgroundColor: 'rgba(255,255,255,0.44)',
    borderRadius: 30,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  callBtn: {
    borderColor: '#F0F1F4',
    marginTop: 2,
    backgroundColor: colors.white,
  },
  emailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  emailMuted: {
    fontSize: 16,
    color: '#1A1C1E',
  },
  emailLink: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryOrange,
    textDecorationLine: 'underline',
  },
  callCtaBtn: {
    backgroundColor: colors.white,
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 224, 224, 0.56)',
    gap: 10,
  },
  callCtaText: {
    color: colors.primaryOrange,
    fontSize: 16,
    fontWeight: '700',
  },
    pressed: {
      opacity: 0.9,
    },
      whatsappCircle: {
    backgroundColor: colors.pointsGreen,
  },

});
