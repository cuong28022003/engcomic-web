import { Component, input, output, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardApiService } from '@core/services/card-api.service';
import { ToastService } from '@core/services/toast.service';
import { PracticePromptResponse, ImportPracticeJsonResponse } from '@models/index';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { AiImportWorkspaceComponent, AiMetaBadge, AiValidationStatus } from '@shared/components/ai-import-workspace/ai-import-workspace.component';
import { parseCleanJson } from '@shared/utils/json.util';

export interface PreviewExerciseEntry {
  word: string;
  hasL1: boolean;
  hasL2: boolean;
  hasL3: boolean;
  hasL4: boolean;
  l1Question?: string;
  l2Sentence?: string;
  l3Sentence?: string;
  l4Scenario?: string;
  valid: boolean;
  error?: string;
}

@Component({
  selector: 'app-exercise-import-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    StatusBadgeComponent,
    AiImportWorkspaceComponent,
  ],
  templateUrl: './exercise-import-modal.component.html',
  styleUrls: ['./exercise-import-modal.component.scss'],
})
export class ExerciseImportModalComponent {
  private cardApi = inject(CardApiService);
  private toast = inject(ToastService);

  isOpen = input.required<boolean>();
  deckId = input<string | undefined>(undefined);
  deckName = input<string | undefined>('Bộ từ vựng');
  promptData = input<PracticePromptResponse | null>(null);

  closeModal = output<void>();
  importSuccess = output<{ total: number; success: number; skipped?: number }>();
  startPractice = output<void>();

  step = signal<'prompt' | 'paste' | 'preview' | 'result'>('prompt');

  readonly workspaceStep = computed<'prompt' | 'paste' | 'preview'>(() => {
    const s = this.step();
    if (s === 'result') return 'preview';
    return s;
  });

  jsonInput = '';
  previewEntries = signal<PreviewExerciseEntry[]>([]);
  parseError = signal<string>('');
  isImporting = signal<boolean>(false);
  importResult = signal<ImportPracticeJsonResponse | null>(null);
  copied = signal<boolean>(false);

  readonly steps = ['1. Trích Xuất Prompt', '2. Dán JSON', '3. Xem Trước 4 Level'];

  readonly metaBadges = computed<AiMetaBadge[]>(() => {
    const badges: AiMetaBadge[] = [];
    const name = this.promptData()?.deckName || this.deckName() || 'Bộ từ vựng';
    badges.push({ icon: 'fa-solid fa-layer-group', label: name, variant: 'primary' });
    const count = this.promptData()?.wordCount || 0;
    if (count > 0) {
      badges.push({ icon: 'fa-regular fa-clock', label: `${count} từ đang chờ tạo bài tập`, variant: 'warning' });
    }
    return badges;
  });

  readonly sampleExerciseJson = JSON.stringify([
    {
      word: "mitigate",
      level1_recognition: {
        question: "Từ nào đồng nghĩa với 'mitigate'?",
        options: ["alleviate", "intensify", "provoke", "ignore"],
        correct_answer: "alleviate",
        explanation: "Mitigate và alleviate đều có nghĩa là làm giảm bớt mức độ nghiêm trọng."
      },
      level2_context: {
        sentence: "Governments should take action to _____ the impact of climate change.",
        options: ["mitigate", "expand", "hesitate", "violate"],
        correct_answer: "mitigate",
        explanation: "Trong ngữ cảnh hạn chế tác động của biến đổi khí hậu, dùng 'mitigate'."
      },
      level3_production: {
        prompt: "Dịch sang tiếng Anh: 'Chúng tôi cần các biện pháp để giảm nhẹ rủi ro tài chính.'",
        correct_sentence: "We need measures to mitigate financial risks.",
        hints: ["mitigate", "financial risks", "measures"]
      },
      level4_realworld: {
        scenario: "Trong cuộc họp công ty về quản trị rủi ro dự án...",
        question: "Cách diễn đạt nào tự nhiên nhất khi đề xuất giải pháp giảm nhẹ?",
        options: [
          "We can implement contingency plans to mitigate the project delays.",
          "We can mitigate by stopping everything.",
          "The project delay is mitigating our plans.",
          "Let's not mitigate any risks."
        ],
        correct_answer: "We can implement contingency plans to mitigate the project delays."
      }
    }
  ], null, 2);

