import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComicApiService } from '@core/services/comic-api.service';
import { ComicCardComponent } from '@shared/components/comic-card/comic-card.component';
import { Comic } from '@models/index';
import { ComicGenres } from '@shared/constants/genres';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ComicCardComponent],
  template: `
    <div class="search-page">
      <div class="search-hero glass-panel">
        <h1><i class="fa-solid fa-magnifying-glass highlight"></i> Tìm Kiếm Truyện Tranh</h1>
        <div class="search-bar-wrap">
          <input
            type="text"
            placeholder="Nhập tên truyện tranh, nhân vật hoặc thể loại..."
            [(ngModel)]="keyword"
            (keyup.enter)="onSearch()"
          />
          <button class="btn-primary" (click)="onSearch()">
            <i class="fa-solid fa-magnifying-glass"></i> Tìm kiếm
          </button>
        </div>

        <!-- Quick Genre tags -->
        <div class="quick-genres">
          <span class="lbl">Gợi ý thể loại:</span>
          @for (genre of genres; track genre) {
            <button
              class="genre-chip"
              [class.active]="selectedGenre === genre"
              (click)="selectGenre(genre)"
            >
              {{ genre }}
            </button>
          }
        </div>
      </div>

      <!-- Results section -->
      <section class="results-section">
        <div class="results-header">
          <h2>
            Kết quả tìm kiếm
            @if (keyword) {
              cho "<span class="keyword-highlight">{{ keyword }}</span>"
            }
            @if (selectedGenre) {
              thể loại "<span class="keyword-highlight">{{ selectedGenre }}</span>"
            }
          </h2>
          <span class="count-badge">{{ comics.length }} bộ truyện</span>
        </div>

        @if (loading) {
          <div class="loading-grid">
            <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6]"></div>
          </div>
        } @else if (comics.length === 0) {
          <div class="empty-state glass-panel">
            <i class="fa-solid fa-magnifying-glass-minus empty-icon"></i>
            <h3>Không tìm thấy kết quả nào phù hợp</h3>
            <p>Vui lòng thử lại với từ khóa khác hoặc xóa bớt các điều kiện lọc.</p>
          </div>
        } @else {
          <div class="comic-grid">
            @for (comic of comics; track comic.id) {
              <app-comic-card [comic]="comic"></app-comic-card>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .search-page {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .search-hero {
      padding: 40px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 20px;
      background: radial-gradient(circle at 50% 20%, rgba(255, 51, 119, 0.1) 0%, rgba(22, 25, 38, 0.95) 80%);
    }

    .search-hero h1 { font-size: 2rem; font-weight: 800; color: #fff; }
    .highlight { color: var(--primary-color); }

    .search-bar-wrap {
      display: flex;
      width: 100%;
      max-width: 640px;
      gap: 10px;
    }

    .search-bar-wrap input {
      flex: 1;
      padding: 14px 20px;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      color: #fff;
      font-size: 1rem;
      outline: none;
    }

    .search-bar-wrap input:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(255, 51, 119, 0.15);
    }

    .quick-genres {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
      max-width: 700px;
    }

    .quick-genres .lbl { font-size: 0.8rem; color: var(--text-dim); }

    .genre-chip {
      padding: 4px 12px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      color: var(--text-muted);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .genre-chip:hover, .genre-chip.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: #fff;
    }

    /* Results */
    .results-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .results-header h2 { font-size: 1.3rem; font-weight: 700; color: #fff; }
    .keyword-highlight { color: var(--primary-color); }
    .count-badge { font-size: 0.85rem; color: var(--text-muted); }

    .empty-state { padding: 60px; text-align: center; color: var(--text-muted); }
    .empty-icon { font-size: 3rem; color: var(--text-dim); margin-bottom: 12px; }

    .loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 24px; }
    .skeleton-card { height: 340px; border-radius: var(--radius-md); background: #161926; }
  `]
})
export class SearchComponent implements OnInit {
  private comicApi = inject(ComicApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  keyword = '';
  selectedGenre = '';
  genres = ComicGenres;
  comics: Comic[] = [];
  loading = true;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.keyword = params['keyword'] || '';
      this.selectedGenre = params['genre'] || '';
      this.performSearch();
    });
  }

  onSearch(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { keyword: this.keyword || null, genre: this.selectedGenre || null },
      queryParamsHandling: 'merge',
    });
  }

  selectGenre(genre: string): void {
    this.selectedGenre = this.selectedGenre === genre ? '' : genre;
    this.onSearch();
  }

  performSearch(): void {
    this.loading = true;
    const params = {
      keyword: this.keyword || undefined,
      genre: this.selectedGenre || undefined,
      size: 30,
    };

    const req$ = this.keyword
      ? this.comicApi.searchComics(params)
      : this.comicApi.getComics(params);

    req$.subscribe({
      next: (res) => {
        this.comics = res.content || [];
        this.loading = false;
      },
      error: () => {
        this.comics = [];
        this.loading = false;
      },
    });
  }
}
