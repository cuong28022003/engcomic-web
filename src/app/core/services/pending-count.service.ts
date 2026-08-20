import { Injectable, signal } from '@angular/core';
import { PendingItemApiService } from './pending-item-api.service';

@Injectable({ providedIn: 'root' })
export class PendingCountService {
  pendingCount = signal<number>(0);
  pendingWords = signal<Set<string>>(new Set());

  constructor(private pendingApi: PendingItemApiService) {}

  /** Tải lại toàn bộ pending items và cập nhật count + words set */
  refresh(): void {
    this.pendingApi.getAll({ status: 'pending', page: 0, size: 500 }).subscribe({
      next: (res) => {
        const items = res?.content ?? [];
        this.pendingCount.set(res?.totalElements ?? items.length);
        const wordSet = new Set<string>();
        items.forEach((item) => {
          if (item.content) {
            wordSet.add(item.content.trim().toLowerCase());
          }
        });
        this.pendingWords.set(wordSet);
      },
      error: () => {}
    });
  }

  isWordPending(word?: string): boolean {
    if (!word) return false;
    return this.pendingWords().has(word.trim().toLowerCase());
  }

  addPendingWord(word: string): void {
    if (!word) return;
    const clean = word.trim().toLowerCase();
    this.pendingWords.update((s) => {
      const next = new Set(s);
      next.add(clean);
      return next;
    });
    this.pendingCount.update((c) => c + 1);
  }

  removePendingWord(word: string): void {
    if (!word) return;
    const clean = word.trim().toLowerCase();
    this.pendingWords.update((s) => {
      const next = new Set(s);
      next.delete(clean);
      return next;
    });
    this.pendingCount.update((c) => Math.max(0, c - 1));
  }
}
