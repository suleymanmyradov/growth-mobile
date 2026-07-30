import { ProfileScreen } from '@/features/profile';

/**
 * Me tab route (thin wrapper).
 *
 * Phase D: temporary bridge — renders the existing Profile screen so profile
 * access stays available during the redesign. Phase G composes profile and
 * settings public surfaces into Me without moving remote state into a new
 * store. This route file stays thin and contains no business logic.
 */
export default function MeRoute() {
  return <ProfileScreen />;
}
