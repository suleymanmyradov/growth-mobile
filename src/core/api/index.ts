export { apiRequest, getApiClient, getBareClient, setInstallationId } from './client';
export {
  authEndpoints,
  categoryEndpoints,
  checkInEndpoints,
  goalEndpoints,
  habitEndpoints,
  personalizationEndpoints,
  profileEndpoints,
  settingsEndpoints,
} from './endpoints';
export { ApiError, fromAxiosError, type ApiErrorOptions } from './errors';
export { uploadFile, type UploadOptions } from './multipart';
export * from './schemas';
export { parseSSEStream, type SSEEvent } from './sse';
