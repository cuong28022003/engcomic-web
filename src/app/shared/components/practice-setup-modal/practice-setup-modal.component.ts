import { Component, Input, Output, EventEmitter, signal, computed, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Card, Deck } from '@models/index';

export type PracticeMode = '4level' | 'flashcard';

export interface PracticeSessionConfig {
  deckId: string;
  mode: PracticeMode;
  level: number; // 0 = all, 1, 2, 3, 4
  pos: string; // 'all' or specific part of speech
  starOnly: boolean;
  shuffle: boolean;
  limit: number;
}

@Component({
  selector: 'app-practice-setup-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practice-setup-modal.component.html',
  styleUrls: ['./practice-setup-modal.component.scss'],
})
export class PracticeSetupModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() deck: Deck | null = null;
  @Input() cards: Card[] = [];
  @Input() availablePosList: Array<{ key: string; label: string; count: number }> = [];
  @Input() initialMode: PracticeMode = '4level';

  @Output() close = new EventEmitter<void>();
  @Output() start = new EventEmitter<PracticeSessionConfig>();

  // State signals
  selectedMode = signal<PracticeMode>('4level');
  selectedLevel = signal<number>(0); // 0 = all
  selectedPos = signal<string>('all');
  isStarOnly = signal<boolean>(false);
  isShuffle = signal<boolean>(true);
  selectedLimit = signal<number>(20);

  limitOptions = [
    { value: 10, label: '10 từ', timeEstimate: '~3 phút', badge: 'Khởi động' },
    { value: 20, label: '20 từ', timeEstimate: '~6 phút', badge: 'Khuyên dùng' },
    { value: 30, label: '30 từ', timeEstimate: '~10 phút', badge: 'Nâng cao' },
    { value: 50, label: '50 từ', timeEstimate: '~15 phút', badge: 'Chuyên sâu' },
    { value: 0, label: 'Tất cả', timeEstimate: 'Không giới hạn', badge: 'Toàn bộ' },
  ];

  levelOptions = [
    { value: 0, label: 'Tất cả Level', icon: 'fa-solid fa-layer-group' },
    { value: 1, label: 'Level 1: Nhận biết', icon: 'fa-solid fa-eye' },
    { value: 2, label: 'Level 2: Ngữ cảnh', icon: 'fa-solid fa-align-left' },
    { value: 3, label: 'Level 3: Tái hiện', icon: 'fa-solid fa-pen-nib' },
    { value: 4, label: 'Level 4: Thực tế', icon: 'fa-solid fa-bullseye' },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.selectedMode.set(this.initialMode);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialMode'] && this.initialMode) {
      this.selectedMode.set(this.initialMode);
    }
  }

  // Filtered pool based on selected criteria
  matchingCards = computed<Card[]>(() => {
    let list = this.cards || [];
    const mode = this.selectedMode();
    const lvl = this.selectedLevel();
    const pos = this.selectedPos();
    const star = this.isStarOnly();

    // If 4level mode, cards must have exercise package for interactive exercises
    if (mode === '4level') {
      list = list.filter((c) => !!c.exercisePackage);
    }

    if (star) {
      list = list.filter((c) => c.isFavorite || c.favorite);
    }

    if (lvl > 0) {
      list = list.filter((c) => {
        const cardLvl = c.masteryLevel || 1;
        return lvl === 4 ? cardLvl >= 4 : cardLvl === lvl;
      });
    }

    if (pos !== 'all') {
      list = list.filter((c) => {
        const cardPos = (c.partOfSpeech || '').trim().toLowerCase();
        if (pos === 'unknown') return !cardPos;
        return cardPos === pos.toLowerCase();
      });
    }

    return list;
  });

  // Number of cards that will be in the practice session
  effectiveCardCount = computed<number>(() => {
    const total = this.matchingCards().length;
    const limit = this.selectedLimit();
    if (limit === 0 || limit >= total) return total;
    return limit;
  });

  // Ready percentage for 4level mode
  readyCount = computed<number>(() => {
    return (this.cards || []).filter((c) => !!c.exercisePackage).length;
  });

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  setMode(mode: PracticeMode): void {
    this.selectedMode.set(mode);
  }

  setLevel(level: number): void {
    this.selectedLevel.set(level);
  }

  setPos(pos: string): void {
    this.selectedPos.set(pos);
  }

  setLimit(limit: number): void {
    this.selectedLimit.set(limit);
  }

  toggleStarOnly(): void {
    this.isStarOnly.update((v) => !v);
  }

  toggleShuffle(): void {
    this.isShuffle.update((v) => !v);
  }

  startSession(): void {
    if (this.matchingCards().length === 0) return;

    const deckId = this.deck?.id || '';
    const config: PracticeSessionConfig = {
      deckId,
      mode: this.selectedMode(),
      level: this.selectedLevel(),
      pos: this.selectedPos(),
      starOnly: this.isStarOnly(),
      shuffle: this.isShuffle(),
      limit: this.selectedLimit() || this.matchingCards().length,
    };

    this.start.emit(config);
    this.onClose();

    // Navigate to respective session
    if (config.mode === '4level') {
      this.router.navigate(['/vocab/practice'], {
        queryParams: {
          deckId: config.deckId,
          limit: config.limit,
          level: config.level > 0 ? config.level : undefined,
          pos: config.pos !== 'all' ? config.pos : undefined,
          starOnly: config.starOnly ? true : undefined,
          shuffle: config.shuffle ? true : undefined,
        },
      });
    } else {
      this.router.navigate([`/study/${config.deckId}`], {
        queryParams: {
          limit: config.limit,
          level: config.level > 0 ? config.level : undefined,
          pos: config.pos !== 'all' ? config.pos : undefined,
          starOnly: config.starOnly ? true : undefined,
          shuffle: config.shuffle ? true : undefined,
        },
      });
    }
  }
}
