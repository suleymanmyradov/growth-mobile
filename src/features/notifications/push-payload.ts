import { z } from 'zod';

import { destinationToRoute, validateDestination } from '@/core/auth/deep-links';

const UUIDSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export const PushPayloadSchema = z.object({
  version: z.literal(1),
  notificationId: UUIDSchema,
  destination: z.string().optional(),
  resourceId: UUIDSchema.optional(),
});

export interface ParsedPushPayload {
  notificationId: string;
  route: string | null;
}

export function parsePushPayload(data: unknown): ParsedPushPayload | null {
  const parsed = PushPayloadSchema.safeParse(data);
  if (!parsed.success) return null;
  if (!parsed.data.destination) {
    return { notificationId: parsed.data.notificationId, route: null };
  }
  const destination = validateDestination(parsed.data.destination);
  if (!destination) return null;
  return {
    notificationId: parsed.data.notificationId,
    route: destinationToRoute(destination, parsed.data.resourceId),
  };
}
