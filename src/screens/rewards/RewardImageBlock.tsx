import React from 'react';
import { Image, StyleSheet, View, type ImageStyle } from 'react-native';

const styles = StyleSheet.create({
  triptychWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
  },
  triptychInner: {
    padding: 10,
  },
  triptychRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 120,
  },
  triptychSeg: {
    flex: 1,
    borderRadius: 4,
  },
  triptychV: {
    width: 2,
    backgroundColor: '#1A1A1A',
    opacity: 0.35,
  },
  remoteImg: {
    width: '100%',
    minHeight: 144,
    backgroundColor: '#ECECEC',
  },
});

function TriptychFallback() {
  return (
    <View style={styles.triptychWrap}>
      <View style={[styles.triptychInner, { backgroundColor: '#FFFFFF' }]}>
        <View style={styles.triptychRow}>
          <View style={[styles.triptychSeg, { backgroundColor: '#E8D44D' }]} />
          <View style={styles.triptychV} />
          <View style={[styles.triptychSeg, { backgroundColor: '#F5D547' }]} />
          <View style={styles.triptychV} />
          <View style={[styles.triptychSeg, { backgroundColor: '#2E2E2E' }]} />
        </View>
      </View>
    </View>
  );
}

type Props = {
  imageUrl: string | null;
  style?: ImageStyle;
  minHeight?: number;
};

/** Product hero image: remote URL when present, otherwise Figma-style triptych placeholder. */
export function RewardImageBlock({ imageUrl, style, minHeight = 144 }: Props) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.remoteImg, { minHeight }, style]}
        resizeMode="cover"
      />
    );
  }
  return <TriptychFallback />;
}
