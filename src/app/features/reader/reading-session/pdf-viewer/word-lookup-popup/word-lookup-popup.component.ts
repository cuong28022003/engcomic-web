import { Component, effect, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PronunciationService } from '@core/services/pronunciation.service';
import { TranslatorApiService, TranslateResponse } from '@core/services/translator-api.service';
import { PendingItemApiService } from '@core/services/pending-item-api.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-word-lookup-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './word-lookup-popup.component.html',
  styleUrls: ['./word-lookup-popup.component.scss']
})
export class WordLookupPopupComponent {
  private http = inject(HttpClient);
  private pronunciationService = inject(PronunciationService);
  private translatorApi = inject(TranslatorApiService);
  private pendingItemApi = inject(PendingItemApiService);
  private toast = inject(ToastService);

  readonly text = input<string>('');
  readonly position = input<{ top: number; left: number } | null>(null);

  readonly close = output<void>();

  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly isSaved = signal<boolean>(false);
  readonly isSpeaking = signal<boolean>(false);

  readonly translationData = signal<TranslateResponse | null>(null);

  readonly displayIpa = computed<string>(() => {
    return this.translationData()?.ipa || '';
  });

  constructor() {
    effect(() => {
      const t = this.text();
      if (t && t.trim()) {
        this.lookupWord();
      }
    });
  }

  lookupWord(): void {
    const clean = this.text().trim();
    if (!clean) return;

    this.loading.set(true);
    this.isSaved.set(false);
    this.translationData.set(null);

    // Get translation meaning via Backend Google Translate
    this.translatorApi.translateText({ text: clean }).subscribe({
      next: (data) => {
        if (
          data && 
          data.meaning && 
          data.meaning.trim() && 
          data.meaning.trim().toLowerCase() !== clean.toLowerCase() && 
          !data.meaning.startsWith('Không thể gọi API Python')
        ) {
          this.translationData.set(data);
          this.loading.set(false);
        } else {
          this.fallbackClientTranslation(clean);
        }
      },
      error: () => {
        this.fallbackClientTranslation(clean);
      }
    });
  }

  private fallbackClientTranslation(clean: string): void {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|vi`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const text = res?.responseData?.translatedText;
        this.translationData.set({
          word: clean,
          meaning: text && text.trim() ? text.trim() : clean
        });
        this.loading.set(false);
      },
      error: () => {
        this.translationData.set({
          word: clean,
          meaning: clean
        });
        this.loading.set(false);
      }
    });
  }

  async speak(accent: 'us' | 'uk'): Promise<void> {
    const textVal = this.text().trim();
    if (!textVal || this.isSpeaking()) return;

    this.isSpeaking.set(true);
    try {
      await this.pronunciationService.speak(textVal, accent);
    } finally {
      this.isSpeaking.set(false);
    }
  }

  saveToVault(): void {
    const clean = this.text().trim();
    if (!clean || this.saving() || this.isSaved()) return;

    this.saving.set(true);
    this.pendingItemApi.addManual(clean).subscribe({
      next: () => {
        this.saving.set(false);
        this.isSaved.set(true);
        this.toast.success(`Đã lưu "${clean}" vào Vocab Vault!`);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Không thể lưu từ vào Vocab Vault');
      }
    });
  }

  copyText(): void {
    const textVal = this.text();
    if (!textVal) return;
    navigator.clipboard.writeText(textVal).then(() => {
      this.toast.info(`Đã sao chép "${textVal}"`);
    });
  }

  onClose(): void {
    this.close.emit();
  }
}