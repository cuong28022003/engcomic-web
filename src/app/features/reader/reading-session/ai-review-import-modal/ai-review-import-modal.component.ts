import { Component, computed, inject, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { AiImportWorkspaceComponent, AiMetaBadge, AiValidationStatus } from '@shared/components/ai-import-workspace/ai-import-workspace.component';
import { ImportReviewItemsPayload } from '../../models';
import { ToastService } from '@core/services/toast.service';
import { parseCleanJson } from '@shared/utils/json.util';

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
  readonly isSubmitting = input<boolean>(false);
  readonly testName = input<string>('');
  readonly filterLabel = input<string>('');
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
  rawJsonInput = signal<string>('');
  parseError = signal<string>('');
  isImporting = signal<boolean>(false);

  readonly effectiveIsSubmitting = computed(() => this.isSubmitting() || this.isImporting());

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.activeTab.set('prompt');
        this.rawJsonInput.set('');
        this.clearError();
        this.isImporting.set(false);
      }
    });

    effect(() => {
      if (!this.isSubmitting()) {
        this.isImporting.set(false);
      }
    });
  }

  onJsonChange(value: string): void {
    this.rawJsonInput.set(value);
    this.clearError();
    this.isImporting.set(false);
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

  readonly metaBadges = computed<AiMetaBadge[]>(() => {
    const list: AiMetaBadge[] = [
      { icon: 'fa-solid fa-file-pdf', label: this.selectedTestName(), variant: 'primary' }
    ];
    if (this.filterLabel()) {
      list.push({ icon: 'fa-solid fa-filter', label: `Bộ lọc: ${this.filterLabel()}`, variant: 'info' });
    }
    list.push({
      icon: 'fa-solid fa-circle-question',
      label: `${this.reviewQuestions().length} câu (${this.filterLabel() || 'cần phân tích'})`,
      variant: 'warning'
    });
    return list;
  });

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
    const raw = this.rawJsonInput().trim();
    if (!raw) return null;
    try {
      const parsed = parseCleanJson(raw);
      const items = Array.isArray(parsed) ? parsed : (parsed?.items || parsed?.questions);
      if (Array.isArray(items) && items.length > 0) {
        return { status: 'valid', itemCount: items.length };
      }
      return { status: 'invalid', errorMessage: 'JSON cần chứa mảng "items" các câu phân tích.' };
    } catch (e: any) {
      return { status: 'invalid', errorMessage: e.message || 'Cú pháp JSON chưa đúng.' };
    }
  });

  readonly generatedPrompt = computed(() => {
    const list = this.reviewQuestions();
    const name = this.selectedTestName();
    const filter = this.filterLabel();

    if (list.length === 0) {
      return `Hiện tại không có câu hỏi nào trong bộ lọc "${filter || 'hiện tại'}" để tạo prompt phân tích.`;
    }

    const questionRows = list.map(q => {
      let statusNote = '';
      if (!q.isCorrect) {
        statusNote = q.userAnswer ? ' (tôi làm sai)' : ' (chưa làm/bỏ qua)';
      } else if (q.flagged) {
        statusNote = ' (làm đúng nhưng phân vân)';
      } else {
        statusNote = ' (làm đúng, phân tích từ vựng & cấu trúc hay)';
      }
      return `- Câu ${q.questionNumber} (Part ${q.part}): tôi chọn '${q.userAnswer || 'Bỏ qua'}', đáp án đúng '${q.correctAnswer}'${statusNote}`;
    }).join('\n');

    const filterIntro = filter ? `theo bộ lọc "${filter}"` : `cần phân tích`;

    return `Tôi vừa làm đề thi TOEIC "${name}" (đã đính kèm file PDF). Dưới đây là danh sách các câu ${filterIntro}, hãy đọc nội dung trong PDF đính kèm và phân tích chi tiết từng câu:

${questionRows}

=== SCHEMA JSON YÊU CẦU: ===
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

=== NGUYÊN TẮC PHÂN TÍCH: ===
1. "key_vocab": Đọc kỹ đoạn trích (passage), câu hỏi và TẤT CẢ 4 đáp án A, B, C, D để trích xuất các từ/cụm từ quan trọng cho TOEIC:
   - Part 5: Quét câu hỏi và CẢ 4 ĐÁP ÁN (3 - 6 từ/cụm từ).
   - Part 6 & 7: Quét toàn bộ đoạn trích, câu hỏi, đáp án và cặp từ Paraphrase (4 - 8 từ/cụm từ).
   - Ưu tiên Collocations, Phrasal verbs, Liên từ/Trạng từ liên kết, từ vựng công sở/kinh doanh/hợp đồng.
   - Bỏ qua từ sơ cấp thông thường. "meaning_vi" phải chuẩn theo ngữ cảnh bài thi.
2. "explanation": Ngắn gọn (khoảng 2-3 câu), nêu rõ lý do đáp án đúng và chỉ ra điểm bẫy/nhầm lẫn.
3. "error_type" chỉ nhận 1 trong các giá trị: "vocab", "grammar", "inference", "detail_missed", "trap_answer", "time_pressure".

=== QUY TẮC BẮT BUỘC ĐỂ TRÁNH LỖI CÚ PHÁP JSON (ZERO-ERROR PROMPT): ===
1. Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ (bắt đầu bằng { và kết thúc bằng }).
2. KHÔNG bọc trong markdown code block (\`\`\`json), KHÔNG thêm bất kỳ lời chào hay câu chữ nào ở trước hoặc sau JSON.
3. QUY TẮC DẤU TRÍCH DẪN (QUAN TRỌNG NHẤT): Trong các chuỗi "explanation", "question_text", "passage_excerpt", "tip", TUYỆT ĐỐI KHÔNG dùng dấu ngoặc kép đôi " để trích dẫn từ hoặc cụm từ. BẮT BUỘC dùng dấu ngoặc đơn '...' (Ví dụ: viết 'postpone' thay vì "postpone") để không làm hỏng cú pháp JSON.
4. Đảm bảo đúng định dạng JSON: tất cả keys phải bọc trong ngoặc kép ", các phần tử ngăn cách bởi dấu phẩy ,, không có dấu phẩy thừa ở phần tử cuối cùng.
5. Không tự ý xuống dòng (newline) bên trong một chuỗi ký tự.`;
  });

  copyPrompt() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.generatedPrompt()).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 3000);
      });
    }
  }

  clearError() {
    this.parseError.set('');
  }

  onImport() {
    this.clearError();
    const raw = this.rawJsonInput().trim();
    if (!raw) return;

    try {
      const parsed = parseCleanJson(raw);

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
    this.rawJsonInput.set('');
    this.clearError();
    this.isImporting.set(false);
    this.close.emit();
    this.closed.emit();
  }
}

