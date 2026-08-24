import { Component, input, output, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardApiService } from '@core/services/card-api.service';
import { PendingItemApiService } from '@core/services/pending-item-api.service';
import { ToastService } from '@core/services/toast.service';
import { Deck, BatchImportResult } from '@models/index';
import { ProgressStepperComponent } from '@shared/components/progress-stepper/progress-stepper.component';
import { AiPromptBoxComponent } from '@shared/components/ai-prompt-box/ai-prompt-box.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { FormInputComponent } from '@shared/components/form-input/form-input.component';
import { FormSelectComponent, FormSelectOption } from '@shared/components/form-select/form-select.component';
import { JsonTextareaComponent } from '@shared/components/json-textarea/json-textarea.component';

export interface PreviewVocabItem {
  word: string;
  ipa?: string;
  partOfSpeech?: string;
  meaningVi: string;
  definitionEn?: string;
  examplesCount: number;
  relationsCount: number;
  valid: boolean;
  error?: string;
}

@Component({
  selector: 'app-vocab-import-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProgressStepperComponent,
    AiPromptBoxComponent,
    StatusBadgeComponent,
    FormInputComponent,
    FormSelectComponent,
    JsonTextareaComponent,
  ],
  templateUrl: './vocab-import-modal.component.html',
  styleUrls: ['./vocab-import-modal.component.scss'],
})
export class VocabImportModalComponent {
  private cardApi = inject(CardApiService);
  private pendingApi = inject(PendingItemApiService);
  private toast = inject(ToastService);

  isOpen = input.required<boolean>();
  targetDeckId = input<string | undefined>(undefined);
  targetDeckName = input<string | undefined>(undefined);
  availableDecks = input<Deck[]>([]);

  closeModal = output<void>();
  vocabAdded = output<{ count: number; deckId?: string }>();

  activeTab = signal<'ai-import' | 'manual'>('ai-import');
  importStep = signal<'prompt' | 'paste' | 'preview' | 'result'>('paste');

  readonly steps = ['Tạo Prompt', 'Dán JSON', 'Xem Trước', 'Kết Quả'];

  currentStepIndex = computed<number>(() => {
    switch (this.importStep()) {
      case 'prompt': return 0;
      case 'paste': return 1;
      case 'preview': return 2;
      case 'result': return 3;
      default: return 1;
    }
  });

  // Word Collector pending words cache
  collectorPendingWords = signal<string[]>([]);
  isLoadingCollector = signal<boolean>(false);

  // AI Prompt & JSON State
  wordListText = '';
  jsonInputText = '';
  previewItems = signal<PreviewVocabItem[]>([]);
  parseError = signal<string>('');
  isImporting = signal<boolean>(false);
  importResult = signal<BatchImportResult | null>(null);
  selectedDeckId = signal<string>('');

  // Manual Form State
  manualWord = '';
  manualMeaning = '';
  manualIpa = '';
  manualPos = 'noun';
  manualNote = '';
  isSavingManual = signal<boolean>(false);

  promptCopied = signal<boolean>(false);

  readonly posOptions: FormSelectOption[] = [
    { label: 'Danh từ (noun)', value: 'noun' },
    { label: 'Động từ (verb)', value: 'verb' },
    { label: 'Tính từ (adjective)', value: 'adjective' },
    { label: 'Trạng từ (adverb)', value: 'adverb' },
    { label: 'Cụm từ (phrase)', value: 'phrase' },
  ];

  deckOptions = computed<FormSelectOption[]>(() => {
    const list: FormSelectOption[] = [
      { label: '-- Kho từ vựng chung (Không gán bộ thẻ) --', value: '' }
    ];
    for (const d of this.availableDecks()) {
      list.push({ label: `🗂️ ${d.name}`, value: d.id });
    }
    return list;
  });

  readonly PROMPT_TEMPLATE = `Với mỗi mục trong danh sách sau: [{WORDS}]
Trả về JSON array, mỗi phần tử theo đúng schema:
[
  {
    "word": "từ hoặc cụm từ",
    "ipa": "/phiên_âm/",
    "part_of_speech": "noun|verb|adjective|adverb",
    "meaning_vi": "nghĩa tiếng Việt chính xác",
    "definition_en": "định nghĩa tiếng Anh ngắn gọn",
    "usage_note": null,
    "topic": "chủ đề liên quan",
    "examples": [
      { "text": "Câu ví dụ tiếng Anh", "formality": "formal|informal|written" }
    ],
    "relations": [
      { "text": "từ liên quan", "type": "family|collocation|synonym", "pos": "từ loại nếu là family" }
    ]
  }
]
Nếu mục là cụm từ (collocation), ipa và part_of_speech có thể null.
Chỉ trả JSON thuần trong thẻ [ ... ], không giải thích thêm.`;

