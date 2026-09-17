import { Injectable } from '@angular/core';
import { AnswerKeyParseResult, ToeicSection } from '../models';

export const TOEIC_AI_PARSE_PROMPT = `Đây là đề thi TOEIC Reading. Hãy đọc phần Answer Key (đáp án) trong file và trả về JSON theo đúng format dưới đây. Chỉ trả về JSON thuần túy, không kèm giải thích, markdown hoặc bất kỳ nội dung nào khác.

Format yêu cầu:
{
  "test_name": "[Tên đề thi]",
  "questions": [
    { "number": 101, "part": 5, "correct_answer": "C" },
    { "number": 102, "part": 5, "correct_answer": "A" },
    { "number": 130, "part": 5, "correct_answer": "D" },
    { "number": 131, "part": 6, "correct_answer": "B" },
    { "number": 146, "part": 6, "correct_answer": "C" },
    { "number": 147, "part": 7, "correct_answer": "D" },
    { "number": 200, "part": 7, "correct_answer": "A" }
  ]
}

Quy tắc xác định Part:
- Part 5: câu 101 đến 130.
- Part 6: câu 131 đến 146.
- Part 7: câu 147 đến 200.

Mapping bắt buộc:
- 101 <= number <= 130 → part = 5
- 131 <= number <= 146 → part = 6
- 147 <= number <= 200 → part = 7

Lưu ý:
- number: số câu từ 101 đến 200 của TOEIC Reading.
- part: chỉ được phép là 5, 6 hoặc 7 và phải tuân thủ chính xác mapping ở trên.
- correct_answer: chỉ được phép là một trong bốn ký tự "A", "B", "C", "D".
- Trả về chính xác đủ 100 câu, từ 101 đến 200, không được thiếu câu nào.
- Các câu phải được sắp xếp theo thứ tự tăng dần từ 101 đến 200.
- Không tự suy đoán hoặc thay đổi đáp án trong Answer Key.
- Hãy đọc chính xác đáp án tương ứng với từng số câu trong Answer Key.
- Nếu Answer Key được trình bày thành nhiều cột hoặc nhiều dòng, hãy đảm bảo ghép đúng số câu với đáp án tương ứng.
- "test_name" là tên đề thi nếu có trong file. Nếu không xác định được tên đề, sử dụng "TOEIC Reading".

Chỉ trả về JSON hợp lệ theo đúng format trên.`;

export const TOEIC_AI_PARSE_PROMPT_LISTENING = `Đây là đề thi TOEIC Listening. Hãy đọc phần Answer Key (đáp án) trong file và trả về JSON theo đúng format dưới đây. Nếu có đính kèm thêm file PDF transcript của phần thu âm, hãy trích xuất "transcript" cho từng câu. Chỉ trả về JSON thuần túy, không kèm giải thích, markdown hoặc bất kỳ nội dung nào khác.

Format yêu cầu:
{
  "test_name": "[Tên đề thi]",
  "questions": [
    { "number": 1, "part": 1, "correct_answer": "B", "transcript": "A man is watering the plants in the garden." },
    { "number": 7, "part": 2, "correct_answer": "C", "transcript": "Option A - ..." },
    { "number": 32, "part": 3, "correct_answer": "A", "transcript": "Woman: ... Man: ..." },
    { "number": 71, "part": 4, "correct_answer": "D", "transcript": "Good morning everyone, ..." },
    { "number": 100, "part": 4, "correct_answer": "C", "transcript": "..." }
  ]
}

Quy tắc xác định Part:
- Part 1: câu 1 đến 6.
- Part 2: câu 7 đến 31.
- Part 3: câu 32 đến 70.
- Part 4: câu 71 đến 100.

Mapping bắt buộc:
- 1 <= number <= 6 → part = 1
- 7 <= number <= 31 → part = 2
- 32 <= number <= 70 → part = 3
- 71 <= number <= 100 → part = 4

Lưu ý:
- number: số câu từ 1 đến 100 của TOEIC Listening.
- part: chỉ được phép là 1, 2, 3 hoặc 4 và phải tuân thủ chính xác mapping ở trên.
- correct_answer: phần lớn là một trong bốn ký tự "A", "B", "C", "D"; riêng Part 2 (câu 7-31) chỉ có 3 đáp án "A", "B", "C".
- transcript: CHỈ bắt buộc khi người dùng đính kèm file PDF transcript. Trích chính xác phần transcript của đoạn audio tương ứng với câu đó, không thêm thắt suy diễn. Nếu KHÔNG đính kèm transcript, bỏ field này.
- Trả về chính xác đủ 100 câu, từ 1 đến 100, không được thiếu câu nào.
- Các câu phải được sắp xếp theo thứ tự tăng dần từ 1 đến 100.
- Không tự suy đoán hoặc thay đổi đáp án trong Answer Key.
- Hãy đọc chính xác đáp án tương ứng với từng số câu trong Answer Key.
- Nếu Answer Key được trình bày thành nhiều cột hoặc nhiều dòng, hãy đảm bảo ghép đúng số câu với đáp án tương ứng.
- "test_name" là tên đề thi nếu có trong file. Nếu không xác định được tên đề, sử dụng "TOEIC Listening".

Chỉ trả về JSON hợp lệ theo đúng format trên.`;

export interface QuestionInputShape {
  number?: number;
  question_number?: number;
  num?: number;
  part?: number;
  correct_answer?: string;
  correctAnswer?: string;
  answer?: string;
  audio_start_ms?: number;
  audioStartMs?: number;
  transcript?: string;
}

