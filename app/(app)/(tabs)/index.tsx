import { TodayScreen } from '@/features/home';

/**
 * Today tab route (thin wrapper).
 *
 * Phase E: renders the Today composition (coach insight, daily check-ins,
 * compact goal progress, Progress entry, notification bell) from
 * `features/home`. This route file stays thin and contains no business logic.
 */
export default function TodayRoute() {
  return <TodayScreen />;
}
