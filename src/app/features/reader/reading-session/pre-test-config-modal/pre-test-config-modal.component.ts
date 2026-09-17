import { Component, OnInit, computed, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components';
import { TimeMode, TimeTargetConfig, UserTimeSettings } from '../../models';
import { ToeicSection } from '../../models';

const STORAGE_SETTINGS_KEY = 'toeic_user_time_settings';

const READING_DEFAULTS = { 5: 20, 6: 10, 7: 45 };
const LISTENING_DEFAULTS = { 1: 5, 2: 8, 3: 16, 4: 16 };

@Component({
  selector: 'app-pre-test-config-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './pre-test-config-modal.component.html',
  styleUrls: ['./pre-test-config-modal.component.scss']
})
export class PreTestConfigModalComponent implements OnInit {
  readonly isOpen = model<boolean>(true);
  readonly section = input<ToeicSection>('reading');

  // Part Selection (listening 1-4 / reading 5-7)
  readonly includePart1 = signal<boolean>(true);
  readonly includePart2 = signal<boolean>(true);
  readonly includePart3 = signal<boolean>(true);
  readonly includePart4 = signal<boolean>(true);
  readonly includePart5 = signal<boolean>(true);
  readonly includePart6 = signal<boolean>(true);
  readonly includePart7 = signal<boolean>(true);

  // Time Mode & Minutes
  readonly selectedMode = signal<TimeMode>('full_test');
  readonly part1Minutes = signal<number>(5);
  readonly part2Minutes = signal<number>(8);
  readonly part3Minutes = signal<number>(16);
  readonly part4Minutes = signal<number>(16);
  readonly part5Minutes = signal<number>(20);
  readonly part6Minutes = signal<number>(10);
  readonly part7Minutes = signal<number>(45);
  readonly saveAsDefault = signal<boolean>(true);

  readonly startTest = output<TimeTargetConfig>();
  readonly cancel = output<void>();

  ngOnInit(): void {
    this.loadSavedSettings();
  }

  readonly isListening = computed<boolean>(() => this.section() === 'listening');

  readonly listeningParts = computed<Array<{ part: number; title: string; range: string }>>(() => [
    { part: 1, title: 'Part 1', range: '6 câu (1 - 6)' },
    { part: 2, title: 'Part 2', range: '25 câu (7 - 31)' },
    { part: 3, title: 'Part 3', range: '39 câu (32 - 70)' },
    { part: 4, title: 'Part 4', range: '30 câu (71 - 100)' }
  ]);

  readonly readingParts = computed<Array<{ part: number; title: string; range: string }>>(() => [
    { part: 5, title: 'Part 5', range: '30 câu (101 - 130)' },
    { part: 6, title: 'Part 6', range: '16 câu (131 - 146)' },
    { part: 7, title: 'Part 7', range: '54 câu (147 - 200)' }
  ]);

  private loadSavedSettings(): void {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (!raw) return;
      const settings: UserTimeSettings = JSON.parse(raw);
      if (settings.mode) this.selectedMode.set(settings.mode);
      if (settings.selectedParts && settings.selectedParts.length > 0) {
        this.includePart1.set(settings.selectedParts.includes(1));
        this.includePart2.set(settings.selectedParts.includes(2));
        this.includePart3.set(settings.selectedParts.includes(3));
        this.includePart4.set(settings.selectedParts.includes(4));
        this.includePart5.set(settings.selectedParts.includes(5));
        this.includePart6.set(settings.selectedParts.includes(6));
        this.includePart7.set(settings.selectedParts.includes(7));
      }
      if (settings.part1_target_minutes) this.part1Minutes.set(settings.part1_target_minutes);
      if (settings.part2_target_minutes) this.part2Minutes.set(settings.part2_target_minutes);
      if (settings.part3_target_minutes) this.part3Minutes.set(settings.part3_target_minutes);
      if (settings.part4_target_minutes) this.part4Minutes.set(settings.part4_target_minutes);
      if (settings.part5_target_minutes) this.part5Minutes.set(settings.part5_target_minutes);
      if (settings.part6_target_minutes) this.part6Minutes.set(settings.part6_target_minutes);
      if (settings.part7_target_minutes) this.part7Minutes.set(settings.part7_target_minutes);
    } catch {
      // Ignore load error
    }
  }

  private saveSettingsToStorage(config: TimeTargetConfig): void {
    try {
      const settings: UserTimeSettings = {
        mode: config.mode,
        selectedParts: config.selectedParts,
        part1_target_minutes: config.part1_minutes ?? 5,
        part2_target_minutes: config.part2_minutes ?? 8,
        part3_target_minutes: config.part3_minutes ?? 16,
        part4_target_minutes: config.part4_minutes ?? 16,
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
    if (this.isListening()) {
      if (this.includePart1()) parts.push(1);
      if (this.includePart2()) parts.push(2);
      if (this.includePart3()) parts.push(3);
      if (this.includePart4()) parts.push(4);
    } else {
      if (this.includePart5()) parts.push(5);
      if (this.includePart6()) parts.push(6);
      if (this.includePart7()) parts.push(7);
    }
    const fallback = this.isListening() ? [1] : [5];
    return parts.length > 0 ? parts : fallback; // Tối thiểu 1 Part
  });

  readonly totalSelectedQuestions = computed<number>(() => {
    if (this.isListening()) {
      let total = 0;
      if (this.includePart1()) total += 6;
      if (this.includePart2()) total += 25;
      if (this.includePart3()) total += 39;
      if (this.includePart4()) total += 30;
      return total;
    }
    let total = 0;
    if (this.includePart5()) total += 30;
    if (this.includePart6()) total += 16;
    if (this.includePart7()) total += 54;
    return total;
  });

  readonly isAllPartsSelected = computed<boolean>(() => {
    if (this.isListening()) return this.includePart1() && this.includePart2() && this.includePart3() && this.includePart4();
    return this.includePart5() && this.includePart6() && this.includePart7();
  });

  readonly totalCalculatedMinutes = computed<number>(() => {
    let total = 0;
    if (this.isListening()) {
      if (this.includePart1()) total += this.part1Minutes();
      if (this.includePart2()) total += this.part2Minutes();
      if (this.includePart3()) total += this.part3Minutes();
      if (this.includePart4()) total += this.part4Minutes();
      return total;
    }
    if (this.includePart5()) total += this.part5Minutes();
    if (this.includePart6()) total += this.part6Minutes();
    if (this.includePart7()) total += this.part7Minutes();
    return total;
  });

  partQuestionCount(part: number): number {
    if (part === 1) return 6;
    if (part === 2) return 25;
    if (part === 3) return 39;
    if (part === 4) return 30;
    if (part === 5) return 30;
    if (part === 6) return 16;
    return 54;
  }

  isIncluded(part: number): boolean {
    if (this.isListening()) {
      if (part === 1) return this.includePart1();
      if (part === 2) return this.includePart2();
      if (part === 3) return this.includePart3();
      return this.includePart4();
    }
    if (part === 5) return this.includePart5();
    if (part === 6) return this.includePart6();
    return this.includePart7();
  }

  getPartMinutesSignal(part: number): ReturnType<typeof signal<number>> {
    if (this.isListening()) {
      if (part === 1) return this.part1Minutes;
      if (part === 2) return this.part2Minutes;
      if (part === 3) return this.part3Minutes;
      return this.part4Minutes;
    }
    if (part === 5) return this.part5Minutes;
    if (part === 6) return this.part6Minutes;
    return this.part7Minutes;
  }

  toggledParts(): number[] {
    if (this.isListening()) {
      return [this.includePart1(), this.includePart2(), this.includePart3(), this.includePart4()]
        .map((v, i) => v ? i + 1 : 0)
        .filter(p => p > 0);
    }
    return [this.includePart5(), this.includePart6(), this.includePart7()]
      .map((v, i) => v ? i + 5 : 0)
      .filter(p => p > 0);
  }

  togglePart(part: number): void {
    if (this.isListening() && part >= 1 && part <= 4) {
      if (this.isIncluded(part) && this.toggledParts().length === 1) return;
      if (part === 1) this.includePart1.update(v => !v);
      else if (part === 2) this.includePart2.update(v => !v);
      else if (part === 3) this.includePart3.update(v => !v);
      else this.includePart4.update(v => !v);
    } else {
      if (this.isIncluded(part) && this.toggledParts().length === 1) return;
      if (part === 5) this.includePart5.update(v => !v);
      else if (part === 6) this.includePart6.update(v => !v);
      else this.includePart7.update(v => !v);
    }
  }

  selectAllParts(): void {
    this.includePart1.set(true);
    this.includePart2.set(true);
    this.includePart3.set(true);
    this.includePart4.set(true);
    this.includePart5.set(true);
    this.includePart6.set(true);
    this.includePart7.set(true);
  }

  selectSinglePart(part: number): void {
    this.includePart1.set(part === 1);
    this.includePart2.set(part === 2);
    this.includePart3.set(part === 3);
    this.includePart4.set(part === 4);
    this.includePart5.set(part === 5);
    this.includePart6.set(part === 6);
    this.includePart7.set(part === 7);
  }

  selectMode(mode: TimeMode): void {
    this.selectedMode.set(mode);
    if (mode === 'full_test') {
      this.part1Minutes.set(5);
      this.part2Minutes.set(8);
      this.part3Minutes.set(16);
      this.part4Minutes.set(16);
      this.part5Minutes.set(20);
      this.part6Minutes.set(10);
      this.part7Minutes.set(45);
    }
  }

  onPartChange(part: number, event: Event): void {
    const val = Math.max(1, Number((event.target as HTMLInputElement).value) || 1);
    this.getPartMinutesSignal(part).set(val);
  }

  toggleSaveDefault(event: Event): void {
    this.saveAsDefault.set((event.target as HTMLInputElement).checked);
  }

  onStartTest(): void {
    const config: TimeTargetConfig = {
      mode: this.selectedMode(),
      section: this.section(),
      selectedParts: this.selectedParts(),
      part1_minutes: this.isListening() && this.includePart1() ? this.part1Minutes() : 0,
      part2_minutes: this.isListening() && this.includePart2() ? this.part2Minutes() : 0,
      part3_minutes: this.isListening() && this.includePart3() ? this.part3Minutes() : 0,
      part4_minutes: this.isListening() && this.includePart4() ? this.part4Minutes() : 0,
      part5_minutes: !this.isListening() && this.includePart5() ? this.part5Minutes() : 0,
      part6_minutes: !this.isListening() && this.includePart6() ? this.part6Minutes() : 0,
      part7_minutes: !this.isListening() && this.includePart7() ? this.part7Minutes() : 0
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