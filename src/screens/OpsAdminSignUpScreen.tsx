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
import { AppButton, AppFieldLabel, AppPhoneInput, AppPillInput } from '../components/ui';
import { SixDigitInput } from '../components/SixDigitInput';
import { colors } from '../theme/colors';
import { figma } from '../theme/figmaTokens';
import { isApiError, userFacingApiMessage } from '../api/client';
import { requestOtp, signupAdminWithOtp } from '../api/auth';

const COUNTRY_CODE = '+91';
const RESEND_SECONDS = 30;

export function OpsAdminSignUpScreen({
  navigation,
}: RootStackScreenProps<'OpsAdminSignUp'>) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const onCreate = async () => {
    const digits = phone.replace(/\D/g, '').slice(0, 10);
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!fullName.trim()) {
      setError('Enter your full name.');
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
    setSubmitting(true);
    setError(null);
    try {
      const r = await signupAdminWithOtp({
        phone: digits,
        countryCode: COUNTRY_CODE,
        code: otp,
        fullName: fullName.trim(),
        email: email.trim() || null,
      });
      if (!r.pendingApproval) {
        setError('Unexpected response. Please try again.');
        return;
      }
      navigation.reset({ index: 0, routes: [{ name: 'PendingApproval' }] });
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Unable to create account. Please try again.');
    } finally {
      setSubmitting(false);
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
          <Text style={styles.title}>Ops Admin Signup</Text>
          <Text style={styles.sub}>
            Create your account with OTP. A Super Admin must approve it before you can access management.
          </Text>

          <AppFieldLabel text="FULL NAME" />
          <AppPillInput placeholder="Enter your full name" value={fullName} onChangeText={setFullName} />

          <View style={styles.gap}>
            <AppFieldLabel text="OFFICIAL EMAIL (OPTIONAL)" />
          </View>
          <AppPillInput
            placeholder="name@company.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <View style={styles.gap}>
            <AppFieldLabel text="MOBILE NUMBER" />
          </View>
          <AppPhoneInput
            countryCode={COUNTRY_CODE}
            value={phone}
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
            text={submitting ? 'Creating...' : 'Create Account'}
            disabled={submitting}
            onPress={onCreate}
            style={styles.cta}
          />

          <View style={styles.row}>
            <Text style={styles.muted}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('AdminLogin')} hitSlop={8}>
              <Text style={styles.link}>Log in</Text>
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
  scroll: { paddingHorizontal: 24, paddingTop: 26 },
  title: { fontSize: 28, fontWeight: '900', color: figma.textTitle },
  sub: { marginTop: 10, fontSize: 14, color: colors.mutedGray, lineHeight: 20, marginBottom: 18 },
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
  row: { marginTop: 18, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  muted: { color: colors.mutedGray, fontSize: 14 },
  link: { color: colors.primaryOrange, fontSize: 14, fontWeight: '800' },
});

