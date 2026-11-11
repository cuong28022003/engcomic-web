import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { CardApiService } from '@core/services/card-api.service';
import { GrammarApiService } from '@core/services/grammar-api.service';
import { ReaderApiService } from '../reader/services/reader-api.service';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { ComicApiService } from '@core/services/comic-api.service';
import { EcosystemService } from '@core/services/ecosystem.service';
import { PronunciationService } from '@core/services/pronunciation.service';
import { AvatarFrameComponent } from '@shared/components/avatar-frame/avatar-frame.component';
import { VocabSearchModalComponent } from '@shared/components/vocab-search-modal/vocab-search-modal.component';
import { GrammarSearchModalComponent } from '../grammar/components/grammar-search-modal/grammar-search-modal.component';
import { GrammarCardModalComponent } from '../grammar/components/grammar-card-modal/grammar-card-modal.component';
import { CurrentUser, UserStats, LeaderboardEntry, Comic } from '@models/index';
import { TestSummary } from '../reader/models';
import { GrammarPoint } from '../grammar/models/grammar.model';

export interface SampleVocab {
  word: string;
  ipa: string;
  pos: string;
  meaning: string;
  collocation: string;
  example: string;
}

export interface FeaturedGachaCharacter {
  name: string;
  title: string;
  anime: string;
  rarity: 'SSR' | 'SR' | 'R';
  stars: number;
  combatPower: string;
  badgeClass: string;
  frameId: string;
  avatarUrl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AvatarFrameComponent,
    VocabSearchModalComponent,
    GrammarSearchModalComponent,
    GrammarCardModalComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  // English Learning & Gamification Ecosystem Home Component
  private authService = inject(AuthService);
  private userState = inject(UserStateService);
  private cardApi = inject(CardApiService);
  private grammarApi = inject(GrammarApiService);
  private readerApi = inject(ReaderApiService);
  private userStatsApi = inject(UserStatsApiService);
  private comicApi = inject(ComicApiService);
  private pronunciation = inject(PronunciationService);
  private router = inject(Router);
  readonly ecosystem = inject(EcosystemService);

  // User state
  currentUser = signal<CurrentUser | null>(null);
  userStats = signal<UserStats | null>(null);

  // Vocab stats
  dueCardsCount = signal<number>(0);
  totalCardsCount = signal<number>(0);

  // Comics
  hotComics = signal<Comic[]>([]);
  loadingComics = signal<boolean>(true);

  // Tests & Grammar
  toeicTests = signal<TestSummary[]>([]);
  featuredGrammar = signal<GrammarPoint[]>([]);
  topUsers = signal<LeaderboardEntry[]>([]);

  // Loading states
  loadingTests = signal<boolean>(true);
  loadingGrammar = signal<boolean>(true);

  // Audio playing indicator
  isPlayingSample = signal<boolean>(false);

  // Modals state
  showVocabSearch = signal<boolean>(false);
  showGrammarSearch = signal<boolean>(false);
  showGrammarCard = signal<boolean>(false);
  selectedGrammarPoint = signal<GrammarPoint | null>(null);

  // Curated Daily Word Spotlight
  readonly dailyWord: SampleVocab = {
    word: 'adventure',
    ipa: '/ədˈven.tʃər/',
    pos: 'noun',
    meaning: 'Cuộc phiêu lưu, trải nghiệm kỳ thú đầy thử thách',
    collocation: 'embark on an exciting adventure',
    example: 'Reading comics in English is a fantastic adventure that enriches your daily vocabulary.'
  };

  // High-quality fallback comics if API returns empty
  readonly fallbackComics: Comic[] = [
    {
      id: 'comic-1',
      title: 'One Piece: Romance Dawn',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&q=80',
      views: 184500,
      totalChapters: 1080,
      genres: ['Adventure', 'Action', 'Shounen'],
      rating: 4.9,
      englishLevel: 'B1 - Intermediate',
      isPremium: false,
    },
    {
      id: 'comic-2',
      title: 'Attack on Titan (Shingeki no Kyojin)',
      imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&q=80',
      views: 142000,
      totalChapters: 139,
      genres: ['Dark Fantasy', 'Mystery'],
      rating: 4.8,
      englishLevel: 'B2 - Upper Intermediate',
      isPremium: true,
    },
    {
      id: 'comic-3',
      title: 'Solo Leveling: Shadow Monarch',
      imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=80',
      views: 220000,
      totalChapters: 179,
      genres: ['Fantasy', 'Action', 'Isekai'],
      rating: 5.0,
      englishLevel: 'B1 - Intermediate',
      isPremium: true,
    },
    {
      id: 'comic-4',
      title: 'Jujutsu Kaisen: Cursed Clash',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&q=80',
      views: 115000,
      totalChapters: 250,
      genres: ['Supernatural', 'Action'],
      rating: 4.7,
      englishLevel: 'B1 - Intermediate',
      isPremium: false,
    },
  ];

