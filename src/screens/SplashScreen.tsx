import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveInitialRoute } from '../auth/resolveInitialRoute';
import type { RootStackScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';

const MIN_SPLASH_MS = 1600;

export function SplashScreen({
  navigation,
}: RootStackScreenProps<'Splash'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [bootError, setBootError] = useState<string | null>(null);
  const dotA = useRef(new Animated.Value(0.35)).current;
  const dotB = useRef(new Animated.Value(0.35)).current;
  const dotC = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const mk = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0.35,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    const l1 = mk(dotA, 0);
    const l2 = mk(dotB, 150);
    const l3 = mk(dotC, 300);
    l1.start();
    l2.start();
    l3.start();
    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, [dotA, dotB, dotC]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const started = Date.now();
      try {
        const next = await resolveInitialRoute();
        const elapsed = Date.now() - started;
        const wait = Math.max(0, MIN_SPLASH_MS - elapsed);
        await new Promise<void>(resolve => setTimeout(resolve, wait));
        if (!cancelled) navigation.replace(next);
      } catch {
        if (!cancelled) {
          setBootError('Unable to start. Check connection and try again.');
          setTimeout(() => {
            if (!cancelled) navigation.replace('CustomerAuth');
          }, 1200);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  const logoScale = Math.min(1, (width - 48) / 320);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={[styles.statusShim, { height: insets.top }]} />
      <View style={styles.orange}>
        <View style={styles.center}>
          <View style={[styles.brandBlock, { transform: [{ scale: logoScale }] }]}>
            <Text style={styles.tmRow}>
              <Text style={styles.bestSm}>BEST</Text>
              <Text style={styles.tm}>™</Text>
            </Text>
            <Text style={styles.bondLg}>BOND</Text>
            <Text style={styles.since}>since 2003</Text>
            <Text style={styles.cert}>
              ISI 9001:2008 Certified • IS 15477 Compliant
            </Text>
          </View>
        </View>
        <View style={[styles.loading, { paddingBottom: 40 + insets.bottom }]}>
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, { opacity: dotA }]} />
            <Animated.View style={[styles.dot, { opacity: dotB }]} />
            <Animated.View style={[styles.dot, { opacity: dotC }]} />
          </View>
          <Text style={styles.loadingText}>
            {bootError ?? 'Loading...'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  statusShim: {
    backgroundColor: colors.white,
  },
  orange: {
    flex: 1,
    backgroundColor: colors.splashOrange,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  brandBlock: {
    alignItems: 'center',
  },
  tmRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bestSm: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 1,
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  tm: {
    color: colors.white,
    fontSize: 12,
    marginLeft: 2,
    marginTop: 4,
    fontWeight: '600',
  },
  bondLg: {
    color: colors.white,
    fontSize: 52,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 2,
    marginTop: -4,
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  since: {
    color: colors.white,
    fontSize: 20,
    fontStyle: 'italic',
    marginTop: 12,
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  cert: {
    color: colors.white,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.95,
    paddingHorizontal: 8,
    lineHeight: 16,
  },
  loading: {
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.white,
    marginHorizontal: 5,
  },
  loadingText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
