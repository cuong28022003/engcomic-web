import { Component, computed, inject, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { AiImportWorkspaceComponent, AiMetaBadge, AiValidationStatus } from '@shared/components/ai-import-workspace/ai-import-workspace.component';
import { ImportReviewItemsPayload } from '../../models';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-ai-review-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AiImportWorkspaceComponent],
  templateUrl: './ai-review-import-modal.component.html',
  styleUrls: ['./ai-review-import-modal.component.scss']
})
export class AiReviewImportModalComponent {
  private toast = inject(ToastService);

  readonly isOpen = input<boolean>(false);
  readonly testName = input<string>('');
  readonly questionsToReview = input<Array<{
    questionNumber: number;
    part: number;
    userAnswer?: string;
    correctAnswer: string;
    isCorrect: boolean;
    flagged?: boolean;
    testName?: string;
  }>>([]);

  readonly close = output<void>();
  readonly closed = output<void>();
  readonly importData = output<ImportReviewItemsPayload>();

  activeTab = signal<'prompt' | 'import'>('prompt');
  readonly workspaceStep = computed<'prompt' | 'paste' | 'preview'>(() => {
    return this.activeTab() === 'prompt' ? 'prompt' : 'paste';
  });

  copied = signal<boolean>(false);
  rawJsonInput = '';
  parseError = signal<string>('');
  isImporting = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.activeTab.set('prompt');
        this.rawJsonInput = '';
        this.clearError();
        this.isImporting.set(false);
      }
    });
  }

  /** Danh sách câu cần phân tích */
  readonly reviewQuestions = computed(() => {
    return this.questionsToReview();
  });

  /** Tên đề hiển thị */
  readonly selectedTestName = computed<string>(() => {
    return this.testName() || 'TOEIC Reading Test';
  });

  readonly steps = ['1. Sao Chép Prompt & PDF', '2. Dán & Import JSON'];

  readonly guideSteps = [
    'Bấm nút "Sao chép Prompt" bên dưới.',
    'Mở ChatGPT hoặc Claude.',
    'Đính kèm file PDF đề thi này vào ô chat và dán prompt vừa copy.',
    'AI sẽ đọc trực tiếp đề trong PDF và trả về JSON phân tích chuẩn xác.'
  ];

  readonly metaBadges = computed<AiMetaBadge[]>(() => [
    { icon: 'fa-solid fa-file-pdf', label: this.selectedTestName(), variant: 'primary' },
    { icon: 'fa-solid fa-circle-question', label: `${this.reviewQuestions().length} câu cần phân tích`, variant: 'warning' }
  ]);

  readonly sampleReviewJson = JSON.stringify({
    items: [
      {
        question_number: 101,
        part: 5,
        error_type: "vocab",
        error_subtype: "nhầm từ đồng âm gần nghĩa",
        passage_excerpt: "The committee decided to postpone the conference...",
        question_text: "The committee decided to _____ the conference due to bad weather.",
        options: {
          A: "postpone",
          B: "cancel",
          C: "delay",
          D: "prolong"
        },
        explanation: "Chọn postpone vì mang nghĩa hoãn lại sang ngày khác do thời tiết.",
        tip: "Phân biệt postpone (hoãn sang ngày khác) và cancel (hủy bỏ hẳn).",
        key_vocab: [
          { word: "postpone", meaning_vi: "hoãn lại" }
        ]
      }
    ]
  }, null, 2);

  readonly jsonValidationStatus = computed<AiValidationStatus | null>(() => {
    const err = this.parseError();
    if (err) {
      return { status: 'invalid', errorMessage: err };
    }
    const raw = this.rawJsonInput.trim();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim());
      const items = Array.isArray(parsed) ? parsed : parsed.items;
      if (Array.isArray(items)) {
        return { status: 'valid', itemCount: items.length };
      }
    } catch {}
    return null;
  });

  readonly generatedPrompt = computed(() => {
    const list = this.reviewQuestions();
    const name = this.selectedTestName();

    const questionRows = list.map(q => {
      const extra = q.flagged && q.isCorrect ? ' (câu tôi đánh dấu phân vân dù chọn đúng)' : '';
      return `- Câu ${q.questionNumber} (Part ${q.part}): tôi chọn "${q.userAnswer || 'Bỏ qua'}", đáp án đúng "${q.correctAnswer}"${extra}`;
    }).join('\n');

    return `Tôi vừa làm đề thi TOEIC "${name}" (đã đính kèm file PDF). Dưới đây là danh sách câu tôi làm sai hoặc phân vân, hãy đọc nội dung trong PDF đính kèm và phân tích chi tiết từng câu:

${questionRows}

Với mỗi câu, hãy trả về JSON theo đúng schema sau (không thêm bất kỳ văn bản giải thích nào ngoài JSON, không dùng markdown code block):

{
  "items": [
    {
      "question_number": 101,
      "part": 5,
      "error_type": "vocab",
      "error_subtype": "nhầm từ đồng âm gần nghĩa",
      "passage_excerpt": "trích đoạn ngắn chứa câu này trong đề",
      "question_text": "nội dung câu hỏi",
      "options": {
        "A": "lựa chọn A",
        "B": "lựa chọn B",
        "C": "lựa chọn C",
        "D": "lựa chọn D"
      },
      "explanation": "giải thích súc tích lý do đáp án đúng là đúng và phân tích điểm sai/phân vân của người làm",
      "tip": "mẹo ngắn gọn để tránh bẫy câu này",
      "key_vocab": [
        { "word": "từ_vựng", "meaning_vi": "nghĩa tiếng Việt" }
      ]
    }
  ]
}

Lưu ý:
- "key_vocab": Đọc kỹ toàn bộ đoạn trích (passage), câu hỏi và TẤT CẢ 4 đáp án A, B, C, D trong file PDF để trích xuất triệt để các từ/cụm từ quan trọng cho kỳ thi TOEIC:
  1. Phạm vi quét bắt buộc:
     - Part 5 (Câu đơn): Quét câu hỏi và CẢ 4 ĐÁP ÁN (kể cả các đáp án sai/gây nhiễu vì chúng là từ vựng TOEIC thực chiến). Mục tiêu: 3 - 6 từ/cụm từ.
     - Part 6 & 7 (Đoạn văn/Đọc hiểu): Quét sâu toàn bộ đoạn trích, câu hỏi, các đáp án và đặc biệt là các cặp từ Paraphrase (từ trong bài ↔ từ trong đáp án). Mục tiêu: 4 - 8 từ/cụm từ.
  2. Các dạng từ ưu tiên trích xuất:
     - Collocation & Cụm từ cố định (VD: in accordance with, subject to change, take advantage of, place an order).
     - Phrasal verbs, Liên từ / Trạng từ liên kết hay gặp trong đề (VD: nevertheless, preliminary, tentative, adhere to, comply with).
     - Từ vựng công sở, kinh doanh, hợp đồng, nhân sự, giao nhận, du lịch, bảo dưỡng, tài chính.
     - Các từ có word-family dễ nhầm (VD: rely/reliable/reliance) hoặc cặp từ dễ nhầm (VD: personnel/personal, considerate/considerable).
  3. Yêu cầu:
     - Bỏ qua từ sơ cấp thông thường (a, the, go, have, good, table...).
     - Ưu tiên từ xuất hiện nhiều trong đề thi TOEIC thật, sắp xếp từ quan trọng nhất lên đầu.
     - "meaning_vi": Nghĩa tiếng Việt chính xác và sát theo ngữ cảnh bài thi, không dịch nghĩa từ điển chung chung.
- "explanation": Trình bày ngắn gọn, rõ ràng, đi thẳng vào trọng tâm (khoảng 2-3 câu):
  1. Nêu lý do cốt lõi vì sao đáp án đúng là đúng (dẫn chứng cấu trúc ngữ pháp, từ loại, sự hòa hợp hoặc trích dẫn từ khóa paraphrase trong bài đọc).
  2. Phân tích tùy theo trường hợp làm bài:
     - Nếu người làm chọn sai: Chỉ ra ngắn gọn lý do vì sao đáp án đó sai hoặc bị bẫy ở điểm nào.
     - Nếu người làm chọn đúng nhưng phân vân: Khẳng định dấu hiệu nhận biết mấu chốt để tự tin chọn và giải tỏa yếu tố gây do dự/nhiễu.
     - Nếu người làm bỏ qua (chưa chọn): Chỉ ra manh mối giúp nhận biết nhanh đáp án đúng trong đề.
  - Dùng câu ngắn, súc tích, tránh lặp lại nguyên văn đề bài hay viết lan man.
- "error_type" chỉ được nhận 1 trong các giá trị: "vocab", "grammar", "inference", "detail_missed", "trap_answer", "time_pressure".
- Chỉ trả về JSON hợp lệ, đúng cấu trúc trên, không có văn bản nào khác trước hoặc sau JSON.`;
  });

  copyPrompt() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.generatedPrompt()).then(() => {
        this.copied.set(true);
        this.toast.success('Đã sao chép AI Prompt vào Clipboard!');
        setTimeout(() => this.copied.set(false), 3000);
      });
    }
  }

  clearError() {
    this.parseError.set('');
  }

  onImport() {
    this.clearError();
    const raw = this.rawJsonInput.trim();
    if (!raw) return;

    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      let items: any[] = [];
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && Array.isArray(parsed.items)) {
        items = parsed.items;
      } else if (parsed && Array.isArray(parsed.questions)) {
        items = parsed.questions;
      } else {
        throw new Error('JSON không chứa mảng "items" hợp lệ.');
      }

      if (items.length === 0) {
        throw new Error('Mảng "items" không có phần tử nào.');
      }

      const payload: ImportReviewItemsPayload = {
        items: items.map(item => ({
          question_number: Number(item.question_number || item.questionNumber || item.question || 0),
          part: item.part ? Number(item.part) : undefined,
          error_type: item.error_type || item.errorType || 'vocab',
          error_subtype: item.error_subtype || item.errorSubtype,
          passage_excerpt: item.passage_excerpt || item.passageExcerpt,
          question_text: item.question_text || item.questionText,
          options: item.options,
          explanation: item.explanation || '',
          tip: item.tip,
          key_vocab: (item.key_vocab || item.keyVocab || []).map((v: any) => ({
            word: v.word || '',
            meaning_vi: v.meaning_vi || v.meaningVi || v.meaning || ''
          }))
        }))
      };

      this.isImporting.set(true);
      this.importData.emit(payload);
    } catch (e: any) {
      this.parseError.set(e.message || 'JSON không hợp lệ. Vui lòng kiểm tra lại định dạng!');
      this.isImporting.set(false);
    }
  }

  onClose() {
    this.activeTab.set('prompt');
    this.rawJsonInput = '';
    this.clearError();
    this.isImporting.set(false);
    this.close.emit();
    this.closed.emit();
  }
}
