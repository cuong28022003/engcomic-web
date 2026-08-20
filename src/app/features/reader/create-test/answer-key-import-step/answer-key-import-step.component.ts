import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnswerKeyService } from '../../services/answer-key.service';
import { AnswerKeyParseResult } from '../../models';

@Component({
  selector: 'app-answer-key-import-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './answer-key-import-step.component.html',
  styleUrls: ['./answer-key-import-step.component.scss']
})
export class AnswerKeyImportStepComponent {
  @Input() initialJson = '';
  @Output() prevStep = new EventEmitter<void>();
  @Output() submitTest = new EventEmitter<{ questions: Array<{ number: number; part: number; correctAnswer: string }> }>();

  rawJson = '';
  parseResult: AnswerKeyParseResult | null = null;
  showSampleModal = false;

  sampleJson = `{\n  "test_name": "ETS 2024 Test 5",\n  "questions": [\n    { "number": 101, "part": 5, "correct_answer": "C" },\n    { "number": 102, "part": 5, "correct_answer": "A" },\n    { "number": 103, "part": 5, "correct_answer": "D" },\n    { "number": 131, "part": 6, "correct_answer": "B" },\n    { "number": 147, "part": 7, "correct_answer": "A" }\n  ]\n}`;

  constructor(private answerKeyService: AnswerKeyService) {}

  ngOnInit() {
    if (this.initialJson) {
      this.rawJson = this.initialJson;
      this.onParse();
    }
  }

  onParse() {
    this.parseResult = this.answerKeyService.parseJson(this.rawJson);
  }

  loadSample() {
    this.rawJson = this.sampleJson;
    this.onParse();
    this.showSampleModal = false;
  }

  onBack() {
    this.prevStep.emit();
  }

  onSubmit() {
    if (!this.parseResult || !this.parseResult.valid || this.parseResult.questions.length === 0) {
      this.onParse();
    }
    if (this.parseResult && this.parseResult.valid) {
      this.submitTest.emit({
        questions: this.parseResult.questions
      });
    }
  }
}