import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = { children: ReactNode };

type State = { error: Error | null };

/**
 * Catches JavaScript render errors so a single bad screen does not hard-crash
 * the native process (users see a recovery UI instead of the OS crash dialog).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.warn('ErrorBoundary', error.message, info.componentStack);
    }
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <View style={styles.box} accessibilityRole="alert">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            Please try again. If the problem continues, reinstall or update the
            app.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            onPress={this.reset}>
            <Text style={styles.btnText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    backgroundColor: colors.offWhite,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: colors.labelGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  btn: {
    backgroundColor: colors.primaryOrange,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  btnPressed: { opacity: 0.9 },
  btnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
