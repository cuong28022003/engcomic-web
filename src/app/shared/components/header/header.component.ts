import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
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
