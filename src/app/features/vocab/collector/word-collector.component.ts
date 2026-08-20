import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PendingItemApiService } from '@services/pending-item-api.service';
import { PendingCountService } from '@services/pending-count.service';
import { PendingItem } from '@models/index';

@Component({
  selector: 'app-word-collector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './word-collector.component.html',
  styleUrls: ['./word-collector.component.scss'],
})
export class WordCollectorComponent implements OnInit {
  items = signal<PendingItem[]>([]);
  loading = signal(true);
  generatingPrompt = signal(false);
  promptText = signal('');
  showPrompt = signal(false);
  newWord = '';
  addingManual = false;

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

  generatePrompt() {
    this.generatingPrompt.set(true);
    this.pendingApi.generatePrompt().subscribe({
      next: (res) => {
        this.promptText.set(res.prompt);
        this.showPrompt.set(true);
        this.generatingPrompt.set(false);
      },
      error: () => this.generatingPrompt.set(false)
    });
  }

  copyPrompt() {
    navigator.clipboard.writeText(this.promptText());
  }

  goToImport() {
    this.router.navigate(['/vocab/import']);
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
