import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { VocabCardComponent } from '@shared/components/vocab-card/vocab-card.component';
import { WordMiniChipComponent } from '@shared/components/word-mini-chip/word-mini-chip.component';
import { PronunciationService } from '@core/services/pronunciation.service';
import { Card } from '@models/index';
import {
  GrammarPoint,
  GRAMMAR_CATEGORIES,
  GrammarCategoryOption,
  GrammarExample,
  GrammarComparison
} from '../../models/grammar.model';

@Component({
  selector: 'app-grammar-card-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, VocabCardComponent, WordMiniChipComponent],
  templateUrl: './grammar-card-modal.component.html',
  styleUrls: ['./grammar-card-modal.component.scss']
})
export class GrammarCardModalComponent {
  private pronunciation = inject(PronunciationService);
  private router = inject(Router);

  readonly isOpen = input<boolean>(false);
  readonly grammarPoint = input<GrammarPoint | null>(null);
  readonly userCards = input<Card[]>([]);

  readonly close = output<void>();
  readonly edit = output<GrammarPoint>();
  readonly delete = output<GrammarPoint>();

  readonly activeTab = signal<'usages' | 'pitfalls' | 'comparisons' | 'vocabulary'>('usages');

  readonly categoryInfo = computed<GrammarCategoryOption>(() => {
    const p = this.grammarPoint();
    if (!p || !p.category) {
      return { key: 'other', label: 'Ngữ pháp', icon: 'fa-solid fa-book-open', color: '#6366f1' };
    }
    const found = GRAMMAR_CATEGORIES.find(
      c => c.key.toLowerCase() === p.category.toLowerCase()
    );
    return (
      found || {
        key: p.category,
        label: p.category,
        icon: 'fa-solid fa-book-bookmark',
        color: '#6366f1'
      }
    );
  });

  readonly levelInfo = computed<{ label: string; class: string }>(() => {
    const lvl = this.grammarPoint()?.level?.toLowerCase();
    switch (lvl) {
      case 'basic':
      case 'a1':
      case 'a2':
        return { label: 'Cơ bản', class: 'level-basic' };
      case 'intermediate':
      case 'b1':
      case 'b2':
        return { label: 'Trung cấp', class: 'level-intermediate' };
      case 'advanced':
      case 'c1':
      case 'c2':
        return { label: 'Nâng cao', class: 'level-advanced' };
      default:
        return { label: 'Phổ biến', class: 'level-general' };
    }
  });

  readonly hasUsages = computed<boolean>(() => {
    const usages = this.grammarPoint()?.usages;
    return Boolean(usages && usages.length > 0);
  });

  readonly standaloneExamples = computed<GrammarExample[]>(() => {
    return this.grammarPoint()?.examples || [];
  });

  readonly allPitfalls = computed<string[]>(() => {
    const p = this.grammarPoint();
    if (!p) return [];
    const list: string[] = [];
    if (p.commonMistake && p.commonMistake.trim()) {
      list.push(p.commonMistake.trim());
    }
    if (p.commonMistakes && p.commonMistakes.length > 0) {
      p.commonMistakes.forEach(m => {
        if (m && m.trim() && !list.includes(m.trim())) {
          list.push(m.trim());
        }
      });
    }
    return list;
  });

  readonly comparisonsList = computed<GrammarComparison[]>(() => {
    return this.grammarPoint()?.comparisons || [];
  });

  readonly typicalWordsList = computed<string[]>(() => {
    const p = this.grammarPoint();
    if (!p) return [];

    const wordsSet = new Set<string>();

    // 1. Explicit typical words (nhập tay trong DB — nguồn chính xác nhất)
    if (p.typicalWords && p.typicalWords.length > 0) {
      p.typicalWords.forEach(w => {
        if (w && w.trim()) wordsSet.add(w.trim());
      });
    }

    // 2. Signal words từ điểm ngữ pháp (legacy field)
    if (p.signalWords && p.signalWords.length > 0) {
      p.signalWords.forEach(w => {
        if (w && w.trim()) wordsSet.add(w.trim());
      });
    }

    // 3. Signal words từ từng cách dùng (usages[].signalWords)
    if (p.usages && p.usages.length > 0) {
      p.usages.forEach(u => {
        if (u.signalWords && u.signalWords.length > 0) {
          u.signalWords.forEach(w => {
            if (w && w.trim()) wordsSet.add(w.trim());
          });
        }
      });
    }

    // NOTE: Không dùng USAGE_CATEGORY_GROUPS inference vì quá noisy —
    // khi group match thì toàn bộ sub-categories bị kéo vào, gây ra nhiều từ không liên quan.

    return Array.from(wordsSet);
  });

  readonly hasTypicalWords = computed<boolean>(() => {
    return this.typicalWordsList().length > 0;
  });

  readonly matchedVaultCards = computed<Card[]>(() => {
    const p = this.grammarPoint();
    if (!p) return [];

    const typicalSet = this.toTypicalWordSet(this.typicalWordsList());
    const cards = this.userCards();
    if (typicalSet.size === 0 || cards.length === 0) return [];

    // CHỈ hiển thị card mà từ/cụm từ của nó NẰM CHÍNH XÁC trong danh sách
    // "từ & cụm từ tiêu biểu" — không match tag, không match lỏng theo từ chứa,
    // tránh hiện những từ vựng không thuộc danh sách tiêu biểu.
    return cards.filter(c => typicalSet.has((c.word ?? '').trim().toLowerCase()));
  });

  /** Set các từ tiêu biểu (đã lowercase) ĐÃ có trong kho từ vựng — dùng để đánh dấu tích trên chip */
  readonly vaultWordLookup = computed<Set<string>>(() => {
    const typicalSet = this.toTypicalWordSet(this.typicalWordsList());
    const cards = this.userCards();
    const set = new Set<string>();
    if (typicalSet.size === 0 || cards.length === 0) return set;

    const vaultWords = cards
      .map(c => (c.word ?? '').trim().toLowerCase())
      .filter(w => w.length > 0);
    for (const w of typicalSet) {
      if (vaultWords.includes(w)) set.add(w);
    }
    return set;
  });

  /** Chuyển danh sách từ tiêu biểu về Set đã trim + lowercase */
  private toTypicalWordSet(words: string[]): Set<string> {
    const set = new Set<string>();
    for (const w of words) {
      const clean = (w ?? '').trim().toLowerCase();
      if (clean) set.add(clean);
    }
    return set;
  }

  setActiveTab(tab: 'usages' | 'pitfalls' | 'comparisons' | 'vocabulary'): void {
    this.activeTab.set(tab);
  }

  playAudio(text?: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (text && text.trim()) {
      this.pronunciation.speak(text.trim(), 'us');
    }
  }

  onVocabCardClick(card: Card): void {
    if (card.id) {
      this.router.navigate(['/vocab/word', card.id]);
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
