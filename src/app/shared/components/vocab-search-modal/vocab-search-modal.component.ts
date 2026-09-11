import { Component, input, output, signal, inject, OnInit, OnDestroy, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { CardApiService } from '@core/services/card-api.service';
import { PronunciationService } from '@core/services/pronunciation.service';
import { Card } from '@models/index';
import { getPosConfig, PartOfSpeechConfig } from '@shared/constants/part-of-speech.constant';

export interface StatusFilterOption {
  key: string;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-vocab-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, LoadingComponent, EmptyStateComponent],
  templateUrl: './vocab-search-modal.component.html',
  styleUrls: ['./vocab-search-modal.component.scss']
})
export class VocabSearchModalComponent implements OnInit, OnDestroy {
  private cardApi = inject(CardApiService);
  private router = inject(Router);
  private pronunciation = inject(PronunciationService);

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('resultsList') resultsListRef?: ElementRef<HTMLDivElement>;

  readonly isOpen = input<boolean>(false);

  readonly close = output<void>();
  readonly selectCard = output<Card>();

  readonly query = signal<string>('');
  readonly activeStatus = signal<string>('all');
  readonly activeTopic = signal<string>('');
  readonly results = signal<Card[]>([]);
  readonly loading = signal<boolean>(false);
  readonly selectedIndex = signal<number>(-1);
  readonly playingWord = signal<string | null>(null);

  readonly statusOptions: StatusFilterOption[] = [
    { key: 'all', label: 'Tất cả', icon: 'fa-solid fa-list-check', color: '#94a3b8' },
    { key: 'new', label: 'Mới', icon: 'fa-solid fa-seedling', color: '#38bdf8' },
    { key: 'learning', label: 'Đang học', icon: 'fa-solid fa-chart-line', color: '#f59e0b' },
    { key: 'mature', label: 'Thành thạo', icon: 'fa-solid fa-check-circle', color: '#10b981' },
    { key: 'leech', label: 'Khó nhớ', icon: 'fa-solid fa-triangle-exclamation', color: '#ef4444' }
  ];

  readonly quickHints: { label: string; tag: string; type: 'query' | 'topic' | 'status' }[] = [
    { label: '#Business', tag: 'Business', type: 'query' },
    { label: '#Workplace', tag: 'Workplace', type: 'query' },
    { label: '#DailyLife', tag: 'Daily Life', type: 'query' },
    { label: '#PhrasalVerb', tag: 'phrasal_verb', type: 'query' },
    { label: '#Idiom', tag: 'idiom', type: 'query' },
    { label: '#KhóNhớ', tag: 'leech', type: 'status' }
  ];

  private searchSubject = new Subject<string>();
  private subs = new Subscription();

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open) {
        this.selectedIndex.set(-1);
        setTimeout(() => {
          this.searchInputRef?.nativeElement?.focus();
        }, 120);
        this.fetchCards();
      }
    });
  }

  ngOnInit(): void {
    this.subs.add(
      this.searchSubject.pipe(debounceTime(250)).subscribe(() => {
        this.fetchCards();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onQueryChange(val: string): void {
    this.query.set(val);
    this.selectedIndex.set(-1);
    this.searchSubject.next(val);
  }

  setStatus(statusKey: string): void {
    if (this.activeStatus() === statusKey) return;
    this.activeStatus.set(statusKey);
    this.selectedIndex.set(-1);
    this.fetchCards();
  }

  applyHint(hint: { label: string; tag: string; type: 'query' | 'topic' | 'status' }): void {
    if (hint.type === 'status') {
      this.setStatus(hint.tag);
    } else {
      this.query.set(hint.tag);
      this.selectedIndex.set(-1);
      this.fetchCards();
    }
  }

  fetchCards(): void {
    this.loading.set(true);
    const q = this.query().trim();
    const st = this.activeStatus();

    const params: Record<string, string | number | boolean | undefined> = {
      page: 0,
      size: 25
    };

    if (q) {
      params['search'] = q;
    }
    if (st && st !== 'all') {
      params['status'] = st;
    }

    this.cardApi.getDashboard(params).subscribe({
      next: (res) => {
        const cards = res?.cards?.content || [];
        this.results.set(cards);
        this.loading.set(false);
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
      }
    });
  }

  playAudio(event: Event, word: string): void {
    event.stopPropagation();
    if (!word) return;
    this.playingWord.set(word);
    this.pronunciation.speak(word, 'us');
    setTimeout(() => {
      if (this.playingWord() === word) {
        this.playingWord.set(null);
      }
    }, 1200);
  }

  getPosBadge(pos?: string): PartOfSpeechConfig | undefined {
    return getPosConfig(pos);
  }

  getStatusBadgeInfo(status?: string): { label: string; css: string; icon: string } {
    switch (status) {
      case 'new':
        return { label: 'Mới', css: 'status-new', icon: 'fa-solid fa-seedling' };
      case 'learning':
        return { label: 'Đang học', css: 'status-learning', icon: 'fa-solid fa-chart-line' };
      case 'mature':
        return { label: 'Thành thạo', css: 'status-mature', icon: 'fa-solid fa-check-circle' };
      case 'leech':
        return { label: 'Khó nhớ', css: 'status-leech', icon: 'fa-solid fa-triangle-exclamation' };
      default:
        return { label: 'Chưa học', css: 'status-default', icon: 'fa-regular fa-circle' };
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    const total = this.results().length;
    if (total === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = (this.selectedIndex() + 1) % total;
      this.selectedIndex.set(next);
      this.scrollToItem(next);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = (this.selectedIndex() - 1 + total) % total;
      this.selectedIndex.set(prev);
      this.scrollToItem(prev);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const current = this.selectedIndex();
      if (current >= 0 && current < total) {
        this.onSelect(this.results()[current]);
      }
    }
  }

  private scrollToItem(index: number): void {
    const container = this.resultsListRef?.nativeElement;
    if (!container) return;
    const items = container.querySelectorAll('.card-result-item');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  onSelect(card: Card): void {
    this.selectCard.emit(card);
    this.onClose();
    this.router.navigate(['/vocab/word', card.id]);
  }

  onClose(): void {
    this.query.set('');
    this.activeStatus.set('all');
    this.selectedIndex.set(-1);
    this.close.emit();
  }
}
