import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PendingItemApiService } from '@services/pending-item-api.service';
import { PendingCountService } from '@services/pending-count.service';
import { PendingItem } from '@models/index';
import { VocabImportModalComponent } from '@shared/components/vocab-import-modal/vocab-import-modal.component';
import { FormInputComponent } from '@shared/components/form-input/form-input.component';

export type SourceFilter = 'all' | 'toeic_review' | 'relations' | 'manual';

@Component({
  selector: 'app-word-collector',
  standalone: true,
  imports: [CommonModule, FormsModule, VocabImportModalComponent, FormInputComponent],
  templateUrl: './word-collector.component.html',
  styleUrls: ['./word-collector.component.scss'],
})
export class WordCollectorComponent implements OnInit {
  items = signal<PendingItem[]>([]);
  loading = signal(true);
  newWord = '';
  addingManual = false;
  sourceFilter = signal<SourceFilter>('all');

  // Shared Vocab Modal
  isVocabModalOpen = signal<boolean>(false);

  readonly toeicCount = computed(() => this.items().filter(i => i.sourceType === 'toeic_review').length);
  readonly relationsCount = computed(() => this.items().filter(i => ['family', 'collocation', 'synonym'].includes(i.sourceType || '')).length);
  readonly manualCount = computed(() => this.items().filter(i => !i.sourceType || i.sourceType === 'manual').length);

  readonly filteredItems = computed(() => {
    const f = this.sourceFilter();
    const list = this.items();
    if (f === 'toeic_review') {
      return list.filter(i => i.sourceType === 'toeic_review');
    }
    if (f === 'relations') {
      return list.filter(i => ['family', 'collocation', 'synonym'].includes(i.sourceType || ''));
    }
    if (f === 'manual') {
      return list.filter(i => !i.sourceType || i.sourceType === 'manual');
    }
    return list;
  });

  readonly filteredWordsList = computed(() => {
    return this.filteredItems().map(i => i.content.trim()).filter(Boolean);
  });

  readonly pendingWordsText = computed(() => {
    return this.filteredWordsList().join(', ');
  });

  constructor(
    private pendingApi: PendingItemApiService,
    public pendingCountService: PendingCountService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadItems();
  }

  setSourceFilter(f: SourceFilter) {
    this.sourceFilter.set(f);
  }

  loadItems() {
    this.loading.set(true);
    this.pendingApi.getAll({ status: 'pending', page: 0, size: 200 }).subscribe({
      next: (res) => {
        this.items.set(res?.content ?? []);
        this.pendingCountService.refresh();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  addManual() {
    const word = this.newWord.trim();
    if (!word || this.addingManual) return;
    this.addingManual = true;

    this.pendingApi.addManual(word).subscribe({
      next: (item) => {
        this.items.update(list => [item, ...list]);
        this.pendingCountService.addPendingWord(word);
        this.newWord = '';
        this.addingManual = false;
      },
      error: () => { this.addingManual = false; }
    });
  }

  removeItem(item: PendingItem) {
    this.pendingApi.remove(item.id).subscribe({
      next: () => {
        this.items.update(list => list.filter(i => i.id !== item.id));
        this.pendingCountService.removePendingWord(item.content);
      }
    });
  }

  openVocabImportModal(): void {
    this.isVocabModalOpen.set(true);
  }

  onVocabAdded(): void {
    this.loadItems();
  }

  getSourceLabel(item: PendingItem): string {
    if (!item.sourceType || item.sourceType === 'manual') return '';
    const map: Record<string, string> = {
      family: '← họ từ',
      collocation: '← cụm từ',
      synonym: '← đồng nghĩa',
      toeic_review: '← đề thi TOEIC'
    };
    return map[item.sourceType] ?? '';
  }

  getSourceBadgeClass(item: PendingItem): string {
    if (item.sourceType === 'toeic_review') return 'source-toeic';
    if (['family', 'collocation', 'synonym'].includes(item.sourceType || '')) return 'source-relation';
    return 'source-manual';
  }

  get pendingCount(): number {
    return this.items().filter(i => i.status === 'pending').length;
  }
}
