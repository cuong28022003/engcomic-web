import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MistakeItem } from '../models';
import { ReaderApiService } from './reader-api.service';

const STORAGE_KEY = 'toeic_reader_mistake_queue';

@Injectable({
  providedIn: 'root'
})
export class MistakeQueueService {
  private mistakesSubject = new BehaviorSubject<MistakeItem[]>([]);
  public mistakes$ = this.mistakesSubject.asObservable();

  private pendingCountSubject = new BehaviorSubject<number>(0);
  public pendingCount$ = this.pendingCountSubject.asObservable();

  constructor(private apiService: ReaderApiService) {
    this.loadFromLocalStorage();
    this.fetchFromBackend();
  }

  private loadFromLocalStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: MistakeItem[] = JSON.parse(raw);
        this.updateState(parsed);
      }
    } catch (e) {
      console.warn('Failed to load mistakes from LocalStorage', e);
    }
  }

  private saveToLocalStorage(items: MistakeItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save mistakes to LocalStorage', e);
    }
  }

  private updateState(items: MistakeItem[]): void {
    this.mistakesSubject.next(items);
    const pending = items.filter(m => m.status === 'pending').length;
    this.pendingCountSubject.next(pending);
    this.saveToLocalStorage(items);
  }

  public fetchFromBackend(): void {
    this.apiService.getMistakes().subscribe({
      next: (page) => {
        if (page && page.content) {
          this.updateState(page.content);
        }
      },
      error: (err) => console.warn('Could not sync mistakes from backend:', err)
    });
  }

  public addMistakes(newItems: MistakeItem[]): void {
    const current = [...this.mistakesSubject.value];
    for (const item of newItems) {
      const existingIdx = current.findIndex(m => m.id === item.id || (m.testId === item.testId && m.questionNumber === item.questionNumber));
      if (existingIdx >= 0) {
        current[existingIdx] = { ...current[existingIdx], ...item };
      } else {
        current.unshift(item);
      }
    }
    this.updateState(current);
  }

  public updateMistake(id: string, explanation?: string, status?: 'pending' | 'explained' | 'resolved'): void {
    const current = [...this.mistakesSubject.value];
    const idx = current.findIndex(m => m.id === id);
    if (idx >= 0) {
      const updated = {
        ...current[idx],
        explanation: explanation !== undefined ? explanation : current[idx].explanation,
        status: status || (explanation ? 'explained' : current[idx].status),
        updatedAt: new Date().toISOString()
      };
      current[idx] = updated;
      this.updateState(current);

      this.apiService.updateMistake(id, { explanation, status }).subscribe({
        error: (err) => console.warn('Failed to sync mistake update to backend', err)
      });
    }
  }

  public markAsResolved(id: string): void {
    this.updateMistake(id, undefined, 'resolved');
  }

  public deleteMistake(id: string): void {
    const current = this.mistakesSubject.value.filter(m => m.id !== id);
    this.updateState(current);
    this.apiService.deleteMistake(id).subscribe({
      error: (err) => console.warn('Failed to delete mistake on backend', err)
    });
  }

  public generateAiPrompt(mistakes: MistakeItem[]): string {
    const pendingItems = mistakes.filter(m => m.status === 'pending');
    if (pendingItems.length === 0) return '';

    let prompt = `Tôi vừa làm bài thi TOEIC Reading và có các câu sau bị làm sai. Hãy giải thích ngắn gọn, súc tích và dễ nhớ tại sao đáp án đúng lại là đáp án chính xác (bao gồm ngữ pháp/từ vựng/bẫy thường gặp).\n\n`;

    // Group by test name
    const grouped = new Map<string, MistakeItem[]>();
    for (const m of pendingItems) {
      const name = m.testName || 'Đề thi';
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name)!.push(m);
    }

    grouped.forEach((items, testName) => {
      prompt += `### Đề thi: ${testName}\n`;
      items.forEach(m => {
        prompt += `- Câu ${m.questionNumber} (Part ${m.part}): Tôi chọn [${m.userAnswer || 'Bỏ qua'}], Đáp án đúng là [${m.correctAnswer}]\n`;
      });
      prompt += `\n`;
    });

    prompt += `Hãy giải thích từng câu một theo định dạng:\n**Câu [Số] (Part [X])**:\n- Lý do đúng: ...\n- Bài học/Mẹo ghi nhớ: ...`;
    return prompt;
  }

  public async copyAiPrompt(mistakes: MistakeItem[]): Promise<boolean> {
    const prompt = this.generateAiPrompt(mistakes);
    if (!prompt) return false;
    try {
      await navigator.clipboard.writeText(prompt);
      return true;
    } catch (e) {
      console.error('Failed to copy AI explanation prompt', e);
      return false;
    }
  }
}