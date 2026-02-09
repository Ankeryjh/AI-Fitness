import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {SetRecord} from '../types/models';
import {colors} from '../theme/tokens';

interface SetLogRowProps {
  setRecord: SetRecord;
}

export const SetLogRow = ({setRecord}: SetLogRowProps): React.JSX.Element => {
  const weight = typeof setRecord.weight === 'number' ? `${setRecord.weight}kg` : '--kg';
  const reps = typeof setRecord.reps === 'number' ? `${setRecord.reps}` : '--';
  const restText =
    typeof setRecord.restActualSec === 'number' ? `${setRecord.restActualSec}s` : '--';

  return (
    <View style={styles.row}>
      <Text style={styles.primary}>{`#${setRecord.index}  ${weight} x ${reps}`}</Text>
      <Text style={styles.secondary}>{`Rest ${restText}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  primary: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  secondary: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
