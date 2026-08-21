import { Component, OnInit, computed, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components';
import { TimeMode, TimeTargetConfig, UserTimeSettings } from '../../models';

const STORAGE_SETTINGS_KEY = 'toeic_user_time_settings';

@Component({
  selector: 'app-pre-test-config-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './pre-test-config-modal.component.html',
  styleUrls: ['./pre-test-config-modal.component.scss']
})
export class PreTestConfigModalComponent implements OnInit {
  readonly isOpen = model<boolean>(true);

  // Part Selection
  readonly includePart5 = signal<boolean>(true);
  readonly includePart6 = signal<boolean>(true);
  readonly includePart7 = signal<boolean>(true);

  // Time Mode & Minutes
  readonly selectedMode = signal<TimeMode>('full_test');
  readonly part5Minutes = signal<number>(20);
  readonly part6Minutes = signal<number>(10);
  readonly part7Minutes = signal<number>(45);
  readonly saveAsDefault = signal<boolean>(true);

  readonly startTest = output<TimeTargetConfig>();
  readonly cancel = output<void>();

  ngOnInit(): void {
    this.loadSavedSettings();
  }

  private loadSavedSettings(): void {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (raw) {
        const settings: UserTimeSettings = JSON.parse(raw);
        if (settings.mode) this.selectedMode.set(settings.mode);
        if (settings.selectedParts && settings.selectedParts.length > 0) {
          this.includePart5.set(settings.selectedParts.includes(5));
          this.includePart6.set(settings.selectedParts.includes(6));
          this.includePart7.set(settings.selectedParts.includes(7));
        }
        if (settings.part5_target_minutes) this.part5Minutes.set(settings.part5_target_minutes);
        if (settings.part6_target_minutes) this.part6Minutes.set(settings.part6_target_minutes);
        if (settings.part7_target_minutes) this.part7Minutes.set(settings.part7_target_minutes);
      }
    } catch {
      // Ignore load error
    }
  }

  private saveSettingsToStorage(config: TimeTargetConfig): void {
    try {
      const settings: UserTimeSettings = {
        mode: config.mode,
        selectedParts: config.selectedParts,
        part5_target_minutes: config.part5_minutes ?? 20,
        part6_target_minutes: config.part6_minutes ?? 10,
        part7_target_minutes: config.part7_minutes ?? 45,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage error
    }
  }

  readonly selectedParts = computed<number[]>(() => {
    const parts: number[] = [];
    if (this.includePart5()) parts.push(5);
    if (this.includePart6()) parts.push(6);
    if (this.includePart7()) parts.push(7);
    return parts.length > 0 ? parts : [5]; // Tối thiểu 1 Part
  });

  readonly totalSelectedQuestions = computed<number>(() => {
    let total = 0;
    if (this.includePart5()) total += 30;
    if (this.includePart6()) total += 16;
    if (this.includePart7()) total += 54;
    return total;
  });

  readonly isAllPartsSelected = computed<boolean>(() => {
    return this.includePart5() && this.includePart6() && this.includePart7();
  });

  readonly totalCalculatedMinutes = computed<number>(() => {
    let total = 0;
    if (this.includePart5()) total += this.part5Minutes();
    if (this.includePart6()) total += this.part6Minutes();
    if (this.includePart7()) total += this.part7Minutes();
    return total;
  });

  togglePart(part: 5 | 6 | 7): void {
    if (part === 5) {
      if (this.includePart5() && !this.includePart6() && !this.includePart7()) return; // Không cho bỏ hết
      this.includePart5.update(v => !v);
    } else if (part === 6) {
      if (this.includePart6() && !this.includePart5() && !this.includePart7()) return;
      this.includePart6.update(v => !v);
    } else if (part === 7) {
      if (this.includePart7() && !this.includePart5() && !this.includePart6()) return;
      this.includePart7.update(v => !v);
    }
  }

  selectAllParts(): void {
    this.includePart5.set(true);
    this.includePart6.set(true);
    this.includePart7.set(true);
  }

  selectSinglePart(part: 5 | 6 | 7): void {
    this.includePart5.set(part === 5);
    this.includePart6.set(part === 6);
    this.includePart7.set(part === 7);
  }

  selectMode(mode: TimeMode): void {
    this.selectedMode.set(mode);
    if (mode === 'full_test') {
      this.part5Minutes.set(20);
      this.part6Minutes.set(10);
      this.part7Minutes.set(45);
    }
  }

  onPartChange(part: 5 | 6 | 7, event: Event): void {
    const val = Math.max(1, Number((event.target as HTMLInputElement).value) || 1);
    if (part === 5) this.part5Minutes.set(val);
    else if (part === 6) this.part6Minutes.set(val);
    else if (part === 7) this.part7Minutes.set(val);
  }

  toggleSaveDefault(event: Event): void {
    this.saveAsDefault.set((event.target as HTMLInputElement).checked);
  }

  onStartTest(): void {
    const config: TimeTargetConfig = {
      mode: this.selectedMode(),
      selectedParts: this.selectedParts(),
      part5_minutes: this.includePart5() ? this.part5Minutes() : 0,
      part6_minutes: this.includePart6() ? this.part6Minutes() : 0,
      part7_minutes: this.includePart7() ? this.part7Minutes() : 0
    };

    if (this.saveAsDefault()) {
      this.saveSettingsToStorage(config);
    }

    this.isOpen.set(false);
    this.startTest.emit(config);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}