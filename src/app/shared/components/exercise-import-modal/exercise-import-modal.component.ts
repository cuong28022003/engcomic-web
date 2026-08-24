import { Component, input, output, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardApiService } from '@core/services/card-api.service';
import { ToastService } from '@core/services/toast.service';
import { PracticePromptResponse, ImportPracticeJsonResponse } from '@models/index';
import { ProgressStepperComponent } from '@shared/components/progress-stepper/progress-stepper.component';
import { AiPromptBoxComponent } from '@shared/components/ai-prompt-box/ai-prompt-box.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { JsonTextareaComponent } from '@shared/components/json-textarea/json-textarea.component';

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
    ProgressStepperComponent,
    AiPromptBoxComponent,
    StatusBadgeComponent,
    JsonTextareaComponent,
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
  jsonInput = '';
  previewEntries = signal<PreviewExerciseEntry[]>([]);
  parseError = signal<string>('');
  isImporting = signal<boolean>(false);
  importResult = signal<ImportPracticeJsonResponse | null>(null);
  copied = signal<boolean>(false);

  readonly steps = ['Trích Xuất Prompt', 'Dán JSON', 'Xem Trước 4 Level', 'Bắt Đầu Học'];

  currentStepIndex = computed<number>(() => {
    switch (this.step()) {
      case 'prompt': return 0;
      case 'paste': return 1;
      case 'preview': return 2;
      case 'result': return 3;
      default: return 0;
    }
  });

  validCount = computed(() => this.previewEntries().filter(e => e.valid).length);

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
      let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
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
