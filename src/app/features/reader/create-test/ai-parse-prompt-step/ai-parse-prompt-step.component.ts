import { Component, EventEmitter, Output, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnswerKeyService } from '../../services/answer-key.service';
import { ToeicSection } from '../../models';

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
  section = input<ToeicSection>('reading');

  @Output() prevStep = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<void>();

  readonly isListening = computed(() => this.section() === 'listening');

  readonly promptText = computed(() => this.answerKeyService.getAiParsePrompt(this.testName(), this.section()));

  copied = false;

  async copyPrompt() {
    const success = await this.answerKeyService.copyAiParsePrompt(this.testName(), this.section());
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