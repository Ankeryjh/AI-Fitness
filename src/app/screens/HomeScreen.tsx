import React, {useMemo, useState} from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {PrimaryButton} from '../components/PrimaryButton';
import {RootStackParamList} from '../navigation/RootNavigator';
import {useSessionStore} from '../store/sessionStore';
import {useSettingsStore} from '../store/settingsStore';
import {colors, radii, spacing} from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen = ({navigation}: Props): React.JSX.Element => {
  const activeSessionId = useSessionStore(state => state.activeSessionId);
  const createSession = useSessionStore(state => state.createSession);

  const defaultRestSec = useSettingsStore(state => state.defaultRestSec);
  const stepSec = useSettingsStore(state => state.stepSec);
  const soundEnabled = useSettingsStore(state => state.soundEnabled);
  const vibrationEnabled = useSettingsStore(state => state.vibrationEnabled);
  const setDefaultRestSec = useSettingsStore(state => state.setDefaultRestSec);
  const setStepSec = useSettingsStore(state => state.setStepSec);
  const setSoundEnabled = useSettingsStore(state => state.setSoundEnabled);
  const setVibrationEnabled = useSettingsStore(state => state.setVibrationEnabled);

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [restInput, setRestInput] = useState(String(defaultRestSec));
  const [stepInput, setStepInput] = useState(String(stepSec));

  const sessionButtonLabel = useMemo(
    () => (activeSessionId ? 'Resume Session' : 'Start Session'),
    [activeSessionId],
  );

  const onStartSession = () => {
    if (!activeSessionId) {
      createSession();
    }
    navigation.navigate('Session');
  };

  const openSettings = () => {
    setRestInput(String(defaultRestSec));
    setStepInput(String(stepSec));
    setSettingsVisible(true);
  };

  const saveSettings = () => {
    const nextRest = Number(restInput);
    const nextStep = Number(stepInput);

    if (Number.isFinite(nextRest) && nextRest > 0) {
      setDefaultRestSec(nextRest);
    }

    if (Number.isFinite(nextStep) && nextStep > 0) {
      setStepSec(nextStep);
    }

    setSettingsVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Training</Text>

        <PrimaryButton label={sessionButtonLabel} onPress={onStartSession} style={styles.cta} />

        <Pressable style={styles.row} onPress={() => navigation.navigate('HistoryDetail')}>
          <Text style={styles.rowLabel}>History</Text>
          <Text style={styles.rowValue}>Open</Text>
        </Pressable>

        <Pressable style={styles.row} onPress={openSettings}>
          <Text style={styles.rowLabel}>Settings</Text>
          <Text style={styles.rowValue}>{`${defaultRestSec}s / +${stepSec}s`}</Text>
        </Pressable>
      </View>

      <Modal visible={settingsVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Settings</Text>

            <Text style={styles.inputLabel}>Default Rest (sec)</Text>
            <TextInput
              value={restInput}
              onChangeText={setRestInput}
              keyboardType="number-pad"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>+/- Step (sec)</Text>
            <TextInput
              value={stepInput}
              onChangeText={setStepInput}
              keyboardType="number-pad"
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text style={styles.rowLabel}>Sound</Text>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{false: '#D7D7D7', true: '#0A0A0A'}}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.rowLabel}>Vibration</Text>
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                trackColor={{false: '#D7D7D7', true: '#0A0A0A'}}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setSettingsVisible(false)} style={styles.ghostBtn}>
                <Text style={styles.ghostText}>Cancel</Text>
              </Pressable>
              <PrimaryButton label="Save" onPress={saveSettings} style={styles.saveBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.pageX,
    paddingTop: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  cta: {
    marginBottom: spacing.xl,
  },
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  rowValue: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ghostBtn: {
    flex: 1,
    minHeight: 56,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
  },
});
