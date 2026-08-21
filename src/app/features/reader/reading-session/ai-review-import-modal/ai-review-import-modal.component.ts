import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ImportReviewItemsPayload } from '../../models';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-ai-review-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
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
  }>>([]);

  readonly close = output<void>();
  readonly closed = output<void>();
  readonly importData = output<ImportReviewItemsPayload>();

  activeTab = signal<'prompt' | 'import'>('prompt');
  copied = signal<boolean>(false);
  rawJsonInput = '';
  parseError = signal<string>('');
  isImporting = signal<boolean>(false);

  readonly generatedPrompt = computed(() => {
    const list = this.questionsToReview();
    const name = this.testName() || 'TOEIC Reading Test';

    const questionRows = list.map(q => {
      const isWrong = !q.isCorrect;
      const extra = q.flagged && q.isCorrect ? ' (câu tôi đánh dấu phân vân dù chọn đúng)' : '';
      return `- Câu ${q.questionNumber} (Part ${q.part}): tôi chọn "${q.userAnswer || 'Bỏ qua'}", đáp án đúng "${q.correctAnswer}"${extra}`;
    }).join('\n');

    return `Tôi vừa làm đề thi TOEIC "${name}" (đã đính kèm file PDF). Dưới đây là danh sách câu tôi làm sai hoặc phân vân, hãy đọc nội dung trong PDF đính kèm và phân tích chi tiết từng câu:

${questionRows}

Với mỗi câu, hãy trả về JSON theo đúng schema sau (không thêm bất kỳ văn bản giải thích nào ngoài JSON):

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
      "explanation": "giải thích ngắn gọn vì sao đáp án đúng là đúng, và vì sao đáp án tôi chọn là sai",
      "tip": "mẹo ngắn gọn để tránh bẫy câu này",
      "key_vocab": [
        { "word": "từ_vựng", "meaning_vi": "nghĩa tiếng Việt" }
      ]
    }
  ]
}

Lưu ý: "error_type" chỉ được nhận 1 trong các giá trị: "vocab", "grammar", "inference", "detail_missed", "trap_answer", "time_pressure".
Chỉ trả về JSON hợp lệ.`;
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
    this.rawJsonInput = '';
    this.clearError();
    this.isImporting.set(false);
    this.close.emit();
    this.closed.emit();
  }
}
