import React from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { resolveRewardImageUrl } from '../../api/rewards';

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  wrapCompact: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  imageSlot: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  triptychWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
  },
  triptychInner: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  triptychRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 80,
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
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  /** Fallback height when parent has no fixed height (e.g. thumbnails). */
  minHeight?: number;
  resizeMode?: 'cover' | 'contain';
  /** Inset padding so tall product PNGs are not clipped (catalog cards). */
  padded?: boolean;
};

/** Product image for reward cards and thumbnails. */
export function RewardImageBlock({
  imageUrl,
  style,
  imageStyle,
  minHeight,
  resizeMode = 'contain',
  padded = true,
}: Props) {
  const uri = resolveRewardImageUrl(imageUrl);
  const wrapStyle = [
    styles.wrap,
    !padded && styles.wrapCompact,
    minHeight != null ? { minHeight } : null,
    style,
  ];

  if (uri) {
    return (
      <View style={wrapStyle}>
        <View style={styles.imageSlot}>
          <Image
            source={{ uri }}
            style={[styles.image, imageStyle]}
            resizeMode={resizeMode}
          />
        </View>
      </View>
    );
  }
  return (
    <View style={wrapStyle}>
      <TriptychFallback />
    </View>
  );
}