  generatedPrompt = signal<string>('');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.loadCollectorWords();
      }
    });
  }

  loadCollectorWords(): void {
    this.isLoadingCollector.set(true);
    this.pendingApi.getAll({ status: 'pending', page: 0, size: 200 }).subscribe({
      next: (res) => {
        const words = (res?.content ?? []).map(i => i.content.trim()).filter(Boolean);
        this.collectorPendingWords.set(words);
        this.isLoadingCollector.set(false);
      },
      error: () => {
        this.collectorPendingWords.set([]);
        this.isLoadingCollector.set(false);
      }
    });
  }

  fillFromWordCollector(): void {
    const words = this.collectorPendingWords();
    if (words.length === 0) {
      this.toast.info('Không có từ vựng nào trong Word Collector.');
      return;
    }
    this.wordListText = words.join(', ');
    this.toast.success(`Đã nạp ${words.length} từ từ Word Collector vào ô nhập!`);
  }

  generateAiPrompt(): void {
    const raw = this.wordListText.trim();
    const words = raw ? raw.split(/[\n,;]+/).map(w => w.trim()).filter(Boolean) : ['decision', 'mitigate', 'reach a decision'];
    const prompt = this.PROMPT_TEMPLATE.replace('{WORDS}', words.join(', '));
    this.generatedPrompt.set(prompt);
    this.importStep.set('prompt');
  }

  onStepChange(index: number): void {
    if (index === 0 && this.generatedPrompt()) this.importStep.set('prompt');
    else if (index === 1) this.importStep.set('paste');
    else if (index === 2 && this.previewItems().length > 0) this.importStep.set('preview');
  }

  goToPaste(): void {
    this.importStep.set('paste');
  }

  parseJson(): void {
    this.parseError.set('');
    const raw = this.jsonInputText.trim();
    if (!raw) {
      this.parseError.set('Vui lòng dán nội dung JSON vào ô trên.');
      return;
    }

    try {
      let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) {
        throw new Error('Dữ liệu JSON phải là một mảng (Array [...])');
      }

      const items: PreviewVocabItem[] = parsed.map((entry: any) => {
        const missing: string[] = [];
        if (!entry.word) missing.push('word');
        if (!entry.meaning_vi && !entry.meaning) missing.push('meaning_vi');

        return {
          word: entry.word ?? '?',
          ipa: entry.ipa,
          partOfSpeech: entry.part_of_speech,
          meaningVi: entry.meaning_vi ?? entry.meaning ?? '',
          definitionEn: entry.definition_en,
          examplesCount: Array.isArray(entry.examples) ? entry.examples.length : 0,
          relationsCount: Array.isArray(entry.relations) ? entry.relations.length : 0,
          valid: missing.length === 0,
          error: missing.length > 0 ? `Thiếu trường: ${missing.join(', ')}` : undefined,
        };
      });

      if (items.length === 0) {
        throw new Error('Mảng JSON rỗng, không tìm thấy từ vựng nào.');
      }

      this.previewItems.set(items);
      this.importStep.set('preview');
    } catch (e: any) {
      this.parseError.set(`Lỗi phân tích JSON: ${e.message}`);
    }
  }

  submitBatchImport(): void {
    const validCount = this.previewItems().filter(i => i.valid).length;
    if (validCount === 0) {
      this.toast.error('Không có từ vựng hợp lệ để import.');
      return;
    }

    this.isImporting.set(true);
    let cleaned = this.jsonInputText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const dId = this.targetDeckId() || this.selectedDeckId() || undefined;

    this.cardApi.batchImport({ jsonContent: cleaned, deckId: dId }).subscribe({
      next: (res: BatchImportResult) => {
        this.isImporting.set(false);
        this.importResult.set(res);
        this.importStep.set('result');
        const importedCount = res.imported ? res.imported.length : 0;
        this.toast.success(`Đã thêm thành công ${importedCount} từ vựng vào kho!`);
        this.vocabAdded.emit({ count: importedCount, deckId: dId });
      },
      error: (err) => {
        this.isImporting.set(false);
        this.toast.error('Lỗi khi import từ vựng: ' + (err.error?.message || err.message));
      }
    });
  }

  submitManualCard(): void {
    if (!this.manualWord.trim() || !this.manualMeaning.trim()) {
      this.toast.warning('Vui lòng nhập Từ tiếng Anh và Nghĩa tiếng Việt.');
      return;
    }

    this.isSavingManual.set(true);
    const dId = this.targetDeckId() || this.selectedDeckId() || undefined;

    this.cardApi.createCard({
      word: this.manualWord.trim(),
      meaning: this.manualMeaning.trim(),
      ipa: this.manualIpa.trim() || undefined,
      partOfSpeech: this.manualPos,
      deckId: dId,
    }).subscribe({
      next: () => {
        this.isSavingManual.set(false);
        this.toast.success(`Đã thêm thẻ từ "${this.manualWord}" thành công!`);
        this.vocabAdded.emit({ count: 1, deckId: dId });
        this.resetManualForm();
        this.onClose();
      },
      error: (err) => {
        this.isSavingManual.set(false);
        this.toast.error('Không thể tạo thẻ từ: ' + (err.error?.message || err.message));
      }
    });
  }

  private resetManualForm(): void {
    this.manualWord = '';
    this.manualMeaning = '';
    this.manualIpa = '';
    this.manualPos = 'noun';
    this.manualNote = '';
  }

  onClose(): void {
    this.importStep.set('paste');
    this.previewItems.set([]);
    this.parseError.set('');
    this.importResult.set(null);
    this.resetManualForm();
    this.closeModal.emit();
  }
}
