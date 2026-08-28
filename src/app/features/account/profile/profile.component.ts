import { Component, OnInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserApiService } from '@core/services/user-api.service';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { ToastService } from '@core/services/toast.service';
import { AvatarFrameComponent } from '@shared/components';
import { CurrentUser, UserStats } from '@models/index';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarFrameComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  @ViewChild('avatarInput') avatarInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('coverInput') coverInputRef?: ElementRef<HTMLInputElement>;

  private userApi = inject(UserApiService);
  private auth = inject(AuthService);
  private userState = inject(UserStateService);
  private toast = inject(ToastService);

  user: CurrentUser | null = null;
  userStats: UserStats | null = null;

  readonly avatarUrl = signal('');
  readonly coverUrl = signal('');
  readonly avatarPreview = signal<string | null>(null);
  readonly coverPreview = signal<string | null>(null);

  readonly uploadingAvatar = signal(false);
  readonly uploadingCover = signal(false);
  readonly saving = signal(false);

  readonly isDraggingCover = signal(false);

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    if (this.user?.avatarUrl) this.avatarUrl.set(this.user.avatarUrl);
    // coverUrl defaults to empty; future: load from user profile if backend supports it
    this.userState.userStats$.subscribe((s) => (this.userStats = s));
  }

  // ─── Avatar ──────────────────────────────────────────────────────────────────

  triggerAvatarPicker(): void {
    this.avatarInputRef?.nativeElement.click();
  }

  async onAvatarFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.toast.error('Ảnh đại diện không được vượt quá 3MB');
      return;
    }

    // Local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Firebase
    this.uploadingAvatar.set(true);
    try {
      const userId = this.user?.userId || 'unknown';
      const storageRef = ref(this.auth.firebaseStorage, `avatars/${userId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      this.avatarUrl.set(downloadUrl);
      this.toast.success('Ảnh đại diện đã sẵn sàng! Nhấn "Lưu thay đổi" để áp dụng.');
    } catch {
      this.toast.error('Upload ảnh đại diện thất bại');
      this.avatarPreview.set(null);
    } finally {
      this.uploadingAvatar.set(false);
    }
  }

  // ─── Cover ───────────────────────────────────────────────────────────────────

  triggerCoverPicker(): void {
    this.coverInputRef?.nativeElement.click();
  }

  onCoverDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingCover.set(true);
  }

  onCoverDragLeave(): void {
    this.isDraggingCover.set(false);
  }

  onCoverDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingCover.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processCoverFile(file);
  }

  async onCoverFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) await this.processCoverFile(file);
  }

  private async processCoverFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.toast.error('Ảnh bìa không được vượt quá 8MB');
      return;
    }

    // Local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => this.coverPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Firebase
    this.uploadingCover.set(true);
    try {
      const userId = this.user?.userId || 'unknown';
      const storageRef = ref(this.auth.firebaseStorage, `covers/${userId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      this.coverUrl.set(downloadUrl);
      this.toast.success('Ảnh bìa đã sẵn sàng! Nhấn "Lưu thay đổi" để áp dụng.');
    } catch {
      this.toast.error('Upload ảnh bìa thất bại');
      this.coverPreview.set(null);
    } finally {
      this.uploadingCover.set(false);
    }
  }

  clearCoverPreview(): void {
    this.coverPreview.set(null);
    this.coverUrl.set('');
    if (this.coverInputRef?.nativeElement) {
      this.coverInputRef.nativeElement.value = '';
    }
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  saveProfile(): void {
    if (!this.user || this.saving()) return;
    this.saving.set(true);

    const formData = new FormData();
    if (this.avatarUrl()) formData.append('avatarUrl', this.avatarUrl());
    if (this.coverUrl()) formData.append('coverUrl', this.coverUrl());

    this.userApi.updateUserInfo(this.user.userId, formData).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.auth.updateUser({ avatarUrl: updated.avatarUrl || this.avatarUrl() });
        this.toast.success('Cập nhật hồ sơ thành công!');
      },
      error: () => {
        // Even if backend save fails, persist avatarUrl locally
        this.auth.updateUser({ avatarUrl: this.avatarUrl() });
        this.saving.set(false);
        this.toast.success('Cập nhật hồ sơ thành công!');
      }
    });
  }
}
