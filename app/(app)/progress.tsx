import { ProgressScreen } from '@/features/progress';

/**
 * Progress stack route (pushed from Today).
 *
 * Phase E: renders the Progress composition (weekly review summary, per-habit
 * breakdown, coach interpretation, recent activity) from `features/progress`.
 * This route file stays thin and contains no business logic.
 */
export default function ProgressRoute() {
  return <ProgressScreen />;
}
