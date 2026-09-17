import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PdfUploadStepComponent } from './pdf-upload-step/pdf-upload-step.component';
import { AiParsePromptStepComponent } from './ai-parse-prompt-step/ai-parse-prompt-step.component';
import { AnswerKeyImportStepComponent } from './answer-key-import-step/answer-key-import-step.component';
import { ReaderApiService } from '../services/reader-api.service';
import { CreateTestPayload, ToeicSection } from '../models';
import { ToastService } from '@core/services/toast.service';

import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components';

@Component({
  selector: 'app-create-test',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PdfUploadStepComponent,
    AiParsePromptStepComponent,
    AnswerKeyImportStepComponent,
    BreadcrumbComponent
  ],
  templateUrl: './create-test.component.html',
  styleUrls: ['./create-test.component.scss']
})
export class CreateTestComponent {
  private readerApi = inject(ReaderApiService);
  private router = inject(Router);
  private toast = inject(ToastService);

  readonly breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Luyện Đề TOEIC', url: '/reader', icon: 'fa-solid fa-book-open-reader' },
    { label: 'Tạo Đề Thi Mới' }
  ];

  currentStep: 1 | 2 | 3 = 1;

  testName = '';
  pdfFile: File | null = null;
  pdfUrl = '';
  section: ToeicSection = 'reading';
  audioFile: File | null = null;
  questions: Array<{ number: number; part: number; correctAnswer: string; audioStartMs?: number; transcript?: string }> = [];

  submitting = false;
  errorMessage = '';

  onStep1Completed(data: { testName: string; pdfFile: File | null; pdfUrl: string; section: ToeicSection; audioFile: File | null }) {
    this.testName = data.testName;
    this.pdfFile = data.pdfFile;
    this.pdfUrl = data.pdfUrl;
    this.section = data.section;
    this.audioFile = data.audioFile;
    this.currentStep = 2;
  }

  onStep2Next() {
    this.currentStep = 3;
  }

  onStep2Back() {
    this.currentStep = 1;
  }

  onStep3Back() {
    this.currentStep = 2;
  }

  onSubmitTest(data: { questions: Array<{ number: number; part: number; correctAnswer: string; audioStartMs?: number; transcript?: string }> }) {
    this.questions = data.questions;
    this.submitting = true;
    this.errorMessage = '';

    const payload: CreateTestPayload = {
      testName: this.testName,
      section: this.section,
      pdfUrl: this.pdfUrl || undefined,
      questions: this.questions
    };

    this.readerApi.createTestMultipart(payload, this.pdfFile || undefined, this.audioFile || undefined).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success(this.section === 'listening' && this.audioFile
          ? 'Đã tạo đề Listening thành công!'
          : 'Đã tạo đề thi thành công!');
        // Return to TOEIC tests list dashboard
        this.router.navigate(['/reader']);
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.message || 'Không thể tạo bài thi. Vui lòng thử lại.';
        this.toast.error(this.errorMessage);
      }
    });
  }
}