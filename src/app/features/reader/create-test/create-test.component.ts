import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PdfUploadStepComponent } from './pdf-upload-step/pdf-upload-step.component';
import { AiParsePromptStepComponent } from './ai-parse-prompt-step/ai-parse-prompt-step.component';
import { AnswerKeyImportStepComponent } from './answer-key-import-step/answer-key-import-step.component';
import { ReaderApiService } from '../services/reader-api.service';
import { CreateTestPayload } from '../models';

@Component({
  selector: 'app-create-test',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PdfUploadStepComponent,
    AiParsePromptStepComponent,
    AnswerKeyImportStepComponent
  ],
  templateUrl: './create-test.component.html',
  styleUrls: ['./create-test.component.scss']
})
export class CreateTestComponent {
  currentStep: 1 | 2 | 3 = 1;

  testName = '';
  pdfFile: File | null = null;
  pdfUrl = '';
  questions: Array<{ number: number; part: number; correctAnswer: string }> = [];

  submitting = false;
  errorMessage = '';

  constructor(
    private readerApi: ReaderApiService,
    private router: Router
  ) {}

  onStep1Completed(data: { testName: string; pdfFile: File | null; pdfUrl: string }) {
    this.testName = data.testName;
    this.pdfFile = data.pdfFile;
    this.pdfUrl = data.pdfUrl;
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

  onSubmitTest(data: { questions: Array<{ number: number; part: number; correctAnswer: string }> }) {
    this.questions = data.questions;
    this.submitting = true;
    this.errorMessage = '';

    const payload: CreateTestPayload = {
      testName: this.testName,
      pdfUrl: this.pdfUrl || undefined,
      questions: this.questions
    };

    this.readerApi.createTestMultipart(payload, this.pdfFile || undefined).subscribe({
      next: (created) => {
        this.submitting = false;
        // Redirect to reading session immediately
        this.router.navigate(['/reader', created.id]);
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.message || 'Không thể tạo bài thi. Vui lòng thử lại.';
      }
    });
  }
}