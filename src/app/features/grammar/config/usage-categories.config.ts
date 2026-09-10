export interface UsageCategoryItem {
  key: string;
  labelVi: string;
  labelEn: string;
  icon: string;
  color: string;
  desc: string;
  commonWords: string[];
}

export interface PosUsageGroup {
  posKey: string;
  labelVi: string;
  labelEn: string;
  icon: string;
  color: string;
  categories: UsageCategoryItem[];
}

export const USAGE_CATEGORY_GROUPS: PosUsageGroup[] = [
  {
    posKey: 'preposition',
    labelVi: 'Giới từ (Prepositions)',
    labelEn: 'Prepositions',
    icon: 'fa-solid fa-route',
    color: '#06b6d4',
    categories: [
      {
        key: 'time',
        labelVi: 'Thời gian',
        labelEn: 'Time',
        icon: 'fa-solid fa-clock',
        color: '#38bdf8',
        desc: 'Chỉ thời điểm, khoảng thời gian hoặc thời hạn (in, on, at, since, for, during, by, until, before, after...)',
        commonWords: ['in', 'on', 'at', 'since', 'for', 'during', 'by', 'until', 'before', 'after', 'from']
      },
      {
        key: 'place',
        labelVi: 'Nơi chốn & Vị trí',
        labelEn: 'Place & Position',
        icon: 'fa-solid fa-location-dot',
        color: '#10b981',
        desc: 'Chỉ địa điểm, không gian hoặc vị trí tương đối (in, on, at, above, under, below, between, among, opposite...)',
        commonWords: ['in', 'on', 'at', 'above', 'under', 'below', 'between', 'among', 'behind', 'in front of', 'opposite', 'near']
      },
      {
        key: 'direction',
        labelVi: 'Hướng & Chuyển động',
        labelEn: 'Direction & Movement',
        icon: 'fa-solid fa-arrow-trend-up',
        color: '#f59e0b',
        desc: 'Chỉ phương hướng hoặc sự di chuyển (to, into, onto, through, across, along, towards, past...)',
        commonWords: ['to', 'into', 'onto', 'through', 'across', 'along', 'towards', 'past', 'round', 'over']
      },
      {
        key: 'cause_reason',
        labelVi: 'Nguyên nhân & Lý do',
        labelEn: 'Cause & Reason',
        icon: 'fa-solid fa-triangle-exclamation',
        color: '#ef4444',
        desc: 'Chỉ nguyên nhân hoặc nguồn cơn sự việc (because of, due to, owing to, on account of, thanks to...)',
        commonWords: ['because of', 'due to', 'owing to', 'on account of', 'thanks to']
      },
      {
        key: 'purpose',
        labelVi: 'Mục đích',
        labelEn: 'Purpose',
        icon: 'fa-solid fa-bullseye',
        color: '#8b5cf6',
        desc: 'Chỉ mục đích hoặc đối tượng hướng đến (for, in order for...)',
        commonWords: ['for', 'in order for']
      },
      {
        key: 'manner',
        labelVi: 'Cách thức & Phương tiện',
        labelEn: 'Manner & Means',
        icon: 'fa-solid fa-gears',
        color: '#ec4899',
        desc: 'Chỉ cách thức hành động hoặc phương tiện thực hiện (by, with, in a ... manner, via...)',
        commonWords: ['by', 'with', 'without', 'via']
      },
      {
        key: 'contrast',
        labelVi: 'Tương phản & Nhượng bộ',
        labelEn: 'Contrast & Concession',
        icon: 'fa-solid fa-arrows-split-up-and-left',
        color: '#a855f7',
        desc: 'Chỉ sự trái ngược hoặc nhượng bộ (despite, in spite of, regardless of...)',
        commonWords: ['despite', 'in spite of', 'regardless of']
      },
      {
        key: 'agent_instrument',
        labelVi: 'Chủ thể & Công cụ',
        labelEn: 'Agent & Instrument',
        icon: 'fa-solid fa-screwdriver-wrench',
        color: '#64748b',
        desc: 'Chỉ tác nhân thực hiện hoặc công cụ trong câu bị động (by, with...)',
        commonWords: ['by', 'with']
      }
    ]
  },
  {
    posKey: 'conjunction',
    labelVi: 'Liên từ (Conjunctions)',
    labelEn: 'Conjunctions',
    icon: 'fa-solid fa-signs-post',
    color: '#8b5cf6',
    categories: [
      {
        key: 'coordinating',
        labelVi: 'Đẳng lập (FANBOYS)',
        labelEn: 'Coordinating',
        icon: 'fa-solid fa-link',
        color: '#6366f1',
        desc: 'Nối các từ, cụm từ hoặc mệnh đề ngang hàng (for, and, nor, but, or, yet, so...)',
        commonWords: ['and', 'but', 'or', 'so', 'yet', 'for', 'nor']
      },
      {
        key: 'contrast',
        labelVi: 'Tương phản & Nhượng bộ',
        labelEn: 'Contrast',
        icon: 'fa-solid fa-code-compare',
        color: '#ec4899',
        desc: 'Nối mệnh đề chỉ sự đối lập hoặc nhượng bộ (although, though, even though, while, whereas...)',
        commonWords: ['although', 'though', 'even though', 'while', 'whereas']
      },
      {
        key: 'cause_reason',
        labelVi: 'Nguyên nhân & Lý do',
        labelEn: 'Cause & Reason',
        icon: 'fa-solid fa-lightbulb',
        color: '#f97316',
        desc: 'Nối mệnh đề chỉ lý do hoặc căn nguyên (because, since, as, now that, seeing that...)',
        commonWords: ['because', 'since', 'as', 'now that', 'seeing that']
      },
      {
        key: 'purpose',
        labelVi: 'Mục đích',
        labelEn: 'Purpose',
        icon: 'fa-solid fa-crosshairs',
        color: '#10b981',
        desc: 'Nối mệnh đề chỉ mục đích hướng đến (so that, in order that...)',
        commonWords: ['so that', 'in order that']
      },
      {
        key: 'condition',
        labelVi: 'Điều kiện & Giả định',
        labelEn: 'Condition',
        icon: 'fa-solid fa-code-branch',
        color: '#06b6d4',
        desc: 'Nối mệnh đề chỉ điều kiện hoặc trường hợp xảy ra (if, unless, provided that, as long as, in case...)',
        commonWords: ['if', 'unless', 'provided that', 'providing that', 'as long as', 'in case']
      },
      {
        key: 'time',
        labelVi: 'Thời gian',
        labelEn: 'Time',
        icon: 'fa-solid fa-hourglass-half',
        color: '#38bdf8',
        desc: 'Nối mệnh đề chỉ quan hệ thời gian (when, while, before, after, as soon as, until, once...)',
        commonWords: ['when', 'while', 'before', 'after', 'as soon as', 'until', 'once', 'since']
      },
      {
        key: 'result',
        labelVi: 'Kết quả',
        labelEn: 'Result',
        icon: 'fa-solid fa-circle-check',
        color: '#eab308',
        desc: 'Nối mệnh đề chỉ hệ quả xảy ra (so...that, such...that...)',
        commonWords: ['so that', 'such that']
      }
    ]
  },
  {
    posKey: 'transition_word',
    labelVi: 'Trạng từ liên kết (Transitions)',
    labelEn: 'Transition Words',
    icon: 'fa-solid fa-bolt',
    color: '#f59e0b',
    categories: [
      {
        key: 'addition',
        labelVi: 'Bổ sung thông tin',
        labelEn: 'Addition',
        icon: 'fa-solid fa-plus',
        color: '#10b981',
        desc: 'Bổ sung thêm ý kiến, luận điểm (furthermore, moreover, in addition, besides, additionally...)',
        commonWords: ['furthermore', 'moreover', 'in addition', 'besides', 'additionally', 'also']
      },
      {
        key: 'contrast',
        labelVi: 'Tương phản & Đối lập',
        labelEn: 'Contrast',
        icon: 'fa-solid fa-shuffle',
        color: '#f43f5e',
        desc: 'Chuyển ý sang chiều đối lập (however, nevertheless, on the other hand, nonetheless...)',
        commonWords: ['however', 'nevertheless', 'nonetheless', 'on the other hand', 'in contrast']
      },
      {
        key: 'result',
        labelVi: 'Kết quả & Hệ quả',
        labelEn: 'Result',
        icon: 'fa-solid fa-arrow-right-from-bracket',
        color: '#38bdf8',
        desc: 'Chỉ kết luận hoặc hệ quả suy ra (therefore, thus, consequently, as a result, hence...)',
        commonWords: ['therefore', 'thus', 'consequently', 'as a result', 'hence']
      },
      {
        key: 'sequence',
        labelVi: 'Trình tự & Thời gian',
        labelEn: 'Sequence & Time',
        icon: 'fa-solid fa-list-ol',
        color: '#8b5cf6',
        desc: 'Chỉ thứ tự các bước hoặc diễn biến thời gian (first, subsequently, finally, meanwhile, then...)',
        commonWords: ['first', 'subsequently', 'finally', 'meanwhile', 'then', 'afterwards']
      }
    ]
  },
  {
    posKey: 'collocation_idiom',
    labelVi: 'Cụm từ & Cấu trúc cố định',
    labelEn: 'Collocations & Fixed Phrases',
    icon: 'fa-solid fa-link-slash',
    color: '#10b981',
    categories: [
      {
        key: 'collocation',
        labelVi: 'Cụm từ cố định (Collocations)',
        labelEn: 'Collocations',
        icon: 'fa-solid fa-shapes',
        color: '#06b6d4',
        desc: 'Các cụm từ thường đi liền với nhau trong văn phong công việc/TOEIC (have access to, take responsibility for...)',
        commonWords: ['have access to', 'take into account', 'pay attention to', 'make a decision', 'take part in']
      },
      {
        key: 'phrasal_verb',
        labelVi: 'Cụm động từ (Phrasal Verbs)',
        labelEn: 'Phrasal Verbs',
        icon: 'fa-solid fa-arrows-spin',
        color: '#f59e0b',
        desc: 'Động từ kết hợp giới từ/trạng từ mang nghĩa đặc biệt (look forward to, run out of, carry out, set up...)',
        commonWords: ['look forward to', 'run out of', 'carry out', 'bring about', 'turn down', 'put off']
      },
      {
        key: 'idiom',
        labelVi: 'Thành ngữ (Idioms)',
        labelEn: 'Idioms',
        icon: 'fa-solid fa-masks-theater',
        color: '#ec4899',
        desc: 'Các quán ngữ / thành ngữ tiếng Anh tự nhiên (out of the blue, piece of cake, under the weather...)',
        commonWords: ['piece of cake', 'out of the blue', 'under the weather', 'hit the ground running']
      }
    ]
  }
];

