import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComicApiService } from '@core/services/comic-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { ComicGenres, AgeRatings } from '@shared/constants/genres';

@Component({
  selector: 'app-create-edit-comic',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="comic-form-page">
      <div class="form-card glass-panel">
        <div class="card-header">
          <h1>
            <i class="fa-solid fa-cloud-arrow-up highlight"></i>
            {{ isEditMode ? 'Chỉnh Sửa Truyện Tranh' : 'Đăng Tải Truyện Tranh Mới' }}
          </h1>
          <p class="subtitle">Chia sẻ những bộ truyện hấp dẫn để cùng cộng đồng luyện đọc tiếng Anh</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="comic-form">
          <div class="form-group">
            <label for="title">Tên truyện tranh *</label>
            <input
              id="title"
              type="text"
              name="title"
              [(ngModel)]="title"
              placeholder="Nhập tên truyện..."
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Thể loại chính</label>
              <select name="selectedGenre" [(ngModel)]="selectedGenre">
                @for (g of genres; track g) {
                  <option [value]="g">{{ g }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Độ tuổi độc giả</label>
              <select name="selectedAgeRating" [(ngModel)]="selectedAgeRating">
                @for (age of ageRatings; track age) {
                  <option [value]="age">{{ age }}</option>
                }
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="desc">Nội dung tóm tắt</label>
            <textarea
              id="desc"
              rows="5"
              name="description"
              [(ngModel)]="description"
              placeholder="Tóm tắt cốt truyện ngắn gọn, hấp dẫn..."
            ></textarea>
          </div>

          <div class="form-group">
            <label>Ảnh bìa truyện (Cover Image)</label>
            <div class="file-upload-box">
              <input type="file" (change)="onFileSelected($event)" accept="image/*" id="coverFile" />
              <label for="coverFile" class="file-label">
                <i class="fa-solid fa-image upload-icon"></i>
                <span>{{ selectedFile ? selectedFile.name : 'Chọn ảnh bìa từ máy tính (PNG, JPG)' }}</span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <a routerLink="/comics" class="btn-secondary">Hủy bỏ</a>
            <button type="submit" class="btn-primary" [disabled]="!title.trim() || submitting">
              @if (submitting) {
                <i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...
              } @else {
                <i class="fa-solid fa-check"></i> {{ isEditMode ? 'Cập nhật truyện' : 'Đăng tải truyện' }}
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .comic-form-page {
      max-width: 720px;
      margin: 0 auto;
      padding: 20px 0;
    }

    .form-card {
      padding: 40px;
      border-radius: var(--radius-lg);
    }

    .card-header {
      margin-bottom: 28px;
    }

    .card-header h1 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .highlight { color: var(--primary-color); }
    .subtitle { color: var(--text-muted); font-size: 0.92rem; margin-top: 4px; }

    .comic-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .form-group input, .form-group select, .form-group textarea {
      padding: 12px 16px;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: #fff;
      outline: none;
      font-size: 0.92rem;
    }

    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(255, 51, 119, 0.15);
    }

    .file-upload-box input { display: none; }
    .file-label {
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-md);
      padding: 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.2s;
    }

    .file-label:hover { border-color: var(--primary-color); color: #fff; }
    .upload-icon { font-size: 2rem; color: var(--primary-color); }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 14px;
      margin-top: 12px;
    }
  `]
})
export class CreateEditComicComponent implements OnInit {
  private comicApi = inject(ComicApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = false;
  comicId = '';

  title = '';
  description = '';
  selectedGenre = 'Hành động';
  selectedAgeRating = 'Kids';
  genres = ComicGenres;
  ageRatings = AgeRatings;
  selectedFile: File | null = null;
  submitting = false;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['comicId']) {
        this.isEditMode = true;
        this.comicId = params['comicId'];
        this.loadComicForEdit();
      }
    });
  }

  loadComicForEdit(): void {
    this.comicApi.getComicById(this.comicId).subscribe({
      next: (c) => {
        this.title = c.title || c.name || '';
        this.description = c.description || '';
        if (c.genres && c.genres.length > 0) this.selectedGenre = c.genres[0];
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.toast.warning('Vui lòng đăng nhập để đăng truyện');
      return;
    }

    this.submitting = true;
    const formData = new FormData();
    formData.append('title', this.title.trim());
    formData.append('description', this.description.trim());
    formData.append('genre', this.selectedGenre);
    formData.append('uploaderId', user.userId);
    if (this.selectedFile) {
      formData.append('coverImage', this.selectedFile);
    }

    const req$ = this.isEditMode
      ? this.comicApi.updateComic(this.comicId, formData)
      : this.comicApi.createComic(formData);

    req$.subscribe({
      next: (res) => {
        this.submitting = false;
        this.toast.success(this.isEditMode ? 'Cập nhật truyện thành công!' : 'Đăng tải truyện thành công!');
        this.router.navigate(['/comics', res.id || this.comicId]);
      },
      error: () => {
        this.submitting = false;
        this.toast.error('Lỗi khi lưu thông tin truyện tranh');
      },
    });
  }
}
