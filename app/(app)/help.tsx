import { HelpScreen } from '@/features/help';

/**
 * Help & guide stack route (pushed from the Me tab's Support section).
 *
 * This route file stays thin and contains no business logic. The help content
 * and rendering live in `features/help`.
 */
export default function HelpRoute() {
  return <HelpScreen />;
}
