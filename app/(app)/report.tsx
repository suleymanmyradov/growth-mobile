import { ReportScreen } from '@/features/report';

/**
 * Report stack route (pushed content screen).
 *
 * Accepts optional `title` and `type` query params so callers (e.g. the
 * article reader's Report link) can prefill context. The ReportScreen reads
 * these via `useLocalSearchParams`. This wrapper stays thin and contains no
 * business logic.
 */
export default function ReportRoute() {
  return <ReportScreen />;
}
