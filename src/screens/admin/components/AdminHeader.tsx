import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTopBar } from '../../../components/ui';
import { adminUi } from '../../../theme/adminUi';

type Props = {
  title: string;
  onBack?: () => void;
};

export function AdminHeader({ title, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 12) }]}>
      <AppTopBar
        title={title}
        onBack={() => (onBack ? onBack() : navigation.goBack())}
        containerStyle={styles.topBar}
        titleColor={adminUi.sectionTitle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: adminUi.screenBg,
  },
  topBar: { paddingBottom: 12 },
});
