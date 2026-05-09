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

type Trade = 'contractor' | 'painter';

export function ProfileSetupScreen({
  navigation,
  route,
}: RootStackScreenProps<'ProfileSetup'>) {
  const insets = useSafeAreaInsets();
  const edit = route.params?.edit === true;
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [isDealer, setIsDealer] = useState(false);
  const [trade, setTrade] = useState<Trade>('painter');

  const bg = isDealer ? colors.white : colors.offWhite;
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
    if (!edit) return;
    getMyProfile()
      .then(p => {
        setFullName(p.fullName?.trim() ?? '');
        setAddress(p.deliveryAddress?.trim() ?? '');
        const pro = p.profession?.trim();
        if (!pro) {
          setIsDealer(true);
        } else {
          setIsDealer(false);
          setTrade(pro.toLowerCase().includes('contractor') ? 'contractor' : 'painter');
        }
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
        profession: isDealer ? undefined : trade === 'contractor' ? 'Contractor' : 'Painter',
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

          <Pressable
            style={styles.checkRow}
            onPress={() => setIsDealer(d => !d)}>
            <View
              style={[styles.checkbox, isDealer && styles.checkboxOn]}>
              {isDealer ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.checkLabel}>Select this if you are a dealer</Text>
          </Pressable>

          {!isDealer ? (
            <>
              <View style={styles.labelGap}>
                <AppFieldLabel text="YOUR PRIMARY TRADE" />
              </View>
              <View style={styles.tradeRow}>
                <TradeCard
                  title="Contractor"
                  subtitle="General building & management"
                  icon="📐"
                  selected={trade === 'contractor'}
                  onPress={() => setTrade('contractor')}
                />
                <TradeCard
                  title="Painter"
                  subtitle="Finishing & aesthetic work"
                  icon="🖌️"
                  selected={trade === 'painter'}
                  onPress={() => setTrade('painter')}
                />
              </View>
            </>
          ) : null}

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

function TradeCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}>
      {selected ? (
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>✓</Text>
        </View>
      ) : null}
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{subtitle}</Text>
    </Pressable>
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.borderGray,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxOn: {
    backgroundColor: colors.primaryOrange,
    borderColor: colors.primaryOrange,
  },
  checkMark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  checkLabel: {
    fontSize: 15,
    color: colors.mutedGray,
    flex: 1,
  },
  tradeRow: {
    flexDirection: 'row',
  },
  card: {
    flex: 1,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 16,
    padding: 14,
    paddingTop: 20,
    backgroundColor: colors.white,
    minHeight: 148,
  },
  cardSelected: {
    borderColor: colors.primaryOrange,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 122, 26, 0.08)',
  },
  cardPressed: { opacity: 0.92 },
  cardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  cardSub: {
    fontSize: 12,
    color: colors.mutedGray,
    marginTop: 6,
    lineHeight: 17,
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
