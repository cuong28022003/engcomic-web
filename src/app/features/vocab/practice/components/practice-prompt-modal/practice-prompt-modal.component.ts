import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PracticePromptResponse } from '@models/index';
import { AiImportWorkspaceComponent, AiMetaBadge } from '@shared/components/ai-import-workspace/ai-import-workspace.component';

@Component({
  selector: 'app-practice-prompt-modal',
  standalone: true,
  imports: [CommonModule, AiImportWorkspaceComponent],
  templateUrl: './practice-prompt-modal.component.html',
  styleUrls: ['./practice-prompt-modal.component.scss'],
})
export class PracticePromptModalComponent {
  isOpen = input.required<boolean>();
  promptData = input<PracticePromptResponse | null>(null);

  closeModal = output<void>();
  openImport = output<void>();

  readonly metaBadges = computed<AiMetaBadge[]>(() => {
    const data = this.promptData();
    const badges: AiMetaBadge[] = [];
    badges.push({ icon: 'fa-solid fa-layer-group', label: data?.deckName || 'Bộ từ vựng', variant: 'primary' });
    if (data?.wordCount !== undefined) {
      badges.push({ icon: 'fa-regular fa-clock', label: `${data.wordCount} từ chưa có bài tập`, variant: 'warning' });
    }
    return badges;
  });

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
