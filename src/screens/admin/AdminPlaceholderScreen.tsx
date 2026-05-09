import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

export function AdminPlaceholderScreen({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>This section is next in the rollout.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.offWhite },
  body: { flex: 1, padding: 24, justifyContent: 'center' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navyAlt,
    marginBottom: 8,
  },
  sub: { fontSize: 15, color: colors.subtitleGray, lineHeight: 22 },
});
