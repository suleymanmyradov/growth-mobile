import { PlanScreen } from '@/features/plan';

/**
 * Plan tab route (thin wrapper).
 *
 * Phase E: renders the Plan composition (goals with nested habits, untied
 * habits, All/Active/Completed filters, FAB create sheet) from `features/plan`.
 * This route file stays thin and contains no business logic.
 */
export default function PlanRoute() {
  return <PlanScreen />;
}
