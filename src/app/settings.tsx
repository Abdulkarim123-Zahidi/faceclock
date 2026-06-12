import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { settingsRepo } from "@/data/settings-repo";
import { useTheme } from "@/hooks/use-theme";
import {
  cancelDailyReminder,
  ensureNotificationSetup,
  reminderSupported,
  scheduleDailyReminder,
} from "@/notifications/reminder";
import type { Settings } from "@/types/entry";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    settingsRepo.get().then(setSettings);
  }, []);

  if (!settings) {
    return <Screen centered />;
  }

  async function apply(next: Settings) {
    setSettings(next);
    await settingsRepo.save(next);
    if (next.reminderEnabled) {
      await scheduleDailyReminder(next.reminderHour, next.reminderMinute);
    }
  }

  async function toggleReminder(on: boolean) {
    if (!settings) return;
    if (on) {
      const allowed = await ensureNotificationSetup();
      if (!allowed) {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
      await apply({ ...settings, reminderEnabled: true });
    } else {
      await cancelDailyReminder();
      await apply({ ...settings, reminderEnabled: false });
    }
  }

  function shiftTime(deltaHours: number, deltaMinutes: number) {
    if (!settings) return;
    const total =
      (settings.reminderHour * 60 +
        settings.reminderMinute +
        deltaHours * 60 +
        deltaMinutes +
        24 * 60) %
      (24 * 60);
    void apply({
      ...settings,
      reminderHour: Math.floor(total / 60),
      reminderMinute: total % 60,
    });
  }

  const stepperDisabled = !settings.reminderEnabled;

  return (
    <Screen>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        DAILY REMINDER
      </Text>

      {!reminderSupported ? (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
            Reminders are not available in the browser — a closed tab has no
            way to wake itself up. Use FaceClock on your phone to get the
            daily nudge.
          </Text>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>
              Remind me every day
            </Text>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={toggleReminder}
              trackColor={{ true: colors.accent }}
            />
          </View>

          {permissionDenied && (
            <Text style={[styles.denied, { color: colors.danger }]}>
              Notifications are blocked for FaceClock. Enable them in your
              system settings, then try again.
            </Text>
          )}

          <View style={[styles.row, stepperDisabled && styles.dimmed]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>At</Text>
            <View style={styles.timeControls}>
              <Stepper
                label="−1h"
                disabled={stepperDisabled}
                onPress={() => shiftTime(-1, 0)}
              />
              <Stepper
                label="−5m"
                disabled={stepperDisabled}
                onPress={() => shiftTime(0, -5)}
              />
              <Text style={[styles.time, { color: colors.text }]}>
                {pad(settings.reminderHour)}:{pad(settings.reminderMinute)}
              </Text>
              <Stepper
                label="+5m"
                disabled={stepperDisabled}
                onPress={() => shiftTime(0, 5)}
              />
              <Stepper
                label="+1h"
                disabled={stepperDisabled}
                onPress={() => shiftTime(1, 0)}
              />
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}

function Stepper({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={[styles.stepper, { borderColor: colors.border }]}
    >
      <Text style={[styles.stepperLabel, { color: colors.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: { borderRadius: 12, padding: 16, gap: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLabel: { fontSize: 15, flexShrink: 1 },
  timeControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  time: {
    fontSize: 18,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    minWidth: 64,
    textAlign: "center",
  },
  stepper: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepperLabel: { fontSize: 13, fontWeight: "600" },
  dimmed: { opacity: 0.4 },
  denied: { fontSize: 13 },
});
