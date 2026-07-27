/**
 * Installation ID — a random per-installation identifier sent as `X-Device-Id`
 * on login/register. Per AGENTS.md: treat it as an installation identifier,
 * not a hardware fingerprint.
 *
 * Stored in the non-secret KV store (it is not sensitive — it identifies an
 * app installation, not a user or device).
 */
import * as Application from 'expo-application';
import * as Constants from 'expo-constants';

import { getItem, setItem } from '../storage/kv';

const INSTALLATION_ID_KEY = 'growth.installation_id';

/**
 * Returns or creates the installation ID.
 * On first call, generates a random UUID and persists it.
 */
export async function getOrCreateInstallationId(): Promise<string> {
  const existing = await getItem<string>(INSTALLATION_ID_KEY);
  if (existing) return existing;

  // Use the app's native installation ID if available (Android), otherwise
  // generate a random UUID. iOS identifierForVendor is async-only.
  const nativeId = Application.getAndroidId();
  const id = nativeId ?? generateUUID();

  await setItem(INSTALLATION_ID_KEY, id);
  return id;
}

/**
 * Generates a RFC 4122 v4 UUID.
 * Uses crypto.getRandomValues when available, otherwise Math.random fallback.
 */
function generateUUID(): string {
  // React Native provides `crypto.getRandomValues` via polyfill or the runtime.
  const getRandomValues = (length: number): number[] => {
    const arr = new Array<number>(length);
    for (let i = 0; i < length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  };

  try {
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6]! & 0x0f) | 0x40;
      bytes[8] = (bytes[8]! & 0x3f) | 0x80;
      return formatUUID(bytes);
    }
  } catch {
    // Fallback below.
  }

  const bytes = getRandomValues(16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  return formatUUID(bytes);
}

function formatUUID(bytes: Uint8Array | number[]): string {
  const hex: string[] = [];
  for (const b of bytes) {
    hex.push(b.toString(16).padStart(2, '0'));
  }
  const h = hex.join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/**
 * Returns the Expo project ID from constants, if configured.
 * Used for push device registration, not for X-Device-Id.
 */
export function getExpoProjectId(): string | undefined {
  const projectId = Constants.default?.expoConfig?.extra?.eas?.projectId;
  return typeof projectId === 'string' && projectId !== 'PLACEHOLDER_EAS_PROJECT_ID'
    ? projectId
    : undefined;
}
