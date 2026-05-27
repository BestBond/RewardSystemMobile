import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { changeMyPassword } from '../../api/adminPreferences';
import { isApiError, userFacingApiMessage } from '../../api/client';
import { getAuthMe } from '../../api/users';
import { EyeToggle } from '../../components/EyeToggle';
import { adminUi } from '../../theme/adminUi';
import { AdminHeader } from './components/AdminHeader';
import { isSuperAdmin } from './adminRole';

export function AdminSecurityScreen() {
  const insets = useSafeAreaInsets();
  const [roleLoading, setRoleLoading] = useState(true);
  const [showSecurityUi, setShowSecurityUi] = useState(false);
  const [showCurPwd, setShowCurPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [cf, setCf] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getAuthMe()
      .then(r => {
        const user = r.user ?? null;
        if (!cancelled) {
          setShowSecurityUi(isSuperAdmin(user));
        }
      })
      .catch(() => {
        if (!cancelled) setShowSecurityUi(false);
      })
      .finally(() => {
        if (!cancelled) setRoleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onUpdatePassword = async () => {
    setError(null);
    setSuccess(null);
    if (!cur.trim() || !nw.trim() || !cf.trim()) {
      setError('Please fill all password fields.');
      return;
    }
    if (nw.length < 8) {
      setError('New password should be at least 8 characters.');
      return;
    }
    if (nw !== cf) {
      setError('New password and confirm password do not match.');
      return;
    }

    setSaving(true);
    try {
      await changeMyPassword({
        currentPassword: cur.trim(),
        newPassword: nw.trim(),
      });
      setSuccess('Password updated successfully.');
      setCur('');
      setNw('');
      setCf('');
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Unable to update password right now.');
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <AdminHeader title="Security & Preferences" />
        <View style={styles.loadingBox}>
          <ActivityIndicator color={adminUi.accentOrange} size="large" />
        </View>
      </View>
    );
  }

  if (!showSecurityUi) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <AdminHeader title="Security & Preferences" />
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 32 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={[styles.card, adminUi.shadowCard]}>
            <Text style={styles.h1}>Account password</Text>
            <Text style={styles.desc}>
              Operational Admin accounts sign in with a 6-digit passcode. Use Reset
              Passcode on your profile to change it. Account password settings are
              only available for Super Admin.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AdminHeader title="Security & Preferences" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 32 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, adminUi.shadowCard]}>
          <Text style={styles.h1}>Authentication</Text>
          <Text style={styles.desc}>
            Update your access credentials regularly to maintain site-wide
            integrity. We recommend complex phrases.
          </Text>
          <Text style={styles.lbl}>CURRENT PASSWORD</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.inputInner, styles.inputFlex]}
              secureTextEntry={!showCurPwd}
              value={cur}
              onChangeText={setCur}
              placeholder="••••••••"
              placeholderTextColor={adminUi.mutedGray}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <EyeToggle
              passwordVisible={showCurPwd}
              onToggle={() => setShowCurPwd(v => !v)}
            />
          </View>
          <Text style={[styles.lbl, styles.gap]}>NEW PASSWORD</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.inputInner, styles.inputFlex]}
              secureTextEntry={!showNewPwd}
              value={nw}
              onChangeText={setNw}
              placeholder="••••••••"
              placeholderTextColor={adminUi.mutedGray}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <EyeToggle
              passwordVisible={showNewPwd}
              onToggle={() => setShowNewPwd(v => !v)}
            />
          </View>
          <Text style={[styles.lbl, styles.gap]}>CONFIRM NEW PASSWORD</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.inputInner, styles.inputFlex]}
              secureTextEntry={!showConfirmPwd}
              value={cf}
              onChangeText={setCf}
              placeholder="••••••••"
              placeholderTextColor={adminUi.mutedGray}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <EyeToggle
              passwordVisible={showConfirmPwd}
              onToggle={() => setShowConfirmPwd(v => !v)}
            />
          </View>
          {error ? <Text style={styles.errTxt}>{error}</Text> : null}
          {success ? <Text style={styles.okTxt}>{success}</Text> : null}
          <Pressable
            style={({ pressed }) => [
              styles.updatePw,
              saving && styles.btnDisabled,
              pressed && { opacity: 0.92 },
            ]}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Update password"
            onPress={() => {
              onUpdatePassword().catch(() => {});
            }}>
            {saving ? (
              <ActivityIndicator color={adminUi.accentOrange} />
            ) : (
              <Text style={styles.updatePwTxt}>Update Password</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: adminUi.radiusLg,
    padding: 18,
    marginBottom: 24,
  },
  h1: {
    fontSize: 20,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: adminUi.labelMuted,
    lineHeight: 20,
    marginBottom: 18,
  },
  lbl: {
    fontSize: 12,
    fontWeight: '800',
    color: adminUi.navyAlt,
    letterSpacing: 0.4,
  },
  gap: { marginTop: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: adminUi.white,
    borderRadius: adminUi.radiusPill,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingRight: 2,
    minHeight: 50,
  },
  inputFlex: { flex: 1 },
  inputInner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: adminUi.sectionTitle,
  },
  updatePw: {
    marginTop: 18,
    backgroundColor: adminUi.white,
    borderRadius: adminUi.radiusPill,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    alignItems: 'center',
  },
  updatePwTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: adminUi.accentOrange,
  },
  btnDisabled: { opacity: 0.65 },
  errTxt: {
    fontSize: 13,
    color: adminUi.pointsDebit,
    marginTop: 10,
    fontWeight: '600',
  },
  okTxt: {
    fontSize: 13,
    color: adminUi.successGreen,
    marginTop: 10,
    fontWeight: '600',
  },
});
