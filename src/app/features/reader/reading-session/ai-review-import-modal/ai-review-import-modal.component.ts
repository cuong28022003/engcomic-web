import { Component, computed, inject, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { AiImportWorkspaceComponent, AiMetaBadge, AiValidationStatus } from '@shared/components/ai-import-workspace/ai-import-workspace.component';
import { ImportReviewItemsPayload } from '../../models';
import { ToastService } from '@core/services/toast.service';
import { parseCleanJson } from '@shared/utils/json.util';

const JSON_OUTPUT_RULES = `=== QUY TẮC BẮT BUỘC ĐỂ TRÁNH LỖI CÚ PHÁP JSON (ZERO-ERROR PROMPT): ===
1. Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ (bắt đầu bằng { và kết thúc bằng }).
2. KHÔNG bọc trong markdown code block (` + '```json' + `), KHÔNG thêm bất kỳ lời chào hay câu chữ nào ở trước hoặc sau JSON.
3. QUY TẮC DẤU TRÍCH DẪN (QUAN TRỌNG NHẤT): Trong các chuỗi "explanation", "question_text", "passage_excerpt", "tip", "meaning", "example", "context_note", TUYỆT ĐỐI KHÔNG dùng dấu ngoặc kép đôi " để trích dẫn từ hoặc cụm từ. BẮT BUỘC dùng dấu ngoặc đơn '...' (Ví dụ: viết 'postpone' thay vì "postpone") để không làm hỏng cú pháp JSON.
4. Đảm bảo đúng định dạng JSON: tất cả keys phải bọc trong ngoặc kép ", các phần tử ngăn cách bởi dấu phẩy ,, không có dấu phẩy thừa ở phần tử cuối cùng.
5. Không tự ý xuống dòng (newline) bên trong một chuỗi ký tự.`;

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
  readonly section = input<'reading' | 'listening' | ''>('');
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

  readonly isListening = computed(() => this.section() === 'listening');

  readonly guideSteps = computed<string[]>(() => {
    if (this.isListening()) {
      return [
        'Bấm nút "Sao chép Prompt" bên dưới.',
        'Mở ChatGPT hoặc Claude.',
        'Đính kèm 2 file PDF vào ô chat: PDF đề thi (câu hỏi) và PDF transcript, rồi dán prompt vừa copy.',
        'AI sẽ đọc song song đề + transcript và trả về JSON phân tích sát nội dung thu âm.'
      ];
    }
    return [
      'Bấm nút "Sao chép Prompt" bên dưới.',
      'Mở ChatGPT hoặc Claude.',
      'Đính kèm file PDF đề thi này vào ô chat và dán prompt vừa copy.',
      'AI sẽ đọc trực tiếp đề trong PDF và trả về JSON phân tích chuẩn xác.'
    ];
  });

  readonly metaBadges = computed<AiMetaBadge[]>(() => {
    const list: AiMetaBadge[] = [
      { icon: 'fa-solid fa-file-pdf', label: this.selectedTestName(), variant: 'primary' }
    ];
    if (this.isListening()) {
      list.push({ icon: 'fa-solid fa-file-lines', label: 'PDF transcript', variant: 'success' });
    }
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

  readonly sampleJson = computed<string>(() => {
    if (this.isListening()) {
      return JSON.stringify({
        items: [
          {
            question_number: 1,
            part: 1,
            error_type: "detail_missed",
            error_subtype: "nghe nhầm chi tiết hành động",
            passage_excerpt: "A man is watering the plants in the garden...",
            transcript: "Woman: Excuse me, what is that man doing?\nMan: He is watering the plants in the garden.",
            question_text: "What is the man doing?",
            options: {
              A: "He is watering the plants.",
              B: "He is mowing the lawn.",
              C: "He is washing the car.",
              D: "He is painting the fence."
            },
            explanation: "Chọn A vì transcript nhắc 'watering the plants', các đáp án còn lại dùng từ nghe gần giống để gây nhiễu.",
            tip: "Chú ý động từ chính và tân ngữ trong Part 1 — đáp án nhiễu thường đổi động từ hoặc đối tượng.",
            key_vocab: [
              {
                term: "water the plants",
                meaning: "tưới cây",
                example: "He waters the plants every morning before work.",
                context_note: "Collocation cố định, không dịch từng chữ."
              }
            ]
          }
        ]
      }, null, 2);
    }
    return JSON.stringify({
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
            {
              term: "postpone",
              meaning: "hoãn lại (sang thời điểm khác)",
              example: "The meeting was postponed until next Friday."
            }
          ]
        }
      ]
    }, null, 2);
  });

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
        statusNote = q.part >= 1 && q.part <= 4 ? ' (làm đúng, phân tích kỹ thuật nghe & từ vựng hay)' : ' (làm đúng, phân tích từ vựng & cấu trúc hay)';
      }
      return `- Câu ${q.questionNumber} (Part ${q.part}): tôi chọn '${q.userAnswer || 'Bỏ qua'}', đáp án đúng '${q.correctAnswer}'${statusNote}`;
    }).join('\n');

    const filterIntro = filter ? `theo bộ lọc "${filter}"` : `cần phân tích`;

    if (this.isListening()) {
      return `Tôi vừa làm đề thi Listening TOEIC "${name}" (đã đính kèm 2 file: PDF đề thi và PDF transcript). Dưới đây là danh sách các câu ${filterIntro}, hãy đọc nội dung trong PDF đề + transcript đính kèm và phân tích chi tiết từng câu:

${questionRows}

=== SCHEMA JSON YÊU CẦU: ===
{
  "items": [
    {
      "question_number": 101,
      "part": 1,
      "error_type": "detail_missed",
      "error_subtype": "nghe nhầm chi tiết hành động",
      "passage_excerpt": "trích ngắn transcript của câu này",
      "transcript": "NGUYÊN VĂN toàn bộ transcript của đoạn audio ứng với câu này (lấy đúng đoạn theo số câu từ file PDF transcript, ghi trong MỘT dòng, mỗi lượt thoại ngăn cách bằng \\n — để \"\" nếu không tìm thấy đoạn đúng, tuyệt đối không bịa)",
      "question_text": "nội dung câu hỏi",
      "options": {
        "A": "lựa chọn A",
        "B": "lựa chọn B",
        "C": "lựa chọn C",
        "D": "lựa chọn D"
      },
      "explanation": "giải thích súc tích dựa transcript, nêu lý do đáp án đúng và điểm bẫy",
      "tip": "mẹo nghe để nhận biết đáp án đúng / tránh bẫy",
      "key_vocab": [
        { "term": "từ_vocab", "meaning": "nghĩa tiếng Việt đúng ngữ cảnh", "example": "1 câu ví dụ ngắn khác", "context_note": "(chỉ khi là bẫy)" }
      ]
    }
  ]
}

=== NGUYÊN TẮC PHÂN TÍCH (LISTENING): ===
1. "transcript": Đây là dữ liệu TRA CỨU, không phải câu chữ tự viết. File PDF transcript đính kèm đánh số TỪNG đoạn audio theo khoảng câu hỏi: Part 1 & 2 mỗi câu = 1 đoạn audio RIÊNG; Part 3 & 4 đoạn chung đánh số kiểu "Questions 38-40".
   - Với mỗi câu đang phân tích, CHỈ lấy đúng đoạn có số chứa số câu đó. KHÔNG lấy đoạn của câu khác dù nội dung nghe có vẻ giống.
   - Part 3 & 4: các câu trong cùng một nhóm DÙNG CHUNG MỘT đoạn — "transcript" của cả nhóm PHẢI giống hệt nhau (nguyên văn toàn bộ đoạn đó).
   - COPY NGUYÊN VĂN 100% từ PDF: đúng từng chữ, từng dấu câu, không viết lại, không tóm tắt, không dịch, không tự sửa lỗi đề.
   - KIỂM TRA KHỚP: đoạn đúng phải chứa manh mối để xác định đáp án đúng của câu đó. Nếu đoạn transcript bạn chọn KHÔNG trả lời được câu hỏi → chắc chắn đã lấy nhầm đoạn, phải tìm lại đoạn đúng.
   - CHỐNG BỊA: nếu không tìm thấy đoạn transcript ứng với câu (không chắc chắn 100%), KHÔNG được bịa — đặt "transcript" là chuỗi rỗng "" và ghi rõ trong "explanation" là bạn không tìm thấy đoạn tương ứng trong PDF.
   - Ghi trong MỘT dòng, mỗi lượt thoại ngăn cách bằng \n.
2. "passage_excerpt": Trích 1-2 câu NẰM TRONG chính đoạn transcript đã gán cho câu ở trên (không lấy câu từ đoạn khác). "question_text" ghi lại câu hỏi đúng như trong đề.
3. "key_vocab": Quét kỹ transcript + câu hỏi + TẤT CẢ các đáp án A, B, C, D. CHỈ liệt kê từ/cụm từ (collocations, phrasal verbs, idioms, từ vựng công sở - kinh doanh, từ đa nghĩa dễ gây nhầm) mà một người ở mức TOEIC 500-650 THẬT SỰ CÓ THỂ chưa biết hoặc dễ hiểu sai trong ngữ cảnh này, dẫn tới nghe nhầm hoặc chọn sai đáp án.
   SỐ LƯỢNG (đủ ngưỡng để review có giá trị, không quá phình):
   - Câu Part 1 & 2: TỐI THIỂU 3 từ/cụm từ mỗi câu.
   - Câu Part 3 & 4: TỐI THIỂU 5 từ/cụm từ mỗi câu.
   Nếu chưa đủ ngưỡng, rà lại transcript + câu hỏi + đáp án để tìm thêm từ/cụm từ ĐÁNG NOTE (đặc biệt từ vựng trong 4 đáp án), tuyệt đối KHÔNG chêm từ cơ bản chỉ để cho đủ số.
   Quy tắc lọc (QUAN TRỌNG):
   - BỎ QUA từ ngữ quá đơn giản, người học TOEIC 500-650 chắc chắn đã biết (ví dụ: the, meeting, go, work, time, sorry, thank...). Chỉ giữ lại từ/cụm từ mang giá trị học thuật thật sự.
   - ƯU TIÊN các từ/cụm mà nếu hiểu sai sẽ dẫn đến nghe nhầm hoặc chọn sai đáp án (đặc biệt là từ vựng xuất hiện trong 4 đáp án).
   - KHÔNG vượt quá 6-8 từ mỗi câu dù đoạn bản dài — dừng lại khi không còn từ nào thực sự đáng note.
   Với mỗi từ/cụm trả về object gồm:
   - "term": từ hoặc cụm từ gốc (giữ đúng dạng xuất hiện trong bài).
   - "meaning": nghĩa tiếng Việt ngắn gọn, đúng với NGHĨA ĐANG DÙNG trong bài (không phải liệt kê hết các nghĩa của từ).
   - "example": 1 câu ví dụ ngắn khác (không lấy lại câu trong bài) để thấy cách dùng.
   - "context_note" (optional): CHỈ thêm khi từ này là "cái bẫy" — VD từ đồng âm khác nghĩa, phrasal verb dễ nhầm với nghĩa đen, collocation cố định không thể dịch từng chữ.
4. "explanation": Ngắn gọn (khoảng 2-3 câu), dựa transcript nêu rõ đáp án đúng và chỉ ra chi tiết nghe nhầm/bẫy: đáp án đúng thường Paraphrase lại ý trong transcript, đáp án nhiễu thường dùng từ nghe gần giống (same-sounding words).
5. Part 2 (Hỏi - Đáp): Chỉ có 3 lựa chọn A, B, C — BỎ key "D" trong options.
6. "error_type" chỉ nhận 1 trong các giá trị: "vocab", "grammar", "inference", "detail_missed", "trap_answer", "time_pressure".

${JSON_OUTPUT_RULES}`;
    }

    return `Tôi vừa làm đề thi TOEIC Reading "${name}" (đã đính kèm file PDF đề thi). Dưới đây là danh sách các câu ${filterIntro}, hãy đọc nội dung trong PDF đính kèm và phân tích chi tiết từng câu:

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
        { "term": "từ_vocab", "meaning": "nghĩa tiếng Việt đúng ngữ cảnh", "example": "1 câu ví dụ ngắn khác", "context_note": "(chỉ khi là bẫy)" }
      ]
    }
  ]
}

=== NGUYÊN TẮC PHÂN TÍCH: ===
1. "key_vocab": Quét kỹ đoạn trích (passage), câu hỏi và TẤT CẢ các đáp án A, B, C, D. CHỈ liệt kê từ/cụm từ (collocations, phrasal verbs, idioms, từ vựng công sở - kinh doanh, từ đa nghĩa dễ gây nhầm) mà một người ở mức TOEIC 500-650 THẬT SỰ CÓ THỂ chưa biết hoặc dễ hiểu sai trong ngữ cảnh này, dẫn tới chọn sai đáp án.
   SỐ LƯỢNG (đủ ngưỡng để review có giá trị, không quá phình):
   - Câu Part 5: TỐI THIỂU 3 từ/cụm từ mỗi câu (kể cả từ vựng trong 4 đáp án).
   - Câu Part 6: TỐI THIỂU 4 từ/cụm từ mỗi câu.
   - Câu Part 7: TỐI THIỂU 5 từ/cụm từ mỗi câu.
   Nếu chưa đủ ngưỡng, rà lại passage + câu hỏi + đáp án để tìm thêm từ/cụm từ ĐÁNG NOTE (đặc biệt từ vựng trong 4 đáp án), tuyệt đối KHÔNG chêm từ cơ bản chỉ để cho đủ số.
   Quy tắc lọc (QUAN TRỌNG):
   - BỎ QUA từ ngữ quá đơn giản, người học TOEIC 500-650 chắc chắn đã biết (ví dụ: the, meeting, go, work, time, sorry, thank...). Chỉ giữ lại từ/cụm từ mang giá trị học thuật thật sự.
   - ƯU TIÊN các từ/cụm mà nếu hiểu sai sẽ dẫn đến chọn sai đáp án (đặc biệt là từ vựng xuất hiện trong 4 đáp án).
   - KHÔNG vượt quá 6-8 từ mỗi câu dù đoạn bản dài — dừng lại khi không còn từ nào thực sự đáng note.
   Với mỗi từ/cụm trả về object gồm:
   - "term": từ hoặc cụm từ gốc (giữ đúng dạng xuất hiện trong bài).
   - "meaning": nghĩa tiếng Việt ngắn gọn, đúng với NGHĨA ĐANG DÙNG trong bài (không phải liệt kê hết các nghĩa của từ).
   - "example": 1 câu ví dụ ngắn khác (không lấy lại câu trong bài) để thấy cách dùng.
   - "context_note" (optional): CHỈ thêm khi từ này là "cái bẫy" — VD từ đồng âm khác nghĩa, phrasal verb dễ nhầm với nghĩa đen, collocation cố định không thể dịch từng chữ.
2. "explanation": Ngắn gọn (khoảng 2-3 câu), nêu rõ lý do đáp án đúng và chỉ ra điểm bẫy/nhầm lẫn.
3. "error_type" chỉ nhận 1 trong các giá trị: "vocab", "grammar", "inference", "detail_missed", "trap_answer", "time_pressure".

${JSON_OUTPUT_RULES}`;
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
          transcript: item.transcript || item.transcriptText,
          options: item.options,
          explanation: item.explanation || '',
          tip: item.tip,
          key_vocab: (item.key_vocab || item.keyVocab || []).map((v: any) => ({
            word: v.term || v.word || '',
            meaning_vi: v.meaning || v.meaning_vi || v.meaningVi || v.meaning || '',
            example: v.example || '',
            context_note: v.context_note || v.contextNote || ''
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

