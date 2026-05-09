import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, AppFieldLabel, AppPillInput } from '../components/ui';
import type { RootStackScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { figma } from '../theme/figmaTokens';
import { isApiError, userFacingApiMessage } from '../api/client';
import { getAuthMe, getMyProfile, updateMyProfile } from '../api/users';
import { getAdminPreferences, updateAdminPreferences } from '../api/adminPreferences';

type AdminRole = 'superadmin' | 'operational';

export function AdminProfileSetupScreen({
  navigation,
}: RootStackScreenProps<'AdminProfileSetup'>) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  /** Assigned by the server; not user-selectable (prevents showing a role the account does not have). */
  const [role, setRole] = useState<AdminRole>('operational');
  const [quickPin, setQuickPin] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [baselineEmail, setBaselineEmail] = useState('');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const [profile, me, prefs] = await Promise.all([
            getMyProfile(),
            getAuthMe().catch(() => ({ user: null })),
            getAdminPreferences().catch(() => null),
          ]);
          if (cancelled) return;
          setFullName(profile.fullName?.trim() ?? '');
          const email0 = profile.email?.trim() ?? '';
          const prof = profile.profession?.trim() ?? '';
          const idMatch = prof.match(/;\s*ID:\s*(.+)$/);
          setEmployeeId((idMatch?.[1] ?? email0).trim());
          setBaselineEmail(email0);
          setDeliveryAddress(profile.deliveryAddress?.trim() ?? '');
          const roles = me.user?.roles ?? profile.roles ?? [];
          const isSuper = roles.some(r => String(r).toUpperCase() === 'SUPERADMIN');
          setRole(isSuper ? 'superadmin' : 'operational');
          if (prefs) setQuickPin(prefs.quickLoginPinEnabled);
        } catch (e) {
          if (!cancelled) {
            if (isApiError(e)) setError(userFacingApiMessage(e.message));
            else setError('Unable to load profile.');
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const onSave = async () => {
    if (!fullName.trim().length) {
      setError('Please enter full name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const roleLabel = role === 'superadmin' ? 'Super Admin' : 'Operational Admin';
      const emp = employeeId.trim();
      const profession =
        emp && emp !== baselineEmail.trim()
          ? `${roleLabel}; ID: ${emp}`
          : roleLabel;
      await Promise.all([
        updateMyProfile({
          fullName: fullName.trim(),
          profession,
          // Keep fallback for profile completeness checks on older API payloads.
          deliveryAddress: deliveryAddress || 'Management Office',
        }),
        updateAdminPreferences({ quickLoginPinEnabled: quickPin }),
      ]);
      navigation.reset({
        index: 0,
        routes: [{ name: 'AdminMain' }],
      });
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 28 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.sub}>
            Let's get started once you fill the details for your profile
          </Text>

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>Upload{'\n'}Image</Text>
            </View>
          </View>

          <AppFieldLabel text="FULL NAME" />
          <AppPillInput
            placeholder="Enter your full Name"
            value={fullName}
            onChangeText={setFullName}
          />

          <View style={styles.gap}>
            <AppFieldLabel text="EMPLOYEE ID / OFFICIAL EMAIL" />
          </View>
          <AppPillInput
            placeholder="Enter you ID / Email"
            value={employeeId}
            onChangeText={setEmployeeId}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <View style={styles.gap}>
            <AppFieldLabel text="YOUR OPERATIONAL ROLE" />
          </View>
          <View style={styles.roleRow}>
            <RoleCard
              title="Super Admin"
              subtitle="Highest level authority"
              selected={role === 'superadmin'}
            />
            <RoleCard
              title="Operational Admin"
              subtitle="Access to approvals and support"
              selected={role === 'operational'}
            />
          </View>

          <View style={styles.quickPinCard}>
            <View style={styles.quickPinText}>
              <Text style={styles.quickPinTitle}>Quick Login PIN</Text>
              <Text style={styles.quickPinSub}>
                Use a 4-digit PIN instead of a password
              </Text>
            </View>
            <Switch
              value={quickPin}
              onValueChange={setQuickPin}
              trackColor={{ false: '#E5E7EB', true: '#FB923C' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {loading ? <Text style={styles.loading}>Loading profile...</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton
            text={saving ? 'Saving...' : 'Save and Continue  →'}
            disabled={saving || loading}
            onPress={onSave}
            style={styles.cta}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function RoleCard({
  title,
  subtitle,
  selected,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
}) {
  return (
    <View
      style={[styles.roleCard, selected && styles.roleCardSelected, !selected && styles.roleCardDim]}>
      {selected ? (
        <View style={styles.checkBadge}>
          <Text style={styles.checkBadgeTxt}>✓</Text>
        </View>
      ) : null}
      <Text style={styles.roleTitle}>{title}</Text>
      <Text style={styles.roleSub}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.offWhite },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 48 * 0.58,
    fontWeight: '800',
    color: figma.textTitle,
  },
  sub: {
    marginTop: 10,
    fontSize: 17 * 0.88,
    color: colors.subtitleGray,
    lineHeight: 24 * 0.88,
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: '#D6DCE6',
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyAlt,
  },
  gap: { marginTop: 14 },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8DEE8',
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    minHeight: 148,
    padding: 14,
    justifyContent: 'flex-end',
  },
  roleCardSelected: {
    borderWidth: 2,
    borderColor: colors.primaryOrange,
    backgroundColor: '#F6EFE3',
  },
  roleCardDim: {
    opacity: 0.55,
  },
  checkBadge: {
    position: 'absolute',
    right: 12,
    top: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeTxt: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  roleTitle: {
    fontSize: 32 * 0.52,
    fontWeight: '800',
    color: figma.textTitle,
  },
  roleSub: {
    marginTop: 4,
    fontSize: 13,
    color: colors.subtitleGray,
    lineHeight: 18,
  },
  quickPinCard: {
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: '#F1F3F6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickPinText: { flex: 1, marginRight: 8 },
  quickPinTitle: {
    fontSize: 32 * 0.5,
    fontWeight: '800',
    color: figma.textTitle,
  },
  quickPinSub: {
    marginTop: 4,
    color: colors.subtitleGray,
    fontSize: 12,
    lineHeight: 18,
  },
  loading: {
    marginTop: 12,
    fontSize: 13,
    color: colors.mutedGray,
    textAlign: 'center',
  },
  error: {
    marginTop: 12,
    fontSize: 13,
    color: '#D14343',
    textAlign: 'center',
  },
  cta: { marginTop: 26 },
});
