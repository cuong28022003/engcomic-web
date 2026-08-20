import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MistakeItem } from '../../models';
import { MistakeQueueService } from '../../services/mistake-queue.service';

@Component({
  selector: 'app-ai-prompt-builder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-prompt-builder.component.html',
  styleUrls: ['./ai-prompt-builder.component.scss']
})
export class AiPromptBuilderComponent implements OnInit {
  @Input() mistakes: MistakeItem[] = [];
  @Output() close = new EventEmitter<void>();

  promptText = '';
  copied = false;

  constructor(private mistakeQueueService: MistakeQueueService) {}

  ngOnInit() {
    this.promptText = this.mistakeQueueService.generateAiPrompt(this.mistakes);
  }

  async copyPrompt() {
    const success = await this.mistakeQueueService.copyAiPrompt(this.mistakes);
    if (success) {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    }
  }

  onClose() {
    this.close.emit();
  }
}