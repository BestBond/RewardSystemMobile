import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { AppFieldLabel } from '../../components/ui';
import { SixDigitInput } from '../../components/SixDigitInput';
import { deleteMyAccount } from '../../api/users';
import { isApiError, userFacingApiMessage } from '../../api/client';
import { clearAuthSession } from '../../api/storage';
import { goBackInApp } from '../../navigation/goBackInApp';
import { resetToLogin } from '../../navigation/rootNavigation';
import { colors } from '../../theme/colors';
import { figma } from '../../theme/figmaTokens';

export function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [passcode, setPasscode] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConfirmDelete = () => {
    if (passcode.length !== 6) {
      setError('Enter your 6-digit passcode to confirm.');
      return;
    }
    Alert.alert(
      'Delete account permanently?',
      'Your profile, phone number, and wallet access will be removed. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => runDelete(),
        },
      ],
    );
  };

  const runDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteMyAccount(passcode);
      await clearAuthSession();
      Alert.alert(
        'Account deleted',
        'Your account has been permanently deleted.',
        [{ text: 'OK', onPress: () => resetToLogin() }],
      );
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Unable to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => goBackInApp(navigation)}>
          <BackArrowLeft width={24} height={24} color="#1A1C1E" />
        </Pressable>
        <Text style={styles.headerTitle}>Delete Account</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.lead}>
            Deleting your account permanently removes your personal information
            and ends access to the BestBond Rewards program. Redemption history
            may be retained for legal and audit purposes without personal
            identifiers.
          </Text>

          <AppFieldLabel text="ENTER PASSCODE TO CONFIRM" />
          <SixDigitInput value={passcode} onChange={setPasscode} secure />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {deleting ? (
            <ActivityIndicator
              style={styles.spinner}
              color={colors.primaryOrange}
            />
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.deleteBtn,
                pressed && styles.pressed,
              ]}
              onPress={onConfirmDelete}>
              <Text style={styles.deleteLabel}>Delete my account</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6F8' },
  flex: { flex: 1 },
  header: {
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.mutedGray,
    marginBottom: 24,
  },
  error: {
    marginTop: 12,
    color: '#C62828',
    fontSize: 14,
    lineHeight: 20,
  },
  spinner: { marginTop: 24 },
  deleteBtn: {
    marginTop: 28,
    backgroundColor: '#C62828',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pressed: { opacity: 0.88 },
  deleteLabel: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
});
