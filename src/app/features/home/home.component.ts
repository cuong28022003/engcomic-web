import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { CardApiService } from '@core/services/card-api.service';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { AvatarFrameComponent } from '@shared/components/avatar-frame/avatar-frame.component';
import { VocabSearchModalComponent } from '@shared/components/vocab-search-modal/vocab-search-modal.component';
import { GrammarSearchModalComponent } from '../grammar/components/grammar-search-modal/grammar-search-modal.component';
import { GrammarCardModalComponent } from '../grammar/components/grammar-card-modal/grammar-card-modal.component';
import { CurrentUser, UserStats, LeaderboardEntry } from '@models/index';
import { GrammarPoint } from '../grammar/models/grammar.model';

interface LearningSkill {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  badge?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AvatarFrameComponent,
    VocabSearchModalComponent,
    GrammarSearchModalComponent,
    GrammarCardModalComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userState = inject(UserStateService);
  private cardApi = inject(CardApiService);
  private userStatsApi = inject(UserStatsApiService);

  currentUser = signal<CurrentUser | null>(null);
  userStats = signal<UserStats | null>(null);
  dueCardsCount = signal<number>(0);
  totalCardsCount = signal<number>(0);
  topUsers = signal<LeaderboardEntry[]>([]);

  showVocabSearch = signal<boolean>(false);
  showGrammarSearch = signal<boolean>(false);
  showGrammarCard = signal<boolean>(false);
  selectedGrammarPoint = signal<GrammarPoint | null>(null);

  readonly learningSkills: LearningSkill[] = [
    {
      id: 'vocab',
      title: 'Từ vựng',
      description: 'Học từ mới & ôn tập bằng thẻ ghi nhớ',
      icon: 'fa-brain',
      color: '#22d3ee',
      route: '/vocab'
    },
    {
      id: 'grammar',
      title: 'Ngữ pháp',
      description: 'Nắm vững cấu trúc câu tiếng Anh',
      icon: 'fa-book',
      color: '#a78bfa',
      route: '/grammar'
    },
    {
      id: 'reading',
      title: 'Đọc hiểu',
      description: 'Luyện đọc với bài tập thực tế',
      icon: 'fa-file-lines',
      color: '#34d399',
      route: '/reader'
    },
    {
      id: 'deck',
      title: 'Bộ từ của tôi',
      description: 'Tạo & học theo bộ từ riêng',
      icon: 'fa-layer-group',
      color: '#f59e0b',
      route: '/deck'
    }
  ];

  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser.set(user);
        if (user) this.loadUserVocabStats();
      })
    );

    this.subs.add(
      this.userState.userStats$.subscribe((stats) => {
        this.userStats.set(stats);
      })
    );

    this.loadTopLearners();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadUserVocabStats(): void {
    this.cardApi.getDashboard({ size: 1 }).subscribe({
      next: (res: any) => {
        this.dueCardsCount.set(res?.dueToday || 0);
        this.totalCardsCount.set(res?.totalCards || 0);
      },
      error: () => {}
    });
  }

  loadTopLearners(): void {
    this.userStatsApi.getLeaderboard({ page: 0, size: 5 }).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.content)
            ? res.content
            : [];
        this.topUsers.set(list);
      },
      error: () => {
        this.topUsers.set([]);
      }
    });
  }

  openVocabModal(): void {
    this.showVocabSearch.set(true);
  }

  closeVocabModal(): void {
    this.showVocabSearch.set(false);
  }

  openGrammarModal(): void {
    this.showGrammarSearch.set(true);
  }

  closeGrammarModal(): void {
    this.showGrammarSearch.set(false);
  }

  onGrammarSelected(point: GrammarPoint): void {
    this.selectedGrammarPoint.set(point);
    this.showGrammarCard.set(true);
  }

  closeGrammarCardModal(): void {
    this.showGrammarCard.set(false);
    this.selectedGrammarPoint.set(null);
  }
}
