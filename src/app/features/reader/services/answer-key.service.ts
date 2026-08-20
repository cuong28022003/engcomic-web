import { Injectable } from '@angular/core';
import { AnswerKeyParseResult } from '../models';

export const TOEIC_AI_PARSE_PROMPT = `Đây là đề thi TOEIC. Hãy đọc phần Answer Key (đáp án) trong file và trả về JSON theo đúng format dưới đây. Chỉ trả về JSON thuần túy, không kèm giải thích hay markdown.

Format yêu cầu:
{
  "test_name": "[Tên đề thi]",
  "questions": [
    { "number": 101, "part": 5, "correct_answer": "C" },
    { "number": 102, "part": 5, "correct_answer": "A" },
    { "number": 147, "part": 7, "correct_answer": "D" }
  ]
}

Lưu ý:
- number: số câu từ 101 đến 200 (TOEIC Reading)
- part: 5, 6, hoặc 7 (dựa theo cấu trúc đề)
- correct_answer: chỉ là 1 ký tự "A", "B", "C", hoặc "D"
- Trả về đủ 100 câu đọc (101-200)`;

@Injectable({
  providedIn: 'root'
})
export class AnswerKeyService {

  getAiParsePrompt(): string {
    return TOEIC_AI_PARSE_PROMPT;
  }

  async copyAiParsePrompt(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(TOEIC_AI_PARSE_PROMPT);
      return true;
    } catch (e) {
      console.error('Failed to copy prompt to clipboard', e);
      return false;
    }
  }

  parseJson(rawInput: string): AnswerKeyParseResult {
    const errors: string[] = [];
    if (!rawInput || !rawInput.trim()) {
      return { valid: false, questions: [], errors: ['Nội dung JSON đang để trống'] };
    }

    let cleaned = rawInput.trim();
    // Strip markdown code fences if present: ```json ... ``` or ``` ... ```
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e: any) {
      return { valid: false, questions: [], errors: [`Lỗi cú pháp JSON: ${e.message}`] };
    }

    const testName = typeof parsed.test_name === 'string' ? parsed.test_name.trim() : undefined;
    const questionsRaw = Array.isArray(parsed.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : null);

    if (!questionsRaw || questionsRaw.length === 0) {
      return { valid: false, testName, questions: [], errors: ['Không tìm thấy danh sách câu hỏi trong mảng "questions"'] };
    }

    const questions: Array<{ number: number; part: number; correctAnswer: string }> = [];
    const seenNumbers = new Set<number>();

    for (let i = 0; i < questionsRaw.length; i++) {
      const item = questionsRaw[i];
      const num = Number(item.number ?? item.question_number ?? item.num);
      let part = Number(item.part ?? (num >= 101 && num <= 130 ? 5 : (num >= 131 && num <= 146 ? 6 : 7)));
      const rawAns = item.correct_answer ?? item.correctAnswer ?? item.answer;
      const ans = typeof rawAns === 'string' ? rawAns.trim().toUpperCase() : '';

      if (isNaN(num)) {
        errors.push(`Mục thứ ${i + 1}: "number" không hợp lệ`);
        continue;
      }

      if (seenNumbers.has(num)) {
        errors.push(`Câu ${num} bị trùng lặp`);
      } else {
        seenNumbers.add(num);
      }

      if (!['A', 'B', 'C', 'D'].includes(ans)) {
        errors.push(`Câu ${num}: Đáp án "${ans}" không hợp lệ (chỉ chấp nhận A, B, C, D)`);
      }

      if (![5, 6, 7].includes(part)) {
        // Auto default part based on standard TOEIC question numbers
        if (num >= 101 && num <= 130) part = 5;
        else if (num >= 131 && num <= 146) part = 6;
        else part = 7;
      }

      questions.push({
        number: num,
        part: part,
        correctAnswer: ans
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