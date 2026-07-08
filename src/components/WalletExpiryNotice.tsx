import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import {
  formatWalletExpiryMessage,
  formatWalletExpiryShort,
} from '../utils/walletExpiry';

type Props = {
  expireInDays: number | null | undefined;
  compact?: boolean;
  style?: object;
};

export function WalletExpiryNotice({
  expireInDays,
  compact = false,
  style,
}: Props) {
  const message = compact
    ? formatWalletExpiryShort(expireInDays)
    : formatWalletExpiryMessage(expireInDays);
  if (!message) return null;

  const urgent =
    expireInDays != null && expireInDays <= 30;

  return (
    <View
      style={[
        styles.wrap,
        urgent ? styles.wrapUrgent : styles.wrapNormal,
        style,
      ]}
      accessibilityRole="text"
    >
      <Text style={[styles.text, urgent && styles.textUrgent]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  wrapNormal: {
    backgroundColor: '#F3F4F6',
  },
  wrapUrgent: {
    backgroundColor: '#FFF5ED',
    borderWidth: 1,
    borderColor: 'rgba(249,133,53,0.35)',
  },
  text: {
    fontSize: 12,
    lineHeight: 17,
    color: '#4B5563',
    fontWeight: '500',
  },
  textUrgent: {
    color: colors.primaryOrange,
  },
});
