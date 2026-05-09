import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '../navigation/types';
import { AppButton, AppFieldLabel, AppPhoneInput, AppPillInput } from '../components/ui';
import { SixDigitInput } from '../components/SixDigitInput';
import { colors } from '../theme/colors';
import { figma } from '../theme/figmaTokens';
import { isApiError, userFacingApiMessage } from '../api/client';
import { loginCustomerWithOtp, requestOtp, signupCustomerWithOtp } from '../api/auth';
import { getMyProfile } from '../api/users';
import { setAccessToken } from '../api/storage';
import { isProfileComplete } from '../auth/profileCompletion';
import { pickHomeRoute } from '../auth/roleRouting';

const COUNTRY_CODE = '+91';
const RESEND_SECONDS = 30;

type Mode = 'login' | 'signup';

export function CustomerAuthScreen({
  navigation,
}: RootStackScreenProps<'CustomerAuth'>) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const title = useMemo(
    () => (mode === 'login' ? 'Log In' : 'Sign Up'),
    [mode],
  );

  useEffect(() => {
    if (!otpSent) return;
    const id = setInterval(() => setSecondsLeft((s) => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [otpSent]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  };

  const resetOtpState = () => {
    setOtp('');
    setOtpSent(false);
    setSecondsLeft(RESEND_SECONDS);
  };

  const onSendOtp = async () => {
    const digits = phone.replace(/\D/g, '').slice(0, 10);
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setSendingOtp(true);
    setError(null);
    try {
      const r = await requestOtp({ phone: digits, countryCode: COUNTRY_CODE });
      setOtpSent(true);
      setSecondsLeft(RESEND_SECONDS);
      setOtp('');
      if (r.devCode) setOtp(String(r.devCode));
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Unable to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const onContinue = async () => {
    const digits = phone.replace(/\D/g, '').slice(0, 10);
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!otpSent) {
      setError('Please send OTP first.');
      return;
    }
    if (otp.length !== 6) {
      setError('Enter a valid 6-digit OTP.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setError('Enter your full name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r =
        mode === 'signup'
          ? await signupCustomerWithOtp({
              phone: digits,
              countryCode: COUNTRY_CODE,
              code: otp,
              fullName: fullName.trim(),
              email: email.trim() || null,
            })
          : await loginCustomerWithOtp({
              phone: digits,
              countryCode: COUNTRY_CODE,
              code: otp,
            });

      await setAccessToken(r.accessToken);
      const profile = await getMyProfile();
      const home = pickHomeRoute(r, profile);
      if (home !== 'Main') {
        await setAccessToken(null);
        setError('This account is not a customer account.');
        return;
      }
      if (!isProfileComplete(profile)) {
        navigation.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] });
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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 28 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>Continue with OTP on your mobile number.</Text>

          <View style={styles.switchRow}>
            <Pressable
              onPress={() => {
                setMode('login');
                resetOtpState();
                setError(null);
              }}
              style={[styles.switchPill, mode === 'login' && styles.switchPillOn]}>
              <Text style={[styles.switchText, mode === 'login' && styles.switchTextOn]}>Log In</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode('signup');
                resetOtpState();
                setError(null);
              }}
              style={[styles.switchPill, mode === 'signup' && styles.switchPillOn]}>
              <Text style={[styles.switchText, mode === 'signup' && styles.switchTextOn]}>Sign Up</Text>
            </Pressable>
          </View>

          {mode === 'signup' ? (
            <>
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
            </>
          ) : null}

          <View style={styles.gap}>
            <AppFieldLabel text="MOBILE NUMBER" />
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

          <View style={styles.otpHeader}>
            <AppFieldLabel text="VERIFICATION CODE" compact />
            {!otpSent ? (
              <Pressable onPress={onSendOtp} disabled={sendingOtp}>
                <Text style={styles.otpAction}>{sendingOtp ? 'Sending OTP...' : 'Send OTP'}</Text>
              </Pressable>
            ) : secondsLeft > 0 ? (
              <Text style={styles.otpMuted}>Resend OTP in {fmt(secondsLeft)}</Text>
            ) : (
              <Pressable onPress={onSendOtp} disabled={sendingOtp}>
                <Text style={styles.otpAction}>Resend OTP</Text>
              </Pressable>
            )}
          </View>
          <SixDigitInput value={otp} onChange={setOtp} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton
            text={loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Continue'}
            onPress={onContinue}
            disabled={loading}
            style={styles.cta}
          />

          <View style={styles.bottomRow}>
            <Text style={styles.muted}>Need management access? </Text>
            <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: 'AdminLogin' }] })} hitSlop={8}>
              <Text style={styles.link}>Go to Management</Text>
            </Pressable>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.muted}>Back </Text>
            <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: 'CustomerAuth' }] })} hitSlop={8}>
              <Text style={styles.link}>Reset</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '900', color: figma.textTitle, marginBottom: 10 },
  sub: { fontSize: 14, color: colors.mutedGray, lineHeight: 20, marginBottom: 18 },
  switchRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.offWhite,
    borderRadius: 999,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    marginBottom: 18,
  },
  switchPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  switchPillOn: {
    backgroundColor: colors.white,
  },
  switchText: { fontWeight: '800', color: colors.mutedGray },
  switchTextOn: { color: figma.textTitle },
  gap: { marginTop: 16 },
  otpHeader: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  otpMuted: { fontSize: 12, color: colors.mutedGray, marginBottom: 2 },
  otpAction: { fontSize: 12, color: colors.primaryOrange, fontWeight: '700', marginBottom: 2 },
  cta: { marginTop: 26 },
  error: { marginTop: 10, fontSize: 13, color: '#D14343', textAlign: 'center' },
  bottomRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  muted: { color: colors.mutedGray, fontSize: 13 },
  link: { color: colors.primaryOrange, fontSize: 13, fontWeight: '900' },
});

