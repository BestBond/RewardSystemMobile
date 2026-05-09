import React, { useEffect, useState } from 'react';
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
import { AppButton, AppFieldLabel, AppPhoneInput } from '../components/ui';
import { SixDigitInput } from '../components/SixDigitInput';
import { colors } from '../theme/colors';
import { figma } from '../theme/figmaTokens';
import { isApiError, userFacingApiMessage } from '../api/client';
import { loginAdminWithOtp, requestOtp } from '../api/auth';
import { getMyProfile } from '../api/users';
import { setAccessToken } from '../api/storage';
import { isProfileComplete } from '../auth/profileCompletion';
import { pickHomeRoute } from '../auth/roleRouting';

const COUNTRY_CODE = '+91';
const RESEND_SECONDS = 30;

export function AdminLoginScreen({
  navigation,
}: RootStackScreenProps<'AdminLogin'>) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onLogin = async () => {
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
    setLoading(true);
    setError(null);
    try {
      const r = await loginAdminWithOtp({
        phone: digits,
        countryCode: COUNTRY_CODE,
        code: otp,
      });
      await setAccessToken(r.accessToken);

      const profile = await getMyProfile();
      const home = pickHomeRoute(r, profile);
      if (home !== 'AdminMain') {
        await setAccessToken(null);
        setError('This account does not have management access.');
        return;
      }
      if (!isProfileComplete(profile)) {
        navigation.reset({ index: 0, routes: [{ name: 'AdminProfileSetup' }] });
        return;
      }
      navigation.reset({ index: 0, routes: [{ name: 'AdminMain' }] });
    } catch (e) {
      if (isApiError(e)) {
        // Ops admin not yet approved: backend returns 403 with specific copy
        if (e.status === 403 && /waiting for super admin approval/i.test(e.message)) {
          navigation.reset({ index: 0, routes: [{ name: 'PendingApproval' }] });
          return;
        }
        setError(userFacingApiMessage(e.message));
      } else {
        setError('Unable to log in. Please try again.');
      }
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
          <Text style={styles.title}>Management Login</Text>
          <Text style={styles.sub}>Super Admin and Ops Admin sign in with OTP.</Text>

          <AppFieldLabel text="MOBILE NUMBER" />
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

          <AppButton text={loading ? 'Logging in...' : 'Log In'} onPress={onLogin} disabled={loading} style={styles.cta} />

          <View style={styles.row}>
            <Text style={styles.muted}>New Ops Admin? </Text>
            <Pressable onPress={() => navigation.navigate('OpsAdminSignUp')} hitSlop={8}>
              <Text style={styles.link}>Create account</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Text style={styles.muted}>Not management? </Text>
            <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: 'CustomerAuth' }] })} hitSlop={8}>
              <Text style={styles.link}>Go back</Text>
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
  sub: { fontSize: 14, color: colors.mutedGray, lineHeight: 20, marginBottom: 24 },
  otpHeader: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  otpMuted: { fontSize: 12, color: colors.mutedGray, marginBottom: 2 },
  otpAction: { fontSize: 12, color: colors.primaryOrange, fontWeight: '700', marginBottom: 2 },
  cta: { marginTop: 34 },
  error: { marginTop: 10, fontSize: 13, color: '#D14343', textAlign: 'center' },
  row: { marginTop: 14, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  muted: { color: colors.mutedGray, fontSize: 14 },
  link: { color: colors.primaryOrange, fontSize: 14, fontWeight: '800' },
});

