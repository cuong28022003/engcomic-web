import { Component, input, output, signal, inject, OnInit, OnDestroy, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { CardApiService } from '@core/services/card-api.service';
import { PronunciationService } from '@core/services/pronunciation.service';
import { TranslatorApiService, TranslateResponse } from '@core/services/translator-api.service';
import { PendingItemApiService } from '@core/services/pending-item-api.service';
import { ToastService } from '@core/services/toast.service';
import { Card } from '@models/index';
import { getPosConfig, PartOfSpeechConfig } from '@shared/constants/part-of-speech.constant';

export interface StatusFilterOption {
  key: string;
  label: string;
  icon: string;
  color: string;
}

interface MyMemoryTranslateResponse {
  responseData?: { translatedText?: string };
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
  private http = inject(HttpClient);
  private translatorApi = inject(TranslatorApiService);
  private pendingItemApi = inject(PendingItemApiService);
  private toast = inject(ToastService);

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

  // Word không có trong Vault → hiển thị tra cứu nhanh (giống app-word-lookup-popup)
  readonly searchWordInfo = signal<TranslateResponse | null>(null);
  readonly wordInfoLoading = signal<boolean>(false);
  readonly isAdded = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly isSpeaking = signal<'us' | 'uk' | null>(null);
  readonly suggestedWord = signal<string>('');

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
    this.isAdded.set(false);
    this.searchWordInfo.set(null);
    this.wordInfoLoading.set(false);
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
      this.isAdded.set(false);
      this.searchWordInfo.set(null);
      this.wordInfoLoading.set(false);
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
        this.checkMissingWordLookup();
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
        this.checkMissingWordLookup();
      }
    });
  }

  private checkMissingWordLookup(): void {
    const clean = this.query().trim();
    if (!this.loading() && clean && this.results().length === 0) {
      this.lookupMissingWord(clean);
    } else {
      this.searchWordInfo.set(null);
      this.wordInfoLoading.set(false);
    }
  }

  private lookupMissingWord(clean: string): void {
    this.suggestedWord.set(clean);
    this.searchWordInfo.set(null);
    this.wordInfoLoading.set(true);
    this.isAdded.set(false);

    this.translatorApi.translateText({ text: clean }).subscribe({
      next: (data) => {
        if (this.suggestedWord() !== clean) return;
        if (
          data &&
          data.meaning &&
          data.meaning.trim() &&
          data.meaning.trim().toLowerCase() !== clean.toLowerCase() &&
          !data.meaning.startsWith('Không thể gọi API Python')
        ) {
          this.searchWordInfo.set(data);
        } else {
          this.fallbackClientTranslation(clean);
        }
        this.wordInfoLoading.set(false);
      },
      error: () => {
        if (this.suggestedWord() !== clean) return;
        this.fallbackClientTranslation(clean);
      }
    });
  }

  private fallbackClientTranslation(clean: string): void {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|vi`;
    this.http.get<MyMemoryTranslateResponse>(url).subscribe({
      next: (res) => {
        if (this.suggestedWord() !== clean) return;
        const text = res?.responseData?.translatedText;
        this.searchWordInfo.set({
          word: clean,
          meaning: text && text.trim() ? text.trim() : clean
        });
        this.wordInfoLoading.set(false);
      },
      error: () => {
        if (this.suggestedWord() !== clean) return;
        this.searchWordInfo.set({ word: clean, meaning: clean });
        this.wordInfoLoading.set(false);
      }
    });
  }

  async speakForMissingWord(accent: 'us' | 'uk'): Promise<void> {
    const clean = this.query().trim();
    if (!clean || this.isSpeaking()) return;

    this.isSpeaking.set(accent);
    try {
      await this.pronunciation.speak(clean, accent);
    } finally {
      if (this.isSpeaking() === accent) {
        this.isSpeaking.set(null);
      }
    }
  }

  addToWordCollector(): void {
    const clean = this.query().trim();
    if (!clean || this.isSaving() || this.isAdded()) return;

    this.isSaving.set(true);
    this.pendingItemApi.addManual(clean).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isAdded.set(true);
        this.toast.success(`Đã thêm "${clean}" vào Sổ từ vựng (Word Collector)!`);
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.error('Không thể thêm từ. Vui lòng thử lại!');
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
