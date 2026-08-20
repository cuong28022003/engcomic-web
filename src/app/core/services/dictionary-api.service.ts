import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

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
  private cache = new Map<string, Observable<WordPronunciationData | null>>();

  constructor(private http: HttpClient) {}

  /** Lấy thông tin phát âm US & UK từ Free Dictionary API */
  getPronunciation(word: string): Observable<WordPronunciationData | null> {
    if (!word || !word.trim()) return of(null);
    const cleanWord = word.trim().toLowerCase();

    if (this.cache.has(cleanWord)) {
      return this.cache.get(cleanWord)!;
    }

    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`;
    const obs = this.http.get<any[]>(url).pipe(
      map((res) => {
        if (!Array.isArray(res) || res.length === 0) return null;
        return this.parseDictionaryResponse(cleanWord, res);
      }),
      catchError(() => of(null)),
      shareReplay(1)
    );

    this.cache.set(cleanWord, obs);
    return obs;
  }

  private parseDictionaryResponse(word: string, entries: any[]): WordPronunciationData {
    let usAudio = '';
    let ukAudio = '';
    let usIpa = '';
    let ukIpa = '';
    let generalIpa = '';

    for (const entry of entries) {
      if (entry.phonetic && !generalIpa) {
        generalIpa = entry.phonetic;
      }
      if (Array.isArray(entry.phonetics)) {
        for (const p of entry.phonetics) {
          const audio = p.audio || '';
          const text = p.text || '';

          if (audio.includes('-us.') || audio.includes('/us/') || audio.includes('us-')) {
            if (!usAudio) usAudio = audio;
            if (text && !usIpa) usIpa = text;
          } else if (audio.includes('-uk.') || audio.includes('/uk/') || audio.includes('uk-') || audio.includes('-gb.')) {
            if (!ukAudio) ukAudio = audio;
            if (text && !ukIpa) ukIpa = text;
          } else if (audio && !usAudio && !ukAudio) {
            usAudio = audio;
          }

          if (text && !generalIpa) {
            generalIpa = text;
          }
        }
      }
    }

    return {
      word,
      us: {
        accent: 'us',
        label: 'US (Anh - Mỹ)',
        flag: '🇺🇸',
        ipa: usIpa || generalIpa,
        audioUrl: usAudio
      },
      uk: {
        accent: 'uk',
        label: 'UK (Anh - Anh)',
        flag: '🇬🇧',
        ipa: ukIpa || generalIpa,
        audioUrl: ukAudio || (usAudio ? '' : '')
      }
    };
  }

  /**
   * Phát âm bằng audio URL hoặc fallback qua Web Speech API (tự nhiên & chuẩn accent)
   */
  speak(word: string, accent: 'us' | 'uk', audioUrl?: string): Promise<void> {
    return new Promise((resolve) => {
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.onended = () => resolve();
        audio.onerror = () => {
          this.speakNative(word, accent).then(resolve);
        };
        audio.play().catch(() => {
          this.speakNative(word, accent).then(resolve);
        });
      } else {
        this.speakNative(word, accent).then(resolve);
      }
    });
  }

  private speakNative(text: string, accent: 'us' | 'uk'): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
      utterance.rate = 0.9; // Tốc độ tự nhiên, rõ ràng

      const voices = window.speechSynthesis.getVoices();
      const targetLang = accent === 'uk' ? 'en-GB' : 'en-US';
      const selectedVoice = voices.find(
        (v) => v.lang === targetLang || v.lang.replace('_', '-') === targetLang
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }
}
