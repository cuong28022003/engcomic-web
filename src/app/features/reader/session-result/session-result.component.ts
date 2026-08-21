import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GradedQuestion, SubmitSessionResponse, ToeicAttempt } from '../models';
import { AttemptHistoryModalComponent } from '../reading-session/attempt-history-modal/attempt-history-modal.component';
import { ReaderApiService } from '../services/reader-api.service';

@Component({
  selector: 'app-session-result',
  standalone: true,
  imports: [CommonModule, RouterModule, AttemptHistoryModalComponent],
  templateUrl: './session-result.component.html',
  styleUrls: ['./session-result.component.scss']
})
export class SessionResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private readerApi = inject(ReaderApiService);

  testId = '';
  result: SubmitSessionResponse | null = null;

  showHistoryModal = signal<boolean>(false);
  historyAttempts = signal<ToeicAttempt[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.testId = params.get('testId') || '';
    });

    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state && nav.extras.state['result']) {
      this.result = nav.extras.state['result'];
    } else if (history.state && history.state.result) {
      this.result = history.state.result;
    }
  }

  openHistory(): void {
    if (!this.testId) return;
    this.readerApi.getAttemptsForTest(this.testId).subscribe({
      next: (list) => {
        this.historyAttempts.set(list || []);
        this.showHistoryModal.set(true);
      },
      error: () => {
        this.historyAttempts.set([]);
        this.showHistoryModal.set(true);
      }
    });
  }

  closeHistory(): void {
    this.showHistoryModal.set(false);
  }

  get wrongQuestions(): GradedQuestion[] {
    return this.result?.results ? this.result.results.filter(r => !r.isCorrect) : [];
  }

  formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m} phút ${s} giây`;
  }

  formatMinutes(sec?: number): string {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  isSlowQuestion(q: GradedQuestion): boolean {
    const time = q.timeSpentSeconds || 0;
    if (q.part === 5 || q.part === 6) return time > 90;
    return time > 150;
  }
}