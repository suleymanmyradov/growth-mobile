import { MeScreen } from '@/features/me';

/**
 * Me tab route (thin wrapper).
 *
 * Phase G: composes profile and settings public surfaces into the Me tab
 * (account overview + Coaching/Reminders/Appearance/Plan & data sections).
 * This route file stays thin and contains no business logic.
 */
export default function MeRoute() {
  return <MeScreen />;
}
