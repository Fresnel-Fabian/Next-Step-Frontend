import { API_BASE_URL } from '@/services/api';

/** Build a full URL for opening uploaded files (uses configured API host, not hardcoded localhost). */
export function resolveFileOpenUrl(fileUrl: string): string {
  if (fileUrl.startsWith('http')) return fileUrl;
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  return `${base}${path}`;
}
