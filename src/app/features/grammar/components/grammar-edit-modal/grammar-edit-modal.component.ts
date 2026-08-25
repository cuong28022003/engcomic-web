import { Component, input, output, signal, effect, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ToastService } from '@core/services/toast.service';
import { GrammarApiService } from '@core/services/grammar-api.service';
import { GrammarPoint, GrammarExample, GRAMMAR_CATEGORIES } from '../../models/grammar.model';

type ModalTab = 'manual' | 'import_json';

interface PromptPreset {
  key: string;
  label: string;
  category: string;
  desc: string;
}

const PROMPT_PRESETS: PromptPreset[] = [
  {
    key: 'all',
    label: '✨ Tổng hợp toàn diện',
    category: 'tenses, conditionals, passive_voice, relative_clauses, prepositions, conjunctions, modal_verbs, comparatives, gerunds_infinitives, word_forms, subject_verb_agreement',
    desc: 'tất cả các chủ đề ngữ pháp tiếng Anh cốt lõi'
  },
  {
    key: 'tenses',
    label: '⏳ 12 Thì tiếng Anh',
    category: 'tenses',
    desc: 'các thì quan trọng nhất trong tiếng Anh (Present Simple, Past Simple, Present Perfect, Past Continuous, Future Simple, Future Continuous, Past Perfect...)'
  },
  {
    key: 'passive_voice',
    label: '🛡️ Câu bị động',
    category: 'passive_voice',
    desc: 'các cấu trúc câu bị động cơ bản, bị động đặc biệt, rút gọn mệnh đề bị động'
  },
  {
    key: 'conditionals',
    label: '🔀 Câu điều kiện & Đảo ngữ',
    category: 'conditionals',
    desc: 'câu điều kiện loại 0, 1, 2, 3, hỗn hợp và cấu trúc đảo ngữ điều kiện'
  },
  {
    key: 'relative_clauses',
    label: '🔗 Mệnh đề quan hệ',
    category: 'relative_clauses',
    desc: 'đại từ quan hệ who, whom, which, that, whose và rút gọn mệnh đề quan hệ'
  },
  {
    key: 'prepositions',
    label: '📍 Giới từ & Cụm giới từ',
    category: 'prepositions',
    desc: 'giới từ thời gian, nơi chốn (in, on, at, by, for, during) và cụm giới từ hay nhầm lẫn'
  },
  {
    key: 'subject_verb_agreement',
    label: '⚖️ Hòa hợp Chủ - Vị',
    category: 'subject_verb_agreement',
    desc: 'quy tắc hòa hợp chủ vị, danh từ số ít/nhiều, cụm danh từ có giới từ chèn giữa, each/every/neither/either'
  }
];

@Component({
  selector: 'app-grammar-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './grammar-edit-modal.component.html',
  styleUrls: ['./grammar-edit-modal.component.scss']
})
export class GrammarEditModalComponent {
  private grammarApi = inject(GrammarApiService);
  private toast = inject(ToastService);

  readonly isOpen = input<boolean>(false);
  readonly grammarPoint = input<GrammarPoint | null>(null);

  readonly close = output<void>();
  readonly saved = output<GrammarPoint | void>();

  readonly categories = GRAMMAR_CATEGORIES.filter(c => c.key !== 'all');
  readonly promptPresets = PROMPT_PRESETS;
  readonly selectedPreset = signal<string>('all');

  readonly isEditMode = computed(() => !!this.grammarPoint()?.id);
  readonly activeTab = signal<ModalTab>('manual');

  // Manual Form Fields Signals
  readonly topic = signal<string>('');
  readonly category = signal<string>('tenses');
  readonly shortRule = signal<string>('');
  readonly structure = signal<string>('');
  readonly signalWordsStr = signal<string>('');
  readonly commonMistake = signal<string>('');
  readonly searchKeywordsStr = signal<string>('');
  readonly examples = signal<GrammarExample[]>([{ text: '', note: '' }]);

  // JSON Import Signals
  readonly importJsonContent = signal<string>('');
  readonly copiedPrompt = signal<boolean>(false);

  readonly saving = signal<boolean>(false);

