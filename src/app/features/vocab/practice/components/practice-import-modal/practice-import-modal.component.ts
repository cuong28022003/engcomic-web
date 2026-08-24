import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardApiService } from '@services/card-api.service';
import { ToastService } from '@services/toast.service';

@Component({
  selector: 'app-practice-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practice-import-modal.component.html',
  styleUrls: ['./practice-import-modal.component.scss'],
})
export class PracticeImportModalComponent {
  isOpen = input<boolean>(false);
  deckId = input<string>('');

  closeModal = output<void>();
  importSuccess = output<{ total: number; success: number }>();

  jsonText = '';
  isLoading = signal<boolean>(false);

  constructor(
    private cardApi: CardApiService,
    private toast: ToastService
  ) {}

  onClose(): void {
    if (this.isLoading()) return;
    this.closeModal.emit();
  }

  submitImport(): void {
    const text = this.jsonText.trim();
    if (!text) {
      this.toast.error('Vui lòng dán nội dung JSON từ AI vào khung!');
      return;
    }

    this.isLoading.set(true);
    const dId = this.deckId() || '';

    this.cardApi.importPracticeJson(dId, text).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toast.success(res.message || 'Import bài tập thành công!');
        this.jsonText = '';
        this.importSuccess.emit({
          total: res.totalProcessed,
          success: res.successCount
        });
        this.onClose();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err.error?.message || 'Lỗi khi import JSON bài tập. Vui lòng kiểm tra cú pháp.');
      }
    });
  }
}
