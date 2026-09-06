/**
 * Utility to extract, sanitize, and repair JSON strings from AI model responses.
 */

/**
 * Parses a JSON string that may be wrapped in markdown codeblocks or surrounded by conversational text.
 * Also repairs common syntax anomalies such as trailing commas.
 */
export function extractAndParseJson<T = any>(raw: string): T {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Nội dung JSON rỗng.');
  }

  let cleaned = raw.trim();

  // 1. Strip markdown fences if present (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 2. Extract outermost JSON structure ({ ... } or [ ... ]) if conversational text exists
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;

  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    const isObject = cleaned[startIdx] === '{';
    const endChar = isObject ? '}' : ']';
    const lastIdx = cleaned.lastIndexOf(endChar);
    if (lastIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, lastIdx + 1);
    }
  }

  // 3. Try standard JSON.parse first
  try {
    return JSON.parse(cleaned);
  } catch (initialError: any) {
    // 4. Try repairing common LLM formatting issues
    try {
      const repaired = repairJsonString(cleaned);
      return JSON.parse(repaired);
    } catch {
      throw new Error(initialError?.message || 'Cú pháp JSON không hợp lệ.');
    }
  }
}

/**
 * Repairs minor JSON formatting quirks often produced by LLMs:
 * - Trailing commas in arrays or objects
 * - Single-line and multi-line comments
 */
export function repairJsonString(jsonStr: string): string {
  return jsonStr
    // Remove trailing commas before closing braces/brackets
    .replace(/,\s*([}\]])/g, '$1')
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')
    .trim();
}
