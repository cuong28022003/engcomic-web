import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
import { AnswerSheetComponent } from './answer-sheet/answer-sheet.component';
import { ReaderApiService } from '../services/reader-api.service';
import { MistakeQueueService } from '../services/mistake-queue.service';
import { GradedQuestion, SubmitSessionResponse, TestDetail, UserAnswerItem } from '../models';

@Component({
  selector: 'app-reading-session',
  standalone: true,
  imports: [CommonModule, RouterModule, PdfViewerComponent, AnswerSheetComponent],
  templateUrl: './reading-session.component.html',
  styleUrls: ['./reading-session.component.scss']
})
export class ReadingSessionComponent implements OnInit {
  testId = '';
  test: TestDetail | null = null;
  loading = true;
  errorMessage = '';

  isSubmitted = false;
  submissionResult: SubmitSessionResponse | null = null;
  gradedResults: GradedQuestion[] = [];

  // Mobile layout tab
  activeMobileTab: 'pdf' | 'answers' = 'answers';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readerApi: ReaderApiService,
    private mistakeQueueService: MistakeQueueService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('testId');
      if (id) {
        this.testId = id;
        this.loadTestDetail();
      }
    });
  }

  loadTestDetail() {
    this.loading = true;
    this.errorMessage = '';
    this.readerApi.getTestDetail(this.testId).subscribe({
      next: (detail) => {
        this.test = detail;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Không thể tải thông tin bài thi';
      }
    });
  }

  onSubmitAnswers(event: { duration: number; answers: UserAnswerItem[] }) {
    this.readerApi.submitSession(this.testId, {
      duration: event.duration,
      answers: event.answers
    }).subscribe({
      next: (res) => {
        this.isSubmitted = true;
        this.submissionResult = res;
        this.gradedResults = res.results;

        // Auto update local mistake queue
        if (res.newMistakes && res.newMistakes.length > 0) {
          this.mistakeQueueService.addMistakes(res.newMistakes);
        }

        // Navigate to result summary page
        this.router.navigate(['/reader', this.testId, 'result'], {
          state: { result: res }
        });
      },
      error: (err) => {
        alert(err.message || 'Gặp lỗi khi nộp bài. Vui lòng thử lại!');
      }
    });
  }
}