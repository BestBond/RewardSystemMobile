import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { figma } from '../theme/figmaTokens';

export function AuthLandingScreen({
  navigation,
}: RootStackScreenProps<'AuthLanding'>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Best Bonds</Text>
        <Text style={styles.sub}>
          Choose how you want to continue.
        </Text>
      </View>

      <View style={styles.cards}>
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('CustomerAuth')}>
          <Text style={styles.cardTitle}>Customer / User</Text>
          <Text style={styles.cardSub}>Earn points, redeem rewards, view history.</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('AdminLogin')}>
          <Text style={styles.cardTitle}>Management</Text>
          <Text style={styles.cardSub}>Super Admin or Ops Admin access.</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>
        Super Admin signup is available on web only.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 26,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: figma.textTitle,
  },
  sub: {
    marginTop: 10,
    fontSize: 15,
    color: colors.mutedGray,
    lineHeight: 22,
  },
  cards: {
    flex: 1,
    gap: 14,
    paddingTop: 10,
  },
  card: {
    borderRadius: 22,
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  cardPressed: { opacity: 0.92 },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: figma.textTitle,
  },
  cardSub: {
    marginTop: 6,
    fontSize: 13,
    color: colors.mutedGray,
    lineHeight: 18,
  },
  footer: {
    textAlign: 'center',
    paddingVertical: 18,
    fontSize: 12,
    color: colors.mutedGray,
  },
});