  readonly jsonValidationStatus = computed<AiValidationStatus | null>(() => {
    const err = this.parseError();
    if (err) {
      return { status: 'invalid', errorMessage: err };
    }
    const entries = this.previewEntries();
    if (entries.length > 0) {
      return { status: 'valid', itemCount: entries.length };
    }
    return null;
  });

  validCount = computed(() => this.previewEntries().filter(e => e.valid).length);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetWizard();
      }
    });
  }

  onStepChange(index: number): void {
    if (index === 0) this.step.set('prompt');
    else if (index === 1) this.step.set('paste');
    else if (index === 2 && this.previewEntries().length > 0) this.step.set('preview');
  }

  copyPrompt(): void {
    const text = this.promptData()?.systemPrompt || '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    });
  }

  goToPaste(): void {
    this.step.set('paste');
  }

  goToPrompt(): void {
    this.step.set('prompt');
  }

  parseJson(): void {
    this.parseError.set('');
    const raw = this.jsonInput.trim();
    if (!raw) {
      this.parseError.set('Vui lòng dán JSON phản hồi từ AI vào ô.');
      return;
    }

    try {
      const parsed = parseCleanJson(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('Dữ liệu JSON phải là một mảng danh sách bài tập (Array [...])');
      }

      const entries: PreviewExerciseEntry[] = parsed.map((item: any) => {
        const word = (item.word || '').trim();
        const l1 = item.level1_recognition || item.level1Recognition;
        const l2 = item.level2_context || item.level2Context;
        const l3 = item.level3_production || item.level3Production;
        const l4 = item.level4_realworld || item.level4Realworld;

        const hasL1 = !!(l1 && (l1.options || l1.question));
        const hasL2 = !!(l2 && (l2.sentence || l2.options));
        const hasL3 = !!(l3 && (l3.correctSentence || l3.correct_sentence || l3.shuffledWords));
        const hasL4 = !!(l4 && (l4.scenario || l4.sampleResponse || l4.sample_response));

        const valid = !!word && (hasL1 || hasL2 || hasL3 || hasL4);

        return {
          word: word || '?',
          hasL1,
          hasL2,
          hasL3,
          hasL4,
          l1Question: l1?.question,
          l2Sentence: l2?.sentence,
          l3Sentence: l3?.correctSentence || l3?.correct_sentence,
          l4Scenario: l4?.scenario,
          valid,
          error: !word ? 'Thiếu từ vựng (word)' : (!valid ? 'Chưa có bài tập cấp độ nào' : undefined),
        };
      });

      if (entries.length === 0) {
        throw new Error('Mảng JSON rỗng, không tìm thấy bài tập nào.');
      }

      this.previewEntries.set(entries);
      this.step.set('preview');
    } catch (e: any) {
      this.parseError.set(`Lỗi cú pháp JSON: ${e.message}`);
    }
  }

  submitImport(): void {
    if (this.validCount() === 0) {
      this.toast.warning('Không có bộ bài tập hợp lệ để import.');
      return;
    }

    this.isImporting.set(true);
    let cleaned = this.jsonInput.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    this.cardApi.importPracticeJson(cleaned, this.deckId()).subscribe({
      next: (res: ImportPracticeJsonResponse) => {
        this.isImporting.set(false);
        this.importResult.set(res);
        this.step.set('result');
        this.toast.success(res.message || 'Đã import bài tập 4-Level thành công!');
        this.importSuccess.emit({
          total: res.totalProcessed,
          success: res.successCount,
        });
      },
      error: (err) => {
        this.isImporting.set(false);
        this.toast.error('Lỗi khi import bài tập: ' + (err.error?.message || err.message));
      }
    });
  }

  onStartPracticeClick(): void {
    this.onClose();
    this.startPractice.emit();
  }

  resetWizard(): void {
    this.step.set('prompt');
    this.jsonInput = '';
    this.previewEntries.set([]);
    this.parseError.set('');
    this.importResult.set(null);
  }

  onClose(): void {
    this.resetWizard();
    this.closeModal.emit();
  }
}