  // Curated Featured Gacha Characters
  readonly featuredGachaCharacters: FeaturedGachaCharacter[] = [
    {
      name: 'Monkey D. Luffy',
      title: 'Gear 5 Nika God',
      anime: 'One Piece',
      rarity: 'SSR',
      stars: 5,
      combatPower: '9,850',
      badgeClass: 'badge-ssr',
      frameId: 'frame_mythic',
      avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&q=80'
    },
    {
      name: 'Gojo Satoru',
      title: 'Vô Hạn Chú Thuật Sư',
      anime: 'Jujutsu Kaisen',
      rarity: 'SSR',
      stars: 5,
      combatPower: '9,999',
      badgeClass: 'badge-ssr',
      frameId: 'frame_dragon',
      avatarUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80'
    },
    {
      name: 'Roronoa Zoro',
      title: 'Kiếm Hào Asura',
      anime: 'One Piece',
      rarity: 'SR',
      stars: 4,
      combatPower: '8,200',
      badgeClass: 'badge-sr',
      frameId: 'frame_gold',
      avatarUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&q=80'
    }
  ];

  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser.set(user);
        if (user) {
          this.loadUserVocabStats();
        }
      })
    );

    this.subs.add(
      this.userState.userStats$.subscribe((stats) => {
        this.userStats.set(stats);
      })
    );

    this.loadHotComics();
    this.loadToeicTests();
    this.loadFeaturedGrammar();
    this.loadTopLearners();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadHotComics(): void {
    this.loadingComics.set(true);
    this.comicApi.getComics({ page: 0, size: 4, sort: 'views' }).subscribe({
      next: (res) => {
        const list = res.content || [];
        if (list.length > 0) {
          this.hotComics.set(list.slice(0, 4));
        } else {
          this.hotComics.set(this.fallbackComics);
        }
        this.loadingComics.set(false);
      },
      error: () => {
        this.hotComics.set(this.fallbackComics);
        this.loadingComics.set(false);
      }
    });
  }

  loadUserVocabStats(): void {
    this.cardApi.getDashboard({ size: 1 }).subscribe({
      next: (res) => {
        this.dueCardsCount.set(res.dueToday || 0);
        this.totalCardsCount.set(res.totalCards || 0);
      },
      error: () => {}
    });
  }

  loadToeicTests(): void {
    this.loadingTests.set(true);
    this.readerApi.getTests(0, 4).subscribe({
      next: (res) => {
        this.toeicTests.set(res.content || []);
        this.loadingTests.set(false);
      },
      error: () => {
        this.toeicTests.set([]);
        this.loadingTests.set(false);
      }
    });
  }

  loadFeaturedGrammar(): void {
    this.loadingGrammar.set(true);
    this.grammarApi.getGrammarPoints().subscribe({
      next: (points) => {
        this.featuredGrammar.set((points || []).slice(0, 3));
        this.loadingGrammar.set(false);
      },
      error: () => {
        this.featuredGrammar.set([]);
        this.loadingGrammar.set(false);
      }
    });
  }

  loadTopLearners(): void {
    this.userStatsApi.getLeaderboard({ page: 0, size: 5 }).subscribe({
      next: (res) => {
        const list = Array.isArray(res)
          ? res
          : Array.isArray((res as { content?: LeaderboardEntry[] } | null)?.content)
            ? ((res as { content?: LeaderboardEntry[] }).content ?? [])
            : [];
        this.topUsers.set(list);
      },
      error: () => {
        this.topUsers.set([]);
      }
    });
  }

  playDailyWord(): void {
    this.isPlayingSample.set(true);
    this.pronunciation.speak(this.dailyWord.word, 'us');
    setTimeout(() => {
      this.isPlayingSample.set(false);
    }, 1200);
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

  onAvatarError(event: Event, name: string): void {
    const img = event.target as HTMLImageElement;
    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff`;
  }

  onComicImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80';
  }

  getFrameForUser(u: LeaderboardEntry, index: number): string {
    return (u as unknown as Record<string, unknown>)['equippedAvatarFrame'] as string || (index === 0 ? 'frame_mythic' : index === 1 ? 'frame_dragon' : 'frame_gold');
  }

  getTitleForUser(u: LeaderboardEntry): string | null {
    return ((u as unknown as Record<string, unknown>)['equippedTitle'] as string) || (u.rank?.name ?? null);
  }
}