function partFromNumber(num: number, section: ToeicSection): number {
  if (section === 'listening') {
    if (num <= 6) return 1;
    if (num <= 31) return 2;
    if (num <= 70) return 3;
    return 4;
  }
  if (num <= 130) return 5;
  if (num <= 146) return 6;
  return 7;
}

@Injectable({
  providedIn: 'root'
})
export class AnswerKeyService {

  getAiParsePrompt(testName?: string, section: ToeicSection = 'reading'): string {
    const base = section === 'listening' ? TOEIC_AI_PARSE_PROMPT_LISTENING : TOEIC_AI_PARSE_PROMPT;
    if (testName && testName.trim()) {
      const name = testName.trim();
      return base
        .replace('"test_name": "[Tên đề thi]"', `"test_name": "${name}"`)
        .replace(/"test_name" là tên đề thi nếu có trong file\. Nếu không xác định được tên đề, sử dụng "[^"]+"/, `"test_name": sử dụng chính xác "${name}".`);
    }
    return base;
  }

  async copyAiParsePrompt(testName?: string, section: ToeicSection = 'reading'): Promise<boolean> {
    try {
      const prompt = this.getAiParsePrompt(testName, section);
      await navigator.clipboard.writeText(prompt);
      return true;
    } catch (e) {
      console.error('Failed to copy prompt to clipboard', e);
      return false;
    }
  }

  parseJson(rawInput: string, section: ToeicSection = 'reading'): AnswerKeyParseResult {
    const errors: string[] = [];
    if (!rawInput || !rawInput.trim()) {
      return { valid: false, questions: [], errors: ['Nội dung JSON đang để trống'] };
    }

    // Nếu không chỉ định section, phát hiện từ số câu: có câu <= 100 là Listening
    let resolvedSection: ToeicSection = section;
    if (resolvedSection === 'reading') {
      try {
        const sniff = JSON.parse(rawInput.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim());
        const sniffRaw = Array.isArray(sniff.questions) ? sniff.questions : (Array.isArray(sniff) ? sniff : []);
        if (sniffRaw.some((q: QuestionInputShape) => {
          const num = Number(q.number ?? q.question_number ?? q.num);
          return num > 0 && num < 101;
        })) {
          resolvedSection = 'listening';
        }
      } catch {
        // ignore, keep default
      }
    }

    let cleaned = rawInput.trim();
    // Strip markdown code fences if present: ```json ... ``` or ``` ... ```
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'JSON không hợp lệ';
      return { valid: false, questions: [], errors: [`Lỗi cú pháp JSON: ${msg}`] };
    }

    const parsedObj = parsed as { test_name?: unknown; questions?: unknown };
    const testName = typeof parsedObj.test_name === 'string' ? parsedObj.test_name.trim() : undefined;
    const questionsRaw = Array.isArray(parsedObj.questions)
      ? parsedObj.questions
      : (Array.isArray(parsed) ? parsed : null);

    if (!questionsRaw || questionsRaw.length === 0) {
      return { valid: false, testName, questions: [], errors: ['Không tìm thấy danh sách câu hỏi trong mảng "questions"'] };
    }

    const allowedParts = resolvedSection === 'listening' ? [1, 2, 3, 4] : [5, 6, 7];
    const questions: Array<{ number: number; part: number; correctAnswer: string; audioStartMs?: number; transcript?: string }> = [];
    const seenNumbers = new Set<number>();

    for (let i = 0; i < questionsRaw.length; i++) {
      const item = questionsRaw[i] as QuestionInputShape;
      const num = Number(item.number ?? item.question_number ?? item.num);
      let part = Number(item.part ?? partFromNumber(num, resolvedSection));
      const rawAns = item.correct_answer ?? item.correctAnswer ?? item.answer;
      const ans = typeof rawAns === 'string' ? rawAns.trim().toUpperCase() : '';
      const audioStartMsRaw = item.audio_start_ms ?? item.audioStartMs;
      const audioStartMs = typeof audioStartMsRaw === 'number'
        ? (Number.isFinite(audioStartMsRaw) ? Math.max(0, Math.round(audioStartMsRaw)) : undefined)
        : undefined;
      const transcript = typeof item.transcript === 'string' && item.transcript.trim() ? item.transcript.trim() : undefined;

      if (isNaN(num)) {
        errors.push(`Mục thứ ${i + 1}: "number" không hợp lệ`);
        continue;
      }

      if (seenNumbers.has(num)) {
        errors.push(`Câu ${num} bị trùng lặp`);
      } else {
        seenNumbers.add(num);
      }

      const allowedAns = resolvedSection === 'listening' && part === 2 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
      if (!allowedAns.includes(ans)) {
        errors.push(`Câu ${num}: Đáp án "${ans}" không hợp lệ${resolvedSection === 'listening' && part === 2 ? ' (Part 2 chỉ có A, B, C)' : ' (chỉ chấp nhận A, B, C, D)'}`);
      }

      if (!allowedParts.includes(part)) {
        part = partFromNumber(num, resolvedSection);
      }

      questions.push({
        number: num,
        part: part,
        correctAnswer: ans,
        ...(audioStartMs !== undefined ? { audioStartMs } : {}),
        ...(transcript !== undefined ? { transcript } : {})
      });
    }

    // Sort by question number ascending
    questions.sort((a, b) => a.number - b.number);

    const valid = errors.length === 0 && questions.length > 0;
    return {
      valid,
      testName,
      questions,
      errors
    };
  }
}