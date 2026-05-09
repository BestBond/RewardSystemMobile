import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  type AppStateStatus,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanSuccessModal } from '../components/ScanSuccessModal';
import { redeemCoupon } from '../api/coupons';
import { isApiError, userFacingApiMessage } from '../api/client';
import type { AdminTabParamList, MainTabParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type ScanNav = BottomTabNavigationProp<MainTabParamList, 'Scan'>;

function tabStateHasAdminShell(navigation: {
  getState: () => { routes: { name: string }[] };
}) {
  const state = navigation.getState();
  return state.routes.some(r => r.name === 'AdminHome');
}

const VIEWFINDER = 260;

const CODE_TYPES = [
  'qr',
  'code-128',
  'code-39',
  'code-93',
  'codabar',
  'ean-13',
  'ean-8',
  'itf',
  'upc-a',
  'upc-e',
  'pdf-417',
  'aztec',
  'data-matrix',
] as const;

export function ScanScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ScanNav>();
  const isFocused = useIsFocused();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [flashOn, setFlashOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successPoints, setSuccessPoints] = useState(0);
  const [successBalance, setSuccessBalance] = useState(0);
  const [appActive, setAppActive] = useState(
    AppState.currentState === 'active',
  );
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const redeemingRef = useRef(false);
  const permissionRequestedRef = useRef(false);
  const successOpenRef = useRef(false);
  const lineAnim = useRef(new Animated.Value(0)).current;

  successOpenRef.current = successOpen;

  useEffect(() => {
    if (hasPermission || permissionRequestedRef.current) return;
    permissionRequestedRef.current = true;
    void requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (next: AppStateStatus) => {
        setAppActive(next === 'active');
      },
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const show =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardWillShow', () =>
            setKeyboardOpen(true),
          )
        : Keyboard.addListener('keyboardDidShow', () =>
            setKeyboardOpen(true),
          );
    const hide =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardWillHide', () =>
            setKeyboardOpen(false),
          )
        : Keyboard.addListener('keyboardDidHide', () =>
            setKeyboardOpen(false),
          );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [lineAnim]);

  const lineY = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, VIEWFINDER - 24],
  });

  const cameraActive =
    isFocused &&
    appActive &&
    !successOpen &&
    hasPermission &&
    device != null;

  const redeemCode = useCallback(async (raw: string) => {
    const code = raw.trim();
    if (!code.length) {
      setError('Enter or scan a coupon code.');
      return;
    }
    if (redeemingRef.current) return;
    redeemingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const r = await redeemCoupon(code);
      setSuccessPoints(r.pointsAdded);
      setSuccessBalance(r.newTotalBalance);
      setSuccessOpen(true);
      setManualCode('');
      Keyboard.dismiss();
    } catch (e) {
      if (isApiError(e)) {
        if (e.status === 0) {
          setError(e.message);
        } else {
          setError(userFacingApiMessage(e.message));
        }
      } else {
        const msg = e instanceof Error ? e.message : '';
        setError(
          msg && msg !== '[object Object]'
            ? msg
            : 'Could not redeem this code. Try again.',
        );
      }
    } finally {
      redeemingRef.current = false;
      setSubmitting(false);
    }
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: [...CODE_TYPES],
    onCodeScanned: codes => {
      if (successOpenRef.current || redeemingRef.current) return;
      const v = codes.find(c => c.value != null)?.value;
      if (typeof v === 'string' && v.length) {
        void redeemCode(v);
      }
    },
  });

  const submitManual = useCallback(() => {
    void redeemCode(manualCode);
  }, [manualCode, redeemCode]);

  const onRequestCamera = useCallback(async () => {
    setError(null);
    try {
      const granted = await requestPermission();
      if (!granted) {
        setError(
          'Camera access was denied. Enable it in Settings to scan codes.',
        );
      }
    } catch {
      setError('Could not request camera access. Try again.');
    }
  }, [requestPermission]);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const maskColor = useMemo(
    () => 'rgba(0,0,0,0.65)' as const,
    [],
  );

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, backgroundColor: colors.scanBg },
      ]}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <View style={styles.topBar}>
          <Pressable
            hitSlop={16}
                       onPress={() => {
              if (tabStateHasAdminShell(navigation)) {
                (
                  navigation as unknown as BottomTabNavigationProp<
                    AdminTabParamList,
                    'AdminScan'
                  >
                ).navigate('AdminHome');
              } else {
                navigation.navigate('Home');
              }
            }}
            accessibilityLabel="Close scanner">
            <Text style={styles.closeX}>{'\u2715'}</Text>
          </Pressable>
          <Text style={styles.title}>Scan Code</Text>
          <Pressable
            hitSlop={16}
            onPress={() => setFlashOn(f => !f)}
            disabled={!device || !hasPermission}>
            <Text style={[styles.flashIcon, flashOn && styles.flashOn]}>
              {'\uD83D\uDD26'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.cameraSection}
          onPress={Keyboard.dismiss}
          accessibilityRole="none">
          {device && hasPermission ? (
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={cameraActive}
              torch={flashOn ? 'on' : 'off'}
              codeScanner={codeScanner}
              enableZoomGesture
            />
          ) : (
            <View style={styles.cameraFallback}>
              {!hasPermission ? (
                <>
                  <Text style={styles.fallbackTitle}>Camera access</Text>
                  <Text style={styles.fallbackBody}>
                    Allow camera access to scan coupon QR codes and barcodes.
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.permissionBtn,
                      pressed && styles.permissionBtnPressed,
                    ]}
                    onPress={() => void onRequestCamera()}>
                    <Text style={styles.permissionBtnText}>
                      Allow camera
                    </Text>
                  </Pressable>
                  <Pressable onPress={openSettings} hitSlop={12}>
                    <Text style={styles.settingsLink}>Open Settings</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.fallbackTitle}>No camera</Text>
                  <Text style={styles.fallbackBody}>
                    This device does not have a back camera. Enter your code
                    below.
                  </Text>
                </>
              )}
            </View>
          )}

          {device && hasPermission ? (
            <View
              style={styles.maskOverlay}
              pointerEvents="none"
              importantForAccessibility="no-hide-descendants">
              <View
                style={[styles.maskFlex, { backgroundColor: maskColor }]}
              />
              <View style={styles.maskRow}>
                <View
                  style={[styles.maskSide, { backgroundColor: maskColor }]}
                />
                <View style={styles.viewfinder}>
                  <Corner brackets="tl" />
                  <Corner brackets="tr" />
                  <Corner brackets="bl" />
                  <Corner brackets="br" />
                  <Animated.View
                    style={[
                      styles.scanLine,
                      flashOn ? styles.scanLineFlash : styles.scanLineGlow,
                      { transform: [{ translateY: lineY }] },
                    ]}
                  />
                </View>
                <View
                  style={[styles.maskSide, { backgroundColor: maskColor }]}
                />
              </View>
              <View
                style={[styles.maskFlex, { backgroundColor: maskColor }]}
              />
            </View>
          ) : null}
        </Pressable>

        <View
          style={[
            styles.manualBlock,
            {
              paddingBottom: keyboardOpen ? 10 : 12 + insets.bottom,
            },
          ]}>
          <Text style={styles.manualHeading}>Manual Entry</Text>
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="Enter code manually"
              placeholderTextColor={colors.mutedGray}
              value={manualCode}
              onChangeText={t => {
                setManualCode(t);
                setError(null);
              }}
              onSubmitEditing={() => void submitManual()}
              returnKeyType="done"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!submitting}
            />
            <Pressable
              style={({ pressed }) => [
                styles.enterBtn,
                pressed && styles.enterPressed,
                submitting && styles.enterDisabled,
              ]}
              disabled={submitting || !manualCode.trim()}
              onPress={() => void submitManual()}>
              {submitting ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.enterBtnText}>ENTER</Text>
              )}
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </KeyboardAvoidingView>

      <ScanSuccessModal
        visible={successOpen}
        pointsEarned={successPoints.toLocaleString()}
        newBalance={successBalance.toLocaleString()}
        onScanAgain={() => setSuccessOpen(false)}
        onGoToWallet={() => {
          setSuccessOpen(false);
          if (tabStateHasAdminShell(navigation)) {
            (
              navigation as unknown as BottomTabNavigationProp<
                AdminTabParamList,
                'AdminScan'
              >
            ).navigate('AdminHome');
          } else {
            navigation.navigate('Rewards', { screen: 'RewardsHome' });
          }
        }}
        onDismiss={() => setSuccessOpen(false)}
      />
    </View>
  );
}

