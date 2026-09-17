import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnswerKeyService } from '../../services/answer-key.service';
import { AnswerKeyParseResult, ToeicSection } from '../../models';

@Component({
  selector: 'app-answer-key-import-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './answer-key-import-step.component.html',
  styleUrls: ['./answer-key-import-step.component.scss']
})
export class AnswerKeyImportStepComponent implements OnInit {
  @Input() initialJson = '';
  @Input() section: ToeicSection = 'reading';
  @Output() prevStep = new EventEmitter<void>();
  @Output() submitTest = new EventEmitter<{ questions: Array<{ number: number; part: number; correctAnswer: string; audioStartMs?: number; transcript?: string }> }>();

  rawJson = '';
  parseResult: AnswerKeyParseResult | null = null;
  showSampleModal = false;

  readonly sampleReadingJson = `{\n  "test_name": "ETS 2024 Test 5",\n  "questions": [\n    { "number": 101, "part": 5, "correct_answer": "C" },\n    { "number": 102, "part": 5, "correct_answer": "A" },\n    { "number": 103, "part": 5, "correct_answer": "D" },\n    { "number": 131, "part": 6, "correct_answer": "B" },\n    { "number": 147, "part": 7, "correct_answer": "A" }\n  ]\n}`;

  readonly sampleListeningJson = `{\n  "test_name": "ETS 2024 Test 5 - Listening",\n  "questions": [\n    { "number": 1, "part": 1, "correct_answer": "A", "transcript": "A man is watering the plants in the garden." },\n    { "number": 7, "part": 2, "correct_answer": "B", "audio_start_ms": 62000, "transcript": "Do you want coffee or tea?" },\n    { "number": 32, "part": 3, "correct_answer": "C", "transcript": "Woman: ... Man: ..." },\n    { "number": 71, "part": 4, "correct_answer": "D" },\n    { "number": 100, "part": 4, "correct_answer": "A" }\n  ]\n}`;

  constructor(private answerKeyService: AnswerKeyService) {}

  get sampleJson(): string {
    return this.section === 'listening' ? this.sampleListeningJson : this.sampleReadingJson;
  }

  ngOnInit() {
    if (this.initialJson) {
      this.rawJson = this.initialJson;
      this.onParse();
    }
  }

  onParse() {
    this.parseResult = this.answerKeyService.parseJson(this.rawJson, this.section);
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