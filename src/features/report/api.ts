/**
 * Report API — submit a problem/feedback/abuse report.
 *
 * Mirrors the backend gateway contract `POST /api/v1/report` returning
 * `EmptyResponse`. Runtime validation at the network boundary is mandatory
 * per AGENTS.md.
 */
import { apiRequest } from '@/core/api/client';
import { reportEndpoints } from '@/core/api/endpoints';
import { EmptyResponseSchema, type ReportRequest } from '@/core/api/schemas';

export type { ReportRequest };

/**
 * Submit a report. The backend returns an empty body on success.
 */
export async function submitReport(data: ReportRequest): Promise<void> {
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: reportEndpoints.submit,
    data,
  });
  EmptyResponseSchema.parse(response);
}
