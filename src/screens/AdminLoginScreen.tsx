import React, { useState } from 'react';
import {
  Image,
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
import { loginAdminWithPasscode } from '../api/auth';
import { getMyProfile } from '../api/users';
import { setAccessToken } from '../api/storage';
import { isProfileComplete } from '../auth/profileCompletion';
import { pickHomeRoute } from '../auth/roleRouting';
import {
  isValidIndiaMobile,
  normalizeIndiaNationalPhoneInput,
} from '../utils/phone';

const COUNTRY_CODE = '+91';

export function AdminLoginScreen({
  navigation,
}: RootStackScreenProps<'AdminLogin'>) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginKind, setLoginKind] = useState<'ops' | 'super'>('ops');

  const onLogin = async () => {
    const digits = normalizeIndiaNationalPhoneInput(phone);
    if (!isValidIndiaMobile(digits)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (passcode.length !== 6) {
      setError('Enter a valid 6-digit passcode.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await loginAdminWithPasscode({
        phone: digits,
        countryCode: COUNTRY_CODE,
        passcode,
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
      <StatusBar />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 28 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/svgs/originals/manWithPhone.png')}
              style={{ width: 300, height: 300 }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.sub}>
            Sign in with your mobile number and 6-digit passcode.
          </Text>

          <View style={styles.kindRow}>
            <Pressable
              style={[styles.kindChip, loginKind === 'ops' && styles.kindChipOn]}
              onPress={() => {
                setLoginKind('ops');
                if (error) setError(null);
              }}>
              <Text style={[styles.kindChipText, loginKind === 'ops' && styles.kindChipTextOn]}>
                Ops Admin
              </Text>
            </Pressable>
            <Pressable
              style={[styles.kindChip, loginKind === 'super' && styles.kindChipOn]}
              onPress={() => {
                setLoginKind('super');
                if (error) setError(null);
              }}>
              <Text style={[styles.kindChipText, loginKind === 'super' && styles.kindChipTextOn]}>
                Super Admin
              </Text>
            </Pressable>
          </View>

          <View style={styles.formContainer}>
            <AppFieldLabel text="MOBILE NUMBER" />
            <AppPhoneInput
              countryCode={COUNTRY_CODE}
              value={phone}
              autoFocus
              onChangeText={(t) => {
                setPhone(normalizeIndiaNationalPhoneInput(t));
                if (error) setError(null);
              }}
            />

            <View style={styles.passcodeBlock}>
              <AppFieldLabel text="PASSCODE" />
              <SixDigitInput value={passcode} onChange={setPasscode} secure />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton
              text={loading ? 'Logging in...' : 'Log In'}
              onPress={onLogin}
              disabled={loading}
              style={styles.cta}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.muted}>New Ops Admin? </Text>
            <Pressable onPress={() => navigation.navigate('OpsAdminSignUp')} hitSlop={8}>
              <Text style={styles.link}>Create account</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Text style={styles.muted}>Not management? </Text>
            <Pressable
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'CustomerAuth' }] })}
              hitSlop={8}>
              <Text style={styles.link}>Go back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primaryOrange },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 40 },
  sub: { fontSize: 18, color: colors.white, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  kindRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  kindChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  kindChipOn: {
    borderColor: colors.primaryOrange,
    backgroundColor: '#FFF7F0',
  },
  kindChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.mutedGray,
  },
  kindChipTextOn: {
    color: colors.primaryOrange,
  },
  passcodeBlock: { marginTop: 18 },
  cta: { marginTop: 34 },
  error: { marginTop: 10, fontSize: 13, color: '#D14343', textAlign: 'center' },
  row: { marginTop: 14, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  muted: { color: colors.navy, fontSize: 14 },
  link: { color: colors.white, fontSize: 14, fontWeight: '800' },
  formContainer: {
    paddingVertical: 24,
    padding: 18,
    backgroundColor: colors.white,
    borderRadius: 22,
  },
  logoWrapper: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
