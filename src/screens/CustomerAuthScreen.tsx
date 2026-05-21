import React, { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '../navigation/types';
import { AppButton, AppFieldLabel, AppPhoneInput, AppPillInput } from '../components/ui';
import { SixDigitInput } from '../components/SixDigitInput';
import { colors } from '../theme/colors';
import { figma } from '../theme/figmaTokens';
import { isApiError, userFacingApiMessage } from '../api/client';
import {
  loginCustomerWithPasscode,
  signupCustomerWithPasscode,
} from '../api/auth';
import { getMyProfile } from '../api/users';
import { setAccessToken } from '../api/storage';
import { pickHomeRoute } from '../auth/roleRouting';
import { BestBondManWithMobile } from '../assets/svgs';

const COUNTRY_CODE = '+91';

type Mode = 'login' | 'signup';
type Trade = 'dealer' | 'contractor_painter';

export function CustomerAuthScreen({
  navigation,
}: RootStackScreenProps<'CustomerAuth'>) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [trade, setTrade] = useState<Trade>('contractor_painter');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const { width, height } = useWindowDimensions();


  const title = useMemo(
    () => (mode === 'login' ? 'Log In' : 'Sign Up'),
    [mode],
  );

  const resetPasscodeState = () => {
    setPasscode('');
    setConfirmPasscode('');
  };

  const onContinue = async () => {
    const digits = phone.replace(/\D/g, '').slice(0, 10);
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (passcode.length !== 6) {
      setError('Enter a valid 6-digit passcode.');
      return;
    }
    if (mode === 'signup' && confirmPasscode.length !== 6) {
      setError('Confirm your 6-digit passcode.');
      return;
    }
    if (mode === 'signup' && passcode !== confirmPasscode) {
      setError('Passcodes do not match.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (mode === 'signup' && !deliveryAddress.trim()) {
      setError('Enter your delivery address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r =
        mode === 'signup'
          ? await signupCustomerWithPasscode({
            phone: digits,
            countryCode: COUNTRY_CODE,
            passcode,
            confirmPasscode,
            fullName: fullName.trim(),
            email: email.trim() || null,
            profession:
              trade === 'dealer' ? 'Dealer' : 'Contractor/Worker',
            deliveryAddress: deliveryAddress.trim(),
          })
          : await loginCustomerWithPasscode({
            phone: digits,
            countryCode: COUNTRY_CODE,
            passcode,
          });

      await setAccessToken(r.accessToken);
      const profile = await getMyProfile();
      const home = pickHomeRoute(r, profile);
      if (home !== 'Main') {
        await setAccessToken(null);
        setError('This account is not a customer account.');
        return;
      }
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Unable to continue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Image is 306x460 (0.66 aspect ratio)
  const logoWidth = Math.min(width * 0.6, 130);
  const logoHeight = logoWidth * (300 / 206);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 28 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* <Text style={styles.title}>{title}</Text> */}
          {/* <Text style={styles.sub}>Continue with OTP on your mobile number.</Text> */}
          {mode !== 'signup' && (
          <View style={styles.logoWrapper} >
            <Image
              source={require("../assets/svgs/originals/manWithPhone.png")}
              style={{ width: 300, height: 300 }}
              resizeMode="contain"
            />
          </View>
          )}

          <View style={styles.switchRow}>
            <Pressable
              onPress={() => {
                setMode('login');
                resetPasscodeState();
                setError(null);
              }}
              style={[styles.switchPill, mode === 'login' && styles.switchPillOn]}>
              <Text style={[styles.switchText, mode === 'login' && styles.switchTextOn]}>Log In</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode('signup');
                resetPasscodeState();
                setError(null);
              }}
              style={[styles.switchPill, mode === 'signup' && styles.switchPillOn]}>
              <Text style={[styles.switchText, mode === 'signup' && styles.switchTextOn]}>Sign Up</Text>
            </Pressable>
          </View>

          {mode === 'signup' ? (
            <View style={[styles.formContainer, { marginBottom: 18 }]}>
              <AppFieldLabel text="FULL NAME" />
              <AppPillInput placeholder="Enter your full name" value={fullName} onChangeText={setFullName} />

              <View style={styles.gap}>
                <AppFieldLabel text="EMAIL (OPTIONAL)" />
              </View>
              <AppPillInput
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />

              <View style={styles.gap}>
                <AppFieldLabel text="YOUR PRIMARY TRADE" />
              </View>
              <View style={styles.tradeRow}>
                <TradeCard
                  title="Dealer"
                  subtitle="Redeem through your authorised store"
                  icon="🏪"
                  selected={false}
                  disabled
                  onPress={() => {}}
                />
                <TradeCard
                  title="Contractor/Worker"
                  subtitle="On-site building, finishing & paint work"
                  icon="🎨"
                  selected={trade === 'contractor_painter'}
                  onPress={() => setTrade('contractor_painter')}
                />
              </View>

              <View style={styles.gap}>
                <AppFieldLabel text="DELIVERY ADDRESS" />
              </View>
              <TextInput
                style={styles.addressInput}
                placeholder="Enter your address"
                placeholderTextColor={colors.lightGray}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
                textAlignVertical="top"
              />
            </View>
          ) : null}

          <View style={styles.formContainer}>

            <View >
              <AppFieldLabel text="YOUR PHONE NUMBER" />
            </View>
            <AppPhoneInput
              countryCode={COUNTRY_CODE}
              value={phone}
              autoFocus
              onChangeText={(t) => {
                setPhone(t.replace(/\D/g, '').slice(0, 10));
                if (error) setError(null);
              }}
            />


            <AppFieldLabel text="PASSCODE" />
            <SixDigitInput value={passcode} onChange={setPasscode} secure />

            {mode === 'signup' ? (
              <>
                <View style={styles.gap}>
                  <AppFieldLabel text="CONFIRM PASSCODE" />
                </View>
                <SixDigitInput
                  value={confirmPasscode}
                  onChange={setConfirmPasscode}
                  secure
                />
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton
              text={loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Continue'}
              onPress={onContinue}
              disabled={loading}
              style={styles.cta}
            />
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.muted}>By logging in, you agree to our Terms of Service and Privacy Policy. </Text>
            <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: 'AdminLogin' }] })} hitSlop={8}>
              <Text style={[styles.link , {textDecorationLine:'underline'}]}>Go to Management</Text>
            </Pressable>
          </View>

          <View style={[  styles.bottomRow, { justifyContent: 'space-between' }]}>

            <Pressable  hitSlop={8}>
            <Text style={styles.link}>Back </Text>
            </Pressable> 
           <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: 'CustomerAuth' }] })} hitSlop={8}>
              <Text style={styles.link}>Reset</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function TradeCard({
  title,
  subtitle,
  icon,
  selected,
  disabled = false,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        disabled && styles.cardDisabled,
        selected && !disabled && styles.cardSelected,
        pressed && !disabled && styles.cardPressed,
      ]}
      onPress={onPress}>
      {selected && !disabled ? (
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>✓</Text>
        </View>
      ) : null}
      <Text style={[styles.cardIcon, disabled && styles.cardTextDisabled]}>{icon}</Text>
      <Text style={[styles.cardTitle, disabled && styles.cardTextDisabled]}>{title}</Text>
      <Text style={[styles.cardSub, disabled && styles.cardTextDisabled]}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primaryOrange },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 20, fontWeight: '900', color: figma.textTitle, marginBottom: 10 },
  sub: { fontSize: 14, color: colors.mutedGray, lineHeight: 20, marginBottom: 18 },
  switchRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.offWhite,
    borderRadius: 22,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    marginBottom: 18,
  },
  signupLogo:{ display:'none'},
  logoWrapper: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  gap: { marginTop: 16 },
  switchPillOn: {
    backgroundColor: colors.white,
  },
  switchText: { fontWeight: '800', color: colors.mutedGray },
  switchTextOn: { color: figma.textTitle },
  addressInput: {
    borderWidth: 1,
    borderColor: '#E6EAF0',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: figma.textTitle,
    minHeight: 100,
    backgroundColor: colors.white,
  },
  tradeRow: { flexDirection: 'row' },
  card: {
    flex: 1,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.white,
    minHeight: 148,
  },
  cardSelected: {
    borderColor: colors.primaryOrange,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 122, 26, 0.08)',
  },
  cardDisabled: {
    opacity: 0.45,
    backgroundColor: '#F3F4F6',
  },
  cardTextDisabled: {
    color: colors.mutedGray,
  },
  cardPressed: { opacity: 0.92 },
  cardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  cardIcon: { fontSize: 28, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: figma.textTitle },
  cardSub: { fontSize: 12, color: colors.mutedGray, marginTop: 6, lineHeight: 17 },
  otpHeader: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  otpMuted: { fontSize: 12, color: colors.mutedGray, marginBottom: 2 },
  otpAction: { fontSize: 12, color: colors.primaryOrange, fontWeight: '700', marginBottom: 10 },
  cta: { marginTop: 26 },
  error: { marginTop: 10, fontSize: 13, color: '#D14343', textAlign: 'center' },
  bottomRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  muted: { color: colors.white, fontSize: 15, marginHorizontal:15, textAlign:'center', width:"70%", lineHeight:22 },
  link: { color: colors.white, fontSize: 16, fontWeight: '900' },
  formContainer: {
    paddingVertical: 24,
    padding: 18,
    backgroundColor: colors.white,
    borderRadius: 22,
  }
});

