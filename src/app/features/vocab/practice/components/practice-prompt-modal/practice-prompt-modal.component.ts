import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PracticePromptResponse } from '@models/index';

@Component({
  selector: 'app-practice-prompt-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './practice-prompt-modal.component.html',
  styleUrls: ['./practice-prompt-modal.component.scss'],
})
export class PracticePromptModalComponent {
  isOpen = input.required<boolean>();
  promptData = input<PracticePromptResponse | null>(null);

  closeModal = output<void>();
  openImport = output<void>();

  copied = signal<boolean>(false);

  copyPrompt(): void {
    const text = this.promptData()?.systemPrompt || '';
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 3000);
    });
  }

  goToImport(): void {
    this.closeModal.emit();
    this.openImport.emit();
  }

  onClose(): void {
    this.copied.set(false);
    this.closeModal.emit();
  }
}
