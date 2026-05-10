import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, AppFieldLabel, AppPillInput } from '../components/ui';
import type { RootStackScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { isApiError, userFacingApiMessage } from '../api/client';
import { getAuthMe, getMyProfile, updateMyProfile } from '../api/users';
import { isProfileComplete } from '../auth/profileCompletion';
import { pickHomeRoute } from '../auth/roleRouting';

export function ProfileSetupScreen({
  navigation,
  route,
}: RootStackScreenProps<'ProfileSetup'>) {
  const insets = useSafeAreaInsets();
  const edit = route.params?.edit === true;
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  /** Profession is chosen at signup; profile edit only updates name/address. */
  const [professionToKeep, setProfessionToKeep] =
    useState<string>('Contractor/Painter');

  const bg = colors.offWhite;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goHome = async () => {
    try {
      const p = await getMyProfile();
      let me = null;
      try {
        me = (await getAuthMe()).user;
      } catch {
        /* ignore */
      }
      navigation.reset({
        index: 0,
        routes: [{ name: pickHomeRoute(p, me ?? undefined) }],
      });
    } catch {
      try {
        const me = (await getAuthMe()).user;
        navigation.reset({
          index: 0,
          routes: [{ name: pickHomeRoute(me ?? undefined) }],
        });
      } catch {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    }
  };

  useEffect(() => {
    getMyProfile()
      .then(p => {
        if (edit) {
          setFullName(p.fullName?.trim() ?? '');
          setAddress(p.deliveryAddress?.trim() ?? '');
        }
        const pro = p.profession?.trim();
        if (pro) setProfessionToKeep(pro);
      })
      .catch(() => {});
  }, [edit]);

  /** If profile is already complete, skip this screen unless user opened it to edit. */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getMyProfile()
        .then(async p => {
          if (!cancelled && isProfileComplete(p) && !edit) {
            let me = null;
            try {
              me = (await getAuthMe()).user;
            } catch {
              /* ignore */
            }
            navigation.reset({
              index: 0,
              routes: [{ name: pickHomeRoute(p, me ?? undefined) }],
            });
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [navigation, edit]),
  );

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMyProfile({
        fullName: fullName || undefined,
        profession: professionToKeep,
        deliveryAddress: address || undefined,
      });
      if (!isProfileComplete(updated)) {
        setError('Please enter your full name and delivery address.');
        return;
      }
      navigation.reset({
        index: 0,
        routes: [{ name: pickHomeRoute(updated) }],
      });
    } catch (e) {
      if (isApiError(e)) {
        if (e.status === 0) setError(e.message);
        else if (e.status === 401) setError('Please sign in again.');
        else setError(userFacingApiMessage(e.message));
      } else {
        setError('Unable to save profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: bg }]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 32 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <View style={styles.topSpacer} />
            <Pressable
              hitSlop={12}
              onPress={() => {
                goHome().catch(() => {});
              }}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.sub}>
            Let's get started once you fill the details for your profile
          </Text>

          <AppFieldLabel text="FULL NAME" />
          <AppPillInput
            containerStyle={styles.inputPill}
            placeholder="Enter your full Name"
            value={fullName}
            onChangeText={setFullName}
          />

          <View style={styles.labelGap}>
            <AppFieldLabel text="DELIVERY ADDRESS" />
          </View>
          <TextInput
            style={styles.inputArea}
            placeholder="Enter your address"
            placeholderTextColor={colors.lightGray}
            value={address}
            onChangeText={setAddress}
            multiline
            textAlignVertical="top"
          />

          <AppButton
            text={saving ? 'Saving...' : 'Save and Continue  →'}
            disabled={saving}
            onPress={onSave}
            style={styles.cta}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  topSpacer: { flex: 1 },
  skip: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.lightGray,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.navyAlt,
    marginTop: 4,
  },
  sub: {
    fontSize: 15,
    color: colors.subtitleGray,
    marginTop: 10,
    marginBottom: 24,
    lineHeight: 22,
  },
  labelGap: {
    marginTop: 22,
  },
  inputPill: {
    marginBottom: 0,
  },
  inputArea: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.navy,
    minHeight: 120,
    backgroundColor: colors.white,
  },
  cta: { marginTop: 28 },
  error: {
    marginTop: 12,
    fontSize: 13,
    color: '#D14343',
    textAlign: 'center',
  },
});
