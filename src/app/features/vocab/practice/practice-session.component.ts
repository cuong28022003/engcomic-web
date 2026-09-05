import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardApiService } from '@services/card-api.service';
import { ToastService } from '@services/toast.service';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { UserStateService } from '@core/services/user-state.service';
import { PracticeQueueItem, PracticePromptResponse, SubmitLevelAnswerResponse } from '@models/index';
import { LevelIndicatorComponent } from './components/level-indicator/level-indicator.component';
import { Level1RecognitionExerciseComponent } from './components/level1-recognition-exercise/level1-recognition-exercise.component';
import { Level2ContextExerciseComponent } from './components/level2-context-exercise/level2-context-exercise.component';
import { Level3ProductionExerciseComponent } from './components/level3-production-exercise/level3-production-exercise.component';
import { Level4RealworldExerciseComponent } from './components/level4-realworld-exercise/level4-realworld-exercise.component';
import { ExerciseImportModalComponent } from '@shared/components/exercise-import-modal/exercise-import-modal.component';

type SessionState = 'loading' | 'active' | 'empty' | 'completed';

@Component({
  selector: 'app-practice-session',
  standalone: true,
  imports: [
    CommonModule,
    LevelIndicatorComponent,
    Level1RecognitionExerciseComponent,
    Level2ContextExerciseComponent,
    Level3ProductionExerciseComponent,
    Level4RealworldExerciseComponent,
    ExerciseImportModalComponent,
  ],
  templateUrl: './practice-session.component.html',
  styleUrls: ['./practice-session.component.scss'],
})
export class PracticeSessionComponent implements OnInit {
  state = signal<SessionState>('loading');
  queue = signal<PracticeQueueItem[]>([]);
  currentIndex = signal<number>(0);
  deckId = signal<string>('');

  // Stats
  totalCount = signal<number>(0);
  correctCount = signal<number>(0);
  promotedCount = signal<number>(0);

  // Modals state
  isExerciseModalOpen = signal<boolean>(false);
  promptData = signal<PracticePromptResponse | null>(null);

  // Computed
  currentCard = computed<PracticeQueueItem | null>(() => {
    const list = this.queue();
    const idx = this.currentIndex();
    return list[idx] || null;
  });

  progressPercent = computed<number>(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.currentIndex() / total) * 100);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cardApi: CardApiService,
    private toast: ToastService,
    private userStatsApi: UserStatsApiService,
    private userState: UserStateService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.deckId.set(params['deckId'] || '');
      this.loadQueue();
    });
  }

  loadQueue(): void {
    this.state.set('loading');
    const dId = this.deckId();

    this.cardApi.getPracticeQueue(dId || undefined).subscribe({
      next: (res) => {
        const items = res?.items || [];
        if (items.length === 0) {
          this.state.set('empty');
          this.queue.set([]);
          this.totalCount.set(0);
        } else {
          this.queue.set(items);
          this.totalCount.set(items.length);
          this.currentIndex.set(0);
          this.correctCount.set(0);
          this.promotedCount.set(0);
          this.state.set('active');
        }
      },
      error: () => {
        this.state.set('empty');
        this.queue.set([]);
        this.toast.error('Lỗi khi tải danh sách luyện tập');
      }
    });
  }

  onAnswerSubmitted(event: { isCorrect: boolean; quality: number; confidenceScore?: number }): void {
    const card = this.currentCard();
    if (!card) return;

    if (event.isCorrect) {
      this.correctCount.update(c => c + 1);
    }

    this.cardApi.submitLevelAnswer(card.id, {
      currentLevel: card.masteryLevel || 1,
      quality: typeof event.quality === 'number' ? event.quality : (event.isCorrect ? 5 : 1),
      isCorrect: !!event.isCorrect,
      confidenceScore: event.confidenceScore ?? undefined
    }).subscribe({
      next: (res: SubmitLevelAnswerResponse) => {
        if (res.levelPromoted || res.newLevel > res.oldLevel) {
          this.promotedCount.update(p => p + 1);
          this.toast.success(`🎉 ${card.word} đã thăng lên Level ${res.newLevel}!`);
        } else if (res.newLevel < res.oldLevel) {
          this.toast.info(`Từ ${card.word} đã hạ về Level ${res.newLevel} để củng cố.`);
        } else if (res.isLeech) {
          this.toast.warning(`⚠️ ${card.word} đã chuyển vào Leech Center.`);
        }

        this.nextCard();
      },
      error: () => {
        this.nextCard();
      }
    });
  }

  nextCard(): void {
    const nextIdx = this.currentIndex() + 1;
    if (nextIdx >= this.queue().length) {
      this.state.set('completed');
      this.userStatsApi.getMyStats().subscribe({
        next: (stats) => this.userState.setUserStats(stats),
        error: () => {}
      });
    } else {
      this.currentIndex.set(nextIdx);
    }
  }

  openExerciseModal(): void {
    const dId = this.deckId() || (this.currentCard()?.deckId || '');
    this.cardApi.getPracticePrompt(dId).subscribe({
      next: (data) => {
        this.promptData.set(data);
        this.isExerciseModalOpen.set(true);
      },
      error: () => {
        this.toast.error('Không thể trích xuất System Prompt cho bộ từ.');
      }
    });
  }

  onExerciseImportSuccess(): void {
    this.toast.success(`Đã cập nhật bài tập AI thành công! Đang tải lại hàng đợi...`);
    this.loadQueue();
  }

  returnToVocab(): void {
    this.router.navigate(['/vocab']);
  }
}
