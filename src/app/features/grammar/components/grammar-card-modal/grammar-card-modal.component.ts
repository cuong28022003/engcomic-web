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

    const typicalWords = this.typicalWordsList()
      .map(w => w.toLowerCase().trim())
      .filter(w => w.length > 0);
    const cards = this.userCards();
    if (cards.length === 0) return [];

    const pointCategory = (p.category || '').toLowerCase().trim();

    return cards.filter(c => {
      const cardWord = (c.word || '').trim().toLowerCase();
      if (!cardWord) return false;

      // ── TIÊU CHÍ 1: KHỚP TỪ / CỤM TỪ CHÍNH XÁC ──
      // card.word phải khớp chính xác với một trong các từ trong typicalWordsList.
      // Nếu card.word là cụm (có dấu cách), dùng \b để tránh khớp sai substring.
      if (typicalWords.length > 0) {
        const isExactWordMatch = typicalWords.some(w => {
          // Khớp chính xác toàn bộ từ
          if (cardWord === w) return true;
          // card.word là cụm từ dài hơn → kiểm tra w có xuất hiện nguyên vẹn không
          if (w.length >= 3 && cardWord.includes(' ')) {
            const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'i');
            return regex.test(cardWord);
          }
          return false;
        });
        if (isExactWordMatch) return true;
      }

      // ── TIÊU CHÍ 2: KHỚP QUA NHÃN NGỮ PHÁP (GRAMMAR TAG) ──
      // Thẻ phải được gắn tag tường minh dạng "grammar:<categoryKey>"
      // để đảm bảo chỉ những thẻ được đánh dấu đúng category mới lọt qua.
      if (c.tags && c.tags.length > 0) {
        const hasMatchingGrammarTag = c.tags.some(tag => {
          const t = tag.toLowerCase().trim();
          if (!t.startsWith('grammar:')) return false;
          const tagKey = t.replace('grammar:', '').trim();
          return tagKey === pointCategory ||
            (pointCategory === 'prepositions' && (tagKey.includes('prep') || tagKey.includes('adjective_prep'))) ||
            (pointCategory === 'conjunctions' && (tagKey.includes('conj') || tagKey.includes('transition'))) ||
            (pointCategory === 'gerunds_infinitives' && (tagKey.includes('gerund') || tagKey.includes('infinitive'))) ||
            (pointCategory === 'phrasal_verbs' && (tagKey.includes('phrasal') || tagKey.includes('collocation'))) ||
            (pointCategory === 'conditionals' && tagKey.includes('condition')) ||
            (pointCategory === 'subjunctive_wish' && (tagKey.includes('subjunctive') || tagKey.includes('wish')));
        });
        if (hasMatchingGrammarTag) return true;
      }

      // NOTE: Không dùng tiêu chí tìm từ trong usage.structure vì từ ngắn như
      // "for", "in", "to" xuất hiện trong hầu hết mọi cấu trúc → false positive hàng loạt.

      return false;
    });
  });

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
