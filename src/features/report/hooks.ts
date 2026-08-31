/**
 * Report hooks — React Query mutation for submitting a report.
 *
 * Reports are non-idempotent writes, so the mutation is not retried
 * automatically (React Query default). Duplicate taps are prevented in the
 * screen via `isPending`.
 */
import { useMutation } from '@tanstack/react-query';

import type { ReportRequest } from '@/core/api/schemas';

import { submitReport } from './api';

export function useSubmitReport() {
  return useMutation({
    mutationFn: (data: ReportRequest) => submitReport(data),
  });
}
