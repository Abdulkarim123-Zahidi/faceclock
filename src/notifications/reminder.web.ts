// Web stub: a browser tab that isn't open can't run a scheduler, and
// web push would need a backend — out of scope for the local-only v1.
// The settings screen explains this instead of showing dead controls.

export const reminderSupported = false;

export async function ensureNotificationSetup(): Promise<boolean> {
  return false;
}

export async function scheduleDailyReminder(
  _hour: number,
  _minute: number,
): Promise<void> {}

export async function cancelDailyReminder(): Promise<void> {}
