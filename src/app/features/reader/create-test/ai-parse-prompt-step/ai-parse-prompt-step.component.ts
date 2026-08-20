import { Component, EventEmitter, Output } from '@angular/core';
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
  @Output() prevStep = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<void>();

  promptText = '';
  copied = false;

  constructor(private answerKeyService: AnswerKeyService) {
    this.promptText = this.answerKeyService.getAiParsePrompt();
  }

  async copyPrompt() {
    const success = await this.answerKeyService.copyAiParsePrompt();
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