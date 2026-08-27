import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectionCheckboxComponent } from '@shared/components/selection-checkbox/selection-checkbox.component';
import {
  GrammarPoint,
  GRAMMAR_CATEGORIES,
  GrammarCategoryOption
} from '../../models/grammar.model';

@Component({
  selector: 'app-grammar-card',
  standalone: true,
  imports: [CommonModule, SelectionCheckboxComponent],
  templateUrl: './grammar-card.component.html',
  styleUrls: ['./grammar-card.component.scss']
})
export class GrammarCardComponent {
  readonly point = input.required<GrammarPoint>();
  readonly layout = input<'grid' | 'list'>('grid');
  readonly selected = input<boolean>(false);
  readonly showCheckbox = input<boolean>(true);

  readonly cardClick = output<GrammarPoint>();
  readonly selectChange = output<{ id: string; selected: boolean }>();

  readonly categoryInfo = computed<GrammarCategoryOption>(() => {
    const p = this.point();
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
    const lvl = this.point()?.level?.toLowerCase();
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

  readonly signalWordsList = computed<string[]>(() => {
    return this.point()?.signalWords || [];
  });

  readonly displayedSignals = computed<string[]>(() => {
    return this.signalWordsList().slice(0, 3);
  });

  readonly remainingSignalsCount = computed<number>(() => {
    const total = this.signalWordsList().length;
    return total > 3 ? total - 3 : 0;
  });

  readonly totalExamplesCount = computed<number>(() => {
    const p = this.point();
    let count = p?.examples?.length || 0;
    if (p?.usages) {
      p.usages.forEach(u => {
        if (u.examples) count += u.examples.length;
      });
    }
    return count;
  });

  readonly hasPitfalls = computed<boolean>(() => {
    const p = this.point();
    return Boolean(p?.commonMistake || (p?.commonMistakes && p.commonMistakes.length > 0));
  });

  readonly hasTips = computed<boolean>(() => {
    const p = this.point();
    return Boolean(p?.examTips && p.examTips.length > 0);
  });

  readonly hasComparisons = computed<boolean>(() => {
    const p = this.point();
    return Boolean(p?.comparisons && p.comparisons.length > 0);
  });

  onCardClick(): void {
    this.cardClick.emit(this.point());
  }

  onToggleSelect(checked: boolean): void {
    if (this.point().id) {
      this.selectChange.emit({ id: this.point().id, selected: checked });
    }
  }
}
