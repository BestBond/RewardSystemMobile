import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';

type PlaceholderProps = MainTabScreenProps<'Cart'>;

export function PlaceholderTabScreen({ route }: PlaceholderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.center}>
        <Text style={styles.title}>{route.name}</Text>
        <Text style={styles.sub}>Coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navyAlt,
  },
  sub: {
    marginTop: 8,
    fontSize: 15,
    color: colors.mutedGray,
  },
});
