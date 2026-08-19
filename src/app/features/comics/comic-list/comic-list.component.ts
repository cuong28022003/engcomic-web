import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComicApiService } from '@core/services/comic-api.service';
import { ComicCardComponent } from '@shared/components/comic-card/comic-card.component';
import { Comic, ComicParams } from '@models/index';
import { ComicGenres } from '@shared/constants/genres';

@Component({
  selector: 'app-comic-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ComicCardComponent],
  template: `
    <div class="comic-list-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1><i class="fa-solid fa-book-bookmark highlight"></i> Thư Viện Truyện Tranh</h1>
          <p class="subtitle">Khám phá hàng ngàn bộ truyện tranh phong phú, tra từ vựng trực quan</p>
        </div>

        <div class="search-filter-box">
          <input
            type="text"
            placeholder="Tìm theo tên truyện..."
            [(ngModel)]="keyword"
            (keyup.enter)="applyFilters()"
          />
          <button (click)="applyFilters()" class="btn-primary btn-sm">
            <i class="fa-solid fa-magnifying-glass"></i> Tìm
          </button>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="filters-bar glass-panel">
        <div class="filter-group">
          <label><i class="fa-solid fa-tags"></i> Thể loại:</label>
          <select [(ngModel)]="selectedGenre" (change)="applyFilters()">
            <option value="">Tất cả thể loại</option>
            @for (genre of genres; track genre) {
              <option [value]="genre">{{ genre }}</option>
            }
          </select>
        </div>

        <div class="filter-group">
          <label><i class="fa-solid fa-arrow-down-wide-short"></i> Sắp xếp:</label>
          <select [(ngModel)]="selectedSort" (change)="applyFilters()">
            <option value="updatedAt">Mới cập nhật</option>
            <option value="views">Lượt xem nhiều nhất</option>
            <option value="rating">Đánh giá cao nhất</option>
            <option value="createdAt">Mới phát hành</option>
          </select>
        </div>

        <div class="filter-group">
          <label><i class="fa-solid fa-filter"></i> Trạng thái:</label>
          <select [(ngModel)]="selectedStatus" (change)="applyFilters()">
            <option value="">Tất cả</option>
            <option value="ONGOING">Đang tiến hành</option>
            <option value="COMPLETED">Đã hoàn thành</option>
          </select>
        </div>

        @if (hasActiveFilters) {
          <button class="btn-secondary btn-sm reset-btn" (click)="resetFilters()">
            <i class="fa-solid fa-rotate-left"></i> Đặt lại
          </button>
        }
      </div>

      <!-- Comics Grid Section -->
      @if (loading) {
        <div class="loading-grid">
          <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6,7,8]"></div>
        </div>
      } @else if (comics.length === 0) {
        <div class="empty-state glass-panel">
          <i class="fa-solid fa-face-frown empty-icon"></i>
          <h3>Không tìm thấy truyện tranh nào</h3>
          <p>Hãy thử thay đổi từ khóa hoặc bộ lọc thể loại khác nhé.</p>
          <button class="btn-primary" (click)="resetFilters()">Xem tất cả truyện</button>
        </div>
      } @else {
        <div class="comic-grid">
          @for (comic of comics; track comic.id) {
            <app-comic-card [comic]="comic"></app-comic-card>
          }
        </div>

        <!-- Pagination Controls -->
        @if (totalPages > 1) {
          <div class="pagination-wrapper">
            <button
              class="page-btn"
              [disabled]="currentPage === 0"
              (click)="changePage(currentPage - 1)"
            >
              <i class="fa-solid fa-chevron-left"></i>
            </button>

            @for (p of getPagesArray(); track p) {
              <button
                class="page-btn"
                [class.active]="p === currentPage"
                (click)="changePage(p)"
              >
                {{ p + 1 }}
              </button>
            }

            <button
              class="page-btn"
              [disabled]="currentPage >= totalPages - 1"
              (click)="changePage(currentPage + 1)"
            >
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .comic-list-page {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      flex-wrap: wrap;
    }

    .page-header h1 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .highlight { color: var(--primary-color); }
    .subtitle { color: var(--text-muted); font-size: 0.92rem; margin-top: 4px; }

    .search-filter-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-card);
      padding: 6px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
    }

    .search-filter-box input {
      background: transparent;
      border: none;
      padding: 6px 14px;
      color: #fff;
      font-size: 0.88rem;
      outline: none;
      min-width: 220px;
    }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 16px 20px;
      border-radius: var(--radius-md);
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .filter-group select {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: #fff;
      padding: 6px 12px;
      font-size: 0.85rem;
      outline: none;
      cursor: pointer;
    }

    .filter-group select:focus {
      border-color: var(--primary-color);
    }

    .reset-btn {
      padding: 6px 14px;
      font-size: 0.82rem;
    }

    /* Skeletons */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 24px;
    }

    .skeleton-card {
      height: 340px;
      border-radius: var(--radius-md);
      background: linear-gradient(90deg, #161926 25%, #222638 50%, #161926 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    /* Empty State */
    .empty-state {
      padding: 60px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }

    .empty-icon {
      font-size: 3rem;
      color: var(--text-dim);
    }

    .empty-state h3 { font-size: 1.3rem; color: #fff; }
    .empty-state p { color: var(--text-muted); max-width: 400px; }

    /* Pagination */
    .pagination-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-top: 20px;
    }

    .page-btn {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: var(--bg-card-hover);
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    .page-btn.active {
      background: var(--primary-gradient);
      color: #fff;
      border-color: var(--primary-color);
      box-shadow: 0 4px 15px rgba(255, 51, 119, 0.4);
    }

    .page-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class ComicListComponent implements OnInit {
  private comicApi = inject(ComicApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  comics: Comic[] = [];
  genres = ComicGenres;

  keyword = '';
  selectedGenre = '';
  selectedSort = 'updatedAt';
  selectedStatus = '';

  currentPage = 0;
  pageSize = 12;
  totalPages = 1;
  loading = true;

  get hasActiveFilters(): boolean {
    return !!(this.keyword || this.selectedGenre || this.selectedStatus || this.selectedSort !== 'updatedAt');
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.keyword = params['keyword'] || '';
      this.selectedGenre = params['genre'] || '';
      this.selectedSort = params['sort'] || 'updatedAt';
      this.selectedStatus = params['status'] || '';
      this.currentPage = params['page'] ? Number(params['page']) : 0;
      this.fetchComics();
    });
  }

  fetchComics(): void {
    this.loading = true;
    const params: ComicParams = {
      page: this.currentPage,
      size: this.pageSize,
      sort: this.selectedSort,
      keyword: this.keyword || undefined,
      genre: this.selectedGenre || undefined,
      status: this.selectedStatus || undefined,
    };

    const req$ = this.keyword
      ? this.comicApi.searchComics(params)
      : this.comicApi.getComics(params);

    req$.subscribe({
      next: (res) => {
        this.comics = res.content || [];
        this.totalPages = res.totalPages || 1;
        this.loading = false;
      },
      error: () => {
        this.comics = [];
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.updateQueryParams();
  }

  resetFilters(): void {
    this.keyword = '';
    this.selectedGenre = '';
    this.selectedSort = 'updatedAt';
    this.selectedStatus = '';
    this.currentPage = 0;
    this.updateQueryParams();
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updateQueryParams();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPagesArray(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.currentPage - 2);
    let end = Math.min(this.totalPages - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  private updateQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        keyword: this.keyword || null,
        genre: this.selectedGenre || null,
        sort: this.selectedSort !== 'updatedAt' ? this.selectedSort : null,
        status: this.selectedStatus || null,
        page: this.currentPage > 0 ? this.currentPage : null,
      },
      queryParamsHandling: 'merge',
    });
  }
}
