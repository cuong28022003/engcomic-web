import { Component, input, output, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { GrammarApiService } from '@core/services/grammar-api.service';
import { GrammarPoint, GRAMMAR_CATEGORIES } from '../../models/grammar.model';

@Component({
  selector: 'app-grammar-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, LoadingComponent, EmptyStateComponent],
  templateUrl: './grammar-search-modal.component.html',
  styleUrls: ['./grammar-search-modal.component.scss']
})
export class GrammarSearchModalComponent implements OnInit {
  private grammarApi = inject(GrammarApiService);

  readonly isOpen = input<boolean>(false);

  readonly close = output<void>();
  readonly selectPoint = output<GrammarPoint>();

  readonly allPoints = signal<GrammarPoint[]>([]);
  readonly loading = signal<boolean>(false);
  readonly query = signal<string>('');

  readonly filteredPoints = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) {
      return this.allPoints().slice(0, 15);
    }

    const tokens = q.split(/\s+/).filter(t => t.length > 0);

    return this.allPoints()
      .map(point => {
        let score = 0;
        const topic = point.topic.toLowerCase();
        const shortRule = (point.shortRule || '').toLowerCase();
        const category = point.category.toLowerCase();
        const structure = (point.structure || '').toLowerCase();
        const signals = (point.signalWords || []).map(s => s.toLowerCase());
        const keywords = (point.searchKeywords || []).map(k => k.toLowerCase());

        for (const token of tokens) {
          if (topic.includes(token)) score += 10;
          if (keywords.some(k => k.includes(token))) score += 7;
          if (signals.some(s => s.includes(token))) score += 5;
          if (structure.includes(token)) score += 4;
          if (shortRule.includes(token)) score += 3;
          if (category.includes(token)) score += 2;
        }

        return { point, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.point);
  });

  ngOnInit(): void {
    this.loadGrammarPoints();
  }

  loadGrammarPoints(): void {
    this.loading.set(true);
    this.grammarApi.getGrammarPoints().subscribe({
      next: (points) => {
        this.allPoints.set(points || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getCategoryBadge(categoryKey: string) {
    const cat = categoryKey?.toLowerCase();
    return GRAMMAR_CATEGORIES.find(c => c.key === cat) || {
      key: cat || 'general',
      label: categoryKey || 'Ngữ pháp',
      icon: 'fa-solid fa-book',
      color: '#6366f1'
    };
  }

  onSelect(point: GrammarPoint): void {
    this.selectPoint.emit(point);
    this.onClose();
  }

  onClose(): void {
    this.query.set('');
    this.close.emit();
  }
}