export function findUsageCategoryInfo(categoryKey: string, posKey?: string): UsageCategoryItem | undefined {
  for (const grp of USAGE_CATEGORY_GROUPS) {
    if (!posKey || grp.posKey === posKey) {
      const match = grp.categories.find(c => c.key === categoryKey);
      if (match) return match;
    }
  }
  return undefined;
}

export function isCardMatchingPosGroup(cardPos?: string, groupPosKey?: string): boolean {
  if (!groupPosKey) return true;
  if (!cardPos) return false;
  const p = cardPos.trim().toLowerCase();
  switch (groupPosKey) {
    case 'preposition':
    case 'prepositions':
      return p === 'preposition' || p === 'prepositions' || p === 'prep';
    case 'conjunction':
    case 'conjunctions':
      return p === 'conjunction' || p === 'conjunctions' || p === 'conj';
    case 'transition_word':
    case 'transitions':
      return p === 'transition_word' || p === 'transition' || p === 'transition_adverb' || p === 'conjunctive_adverb';
    case 'collocation_idiom':
    case 'phrasal_verbs':
      return ['collocation', 'collocations', 'phrasal_verb', 'phrasal_verbs', 'idiom', 'phrase'].includes(p);
    default:
      return p === groupPosKey.toLowerCase();
  }
}

