/**
 * Best Bond — onboarding & auth flow
 *
 * @format
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AppNavigator } from './src/navigation/AppNavigator';

function App() {
  return (
    <View style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AppNavigator />
        </ErrorBoundary>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

});

export default App;
