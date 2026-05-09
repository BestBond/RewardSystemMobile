import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '../navigation/types';
import { AppButton } from '../components/ui';
import { colors } from '../theme/colors';
import { figma } from '../theme/figmaTokens';
import { setAccessToken } from '../api/storage';

export function PendingApprovalScreen({
  navigation,
}: RootStackScreenProps<'PendingApproval'>) {
  const insets = useSafeAreaInsets();

  const onBackToLogin = () => {
    navigation.reset({ index: 0, routes: [{ name: 'AdminLogin' }] });
  };

  const onLogout = async () => {
    await setAccessToken(null);
    navigation.reset({ index: 0, routes: [{ name: 'CustomerAuth' }] });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.card}>
        <Text style={styles.title}>Waiting for Super Admin approval</Text>
        <Text style={styles.sub}>
          Your Ops Admin account is created. Once the Super Admin approves it, you can log in and
          access management dashboards.
        </Text>

        <AppButton text="Back to Login" onPress={onBackToLogin} style={styles.primary} />
        <AppButton text="Logout" onPress={onLogout} variant="neutral" style={styles.secondary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 26,
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: figma.textTitle,
  },
  sub: {
    marginTop: 10,
    color: colors.mutedGray,
    lineHeight: 20,
    fontSize: 13,
  },
  primary: { marginTop: 18 },
  secondary: { marginTop: 10 },
});

