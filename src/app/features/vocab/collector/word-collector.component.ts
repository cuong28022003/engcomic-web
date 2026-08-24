import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PendingItemApiService } from '@services/pending-item-api.service';
import { PendingCountService } from '@services/pending-count.service';
import { PendingItem } from '@models/index';
import { VocabImportModalComponent } from '@shared/components/vocab-import-modal/vocab-import-modal.component';
import { FormInputComponent } from '@shared/components/form-input/form-input.component';

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

  // Shared Vocab Modal
  isVocabModalOpen = signal<boolean>(false);

  pendingWordsText = computed(() => {
    return this.items().map(i => i.content).join(', ');
  });

  constructor(
    private pendingApi: PendingItemApiService,
    public pendingCountService: PendingCountService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadItems();
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
      family: '← họ từ', collocation: '← cụm từ', synonym: '← đồng nghĩa'
    };
    return map[item.sourceType] ?? '';
  }

  get pendingCount(): number {
    return this.items().filter(i => i.status === 'pending').length;
  }
}