  // Dynamic Prompt Computed (Focused on Real-life Usage, Context & Atomic Points)
  readonly generatedPrompt = computed(() => {
    const preset = this.promptPresets.find(p => p.key === this.selectedPreset()) || this.promptPresets[0];
    return `Bạn là một Chuyên gia Ngôn ngữ học Tiếng Anh sư phạm hàng đầu.
MỤC TIÊU CỐT LÕI: Giúp người học HIỂU RÕ BẢN CHẤT VÀ CÁCH SỬ DỤNG THỰC TẾ (When & How to use in real-life context) của từng điểm ngữ pháp riêng biệt, tránh học vẹt công thức.

NGUYÊN TẮC BẮT BUỘC:
👉 1. MỖI ĐIỂM NGỮ PHÁP LÀ MỘT ĐƠN VỊ ĐƠN NHẤT (ATOMIC RULE):
Mỗi phần tử JSON chỉ trình bày DUY NHẤT 1 quy tắc / 1 thì / 1 cấu trúc riêng lẻ (Ví dụ: Thẻ 1 là "Present Perfect", Thẻ 2 là "Past Simple", Thẻ 3 là "Used to + V0", Thẻ 4 là "Be used to + V-ing", Thẻ 5 là "Although", Thẻ 6 là "Despite"...).
❌ TUYỆT ĐỐI KHÔNG GỘP 2-3 CẤU TRÚC VÀO CHUNG 1 THẺ KIỂU "A vs B" hoặc "A vs B vs C".

👉 2. "short_rule" BẮT BUỘC NGẮN GỌN & ĐI THẲNG VÀO TRỌNG TÂM:
Chỉ viết trong 1-2 câu ngắn (tối đa 25-30 từ). Nêu ngay bản chất cốt lõi: "Dùng để diễn tả [hành động/trạng thái gì] trong [ngữ cảnh nào]" để người dùng nhìn lướt qua thẻ trong 1 giây là nhận diện được ngay điểm ngữ pháp mình cần tra cứu.

👉 3. MỖI DẠNG CẤU TRÚC ĐỀU PHẢI CÓ VÍ DỤ MINH HỌA TƯƠNG ỨNG:
Mọi dạng thức nêu trong trường "structure" (Khẳng định (+), Phủ định (-), Nghi vấn (?) hoặc các trường hợp đặc biệt) BẮT BUỘC phải có ví dụ minh họa kèm phân tích ngữ cảnh rõ ràng trong mảng "examples".

Hãy biên soạn danh sách các điểm ngữ pháp đơn lẻ, trọng tâm về: ${preset.desc}.
Nhóm category phù hợp: [${preset.category}].

Với mỗi điểm ngữ pháp đơn nhất, trả đúng schema JSON:
[
  {
    "topic": "Tên điểm ngữ pháp đơn nhất (ví dụ: Present Perfect / Past Simple / Used to + V0 / Be used to + V-ing / In for Time / Third Conditional)",
    "category": "${preset.key === 'all' ? 'tenses' : preset.category}",
    "short_rule": "Ngắn gọn 1-2 câu trực diện: Dùng để diễn tả [hành động/trạng thái gì] xảy ra khi nào / trong ngữ cảnh nào.",
    "structure": "(+) S + have/has + V3/ed | (-) S + have/has + not + V3/ed | (?) Have/Has + S + V3/ed?",
    "signal_words": ["already", "yet", "just", "ever", "never", "since", "for"],
    "common_mistake": "LỖI SAI HAY GẶP: Phân tích cụ thể người học hay nhầm lẫn ở điểm nào (dịch sai từ tiếng Việt, nhầm thì, nhầm dạng từ) và chỉ ra mẹo phân biệt dứt điểm.",
    "examples": [
      {
        "text": "I have already finished all my assigned tasks for today. (+)",
        "note": "PHÂN TÍCH KHẲNG ĐỊNH: Diễn tả hành động vừa hoàn thành ở hiện tại, không nêu mốc thời gian cụ thể"
      },
      {
        "text": "She hasn't received the confirmation email yet. (-)",
        "note": "PHÂN TÍCH PHỦ ĐỊNH: Nhấn mạnh việc kỳ vọng sẽ xảy ra nhưng tính đến thời điểm nói vẫn chưa diễn ra"
      },
      {
        "text": "Have you ever traveled to Japan before? (?)",
        "note": "PHÂN TÍCH NGHI VẤN: Hỏi về trải nghiệm / kinh nghiệm trong cuộc đời tính đến hiện tại"
      }
    ],
    "search_keywords": ["từ khóa tra cứu tiếng Việt", "từ khóa tiếng Anh", "dạng bài", "từ viết tắt"]
  }
]

YÊU CẦU ĐẦU RA:
1. Trả về DUY NHẤT một JSON array thuần hợp lệ (KHÔNG kèm lời dẫn, KHÔNG bọc thêm giải thích ngoài JSON).
2. Từng thẻ là một điểm ngữ pháp riêng biệt, độc lập.
3. Mỗi dạng cấu trúc bắt buộc có ví dụ tương ứng kèm phân tích ngữ cảnh sâu sắc.`;
  });

