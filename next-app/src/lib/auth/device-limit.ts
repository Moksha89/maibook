export const DEVICE_LIMIT_SETTING_KEY = "security.deviceLimit";

/** Device limit is off unless the Settings switch is explicitly enabled. Missing or invalid values stay off. */
export function isDeviceLimitEnabled(setting: unknown): boolean {
  if (!setting || typeof setting !== "object" || Array.isArray(setting)) return false;
  return (setting as { enabled?: unknown }).enabled === true;
}
