import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  value: string;
  onChange: (next: string) => void;
  secure?: boolean;
  autoFocus?: boolean;
};

export function SixDigitInput({
  value,
  onChange,
  secure = false,
  autoFocus = false,
}: Props) {
  const inputsRef = useRef<(TextInputType | null)[]>([]);
  const digits = value.split('').slice(0, 6);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(
    autoFocus ? 0 : null,
  );

  const setAt = (index: number, char: string) => {
    const next = value.split('');
    while (next.length < 6) {
      next.push('');
    }
    if (char === '') {
      next[index] = '';
    } else {
      const d = char.replace(/\D/g, '').slice(-1);
      if (!d) {
        return;
      }
      next[index] = d;
    }
    onChange(next.join('').replace(/\s/g, '').slice(0, 6));
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const onKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Pressable
          key={i}
          style={styles.cellWrap}
          onPress={() => inputsRef.current[i]?.focus()}
          hitSlop={8}>
          <View
            pointerEvents="none"
            style={[
              styles.circle,
              focusedIndex === i
                ? styles.circleActive
                : digits[i]
                  ? styles.circleFilled
                  : styles.circleEmpty,
            ]}>
            <Text style={styles.digitText}>
              {digits[i]
                ? secure
                  ? '•'
                  : digits[i]
                : ''}
            </Text>
          </View>
          <TextInput
            ref={r => {
              inputsRef.current[i] = r;
            }}
            value={digits[i] ?? ''}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() =>
              setFocusedIndex(prev => (prev === i ? null : prev))
            }
            onChangeText={t => {
              if (t.length > 1) {
                const merged = t.replace(/\D/g, '').slice(0, 6);
                onChange(merged);
                const nextIdx = Math.min(merged.length, 5);
                inputsRef.current[nextIdx]?.focus();
                return;
              }
              setAt(i, t);
            }}
            onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={autoFocus && i === 0}
            showSoftInputOnFocus
            caretHidden
            selectionColor="transparent"
            underlineColorAndroid="transparent"
            accessibilityLabel={`PIN digit ${i + 1}`}
            pointerEvents="none"
            style={styles.hiddenInput}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cellWrap: {
    position: 'relative',
    flex: 1,
    maxWidth: 56,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  circle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleEmpty: {
    borderColor: colors.borderGray,
  },
  circleFilled: {
    borderColor: '#0B0F14',
    borderWidth: 2,
  },
  circleActive: {
    borderColor: '#16A34A',
    borderWidth: 2,
  },
  digitText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
    fontSize: 16,
    color: 'transparent',
  },
});