  // Real-time JSON parser & validator
  readonly parsedJsonStatus = computed<{
    status: 'empty' | 'valid' | 'invalid';
    errorMessage?: string;
    items?: any[];
  }>(() => {
    const raw = this.importJsonContent().trim();
    if (!raw) {
      return { status: 'empty' };
    }

    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(cleaned);
      const items = Array.isArray(parsed) ? parsed : (parsed.items || [parsed]);

      if (!Array.isArray(items) || items.length === 0) {
        return { status: 'invalid', errorMessage: 'JSON hợp lệ nhưng không tìm thấy mảng danh sách điểm ngữ pháp.' };
      }

      // Check minimal required fields for first item
      const first = items[0];
      if (!first.topic && !first.short_rule && !first.shortRule) {
        return { status: 'invalid', errorMessage: 'Các phần tử thiếu trường bắt buộc "topic" hoặc "short_rule".' };
      }

      return { status: 'valid', items };
    } catch (err: any) {
      return { status: 'invalid', errorMessage: err?.message || 'Cú pháp JSON chưa đúng (thiếu dấu ngoặc, dấu phẩy...).' };
    }
  });

  constructor() {
    effect(() => {
      const p = this.grammarPoint();
      if (p) {
        this.activeTab.set('manual');
        this.topic.set(p.topic || '');
        this.category.set(p.category || 'tenses');
        this.shortRule.set(p.shortRule || '');
        this.structure.set(p.structure || '');
        this.signalWordsStr.set((p.signalWords || []).join(', '));
        this.commonMistake.set(p.commonMistake || '');
        this.searchKeywordsStr.set((p.searchKeywords || []).join(', '));
        this.examples.set(p.examples && p.examples.length > 0 ? p.examples.map(e => ({ ...e })) : [{ text: '', note: '' }]);
      } else {
        this.resetForm();
      }
    });
  }

  setTab(tab: ModalTab): void {
    this.activeTab.set(tab);
  }

  selectPreset(key: string): void {
    this.selectedPreset.set(key);
  }

  copyPromptToClipboard(): void {
    navigator.clipboard.writeText(this.generatedPrompt()).then(() => {
      this.copiedPrompt.set(true);
      this.toast.success('Đã sao chép Prompt vào bộ nhớ đệm!');
      setTimeout(() => this.copiedPrompt.set(false), 2500);
    }).catch(() => {
      this.toast.error('Không thể tự động sao chép. Vui lòng chọn và sao chép thủ công.');
    });
  }

  insertSampleJson(): void {
    const sample = [
      {
        topic: "Used to + V0 (Thói quen trong quá khứ)",
        category: "modal_verbs",
        short_rule: "Dùng để diễn tả một thói quen hoặc trạng thái từng xảy ra thường xuyên trong quá khứ nhưng hiện tại đã chấm dứt hoàn toàn.",
        structure: "(+) S + used to + V0 | (-) S + didn't use to + V0 | (?) Did + S + use to + V0?",
        signal_words: ["in the past", "when I was young", "no longer", "used to"],
        common_mistake: "Nhầm lẫn giữa 'used to + V0' (đã từng làm) với 'be/get used to + V-ing' (đã quen với việc gì). Quên bỏ đuôi -d trong câu phủ định (didn't use to).",
        examples: [
          {
            text: "I used to play soccer every Sunday morning when I was in high school.",
            note: "Nhấn mạnh đây là thói quen thời cấp ba, hiện tại không còn chơi bóng đá vào sáng chủ nhật nữa"
          },
          {
            text: "He didn't use to like coffee, but now he drinks two cups a day.",
            note: "Quá khứ không thích cà phê, hiện tại đã thay đổi sở thích"
          }
        ],
        search_keywords: ["used to", "thói quen quá khứ", "từng làm gì"]
      },
      {
        topic: "Be used to + V-ing / Noun (Đã quen với việc gì)",
        category: "modal_verbs",
        short_rule: "Dùng để diễn tả ai đó đã quen thuộc, thích nghi với một việc gì hoặc môi trường nào đó ở hiện tại; việc đó không còn gây khó khăn hay xa lạ nữa.",
        structure: "S + be (am/is/are/was/were) + used to + V-ing / Noun phrase",
        signal_words: ["familiar with", "accustomed to", "now", "already"],
        common_mistake: "Sau 'be used to' bắt buộc phải là V-ing hoặc Danh từ, người học hay nhầm chia V0.",
        examples: [
          {
            text: "She is used to working night shifts, so she doesn't feel tired at all.",
            note: "Cô ấy đã quen với việc làm ca đêm (V-ing), việc này không còn là trở ngại đối với cô ấy"
          },
          {
            text: "Living in Hanoi, I am used to the heavy traffic during rush hours.",
            note: "Đã quen với tình trạng tắc đường (Noun phrase) ở Hà Nội"
          }
        ],
        search_keywords: ["be used to", "quen với việc gì", "accustomed to"]
      }
    ];

    this.importJsonContent.set(JSON.stringify(sample, null, 2));
    this.toast.info('Đã nạp 2 điểm ngữ pháp mẫu riêng biệt!');
  }

  clearImportText(): void {
    this.importJsonContent.set('');
  }

  resetForm(): void {
    this.activeTab.set('manual');
    this.topic.set('');
    this.category.set('tenses');
    this.shortRule.set('');
    this.structure.set('');
    this.signalWordsStr.set('');
    this.commonMistake.set('');
    this.searchKeywordsStr.set('');
    this.examples.set([{ text: '', note: '' }]);
    this.importJsonContent.set('');
    this.selectedPreset.set('all');
  }

  addExampleRow(): void {
    this.examples.update(list => [...list, { text: '', note: '' }]);
  }

  removeExampleRow(index: number): void {
    if (this.examples().length <= 1) {
      this.examples.set([{ text: '', note: '' }]);
      return;
    }
    this.examples.update(list => list.filter((_, i) => i !== index));
  }

  updateExampleText(index: number, val: string): void {
    this.examples.update(list => {
      const updated = [...list];
      if (updated[index]) updated[index] = { ...updated[index], text: val };
      return updated;
    });
  }

  updateExampleNote(index: number, val: string): void {
    this.examples.update(list => {
      const updated = [...list];
      if (updated[index]) updated[index] = { ...updated[index], note: val };
      return updated;
    });
  }

  onSubmitManual(): void {
    const topicVal = this.topic().trim();
    if (!topicVal) {
      this.toast.warning('Vui lòng nhập tên chủ đề ngữ pháp!');
      return;
    }

    const signalWords = this.signalWordsStr()
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const searchKeywords = this.searchKeywordsStr()
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const validExamples = this.examples().filter(e => e.text && e.text.trim().length > 0);

    const payload: Partial<GrammarPoint> = {
      topic: topicVal,
      category: this.category(),
      shortRule: this.shortRule().trim(),
      structure: this.structure().trim(),
      signalWords: signalWords,
      commonMistake: this.commonMistake().trim(),
      examples: validExamples,
      searchKeywords: searchKeywords
    };

    this.saving.set(true);

    const currentPoint = this.grammarPoint();
    if (currentPoint && currentPoint.id) {
      this.grammarApi.updateGrammarPoint(currentPoint.id, payload).subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.toast.success('Cập nhật điểm ngữ pháp thành công!');
          this.saved.emit(updated);
          this.onClose();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err?.message || 'Không thể cập nhật điểm ngữ pháp.');
        }
      });
    } else {
      this.grammarApi.createGrammarPoint(payload).subscribe({
        next: (created) => {
          this.saving.set(false);
          this.toast.success('Tạo mới điểm ngữ pháp thành công!');
          this.saved.emit(created);
          this.onClose();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err?.message || 'Không thể tạo điểm ngữ pháp.');
        }
      });
    }
  }

  onSubmitImportJson(): void {
    const val = this.parsedJsonStatus();
    if (val.status !== 'valid' || !val.items || val.items.length === 0) {
      this.toast.warning('Vui lòng kiểm tra lại định dạng JSON trước khi nạp!');
      return;
    }

    this.saving.set(true);
    this.grammarApi.batchImport(val.items).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.toast.success(`Đã nạp thành công: ${res.insertedCount} mới, ${res.updatedCount} cập nhật!`);
        this.saved.emit();
        this.onClose();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.message || 'Có lỗi khi nạp dữ liệu ngữ pháp.');
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
