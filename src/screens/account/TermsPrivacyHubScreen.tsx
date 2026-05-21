import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient as SvgLinear,
  Rect,
  Stop,
} from 'react-native-svg';
import {
  BackArrowLeft,
  ChevronRight,
  IconReceiptDocOrange,
  IconShieldOrange,
} from '../../assets/svgs';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { figma } from '../../theme/figmaTokens';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'TermsPrivacyHub'>;

export function TermsPrivacyHubScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinear id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="rgba(249,133,53,1)" stopOpacity="1" />
            <Stop offset="1" stopColor="rgb(255,248,241)" stopOpacity="1" />
          </SvgLinear>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrad)" />
      </Svg>

      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>        
        <Pressable
          style={styles.backBtn}
          hitSlop={12}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <BackArrowLeft width={24} height={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms & Privacy Policies</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}>
          <Text style={styles.heroTitle}>Our Reward App Policies</Text>


        <View style={styles.cardList}>
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() =>
              navigation.navigate('LegalDocument', { document: 'terms' })
            }>
            <View style={styles.iconWrapper}>
              <IconReceiptDocOrange width={24} height={24} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Terms & Conditions</Text>
              <Text style={styles.cardCaption}>Read our user agreement.</Text>
            </View>
            <ChevronRight strokeColor="#64748B" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() =>
              navigation.navigate('LegalDocument', { document: 'privacy' })
            }>
            <View style={styles.iconWrapper}>
              <IconShieldOrange width={24} height={24} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Privacy Policy</Text>
              <Text style={styles.cardCaption}>See how we protect your data.</Text>
            </View>
            <ChevronRight strokeColor="#64748B" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 0,
    marginTop:10,
  },
  backBtn: { width: 40, justifyContent: 'center' },
  headerTitle: {
    marginLeft: 0,
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
    flex: 1,
  },
  scroll: {
    paddingHorizontal: figma.spaceGutter,
    paddingTop: 16,
  },

  heroTitle: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.white,
    opacity:0.6,
    marginBottom: 58,
    lineHeight: 70,
    paddingHorizontal:10,
    marginTop:20,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  cardList: {
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    ...figma.shadowSoft,
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFF2E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: figma.textBody,
    marginBottom: 4,
  },
  cardCaption: {
    fontSize: 13,
    color: figma.textMuted,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.9,
  },
});