/**
 * Tìm kiếm danh sách từ vựng tiêu biểu từ cấu hình Ngữ pháp chức năng (USAGE_CATEGORY_GROUPS)
 * tương ứng với thông tin của một điểm ngữ pháp.
 */
export function findMatchingUsageWords(point?: { topic?: string; category?: string; searchKeywords?: string[] } | null): string[] {
  if (!point) return [];
  const words = new Set<string>();

  const targetText = [
    point.topic || '',
    point.category || '',
    ...(point.searchKeywords || [])
  ].join(' ').toLowerCase();

  for (const grp of USAGE_CATEGORY_GROUPS) {
    const isGroupMatch =
      targetText.includes(grp.posKey.toLowerCase()) ||
      targetText.includes(grp.labelEn.toLowerCase()) ||
      targetText.includes(grp.labelVi.toLowerCase()) ||
      (grp.posKey === 'preposition' && targetText.includes('prepositions')) ||
      (grp.posKey === 'conjunction' && targetText.includes('conjunctions')) ||
      (grp.posKey === 'collocation_idiom' && (targetText.includes('phrasal_verbs') || targetText.includes('phrasal_verb') || targetText.includes('collocation')));

    for (const cat of grp.categories) {
      const isCatMatch =
        isGroupMatch ||
        targetText.includes(cat.key.toLowerCase()) ||
        targetText.includes(cat.labelEn.toLowerCase()) ||
        targetText.includes(cat.labelVi.toLowerCase());

      if (isCatMatch && cat.commonWords && cat.commonWords.length > 0) {
        cat.commonWords.forEach(w => words.add(w.trim()));
      }
    }
  }

  return Array.from(words);
}

