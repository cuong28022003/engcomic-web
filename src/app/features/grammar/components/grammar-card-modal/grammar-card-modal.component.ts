import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { PronunciationService } from '@core/services/pronunciation.service';
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
  imports: [CommonModule, ModalComponent],
  templateUrl: './grammar-card-modal.component.html',
  styleUrls: ['./grammar-card-modal.component.scss']
})
export class GrammarCardModalComponent {
  private pronunciation = inject(PronunciationService);

  readonly isOpen = input<boolean>(false);
  readonly grammarPoint = input<GrammarPoint | null>(null);

  readonly close = output<void>();
  readonly edit = output<GrammarPoint>();
  readonly delete = output<GrammarPoint>();

  readonly activeTab = signal<'usages' | 'pitfalls' | 'comparisons'>('usages');

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

  setActiveTab(tab: 'usages' | 'pitfalls' | 'comparisons'): void {
    this.activeTab.set(tab);
  }

  playAudio(text?: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (text && text.trim()) {
      this.pronunciation.speak(text.trim(), 'us');
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
