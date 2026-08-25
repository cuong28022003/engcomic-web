import { Component, OnInit, OnDestroy, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { TranslationService, LanguageCode } from '@core/services/translation.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { CurrentUser, UserStats } from '@models/index';
import { ComicGenres } from '../../constants/genres';
import { GrammarSearchModalComponent } from '../../../features/grammar/components/grammar-search-modal/grammar-search-modal.component';
import { GrammarCardModalComponent } from '../../../features/grammar/components/grammar-card-modal/grammar-card-modal.component';
import { GrammarPoint } from '../../../features/grammar/models/grammar.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslatePipe,
    GrammarSearchModalComponent,
    GrammarCardModalComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userState = inject(UserStateService);
  private userStatsApi = inject(UserStatsApiService);
  private router = inject(Router);
  readonly i18n = inject(TranslationService);

  currentUser: CurrentUser | null = null;
  userStats: UserStats | null = null;
  searchKeyword = '';
  isProfileMenuOpen = false;
  isLangMenuOpen = false;
  isCategoryModalOpen = false;
  genres = ComicGenres;

  // Grammar Modals
  readonly showGrammarSearchModal = signal<boolean>(false);
  readonly showGrammarCardModal = signal<boolean>(false);
  readonly selectedGrammarPoint = signal<GrammarPoint | null>(null);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Ctrl+G or Cmd+G to quickly open Grammar Search
    if ((event.ctrlKey || event.metaKey) && (event.key === 'g' || event.key === 'G')) {
      event.preventDefault();
      this.showGrammarSearchModal.set(!this.showGrammarSearchModal());
    }
  }

  openGrammarSearch(): void {
    this.showGrammarSearchModal.set(true);
  }

  closeGrammarSearch(): void {
    this.showGrammarSearchModal.set(false);
  }

  onGrammarPointSelected(point: GrammarPoint): void {
    this.selectedGrammarPoint.set(point);
    this.showGrammarCardModal.set(true);
  }

  closeGrammarCard(): void {
    this.showGrammarCardModal.set(false);
    this.selectedGrammarPoint.set(null);
  }

  private subs = new Subscription();

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.subs.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.loadUserStats(user.userId);
        }
      })
    );

    this.subs.add(
      this.userState.userStats$.subscribe((stats) => {
        this.userStats = stats;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadUserStats(userId: string): void {
    this.userStatsApi.getUserStats(userId).subscribe({
      next: (stats) => this.userState.setUserStats(stats),
      error: () => {},
    });
  }

  onSearch(): void {
    if (this.searchKeyword.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { keyword: this.searchKeyword.trim() },
      });
    }
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    if (this.isProfileMenuOpen) {
      this.isLangMenuOpen = false;
    }
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  toggleLangMenu(): void {
    this.isLangMenuOpen = !this.isLangMenuOpen;
    if (this.isLangMenuOpen) {
      this.isProfileMenuOpen = false;
    }
  }

  closeLangMenu(): void {
    this.isLangMenuOpen = false;
  }

  changeLanguage(code: LanguageCode): void {
    this.i18n.setLanguage(code).subscribe();
    this.closeLangMenu();
  }

  toggleCategoryModal(): void {
    this.isCategoryModalOpen = !this.isCategoryModalOpen;
  }

  logout(): void {
    this.closeProfileMenu();
    this.authService.logout();
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://ui-avatars.com/api/?name=' + (this.currentUser?.username || 'User') + '&background=ff3377&color=fff';
  }
}
