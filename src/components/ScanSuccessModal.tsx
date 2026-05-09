import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CelebrationBackground, ScannerWhite } from '../assets/svgs';
import { AppButton } from './ui';
import { colors } from '../theme/colors';

type Props = {
  visible: boolean;
  pointsEarned: string;
  newBalance: string;
  onScanAgain: () => void;
  onGoToWallet: () => void;
  onDismiss: () => void;
};

export function ScanSuccessModal({
  visible,
  pointsEarned,
  newBalance,
  onScanAgain,
  onGoToWallet,
  onDismiss,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.illustration}>
            <View style={styles.celebrationLayer}>
              <CelebrationBackground width={320} height={200} />
            </View>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          </View>

          <Text style={styles.statusLabel}>SCAN SUCCESSFUL</Text>
          <Text style={styles.pointsBig}>+{pointsEarned} Points</Text>
          <Text style={styles.balanceLine}>
            New Total Balance:{' '}
            <Text style={styles.balanceNum}>{newBalance}</Text>
          </Text>

          <AppButton
            text="Scan Coupon"
            onPress={onScanAgain}
            leftIcon={<ScannerWhite width={22} height={22} />}
            style={styles.primaryBtn}
          />

          <AppButton
            text="Go to Wallet"
            onPress={onGoToWallet}
            variant="neutral"
            style={styles.secondaryBtn}
          />

          <Pressable onPress={onDismiss} hitSlop={12}>
            <Text style={styles.dismiss}>Dismiss for now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  illustration: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  celebrationLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.navyAlt,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginTop: 36,
  },
  checkMark: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.labelGray,
    marginTop: 8,
  },
  pointsBig: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryOrange,
    marginTop: 10,
  },
  balanceLine: {
    fontSize: 15,
    color: colors.mutedGray,
    marginTop: 10,
    marginBottom: 22,
  },
  balanceNum: {
    fontWeight: '700',
    color: colors.navyAlt,
  },
  primaryBtn: {
    marginTop: 0,
    width: '100%',
  },
  secondaryBtn: {
    marginTop: 12,
    width: '100%',
  },
  dismiss: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
    color: colors.labelGray,
  },
  pressed: { opacity: 0.92 },
});
