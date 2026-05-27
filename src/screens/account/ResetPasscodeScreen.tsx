import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { BackArrowLeft } from '../../assets/svgs';
import { AppButton, AppFieldLabel } from '../../components/ui';
import { SixDigitInput } from '../../components/SixDigitInput';
import { changeMyPasscode } from '../../api/users';
import { isApiError, userFacingApiMessage } from '../../api/client';
import { goBackInApp } from '../../navigation/goBackInApp';
import { colors } from '../../theme/colors';
import { figma } from '../../theme/figmaTokens';
import { adminUi } from '../../theme/adminUi';
import { AdminHeader } from '../admin/components/AdminHeader';

export function ResetPasscodeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const isAdmin = route.name === 'AdminResetPasscode';

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    setSuccess(null);
    if (current.length !== 6 || next.length !== 6 || confirm.length !== 6) {
      setError('Enter a valid 6-digit passcode in each field.');
      return;
    }
    if (next !== confirm) {
      setError('New passcode and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      await changeMyPasscode({
        currentPasscode: current,
        newPasscode: next,
        confirmNewPasscode: confirm,
      });
      setSuccess('Passcode updated successfully.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Unable to update passcode. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const form = (
    <>
      <AppFieldLabel text="CURRENT PASSCODE" />
      <SixDigitInput value={current} onChange={setCurrent} secure />

      <View style={styles.fieldGap}>
        <AppFieldLabel text="NEW PASSCODE" />
      </View>
      <SixDigitInput value={next} onChange={setNext} secure />

      <View style={styles.fieldGap}>
        <AppFieldLabel text="CONFIRM NEW PASSCODE" />
      </View>
      <SixDigitInput value={confirm} onChange={setConfirm} secure />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <AppButton
        text={saving ? 'Saving...' : 'Update Passcode'}
        onPress={onSave}
        disabled={saving}
        style={styles.cta}
      />
    </>
  );

  if (isAdmin) {
    return (
      <View style={[styles.adminRoot, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <AdminHeader title="Reset Passcode" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[
              styles.adminScroll,
              { paddingBottom: 28 + insets.bottom },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={[styles.adminCard, adminUi.shadowCard]}>
              <Text style={styles.adminDesc}>
                Enter your current 6-digit passcode, then choose a new one. You
                will use the new passcode the next time you sign in.
              </Text>
              {form}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.customerRoot}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.customerHeader, { paddingTop: insets.top + 10 }]}>
        <Pressable
          style={styles.backBtn}
          hitSlop={12}
          onPress={() => goBackInApp(navigation)}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <BackArrowLeft width={24} height={24} />
        </Pressable>
        <Text style={styles.customerTitle}>Reset Passcode</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.customerScroll,
            { paddingBottom: 28 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.customerCard}>
            <Text style={styles.customerDesc}>
              Enter your current 6-digit passcode, then choose a new one for
              future logins.
            </Text>
            {form}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fieldGap: { marginTop: 16 },
  cta: { marginTop: 20 },
  error: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#D14343',
  },
  success: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },
  customerRoot: { flex: 1, backgroundColor: '#FFF8F3' },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  customerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  customerScroll: { paddingHorizontal: 16, paddingTop: 8 },
  customerCard: {
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: 24,
    ...figma.shadowSoft,
  },
  customerDesc: {
    fontSize: 14,
    color: colors.mutedGray,
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },
  adminRoot: { flex: 1, backgroundColor: adminUi.screenBg },
  adminScroll: { paddingHorizontal: 20, paddingTop: 4 },
  adminCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: adminUi.radiusLg,
    padding: 18,
  },
  adminDesc: {
    fontSize: 14,
    color: adminUi.labelMuted,
    lineHeight: 20,
    marginBottom: 18,
  },
});
