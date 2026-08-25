import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PronunciationService {
  private voicesReady = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
      // Fallback timeout in case onvoiceschanged does not fire
      setTimeout(() => {
        resolve(window.speechSynthesis.getVoices() || []);
      }, 500);
    }
  });

  /**
   * Phát âm từ vựng bằng Web Speech API (Local, 0 độ trễ, không tốn data)
   * @param word Từ hoặc cụm từ cần phát âm
   * @param accent Giọng 'us' (Anh - Mỹ) hoặc 'uk' (Anh - Anh)
   * @param rate Tốc độ đọc (mặc định 0.9)
   */
  async speak(word: string, accent: 'uk' | 'us' = 'us', rate: number = 0.9): Promise<void> {
    if (!word || !word.trim()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      const cleanWord = word.trim();
      const voices = await this.voicesReady;
      const utterance = new SpeechSynthesisUtterance(cleanWord);

      const targetLang = accent === 'uk' ? 'en-GB' : 'en-US';
      const targetPrefix = accent === 'uk' ? 'en-GB' : 'en-US';

      // Find best matching voice
      const matchedVoice =
        voices.find((v) => v.lang === targetLang) ||
        voices.find((v) => v.lang.replace('_', '-').startsWith(targetPrefix)) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        null;

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = targetLang;
      }

      utterance.rate = rate;

      // Hủy audio đang phát dở trước đó để tránh xếp hàng phát chồng chéo
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
    }
  }

  /**
   * Dừng phát âm ngay lập tức
   */
  stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
