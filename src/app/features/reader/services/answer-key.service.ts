import { Injectable } from '@angular/core';
import { AnswerKeyParseResult } from '../models';

export const TOEIC_AI_PARSE_PROMPT = `Đây là đề thi TOEIC. Hãy đọc phần Answer Key (đáp án) trong file và trả về JSON theo đúng format dưới đây. Chỉ trả về JSON thuần túy, không kèm giải thích, markdown hoặc bất kỳ nội dung nào khác.

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

@Injectable({
  providedIn: 'root'
})
export class AnswerKeyService {

  getAiParsePrompt(testName?: string): string {
    if (testName && testName.trim()) {
      const name = testName.trim();
      return TOEIC_AI_PARSE_PROMPT
        .replace('"test_name": "[Tên đề thi]"', `"test_name": "${name}"`)
        .replace('"test_name" là tên đề thi nếu có trong file. Nếu không xác định được tên đề, sử dụng "TOEIC Reading".', `"test_name": sử dụng chính xác "${name}".`);
    }
    return TOEIC_AI_PARSE_PROMPT;
  }

  async copyAiParsePrompt(testName?: string): Promise<boolean> {
    try {
      const prompt = this.getAiParsePrompt(testName);
      await navigator.clipboard.writeText(prompt);
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