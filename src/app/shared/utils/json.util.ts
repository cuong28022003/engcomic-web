/**
 * JSON Helper - Xử lý bóc tách và parse JSON chuẩn từ kết quả phản hồi của AI.
 */
export function parseCleanJson<T = any>(raw: string): T {
  if (!raw || !raw.trim()) {
    throw new Error('Dữ liệu JSON đang để trống.');
  }
  let cleaned = raw.trim();
  // Loại bỏ các khối markdown code block ```json ... ``` nếu người dùng copy cả khối
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}
