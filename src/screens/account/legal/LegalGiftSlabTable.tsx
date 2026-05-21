import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LEGAL_GIFT_SLABS } from './legalGiftSlabs';
import { legalTypography } from './legalTypography';

export function LegalGiftSlabTable() {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.headerCell, styles.colPoints]}>
          Required Points
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.colGift]}>Gift</Text>
      </View>
      {LEGAL_GIFT_SLABS.map((row, i) => (
        <View
          key={`${row.points}-${row.gift}`}
          style={[styles.dataRow, i % 2 === 1 && styles.dataRowAlt]}>
          <Text style={[styles.cell, styles.colPoints]}>{row.points}</Text>
          <Text style={[styles.cell, styles.colGift]}>{row.gift}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D1D5DB',
  },
  dataRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  dataRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  cell: {
    ...legalTypography.body,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  headerCell: {
    fontFamily: legalTypography.subsection.fontFamily,
    fontSize: legalTypography.subsection.fontSize,
    fontWeight: '700',
    color: '#000000',
  },
  colPoints: {
    width: '38%',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E5E7EB',
  },
  colGift: {
    flex: 1,
  },
});
