import { Component, input, output, signal, effect, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { AiImportWorkspaceComponent, AiPromptPreset, AiValidationStatus } from '@shared/components/ai-import-workspace/ai-import-workspace.component';
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
    label: '✨ Tổng hợp toàn diện (18 Chủ đề)',
    category: 'tenses, conditionals, passive_voice, relative_clauses, phrasal_verbs, conjunctions, modal_verbs, comparisons, gerunds_infinitives, parts_of_speech, subject_verb_agreement',
    desc: 'tất cả 18 chủ đề ngữ pháp tiếng Anh cốt lõi từ căn bản đến nâng cao'
  },
  {
    key: 'parts_of_speech',
    label: '🔤 1. Từ loại',
    category: 'parts_of_speech',
    desc: 'từ loại tiếng Anh (Danh từ đếm được/không đếm được, Đại từ nhân xưng/sở hữu/phản thân, Động từ thường/liên kết, Tính từ, Trạng từ, Thán từ)'
  },
  {
    key: 'tenses',
    label: '⏳ 2. 12 Thì cơ bản',
    category: 'tenses',
    desc: '12 thì cơ bản (Hiện tại đơn/tiếp diễn/hoàn thành/hoàn thành tiếp diễn, Quá khứ đơn/tiếp diễn/hoàn thành, Tương lai đơn/gần be going to/hoàn thành)'
  },
  {
    key: 'sentence_structure',
    label: '📐 3. Cấu trúc câu',
    category: 'sentence_structure',
    desc: 'cấu trúc câu đơn, câu ghép, câu phức, câu phức-ghép, trật tự từ, câu hỏi Yes/No, Wh-question, câu hỏi đuôi (tag questions)'
  },
  {
    key: 'passive_voice',
    label: '🛡️ 4. Câu bị động',
    category: 'passive_voice',
    desc: 'câu bị động theo từng thì, bị động với động từ khuyết thiếu (modal verbs), bị động 2 tân ngữ, câu mệnh lệnh bị động'
  },
  {
    key: 'conditionals',
    label: '🔀 5. Câu điều kiện',
    category: 'conditionals',
    desc: 'câu điều kiện loại 0, 1, 2, 3, câu điều kiện hỗn hợp (mixed conditionals), cấu trúc unless, provided that, in case'
  },
  {
    key: 'reported_speech',
    label: '💬 6. Câu tường thuật',
    category: 'reported_speech',
    desc: 'câu gián tiếp, quy tắc lùi thì (backshift), tường thuật câu hỏi, câu mệnh lệnh, lời khuyên và đề nghị'
  },
  {
    key: 'relative_clauses',
    label: '🔗 7. Mệnh đề quan hệ',
    category: 'relative_clauses',
    desc: 'đại từ/trạng từ quan hệ (who, whom, which, that, whose, where, when), mệnh đề xác định/không xác định, rút gọn mệnh đề quan hệ (V-ing / V3/ed)'
  },
  {
    key: 'gerunds_infinitives',
    label: '📝 8. Danh động từ & Động từ nguyên mẫu',
    category: 'gerunds_infinitives',
    desc: 'danh động từ (V-ing) vs động từ nguyên mẫu (To-V), cấu trúc prefer/would rather, used to vs be/get used to'
  },
  {
    key: 'modal_verbs',
    label: '⚡ 9. Động từ khuyết thiếu',
    category: 'modal_verbs',
    desc: 'can/could, may/might, must/have to, should/ought to, will/would, modal perfect (must have, should have, could have + V3)'
  },
  {
    key: 'comparisons',
    label: '⚖️ 10. Câu so sánh',
    category: 'comparisons',
    desc: 'so sánh hơn, so sánh nhất, so sánh bằng (as...as), cấu trúc càng... càng (the more... the more), so sánh bội số'
  },
  {
    key: 'articles_quantifiers',
    label: '📦 11. Mạo từ & Lượng từ',
    category: 'articles_quantifiers',
    desc: 'mạo từ a/an/the/zero article, lượng từ some/any, much/many, few/little, all/every/each, this/that/these/those'
  },
  {
    key: 'phrasal_verbs',
    label: '🛣️ 12. Cụm động từ & Giới từ',
    category: 'phrasal_verbs',
    desc: 'cụm động từ thông dụng (look for, give up, take over...), giới từ đi kèm tính từ/động từ, giới từ thời gian/nơi chốn (in, on, at)'
  },
  {
    key: 'subject_verb_agreement',
    label: '🤝 13. Hòa hợp chủ ngữ - động từ',
    category: 'subject_verb_agreement',
    desc: 'quy tắc hòa hợp giữa chủ ngữ và động từ, chủ ngữ có each/every/neither/either, danh từ tập hợp, cụm từ chèn giữa'
  },
  {
    key: 'inversion',
    label: '🔄 14. Câu đảo ngữ',
    category: 'inversion',
    desc: 'đảo ngữ với trạng từ phủ định (Never, Rarely, Seldom, Not only... but also, No sooner... than), đảo ngữ câu điều kiện'
  },
  {
    key: 'cleft_sentences',
    label: '🎯 15. Câu nhấn mạnh',
    category: 'cleft_sentences',
    desc: 'câu chẻ nhấn mạnh (It is/was... that/who, What... is/was), dùng trợ động từ do/does/did để nhấn mạnh'
  },
  {
    key: 'conjunctions',
    label: '🪧 16. Liên từ & Từ nối',
    category: 'conjunctions',
    desc: 'liên từ chỉ nguyên nhân/kết quả (because, since, so, therefore), tương phản (although, despite, however), bổ sung (furthermore, in addition)'
  },
  {
    key: 'parallel_structure',
    label: '⏸️ 17. Cấu trúc song song',
    category: 'parallel_structure',
    desc: 'cấu trúc song song trong liệt kê, câu ghép, với liên từ tương quan both...and, either...or, neither...nor, not only...but also'
  },
  {
    key: 'subjunctive_wish',
    label: '🌙 18. Câu ước & Thể giả định',
    category: 'subjunctive_wish',
    desc: 'câu ước với Wish / If only (quá khứ, hiện tại, tương lai), thể giả định (It is essential/vital that S + V0)'
  }
];

