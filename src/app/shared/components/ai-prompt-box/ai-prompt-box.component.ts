import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-prompt-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-prompt-box.component.html',
  styleUrls: ['./ai-prompt-box.component.scss'],
})
export class AiPromptBoxComponent {
  promptText = input.required<string>();
  deckName = input<string | undefined>(undefined);
  wordCount = input<number | undefined>(undefined);
  instruction = input<string>('Sao chép System Prompt dưới đây và dán vào ChatGPT (GPT-4o) hoặc Claude 3.5 Sonnet:');
  showPasteAction = input<boolean>(true);
  pasteActionLabel = input<string>('Đã Copy, Sang Dán JSON');

  copy = output<void>();
  proceedToPaste = output<void>();

  copied = signal<boolean>(false);

  copyToClipboard(): void {
    const text = this.promptText();
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      this.copy.emit();
      setTimeout(() => this.copied.set(false), 2500);
    });
  }

  onProceed(): void {
    this.proceedToPaste.emit();
  }
}
