import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PronunciationService } from './pronunciation.service';

export interface AccentPronunciation {
  accent: 'us' | 'uk';
  label: string;
  flag: string;
  ipa?: string;
  audioUrl?: string;
}

export interface WordPronunciationData {
  word: string;
  us: AccentPronunciation;
  uk: AccentPronunciation;
}

@Injectable({ providedIn: 'root' })
export class DictionaryApiService {
  private pronunciationService = inject(PronunciationService);

  /**
   * @deprecated Đã chuyển toàn bộ sang Web Speech API (PronunciationService). Không gọi API bên thứ ba nữa.
   */
  getPronunciation(word: string): Observable<WordPronunciationData | null> {
    if (!word || !word.trim()) return of(null);
    const cleanWord = word.trim();
    return of({
      word: cleanWord,
      us: {
        accent: 'us',
        label: 'US (Anh - Mỹ)',
        flag: '🇺🇸'
      },
      uk: {
        accent: 'uk',
        label: 'UK (Anh - Anh)',
        flag: '🇬🇧'
      }
    });
  }

  /**
   * Phát âm tức thì qua Web Speech API
   */
  speak(word: string, accent: 'us' | 'uk' = 'us'): Promise<void> {
    return this.pronunciationService.speak(word, accent);
  }
}
