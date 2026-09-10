import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { VocabCardComponent } from '@shared/components/vocab-card/vocab-card.component';
import { PronunciationService } from '@core/services/pronunciation.service';
import { Card } from '@models/index';
import {
  GrammarPoint,
  GRAMMAR_CATEGORIES,
  GrammarCategoryOption,
  GrammarExample,
  GrammarComparison
} from '../../models/grammar.model';
import { findMatchingUsageWords } from '../../config/usage-categories.config';

@Component({
  selector: 'app-grammar-card-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, VocabCardComponent],
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

    // 1. Explicit typical words
    if (p.typicalWords && p.typicalWords.length > 0) {
      p.typicalWords.forEach(w => {
        if (w && w.trim()) wordsSet.add(w.trim());
      });
    }

    // 2. Signal words from point
    if (p.signalWords && p.signalWords.length > 0) {
      p.signalWords.forEach(w => {
        if (w && w.trim()) wordsSet.add(w.trim());
      });
    }

    // 3. Signal words from multi usages
    if (p.usages && p.usages.length > 0) {
      p.usages.forEach(u => {
        if (u.signalWords && u.signalWords.length > 0) {
          u.signalWords.forEach(w => {
            if (w && w.trim()) wordsSet.add(w.trim());
          });
        }
      });
    }

    // 4. Inferred matching common words from USAGE_CATEGORY_GROUPS
    const matchedConfigWords = findMatchingUsageWords(p);
    matchedConfigWords.forEach(w => {
      if (w && w.trim()) wordsSet.add(w.trim());
    });

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

      // ── TIÊU CHÍ 1: KHỚP TỪ / CỤM TỪ CHÍNH XÁC (EXACT OR WORD-BOUNDARY MATCH) ──
      // Khớp chính xác với một trong các từ tiêu biểu (loại trừ hoàn toàn substring sai như "in" trong "information")
      const isExactWordMatch = typicalWords.some(w => {
        if (cardWord === w) return true;
        // Nếu w là cụm nhiều từ (VD: "look forward to", "used to", "responsible for")
        if (w.includes(' ') && cardWord === w) return true;
        // Kiểm tra khớp từ nguyên vẹn với ranh giới từ độc lập (\b)
        if (w.length >= 3 && cardWord.includes(' ')) {
          const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escaped}\\b`, 'i');
          return regex.test(cardWord);
        }
        return false;
      });
      if (isExactWordMatch) return true;

      // ── TIÊU CHÍ 2: KHỚP QUA NHÃN NGỮ PHÁP (GRAMMAR FUNCTION TAGS) ──
      // Thẻ từ vựng trong kho được gắn nhãn chức năng ngữ pháp đặc thù (VD: "grammar:prepositions", "grammar:gerunds_infinitives")
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

      // ── TIÊU CHÍ 3: KHỚP QUA CẤU TRÚC CÁCH DÙNG (USAGE STRUCTURE MATCH) ──
      // Thẻ từ có ghi rõ công thức ngữ pháp đặc thù trong usage (VD: "responsible for + V-ing/N", "enjoy + V-ing")
      if (c.usages && c.usages.length > 0 && typicalWords.length > 0) {
        const hasGrammarStructureMatch = c.usages.some(u => {
          const struct = (u.structure || '').toLowerCase();
          const note = (u.note || '').toLowerCase();
          if (!struct && !note) return false;

          return typicalWords.some(w => {
            if (w.length <= 1) return false;
            const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'i');
            return regex.test(struct) || regex.test(note);
          });
        });
        if (hasGrammarStructureMatch) return true;
      }

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