function Corner({ brackets }: { brackets: 'tl' | 'tr' | 'bl' | 'br' }) {
  const len = 28;
  const thick = 3;
  const w = colors.white;
  const base = { position: 'absolute' as const, borderColor: w };
  const arms = {
    tl: {
      top: 0,
      left: 0,
      width: len,
      height: len,
      borderTopWidth: thick,
      borderLeftWidth: thick,
      borderTopLeftRadius: 4,
    },
    tr: {
      top: 0,
      right: 0,
      width: len,
      height: len,
      borderTopWidth: thick,
      borderRightWidth: thick,
      borderTopRightRadius: 4,
    },
    bl: {
      bottom: 0,
      left: 0,
      width: len,
      height: len,
      borderBottomWidth: thick,
      borderLeftWidth: thick,
      borderBottomLeftRadius: 4,
    },
    br: {
      bottom: 0,
      right: 0,
      width: len,
      height: len,
      borderBottomWidth: thick,
      borderRightWidth: thick,
      borderBottomRightRadius: 4,
    },
  };
  return <View style={[base, arms[brackets]]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  closeX: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '400',
  },
  title: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  flashIcon: {
    fontSize: 22,
    opacity: 0.9,
  },
  flashOn: {
    opacity: 1,
    textShadowColor: '#FFEB3B',
    textShadowRadius: 8,
  },
  cameraSection: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  cameraFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scanBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  fallbackTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackBody: {
    color: colors.mutedGray,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: colors.primaryOrange,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginBottom: 12,
  },
  permissionBtnPressed: { opacity: 0.9 },
  permissionBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  settingsLink: {
    color: colors.primaryOrange,
    fontSize: 15,
    fontWeight: '600',
  },
  maskOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
  },
  maskFlex: {
    flex: 1,
  },
  maskRow: {
    height: VIEWFINDER,
    flexDirection: 'row',
  },
  maskSide: {
    flex: 1,
  },
  viewfinder: {
    width: VIEWFINDER,
    height: VIEWFINDER,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.scanLine,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 4,
  },
  scanLineGlow: {
    shadowColor: colors.scanLine,
  },
  scanLineFlash: {
    shadowColor: '#FFEB3B',
  },
  manualBlock: {
    backgroundColor: colors.scanBg,
    paddingTop: 8,
  },
  manualHeading: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  manualRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
  },
  manualInput: {
    flex: 1,
    backgroundColor: colors.scanSurface,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: colors.white,
    fontSize: 15,
  },
  enterBtn: {
    backgroundColor: colors.scanSurface,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterDisabled: { opacity: 0.6 },
  enterPressed: { opacity: 0.85 },
  enterBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#FFB4B4',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 24,
  },
});
