import { Component, EventEmitter, Output, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnswerKeyService } from '../../services/answer-key.service';

@Component({
  selector: 'app-ai-parse-prompt-step',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-parse-prompt-step.component.html',
  styleUrls: ['./ai-parse-prompt-step.component.scss']
})
export class AiParsePromptStepComponent {
  private answerKeyService = inject(AnswerKeyService);

  testName = input<string>('');

  @Output() prevStep = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<void>();

  promptText = computed(() => this.answerKeyService.getAiParsePrompt(this.testName()));
  copied = false;

  async copyPrompt() {
    const success = await this.answerKeyService.copyAiParsePrompt(this.testName());
    if (success) {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    }
  }

  onBack() {
    this.prevStep.emit();
  }

  onNext() {
    this.nextStep.emit();
  }
}