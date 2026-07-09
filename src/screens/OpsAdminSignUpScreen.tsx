import React, { useState } from 'react';
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
import { signupAdminWithPasscode } from '../api/auth';
import {
  isValidIndiaMobile,
  normalizeIndiaNationalPhoneInput,
} from '../utils/phone';

const COUNTRY_CODE = '+91';

export function OpsAdminSignUpScreen({
  navigation,
}: RootStackScreenProps<'OpsAdminSignUp'>) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    const digits = normalizeIndiaNationalPhoneInput(phone);
    if (!isValidIndiaMobile(digits)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!fullName.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (passcode.length !== 6 || confirmPasscode.length !== 6) {
      setError('Enter a valid 6-digit passcode.');
      return;
    }
    if (passcode !== confirmPasscode) {
      setError('Passcodes do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await signupAdminWithPasscode({
        phone: digits,
        countryCode: COUNTRY_CODE,
        passcode,
        confirmPasscode,
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
            Create your account with a 6-digit passcode. A Super Admin must approve it before you can access management.
          </Text>

          <View style={styles.formContainer}>
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
                setPhone(normalizeIndiaNationalPhoneInput(t));
                if (error) setError(null);
              }}
            />

            <View style={styles.gap}>
              <AppFieldLabel text="PASSCODE" />
            </View>
            <SixDigitInput value={passcode} onChange={setPasscode} secure />

            <View style={styles.gap}>
              <AppFieldLabel text="CONFIRM PASSCODE" />
            </View>
            <SixDigitInput value={confirmPasscode} onChange={setConfirmPasscode} secure />

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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primaryOrange },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 26 },
  title: { fontSize: 28, fontWeight: '900', color: figma.textTitle },
  sub: { marginTop: 10, fontSize: 14, color: colors.white, lineHeight: 20, marginBottom: 18 },
  gap: { marginTop: 16 },
  cta: { marginTop: 26 },
  error: { marginTop: 10, fontSize: 13, color: '#D14343', textAlign: 'center' },
  row: { marginTop: 18, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  muted: { color: colors.mutedGray, fontSize: 14 },
  link: { color: colors.primaryOrange, fontSize: 14, fontWeight: '800' },
  formContainer: {
    paddingVertical: 24,
    padding: 18,
    backgroundColor: colors.white,
    borderRadius: 22,
  },
});
