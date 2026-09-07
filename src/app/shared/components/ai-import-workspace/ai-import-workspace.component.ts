import { Component, input, model, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgressStepperComponent } from '../progress-stepper/progress-stepper.component';
import { parseCleanJson } from '@shared/utils/json.util';

export interface AiPromptPreset {
  key: string;
  label: string;
  description?: string;
  promptText?: string;
}

export interface AiMetaBadge {
  label: string;
  icon?: string;
  color?: string;
  variant?: 'primary' | 'warning' | 'success' | 'info';
}

export interface AiValidationStatus {
  status: 'empty' | 'valid' | 'invalid';
  itemCount?: number;
  errorMessage?: string;
}

@Component({
  selector: 'app-ai-import-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, ProgressStepperComponent],
  templateUrl: './ai-import-workspace.component.html',
  styleUrls: ['./ai-import-workspace.component.scss']
})
export class AiImportWorkspaceComponent {
  // ── Mode Switcher (AI vs Manual Form) ──
  readonly enableModeSwitch = input<boolean>(false);
  readonly activeMode = model<'ai' | 'manual'>('ai');
  readonly aiModeLabel = input<string>('Nạp Bằng AI JSON');
  readonly manualModeLabel = input<string>('Nhập Thủ Công');
  readonly aiModeIcon = input<string>('fa-solid fa-wand-magic-sparkles');
  readonly manualModeIcon = input<string>('fa-solid fa-pen-nib');

  // ── Stepper Flow ──
  readonly showStepper = input<boolean>(true);
  readonly steps = input<string[]>([
    '1. Tạo & Sao Chép Prompt',
    '2. Dán & Kiểm Tra JSON',
    '3. Xem Trước & Xác Nhận'
  ]);
  readonly currentStep = model<'prompt' | 'paste' | 'preview'>('prompt');

  // ── Step 1: Prompt Generator ──
  readonly promptText = input<string>('');
  readonly instruction = input<string>('Sao chép System Prompt dưới đây và dán vào ChatGPT hoặc Claude:');
  readonly guideSteps = input<string[]>([]);
  readonly metaBadges = input<AiMetaBadge[]>([]);
  readonly presets = input<any[]>([]);
  readonly selectedPreset = model<string>('');
  readonly promptTerminalTitle = input<string>('System Prompt (.json)');
  readonly pasteActionLabel = input<string>('Đã Copy, Sang Bước Dán JSON');

  // ── Step 2: JSON Input & Validator ──
  readonly jsonText = model<string>('');
  readonly jsonPlaceholder = input<string>('Dán dữ liệu JSON từ AI vào đây...');
  readonly jsonRows = input<number>(7);
  readonly sampleJson = input<string>('');
  readonly validationStatus = input<AiValidationStatus | null>(null);

  // ── Action / Loading States ──
  readonly isSubmitting = input<boolean>(false);
  readonly submitButtonLabel = input<string>('Nạp Dữ Liệu');

  // ── Outputs ──
  readonly copyPrompt = output<void>();
  readonly proceedToPaste = output<void>();
  readonly proceedToPreview = output<void>();
  readonly backToPrompt = output<void>();
  readonly backToPaste = output<void>();
  readonly submitImport = output<void>();
  readonly cancel = output<void>();
  readonly presetChanged = output<any>();

  // ── Internal Signals ──
  readonly copied = signal<boolean>(false);

  private readonly stepKeys: Array<'prompt' | 'paste' | 'preview'> = ['prompt', 'paste', 'preview'];

  readonly currentStepIndex = computed(() => {
    const cur = this.currentStep();
    const idx = this.stepKeys.indexOf(cur);
    return idx >= 0 ? idx : 0;
  });

  onCopyPrompt(): void {
    const txt = this.promptText();
    if (!txt) return;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(() => {
        this.copied.set(true);
        this.copyPrompt.emit();
        setTimeout(() => this.copied.set(false), 2200);
      });
    }
  }

  onSelectPreset(key: string): void {
    this.selectedPreset.set(key);
    const found = this.presets().find(p => p.key === key);
    this.presetChanged.emit(found || { key });
  }

  onStepChange(stepIndex: number): void {
    if (this.stepKeys[stepIndex]) {
      this.currentStep.set(this.stepKeys[stepIndex]);
    }
  }

  goToPasteStep(): void {
    this.currentStep.set('paste');
    this.proceedToPaste.emit();
  }

  goToPromptStep(): void {
    this.currentStep.set('prompt');
    this.backToPrompt.emit();
  }

  goToPreviewStep(): void {
    this.currentStep.set('preview');
    this.proceedToPreview.emit();
  }

  insertSample(): void {
    const sample = this.sampleJson();
    if (sample) {
      this.jsonText.set(sample);
    }
  }

  clearJson(): void {
    this.jsonText.set('');
  }

  formatJson(): void {
    const raw = this.jsonText().trim();
    if (!raw) return;
    try {
      const parsed = parseCleanJson(raw);
      this.jsonText.set(JSON.stringify(parsed, null, 2));
    } catch {
      // Keep existing content if not valid JSON
    }
  }
}
