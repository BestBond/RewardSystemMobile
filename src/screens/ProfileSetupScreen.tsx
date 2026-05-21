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
import Svg, { Defs, LinearGradient as SvgLinear, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackArrowLeft } from '../assets/svgs';
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
  /** First-time incomplete setup may skip; returning users / edit flow may not. */
  const [showSkipButton, setShowSkipButton] = useState(() => !edit);
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  /** Profession is chosen at signup; profile edit only updates name/address. */
  const [professionToKeep, setProfessionToKeep] =
    useState<string>('Contractor/Worker');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      goHome().catch(() => {});
    }
  };

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
        setEmail(p.email?.trim() ?? '');
        setPhone(p.phone?.trim() ?? '');
        if (edit) {
          setFullName(p.fullName?.trim() ?? '');
          setAddress(p.deliveryAddress?.trim() ?? '');
        }
        const pro = p.profession?.trim();
        if (pro) setProfessionToKeep(pro);
        setShowSkipButton(!edit && !isProfileComplete(p));
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
    <View style={[styles.root, { paddingTop: insets.top }]}> 
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinear id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="rgba(249,133,53,1)" stopOpacity="1" />
            <Stop offset="1" stopColor="rgb(255, 248, 241)" stopOpacity="1" />
          </SvgLinear>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrad)" />
      </Svg>
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
            <Pressable
              style={styles.backBtn}
              hitSlop={12}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Back">
              <BackArrowLeft width={24} height={24} />
              <Text style={styles.headerTitle}>Checkout</Text>
              
            </Pressable>
            <View style={styles.topSpacer} />
            {showSkipButton ? (
              <Pressable
                hitSlop={12}
                onPress={() => {
                  goHome().catch(() => {});
                }}>
                <Text style={styles.skip}>Skip</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.sub}>
            Let's get started once you fill the details for your profile
          </Text>

          <AppFieldLabel text="MOBILE NUMBER" />
          <AppPillInput
            containerStyle={[styles.inputPill, styles.readOnlyContainer]}
            placeholder="Not available"
            value={phone}
            editable={false}
            selectTextOnFocus={false}
            style={styles.readOnlyInput}
          />

          <View style={styles.labelGap}>
            <AppFieldLabel text="EMAIL" />
          </View>
          <AppPillInput
            containerStyle={[styles.inputPill, styles.readOnlyContainer]}
            placeholder="Not available"
            value={email}
            editable={false}
            selectTextOnFocus={false}
            style={styles.readOnlyInput}
          />

          <View style={styles.labelGap}>
            <AppFieldLabel text="FULL NAME" />
          </View>
          <AppPillInput
            containerStyle={styles.inputPill}
            placeholder="Enter your full name"
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
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 44,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
    headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navyAlt,
  },
  topSpacer: { flex: 1 },
  skip: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.navyAlt,
  },
  title: {
    fontSize: 35,
    fontWeight: '900',
    color: colors.white,
    marginTop: 4,
    lineHeight: 36,
    opacity:0.6,
  },
  sub: {
    fontSize: 16,
    color: colors.navyAlt,
    marginTop: 5,
    marginBottom: 34,
    lineHeight: 24,
  },
  labelGap: {
    marginTop: 12,
  },
  inputPill: {
    marginBottom: 16,
  },
  readOnlyContainer: {
    backgroundColor: '#F7F6F4',
  },
  readOnlyInput: {
    color: colors.navyAlt,
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
  cta: { marginTop: 32 },
  error: {
    marginTop: 12,
    fontSize: 13,
    color: '#D14343',
    textAlign: 'center',
  },
});
