import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { BestBondMan } from '../assets/svgs';

const MIN_SPLASH_MS = 2000;

export function SplashScreen({
  navigation,
}: RootStackScreenProps<'Splash'>) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
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
          setBootError('Unable to start. Check connection.');
          setTimeout(() => {
            if (!cancelled) navigation.replace('CustomerAuth');
          }, 1500);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  // Image is 306x460 (0.66 aspect ratio)
  const logoWidth = Math.min(width * 0.6, 130);
  const logoHeight = logoWidth * (300 / 206);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.splashOrange} />
      
      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <BestBondMan width={logoWidth} height={logoHeight} />
        </View>

        <Text style={styles.certText}>
          ISI 9001:2008 Certified • IS 15477 Compliant
        </Text>

        <View style={styles.loadingArea}>
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

      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <Text style={styles.footerText}>
          Developed by <Text style={styles.footerBrand}>Nuvate</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.splashOrange,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingArea: {
    marginTop: 60,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
    marginHorizontal: 4,
  },
  loadingText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  footerBrand: {
    fontWeight: 'bold',
    color: colors.white,
  },
});