@Component({
  selector: 'app-grammar-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AiImportWorkspaceComponent],
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
  readonly grammarSteps = ['1. Chọn Chủ Đề & Prompt', '2. Dán & Kiểm Tra JSON'];
  readonly currentAiStep = signal<'prompt' | 'paste' | 'preview'>('prompt');

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

  // Dynamic Prompt Computed (Multi-usages, Real-life Context, Pitfalls & Comparisons)
  readonly generatedPrompt = computed(() => {
    const preset = this.promptPresets.find(p => p.key === this.selectedPreset()) || this.promptPresets[0];
    return `Bạn là một Chuyên gia Sư phạm & Ngôn ngữ học Tiếng Anh hàng đầu (Chuyên gia TOEIC / IELTS).
MỤC TIÊU CỐT LÕI: Giúp người học HIỂU SÂU BẢN CHẤT, NẮM RÕ TỪNG CÁCH DÙNG CHI TIẾT (MULTI-USAGES), TRÁNH BẪY ĐỀ THI VÀ PHÂN BIỆT RÕ RÀNG CÁC CẤU TRÚC DỄ NHẦM LẪN.

NGUYÊN TẮC THIẾT KẾ BẮT BUỘC:
👉 1. PHÂN CHIA RÕ RÀNG CÁC CÁCH DÙNG (USAGES):
Mỗi điểm ngữ pháp lớn (ví dụ: Present Perfect, Inversion, Conditionals, Gerunds...) có thể có từ 2 đến 4 CÁCH DÙNG CHI TIẾT (mảng "usages").
Mỗi cách dùng ("usage") phải có:
- "title": Tên cách dùng rõ ràng (VD: "1. Diễn tả trải nghiệm, kinh nghiệm sống").
- "structure": Công thức cụ thể của riêng cách dùng này (VD: "S + have/has + (never/ever) + V3/ed").
- "explanation": Giải thích ngắn gọn ngữ cảnh và bản chất của cách dùng này.
- "signal_words": Các dấu hiệu nhận biết riêng biệt (VD: ["ever", "never", "before", "once"]).
- "examples": Danh sách câu ví dụ sinh động có:
  + "text": Câu tiếng Anh tự nhiên.
  + "translation": Bản dịch nghĩa tiếng Việt chuẩn xác.
  + "highlight": Cụm từ cần lưu ý trong câu.
  + "note": Giải thích ngữ cảnh vì sao dùng cấu trúc này.

👉 2. TRÁNH BẪY ĐỀ THI & LỖI SAI KINH ĐIỂN:
- "common_mistakes": Danh sách 1-3 lỗi sai hoặc bẫy phổ biến nhất mà thí sinh hay mắc phải.
- "exam_tips": Danh sách 1-2 mẹo nhận diện nhanh trong 3 giây khi làm bài thi trắc nghiệm (TOEIC/IELTS).

👉 3. SO SÁNH PHÂN BIỆT (COMPARISONS):
- "comparisons": Mảng đối chiếu phân biệt với điểm ngữ pháp dễ gây nhầm lẫn (Ví dụ: So sánh Hiện tại hoàn thành vs Quá khứ đơn, Used to vs Be used to, Because of vs In spite of...).

Hãy biên soạn danh sách các điểm ngữ pháp trọng tâm về: ${preset.desc}.
Nhóm category phù hợp: [${preset.category}].

Định dạng JSON Array đầu ra:
[
  {
    "topic": "Hiện tại hoàn thành (Present Perfect Tense)",
    "category": "${preset.key === 'all' ? 'tenses' : preset.category}",
    "level": "intermediate",
    "summary": "Diễn tả hành động xảy ra trong quá khứ nhưng có kết quả hoặc liên hệ trực tiếp tới hiện tại.",
    "usages": [
      {
        "title": "1. Hành động bắt đầu trong quá khứ kéo dài đến hiện tại",
        "structure": "S + have/has + V3/ed + since (mốc) / for (khoảng)",
        "explanation": "Dùng để nói về một tình trạng hoặc hành động đã kéo dài được một khoảng thời gian.",
        "signal_words": ["since", "for", "so far", "up to now"],
        "examples": [
          {
            "text": "She has worked at this company for five years.",
            "translation": "Cô ấy đã làm việc tại công ty này được 5 năm.",
            "highlight": "has worked ... for five years",
            "note": "Hành động làm việc bắt đầu 5 năm trước và tiếp diễn ở hiện tại."
          }
        ]
      },
      {
        "title": "2. Diễn tả trải nghiệm, kinh nghiệm sống",
        "structure": "S + have/has + (never/ever) + V3/ed",
        "explanation": "Nhấn mạnh việc người nói đã từng hoặc chưa từng làm gì tính đến hiện tại.",
        "signal_words": ["ever", "never", "before", "several times"],
        "examples": [
          {
            "text": "Have you ever visited London?",
            "translation": "Bạn đã từng đến Luân Đôn bao giờ chưa?",
            "highlight": "Have you ever visited"
          }
        ]
      }
    ],
    "common_mistakes": [
      "Dùng thì Quá khứ đơn với 'since/for' (Sai: I lived here since 2020 -> Đúng: I have lived here since 2020)."
    ],
    "exam_tips": [
      "Trong bài thi TOEIC Part 5, nếu thấy 'since + mốc thời gian' -> 90% chọn thì Hiện tại hoàn thành."
    ],
    "comparisons": [
      {
        "compare_with": "Quá khứ đơn (Past Simple)",
        "core_difference": "Hiện tại hoàn thành không nêu rõ thời điểm chính xác và còn tiếp diễn/ảnh hưởng hiện tại; Quá khứ đơn đã kết thúc hoàn toàn trong quá khứ.",
        "current_example": "I have lost my key. (Hiện tại vẫn chưa tìm thấy)",
        "target_example": "I lost my key yesterday. (Chỉ kể sự việc hôm qua)"
      }
    ],
    "search_keywords": ["hiện tại hoàn thành", "present perfect", "since for", "12 thì"]
  }
]

YÊU CẦU ĐẦU RA:
1. Trả về DUY NHẤT một JSON array thuần hợp lệ (KHÔNG kèm lời dẫn, KHÔNG bọc thêm giải thích ngoài JSON).
2. Chuẩn hóa đầy đủ các trường và câu ví dụ kèm bản dịch tiếng Việt.`;
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
      if (!first.topic && !first.short_rule && !first.shortRule && !first.summary) {
        return { status: 'invalid', errorMessage: 'Các phần tử thiếu trường bắt buộc "topic" hoặc "summary".' };
      }

      return { status: 'valid', items };
    } catch (err: any) {
      return { status: 'invalid', errorMessage: err?.message || 'Cú pháp JSON chưa đúng (thiếu dấu ngoặc, dấu phẩy...).' };
    }
  });

  readonly validationStatusObj = computed<AiValidationStatus>(() => {
    const val = this.parsedJsonStatus();
    return {
      status: val.status,
      itemCount: val.items?.length,
      errorMessage: val.errorMessage
    };
  });

  readonly sampleJsonData = JSON.stringify([
    {
      topic: "Used to + V (Thói quen trong quá khứ)",
      category: "gerunds_infinitives",
      level: "basic",
      summary: "Dùng để diễn tả một thói quen hoặc trạng thái từng xảy ra thường xuyên trong quá khứ nhưng hiện tại đã chấm dứt hoàn toàn.",
      usages: [
        {
          title: "1. Thói quen hoặc hành động lặp đi lặp lại trong quá khứ",
          structure: "S + used to + V (nguyên mẫu)",
          explanation: "Nhấn mạnh thói quen cũ mà nay không còn làm nữa.",
          signal_words: ["in the past", "when I was young", "no longer"],
          examples: [
            {
              text: "I used to play badminton every Sunday morning when I was in high school.",
              translation: "Tôi từng chơi cầu lông vào mỗi sáng Chủ nhật khi còn học cấp ba.",
              highlight: "used to play"
            }
          ]
        },
        {
          title: "2. Phủ định và nghi vấn với used to",
          structure: "S + didn't use to + V | Did + S + use to + V?",
          explanation: "Lưu ý bỏ chữ 'd' ở used khi đã mượn trợ động từ did/didn't.",
          examples: [
            {
              text: "He didn't use to like coffee, but now he drinks two cups a day.",
              translation: "Trước đây anh ấy không thích cà phê, nhưng bây giờ ngày nào cũng uống hai tách.",
              highlight: "didn't use to like"
            }
          ]
        }
      ],
      common_mistakes: [
        "Nhầm lẫn giữa 'used to + V' (từng làm gì) với 'be/get used to + V-ing' (đã quen với việc gì)."
      ],
      exam_tips: [
        "Trong câu phủ định, nếu đã có 'didn't' thì dùng 'use to' (không có chữ 'd')."
      ],
      comparisons: [
        {
          compare_with: "Be used to + V-ing (Đã quen với)",
          core_difference: "'Used to V' nói về quá khứ đã dừng; 'Be used to V-ing' nói về sự quen thuộc ở hiện tại.",
          current_example: "I used to wake up late. (Quá khứ từng dậy muộn)",
          target_example: "I am used to waking up early. (Hiện tại đã quen dậy sớm)"
        }
      ],
      search_keywords: ["used to", "thói quen quá khứ", "từng làm gì"]
    }
  ], null, 2);

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
        topic: "Used to + V (Thói quen trong quá khứ)",
        category: "gerunds_infinitives",
        short_rule: "Dùng để diễn tả một thói quen hoặc trạng thái từng xảy ra thường xuyên trong quá khứ nhưng hiện tại đã chấm dứt hoàn toàn.",
        structure: "S + used to + V (thói quen cũ) | S + didn't use to + V",
        signal_words: ["in the past", "when I was young", "no longer", "used to"],
        common_mistake: "Nhầm lẫn giữa 'used to + V' (từng làm gì) với 'be/get used to + V-ing' (quen với việc gì). Quên bỏ đuôi -d trong câu phủ định (didn't use to).",
        examples: [
          {
            text: "I used to play badminton every Sunday morning when I was in high school.",
            note: "Tôi từng chơi cầu lông vào mỗi sáng Chủ nhật khi còn học cấp ba."
          },
          {
            text: "He didn't use to like coffee, but now he drinks two cups a day.",
            note: "Trước đây anh ấy không thích cà phê, nhưng bây giờ ngày nào cũng uống hai tách."
          }
        ],
        search_keywords: ["used to", "thói quen quá khứ", "từng làm gì"]
      },
      {
        topic: "Be used to + V-ing / Noun (Đã quen với việc gì)",
        category: "gerunds_infinitives",
        short_rule: "Dùng để diễn tả ai đó đã quen thuộc và không còn thấy bỡ ngỡ hay khó khăn với một sự việc, hành động nào đó ở hiện tại.",
        structure: "S + be (am/is/are/was/were) + used to + V-ing / Noun",
        signal_words: ["already", "familiar with", "now", "customary"],
        common_mistake: "Quên dùng V-ing sau 'be used to' mà lại dùng động từ nguyên mẫu V0.",
        examples: [
          {
            text: "I am used to waking up early because of my shift work.",
            note: "Tôi đã quen với việc thức dậy sớm vì lịch làm việc theo ca."
          },
          {
            text: "She lives in London, so she is used to the rainy weather.",
            note: "Cô ấy sống ở London nên đã quen với thời tiết mưa nhiều."
          }
        ],
        search_keywords: ["be used to", "quen với", "thói quen hiện tại"]
      }
    ];
    this.importJsonContent.set(JSON.stringify(sample, null, 2));
    this.toast.info('Đã dán dữ liệu mẫu thực tế vào ô nhập!');
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
    this.currentAiStep.set('prompt');
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
