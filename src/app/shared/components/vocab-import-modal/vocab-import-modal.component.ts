import { Component, input, output, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardApiService } from '@core/services/card-api.service';
import { PendingItemApiService } from '@core/services/pending-item-api.service';
import { ToastService } from '@core/services/toast.service';
import { Deck, BatchImportResult, ExampleSentence, Card, WordUsage } from '@models/index';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { FormInputComponent } from '@shared/components/form-input/form-input.component';
import { FormSelectComponent, FormSelectOption } from '@shared/components/form-select/form-select.component';
import { AiImportWorkspaceComponent, AiMetaBadge, AiValidationStatus } from '@shared/components/ai-import-workspace/ai-import-workspace.component';

import { DeckApiService } from '@core/services/deck-api.service';
import { AuthService } from '@core/services/auth.service';
import { PendingCountService } from '@core/services/pending-count.service';
import { parseCleanJson } from '@shared/utils/json.util';
import { POS_FORM_SELECT_OPTIONS, POS_PROMPT_SCHEMA_KEYS } from '@shared/constants/part-of-speech.constant';

export interface PreviewVocabItem {
  word: string;
  ipa?: string;
  partOfSpeech?: string;
  meaningVi: string;
  definitionEn?: string;
  usagesCount: number;
  examplesCount?: number;
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
    ModalComponent,
    StatusBadgeComponent,
    FormInputComponent,
    FormSelectComponent,
    AiImportWorkspaceComponent
  ],
  templateUrl: './vocab-import-modal.component.html',
  styleUrls: ['./vocab-import-modal.component.scss'],
})
export class VocabImportModalComponent {
  private cardApi = inject(CardApiService);
  private pendingApi = inject(PendingItemApiService);
  private pendingCountService = inject(PendingCountService);
  private deckApi = inject(DeckApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly isOpen = input.required<boolean>();
  readonly card = input<Card | null>(null); // For Edit Mode
  readonly targetDeckId = input<string | undefined>(undefined);
  readonly targetDeckName = input<string | undefined>(undefined);
  readonly availableDecks = input<Deck[]>([]);
  readonly initialWords = input<string[] | undefined>(undefined);
  readonly initialTab = input<'ai-import' | 'manual'>('ai-import');

  readonly closeModal = output<void>();
  readonly vocabAdded = output<{ count: number; deckId?: string }>();
  readonly cardSaved = output<Card>();

  readonly isEditMode = computed(() => !!this.card()?.id);

  internalDecks = signal<Deck[]>([]);

  readonly allDecks = computed<Deck[]>(() => {
    if (this.availableDecks().length > 0) return this.availableDecks();
    return this.internalDecks();
  });

  activeTab = signal<'ai-import' | 'manual'>('ai-import');
  importStep = signal<'prompt' | 'paste' | 'preview' | 'result'>('prompt');

  readonly workspaceStep = computed<'prompt' | 'paste' | 'preview'>(() => {
    const s = this.importStep();
    if (s === 'result') return 'preview';
    return s;
  });

  readonly steps = ['1. Tạo Prompt', '2. Dán JSON', '3. Xem Trước'];

  readonly sampleVocabJson = JSON.stringify([
    {
      word: "mitigate",
      ipa: "/ˈmɪt.ɪ.ɡeɪt/",
      partOfSpeech: "verb",
      meaning_vi: "làm dịu bớt, giảm nhẹ",
      definition_en: "to make something less harmful, unpleasant, or bad",
      usages: [
        {
          category: "collocation",
          structure: "mitigate the effects / impact of something",
          meaning: "giảm nhẹ tác động / ảnh hưởng của điều gì",
          examples: [
            {
              text: "It is unclear how to mitigate the effects of tourism on the island.",
              translation: "Chưa rõ cách giảm nhẹ tác động của du lịch lên hòn đảo."
            }
          ]
        }
      ],
      relations: [
        { word: "mitigation", pos: "noun", meaning: "sự giảm nhẹ" }
      ]
    }
  ], null, 2);

  readonly jsonValidationStatus = computed<AiValidationStatus | null>(() => {
    const err = this.parseError();
    if (err) {
      return { status: 'invalid', errorMessage: err };
    }
    const items = this.previewItems();
    if (items.length > 0) {
      return { status: 'valid', itemCount: items.length };
    }
    return null;
  });

  readonly metaBadges = computed<AiMetaBadge[]>(() => {
    const list: AiMetaBadge[] = [];
    if (this.targetDeckName()) {
      list.push({ icon: 'fa-solid fa-layer-group', label: `Bộ: ${this.targetDeckName()}`, variant: 'primary' });
    }
    if (this.collectorPendingWords().length > 0) {
      list.push({ icon: 'fa-solid fa-inbox', label: `${this.collectorPendingWords().length} từ trong Word Collector`, variant: 'info' });
    }
    return list;
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

  // Manual Form State (Rich Format)
  manualWord = signal<string>('');
  manualIpa = signal<string>('');
  manualPos = signal<string>('noun');
  manualMeaning = signal<string>('');
  manualDefinitionEn = signal<string>('');
  manualTopic = signal<string>('');
  manualDeckId = signal<string>('');
  manualUsages = signal<WordUsage[]>([]);
  isSavingManual = signal<boolean>(false);

  promptCopied = signal<boolean>(false);

  readonly posOptions: FormSelectOption[] = POS_FORM_SELECT_OPTIONS;

  readonly categoryOptions = [
    { value: '', label: '-- Không phân nhóm --' },
    { value: 'time', label: '⏱️ Thời gian (Time)' },
    { value: 'place', label: '📍 Nơi chốn & Vị trí (Place)' },
    { value: 'direction', label: '↗️ Hướng & Di chuyển (Direction)' },
    { value: 'cause_reason', label: '💡 Nguyên nhân & Lý do (Cause & Reason)' },
    { value: 'purpose', label: '🎯 Mục đích (Purpose)' },
    { value: 'contrast', label: '⚖️ Tương phản & Nhượng bộ (Contrast)' },
    { value: 'condition', label: '🔀 Điều kiện (Condition)' },
    { value: 'addition', label: '➕ Bổ sung & Liệt kê (Addition)' },
    { value: 'result', label: '🏁 Kết quả & Hệ quả (Result)' },
    { value: 'agent_means', label: '🛠️ Phương tiện & Tác nhân (Means)' },
    { value: 'manner', label: '🎨 Cách thức (Manner)' },
    { value: 'degree_extent', label: '📏 Mức độ & Phạm vi (Degree)' },
    { value: 'exception', label: '🚫 Ngoại lệ (Exception)' },
    { value: 'collocation', label: '🔗 Cụm từ cố định (Collocation)' },
    { value: 'phrasal_verb', label: '🔄 Cụm động từ (Phrasal Verb)' },
    { value: 'idiom', label: '🎭 Thành ngữ (Idiom)' },
    { value: 'formal_written', label: '📜 Văn phong trang trọng (Formal)' }
  ];

  deckOptions = computed<FormSelectOption[]>(() => {
    const list: FormSelectOption[] = [
      { label: '-- Kho từ vựng chung (Không gán bộ thẻ) --', value: '' }
    ];
    for (const d of this.allDecks()) {
      list.push({ label: `🗂️ ${d.name}`, value: d.id });
    }
    return list;
  });

  readonly PROMPT_TEMPLATE = `Với mỗi mục trong danh sách sau: [{WORDS}]
Hãy phân tích và trả về JSON array, mỗi phần tử theo đúng schema:
[
  {
    "word": "từ hoặc cụm từ tiếng Anh ở dạng nguyên mẫu (base form / lemma, VD: 'reported' -> 'report', 'decisions' -> 'decision')",
    "ipa": "/phiên_âm_IPA/",
    "part_of_speech": "${POS_PROMPT_SCHEMA_KEYS}",
    "meaning_vi": "nghĩa tiếng Việt chính xác và ngắn gọn",
    "definition_en": "định nghĩa tiếng Anh ngắn gọn, súc tích",
    "topic": "Tên chủ đề tiếng Anh (Title Case, 1-3 từ). Gợi ý: Daily Life, Travel, Food & Drinks, Shopping, Family & Friends, Health & Fitness, Business, Office & Workplace, Finance & Banking, Marketing & Sales, Technology & IT, Education, Environment & Nature, Science, Society & Law... Nếu là từ trừu tượng hoặc đa dụng, đặt là 'General Vocabulary'.",
    "usages": [
      {
        "category": "time|place|direction|cause_reason|purpose|contrast|condition|addition|result|manner|degree_extent|collocation|phrasal_verb|idiom|phrase",
        "structure": "cấu trúc sử dụng / collocation thực tế của từ (BẮT BUỘC có)",
        "meaning": "nghĩa tiếng Việt cụ thể theo cấu trúc này",
        "note": "lưu ý ngữ pháp / giới từ đi kèm / bẫy thi TOEIC (nếu có)",
        "examples": [
          {
            "text": "Câu ví dụ tiếng Anh tự nhiên minh họa trực tiếp cho cấu trúc trên",
            "translation": "Bản dịch tiếng Việt câu ví dụ"
          }
        ]
      }
    ],
    "relations": [
      { "text": "từ liên quan", "type": "family|collocation|synonym", "pos": "từ loại nếu là family" }
    ],
    "tags": ["grammar:prepositions"]
  }
]

QUY TẮC QUAN TRỌNG:
1. BẮT BUỘC QUY VỀ TỪ NGUYÊN MẪU (LEMMA / BASE FORM):
   - Trường "word" PHẢI LUÔN LÀ DẠNG TỪ NGUYÊN MẪU / TỪ GỐC (Base form / Infinitive / Singular form).
   - Ví dụ: "reported" -> "report"; "decisions" -> "decision"; "looked forward to" -> "look forward to".
2. BẮT BUỘC: MỌI TỪ VỰNG ĐỀU PHẢI CÓ trường "usages" (tối thiểu 1 hoặc nhiều cấu trúc cách dùng thực tế, không được để trống).
3. QUY TẮC GÁN CHỦ ĐỀ ("topic"): Viết hoa chữ cái đầu mỗi từ (Title Case), ngắn gọn bằng tiếng Anh (1-3 từ).
4. Mọi câu ví dụ ngữ cảnh minh họa phải nằm trực tiếp bên trong danh sách "examples" của từng cấu trúc trong "usages".
5. QUY TẮC PHÂN LOẠI CHỨC NĂNG NGỮ PHÁP ("tags"):
   - CHỈ gán tag định danh ngữ pháp (bắt đầu bằng tiền tố 'grammar:') khi từ có QUY TẮC HOẶC HÀNH VI NGỮ PHÁP ĐẶC THÙ (không gán cho từ vựng miêu tả chung chung):
     + Tính từ / Động từ đi kèm giới từ cố định (VD: 'responsible for', 'interested in', 'depend on', 'accused of') -> ["grammar:prepositions", "grammar:adjective_preposition"]
     + Động từ đi kèm V-ing / To-V (VD: 'enjoy', 'avoid', 'decide', 'manage') -> ["grammar:gerunds_infinitives"]
     + Tính từ thể giả định (VD: 'essential', 'vital', 'necessary') -> ["grammar:subjunctive_wish"]
     + Liên từ & Trạng từ liên kết (VD: 'although', 'however', 'therefore', 'in addition') -> ["grammar:conjunctions"]
     + Cụm động từ (VD: 'look forward to', 'run out of', 'carry out') -> ["grammar:phrasal_verbs"]
   - Nếu là từ vựng miêu tả thông thường (VD: 'beautiful', 'delicious', 'happy', 'apple', 'chair') KHÔNG có quy tắc ngữ pháp đặc biệt -> BẮT BUỘC để mảng rỗng: "tags": []

=== QUY TẮC BẮT BUỘC ĐỂ TRÁNH LỖI CÚ PHÁP JSON (ZERO-ERROR PROMPT): ===
1. Chỉ trả về DUY NHẤT một JSON array thuần hợp lệ trong cặp ngoặc vuông [ ... ], KHÔNG thêm bất kỳ lời chào, giải thích hoặc markdown block nào.
2. QUY TẮC DẤU TRÍCH DẪN: Trong các chuỗi "meaning_vi", "definition_en", "structure", "note", "examples", TUYỆT ĐỐI KHÔNG dùng dấu ngoặc kép đôi " để trích dẫn từ. BẮT BUỘC dùng dấu ngoặc đơn '...' (Ví dụ: 'take action' thay vì "take action").
3. Đảm bảo cấu trúc JSON hợp lệ, các phần tử ngăn cách bởi dấu phẩy ,, không có dấu phẩy thừa ở cuối.`;

  generatedPrompt = signal<string>('');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const c = this.card();
        if (c) {
          // Prefill existing card into manual form
          this.manualWord.set(c.word || (c as any).front || '');
          this.manualIpa.set(c.ipa || '');
          this.manualPos.set(c.partOfSpeech || 'noun');
          this.manualMeaning.set(c.meaning || (c as any).back || '');
          this.manualDefinitionEn.set(c.definitionEn || '');
          this.manualTopic.set(c.topic || '');
          this.manualDeckId.set(c.deckId || '');

          this.manualUsages.set(
            c.usages && c.usages.length > 0
              ? c.usages.map(u => ({
                  category: u.category || '',
                  structure: u.structure || '',
                  meaning: u.meaning || '',
                  note: u.note || '',
                  examples: u.examples && u.examples.length > 0
                    ? u.examples.map(ex => ({ text: ex.text || '', translation: ex.translation || '' }))
                    : [{ text: '', translation: '' }]
                }))
              : []
          );

          // Prefill AI JSON generator text
          this.wordListText = c.word || (c as any).front || '';
          this.generatedPrompt.set(
            this.PROMPT_TEMPLATE.replace('{WORDS}', c.word || (c as any).front || '')
          );

          // Format existing card as clean sample JSON in textarea
          const sampleJson = [
            {
              word: c.word || (c as any).front,
              ipa: c.ipa || '',
              part_of_speech: c.partOfSpeech || 'noun',
              meaning_vi: c.meaning || (c as any).back,
              definition_en: c.definitionEn || '',
              topic: c.topic || '',
              usages: c.usages && c.usages.length > 0
                ? c.usages
                : [
                    {
                      structure: c.word || (c as any).front,
                      meaning: c.meaning || (c as any).back,
                      examples: [
                        { text: `Example using ${c.word || (c as any).front}.`, translation: 'Câu ví dụ minh họa.' }
                      ]
                    }
                  ]
            }
          ];
          this.jsonInputText = JSON.stringify(sampleJson, null, 2);
        } else {
          this.resetManualForm();
          const initWords = this.initialWords();
          if (initWords && initWords.length > 0) {
            this.wordListText = initWords.join(', ');
            this.generatedPrompt.set(this.PROMPT_TEMPLATE.replace('{WORDS}', this.wordListText));
          } else {
            this.wordListText = '';
            this.jsonInputText = '';
            const defaultList = 'mitigate, implement, accommodate, tentative, prerequisite';
            this.generatedPrompt.set(this.PROMPT_TEMPLATE.replace('{WORDS}', defaultList));
          }
        }

        this.importStep.set('prompt');
        this.activeTab.set(this.initialTab());
        this.loadCollectorWords();
        if (this.availableDecks().length === 0) {
          this.loadDecks();
        }
      }
    });
  }

  loadDecks(): void {
    const user = this.auth.currentUser;
    if (!user) return;
    this.deckApi.getDecksByUserId(user.userId, { page: 0, size: 200 }).subscribe({
      next: (res) => {
        this.internalDecks.set(res?.content ?? []);
      },
      error: () => {}
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
    if (words.length === 0) return;
    this.wordListText = words.join(', ');
    this.toast.info(`Đã điền ${words.length} từ từ Collector vào danh sách.`);
  }

  goToPromptStep(): void {
    const raw = this.wordListText.trim();
    if (!raw) {
      this.toast.warning('Vui lòng nhập ít nhất 1 từ vựng.');
      return;
    }
    const prompt = this.PROMPT_TEMPLATE.replace('{WORDS}', raw);
    this.generatedPrompt.set(prompt);
    this.importStep.set('prompt');
  }

  generateAiPrompt(): void {
    this.goToPromptStep();
  }

  onStepChange(stepIdx: number): void {
    switch (stepIdx) {
      case 0:
        this.importStep.set('prompt');
        break;
      case 1:
        this.importStep.set('paste');
        break;
      case 2:
        if (this.previewItems().length > 0) {
          this.importStep.set('preview');
        } else {
          this.parseJson();
        }
        break;
      case 3:
        if (this.importResult()) {
          this.importStep.set('result');
        }
        break;
    }
  }

  goToPaste(): void {
    this.importStep.set('paste');
  }

  insertSampleJson(): void {
    const sample = [
      {
        word: "resilient",
        ipa: "/rɪˈzɪl.jənt/",
        part_of_speech: "adjective",
        meaning_vi: "kiên cường, có khả năng phục hồi nhanh chóng",
        definition_en: "able to recover quickly from difficult conditions",
        topic: "Personality",
        examples: [
          { text: "Local businesses have been remarkably resilient during the crisis.", translation: "Các doanh nghiệp địa phương đã kiên cường vượt qua khủng hoảng." }
        ]
      }
    ];
    this.jsonInputText = JSON.stringify(sample, null, 2);
  }

  clearJsonText(): void {
    this.jsonInputText = '';
  }

  parseJson(): void {
    this.parseError.set('');
    let raw = this.jsonInputText.trim();

    if (!raw) {
      this.parseError.set('Vui lòng dán nội dung JSON vào ô.');
      return;
    }

    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const parsed = parseCleanJson(raw);
      const arr = Array.isArray(parsed) ? parsed : [parsed];

      const items: PreviewVocabItem[] = arr.map((entry: any) => {
        const missing: string[] = [];
        if (!entry.word && !entry.front) missing.push('word');
        if (!entry.meaning_vi && !entry.meaning && !entry.back) missing.push('meaning_vi');

        const usagesCount = Array.isArray(entry.usages)
          ? entry.usages.length
          : (entry.structure || (Array.isArray(entry.examples) && entry.examples.length > 0)) ? 1 : 0;

        return {
          word: entry.word ?? entry.front ?? '',
          ipa: entry.ipa,
          partOfSpeech: entry.part_of_speech ?? entry.partOfSpeech,
          meaningVi: entry.meaning_vi ?? entry.meaning ?? entry.back ?? '',
          definitionEn: entry.definition_en ?? entry.definitionEn,
          usagesCount,
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
      this.toast.error('Không có từ vựng hợp lệ để cập nhật / import.');
      return;
    }

    this.isImporting.set(true);
    let cleaned = this.jsonInputText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const dId = this.targetDeckId() || this.manualDeckId() || this.selectedDeckId() || undefined;

    const currentCard = this.card();

    // If in Edit Mode and editing 1 card:
    if (currentCard?.id && this.previewItems().length === 1) {
      try {
        const parsed = parseCleanJson(cleaned);
        const item = Array.isArray(parsed) ? parsed[0] : parsed;

        const payload: Partial<Card> = {
          word: item.word ?? item.front,
          front: item.word ?? item.front,
          meaning: item.meaning_vi ?? item.meaning ?? item.back,
          back: item.meaning_vi ?? item.meaning ?? item.back,
          ipa: item.ipa,
          partOfSpeech: item.part_of_speech ?? item.partOfSpeech,
          definitionEn: item.definition_en ?? item.definitionEn,
          topic: item.topic,
          deckId: dId,
          usages: item.usages,
          comparisonGroup: item.comparison_group ?? item.comparisonGroup
        };

        this.cardApi.updateCard(currentCard.id, payload).subscribe({
          next: (updated) => {
            this.isImporting.set(false);
            this.toast.success(`Đã cập nhật từ "${updated.word}" thành công từ AI JSON!`);
            this.cardSaved.emit(updated);
            this.vocabAdded.emit({ count: 1, deckId: dId });
            this.onClose();
          },
          error: (err) => {
            this.isImporting.set(false);
            this.toast.error('Lỗi khi cập nhật từ: ' + (err.error?.message || err.message));
          }
        });
        return;
      } catch (e) {
        // Fall back to batchImport
      }
    }

    const promptWords = this.extractPromptWords();

    // Default: Batch import
    this.cardApi.batchImport({ jsonContent: cleaned, deckId: dId, promptWords }).subscribe({
      next: (res: BatchImportResult) => {
        this.isImporting.set(false);
        const importedCount = res.imported ? res.imported.length : 0;
        this.toast.success(`Đã thêm thành công ${importedCount} từ vựng vào kho!`);
        this.pendingCountService.refresh();
        this.vocabAdded.emit({ count: importedCount, deckId: dId });
        this.onClose();
      },
      error: (err) => {
        this.isImporting.set(false);
        this.toast.error('Lỗi khi import từ vựng: ' + (err.error?.message || err.message));
      }
    });
  }

  // ── Manual Usages & Nested Examples Management ────────────────
  addManualUsage(): void {
    this.manualUsages.update(list => [
      ...list,
      {
        category: '',
        structure: '',
        meaning: '',
        note: '',
        examples: [{ text: '', translation: '' }]
      }
    ]);
  }

  removeManualUsage(uIndex: number): void {
    this.manualUsages.update(list => list.filter((_, i) => i !== uIndex));
  }

  updateManualUsageField(uIndex: number, field: keyof WordUsage, val: any): void {
    this.manualUsages.update(list => {
      const next = [...list];
      if (next[uIndex]) {
        next[uIndex] = { ...next[uIndex], [field]: val };
      }
      return next;
    });
  }

  addManualUsageExample(uIndex: number): void {
    this.manualUsages.update(list => {
      const next = [...list];
      if (next[uIndex]) {
        const curEx = next[uIndex].examples || [];
        next[uIndex] = {
          ...next[uIndex],
          examples: [...curEx, { text: '', translation: '' }]
        };
      }
      return next;
    });
  }

  removeManualUsageExample(uIndex: number, exIndex: number): void {
    this.manualUsages.update(list => {
      const next = [...list];
      if (next[uIndex] && next[uIndex].examples) {
        const curEx = next[uIndex].examples!.filter((_, i) => i !== exIndex);
        next[uIndex] = {
          ...next[uIndex],
          examples: curEx.length > 0 ? curEx : [{ text: '', translation: '' }]
        };
      }
      return next;
    });
  }

  updateManualUsageExampleText(uIndex: number, exIndex: number, val: string): void {
    this.manualUsages.update(list => {
      const next = [...list];
      if (next[uIndex] && next[uIndex].examples && next[uIndex].examples![exIndex]) {
        const curEx = [...next[uIndex].examples!];
        curEx[exIndex] = { ...curEx[exIndex], text: val };
        next[uIndex] = { ...next[uIndex], examples: curEx };
      }
      return next;
    });
  }

  updateManualUsageExampleTranslation(uIndex: number, exIndex: number, val: string): void {
    this.manualUsages.update(list => {
      const next = [...list];
      if (next[uIndex] && next[uIndex].examples && next[uIndex].examples![exIndex]) {
        const curEx = [...next[uIndex].examples!];
        curEx[exIndex] = { ...curEx[exIndex], translation: val };
        next[uIndex] = { ...next[uIndex], examples: curEx };
      }
      return next;
    });
  }

  submitManualCard(): void {
    const w = this.manualWord().trim();
    const m = this.manualMeaning().trim();

    if (!w) {
      this.toast.warning('Vui lòng nhập từ vựng tiếng Anh!');
      return;
    }
    if (!m) {
      this.toast.warning('Vui lòng nhập nghĩa tiếng Việt!');
      return;
    }

    this.isSavingManual.set(true);
    const dId = this.targetDeckId() || this.manualDeckId() || this.selectedDeckId() || undefined;

    const cleanedUsages: WordUsage[] = this.manualUsages()
      .filter(u => (u.structure && u.structure.trim()) || (u.meaning && u.meaning.trim()))
      .map(u => ({
        category: u.category?.trim() || undefined,
        structure: u.structure?.trim() || undefined,
        meaning: u.meaning?.trim() || undefined,
        note: u.note?.trim() || undefined,
        examples: (u.examples || [])
          .filter(e => e.text && e.text.trim())
          .map(e => ({
            text: e.text.trim(),
            translation: e.translation?.trim() || undefined
          }))
      }));

    const payload: Partial<Card> = {
      word: w,
      meaning: m,
      ipa: this.manualIpa().trim() || undefined,
      partOfSpeech: this.manualPos(),
      definitionEn: this.manualDefinitionEn().trim() || undefined,
      topic: this.manualTopic().trim() || undefined,
      deckId: dId,
      usages: cleanedUsages
    };

    const currentCard = this.card();

    if (currentCard?.id) {
      // Update existing card
      this.cardApi.updateCard(currentCard.id, payload).subscribe({
        next: (updated) => {
          this.isSavingManual.set(false);
          this.toast.success(`Đã cập nhật thẻ từ "${w}" thành công!`);
          this.cardSaved.emit(updated);
          this.vocabAdded.emit({ count: 1, deckId: dId });
          this.resetManualForm();
          this.onClose();
        },
        error: (err) => {
          this.isSavingManual.set(false);
          this.toast.error('Không thể cập nhật thẻ từ: ' + (err.error?.message || err.message));
        }
      });
    } else {
      // Create new card
      this.cardApi.createCard(payload).subscribe({
        next: (created) => {
          this.isSavingManual.set(false);
          this.toast.success(`Đã thêm thẻ từ "${w}" thành công!`);
          this.cardSaved.emit(created);
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
  }

  private resetManualForm(): void {
    this.manualWord.set('');
    this.manualMeaning.set('');
    this.manualIpa.set('');
    this.manualPos.set('noun');
    this.manualDefinitionEn.set('');
    this.manualTopic.set('');
    this.manualDeckId.set('');
    this.manualUsages.set([]);
  }

  private extractPromptWords(): string[] {
    const rawTokens = this.wordListText
      ? this.wordListText.split(/[\n\r]+/).flatMap(line => line.split(/[,;]+(?!\s*[a-z0-9]+\))/i))
      : [];

    const promptWordsSet = new Set<string>();
    rawTokens.forEach(t => {
      const trimmed = t.trim();
      if (trimmed) promptWordsSet.add(trimmed);
    });

    // Đối chiếu và giữ nguyên vẹn các từ gốc từ Word Collector (initialWords & collectorPendingWords)
    const allCollectorWords = [
      ...(this.initialWords() || []),
      ...(this.collectorPendingWords() || [])
    ];
    const lowerWordList = (this.wordListText || '').toLowerCase();
    allCollectorWords.forEach(cw => {
      const cleanCw = cw.trim().toLowerCase().replace(/^[.,;:!?"'()]+|[.,;:!?"'()]+$/g, '');
      if (cleanCw && lowerWordList.includes(cleanCw)) {
        promptWordsSet.add(cw.trim());
      }
    });

    return Array.from(promptWordsSet);
  }

  onClose(): void {
    this.importStep.set('prompt');
    this.previewItems.set([]);
    this.parseError.set('');
    this.importResult.set(null);
    this.resetManualForm();
    this.closeModal.emit();
  }
}
