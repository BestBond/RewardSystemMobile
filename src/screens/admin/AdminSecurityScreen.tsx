import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { adminUi } from '../../theme/adminUi';
import { AdminHeader } from './components/AdminHeader';
import {
  changeMyPassword,
  getAdminPreferences,
  updateAdminPreferences,
} from '../../api/adminPreferences';
import { isApiError, userFacingApiMessage } from '../../api/client';

export function AdminSecurityScreen() {
  const insets = useSafeAreaInsets();
  const [quickPin, setQuickPin] = useState(true);
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [cf, setCf] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getAdminPreferences()
      .then(prefs => {
        if (!cancelled) {
          setQuickPin(prefs.quickLoginPinEnabled);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingPrefs(false);
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
          <TextInput
            style={styles.input}
            secureTextEntry
            value={cur}
            onChangeText={setCur}
            placeholder="••••••••"
            placeholderTextColor={adminUi.mutedGray}
          />
          <Text style={[styles.lbl, styles.gap]}>NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={nw}
            onChangeText={setNw}
            placeholder="••••••••"
            placeholderTextColor={adminUi.mutedGray}
          />
          <Text style={[styles.lbl, styles.gap]}>CONFIRM NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={cf}
            onChangeText={setCf}
            placeholder="••••••••"
            placeholderTextColor={adminUi.mutedGray}
          />
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

        <Text style={styles.h1}>Efficiency</Text>
        <Text style={styles.desc}>
          Streamline your workflow with biometric-ready authentication
          shortcuts.
        </Text>
        <View style={[styles.toggleCard, adminUi.shadowCard]}>
          <View style={styles.toggleMid}>
            <Text style={styles.toggleTitle}>Quick Login PIN</Text>
            <Text style={styles.toggleSub}>
              Use a 4-digit PIN instead of a password
            </Text>
          </View>
          <Switch
            value={quickPin}
            disabled={loadingPrefs || saving}
            onValueChange={v => {
              setQuickPin(v);
              setError(null);
              setSuccess(null);
              updateAdminPreferences({ quickLoginPinEnabled: v })
                .then(() => {
                  setSuccess(v ? 'Quick Login PIN enabled.' : 'Quick Login PIN disabled.');
                })
                .catch((e) => {
                  setQuickPin(prev => !prev);
                  if (isApiError(e)) setError(userFacingApiMessage(e.message));
                  else setError('Unable to update quick PIN setting.');
                });
            }}
            trackColor={{ false: '#E5E7EB', true: '#FDBA74' }}
            thumbColor={quickPin ? adminUi.accentOrange : '#f4f3f4'}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
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
  input: {
    marginTop: 8,
    backgroundColor: adminUi.white,
    borderRadius: adminUi.radiusPill,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: adminUi.radiusLg,
    padding: 16,
    marginTop: 8,
  },
  toggleMid: { flex: 1, paddingRight: 12 },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminUi.navyAlt,
  },
  toggleSub: {
    fontSize: 13,
    color: adminUi.labelMuted,
    marginTop: 4,
    lineHeight: 18,
  },
});
