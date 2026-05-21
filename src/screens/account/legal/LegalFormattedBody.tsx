import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { LegalGiftSlabTable } from './LegalGiftSlabTable';
import { GIFT_SLAB_TABLE_MARKER } from './legalGiftSlabs';
import { legalTypography } from './legalTypography';

const DEFINITION_TERM = /^•\s+(.+?)\s+refers to\s+(.*)$/;
const MAIN_SECTION = /^\d+\.\s+[A-Z][A-Z0-9 &'-]+$/;
const SUBSECTION = /^\d+\.\d+\s+\S/;
const NUMBERED_ITEM = /^\d+\.\s+[A-Za-z]/;
const CONTACT_LABEL =
  /^(Registered Office Address|Customer Support Number|Support Email|Website):$/;

function stripBullet(line: string): string {
  return line.replace(/^\s*•\s*/, '').trim();
}

function ParagraphWithBrandLink({ text }: { text: string }) {
  const parts = text.split(/(BestBond)/g);
  if (parts.length === 1) {
    return <Text style={[legalTypography.body, styles.para]}>{text}</Text>;
  }
  return (
    <Text style={[legalTypography.body, styles.para]}>
      {parts.map((part, i) =>
        part === 'BestBond' ? (
          <Text
            key={i}
            style={legalTypography.link}
            onPress={() => Linking.openURL('https://www.bestbond.in')}>
            BestBond
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

function renderLine(line: string, key: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return <View key={key} style={styles.gap} />;
  }
  if (trimmed === GIFT_SLAB_TABLE_MARKER) {
    return <LegalGiftSlabTable key={key} />;
  }
  if (MAIN_SECTION.test(trimmed)) {
    return (
      <Text key={key} style={legalTypography.section}>
        {trimmed}
      </Text>
    );
  }
  if (SUBSECTION.test(trimmed)) {
    return (
      <Text key={key} style={legalTypography.subsection}>
        {trimmed}
      </Text>
    );
  }
  if (NUMBERED_ITEM.test(trimmed) && !MAIN_SECTION.test(trimmed)) {
    return (
      <Text key={key} style={[legalTypography.body, styles.numbered]}>
        {trimmed}
      </Text>
    );
  }
  if (trimmed.startsWith('•')) {
    const def = trimmed.match(DEFINITION_TERM);
    if (def) {
      return (
        <Text key={key} style={[legalTypography.body, styles.bullet]}>
          {'• '}
          <Text style={legalTypography.bodyBold}>{def[1]}</Text>
          {` refers to ${def[2]}`}
        </Text>
      );
    }
    return (
      <Text key={key} style={[legalTypography.body, styles.bullet]}>
        • {stripBullet(trimmed)}
      </Text>
    );
  }
  if (CONTACT_LABEL.test(trimmed)) {
    return (
      <Text key={key} style={legalTypography.label}>
        {trimmed}
      </Text>
    );
  }
  return <ParagraphWithBrandLink key={key} text={trimmed} />;
}

type Props = {
  body: string;
};

export function LegalFormattedBody({ body }: Props) {
  const lines = body.split('\n');
  return (
    <View style={styles.root}>
      {lines.map((line, i) => renderLine(line, `l-${i}`))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingBottom: 8,
  },
  gap: {
    height: 8,
  },
  para: {
    marginBottom: 8,
  },
  bullet: {
    ...legalTypography.bullet,
  },
  numbered: {
    ...legalTypography.numbered,
  },
});
