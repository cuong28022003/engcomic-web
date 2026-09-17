import { environment } from '@env/environment';

/**
 * Trả về URL tuyệt đối cho các đường dẫn tương đối phục vụ từ backend
 * (ví dụ `/api/toeic/tests/audio/file/x.mp3`). Giữ nguyên URL tuyệt đối
 * (http/https/blob) — Cloudinary đi qua proxy backend như cũ.
 */
export function resolveBackendPath(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const base = environment.apiUrl.replace(/\/api\/?$/, '');
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}