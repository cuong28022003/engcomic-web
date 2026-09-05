import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { UserStats } from '@models/index';

export interface DayOfWeekItem {
  dayLabel: string; // T2, T3, T4, T5, T6, T7, CN
  dateStr: string;
  isToday: boolean;
  isPast: boolean;
  isCompleted: boolean;
}

@Component({
  selector: 'app-streak-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './streak-modal.component.html',
  styleUrls: ['./streak-modal.component.scss']
})
export class StreakModalComponent {
  private router = inject(Router);

  readonly isOpen = input<boolean>(false);
  readonly stats = input<UserStats | null>(null);

  readonly close = output<void>();

  readonly streakCount = computed(() => {
    const s = this.stats();
    return s?.currentStreak ?? s?.streakDays ?? 0;
  });

  readonly longestStreak = computed(() => {
    const s = this.stats();
    return s?.longestStreak ?? this.streakCount();
  });

  readonly isStudiedToday = computed(() => {
    const s = this.stats();
    if (s?.studiedToday !== undefined) return s.studiedToday;
    if (!s?.lastStudyDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return s.lastStudyDate.startsWith(today);
  });

  readonly weekDays = computed<DayOfWeekItem[]>(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    // Normalize Monday as index 0, Sunday as index 6
    const normalizedTodayIdx = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const days: DayOfWeekItem[] = [];

    const studiedToday = this.isStudiedToday();
    const streak = this.streakCount();

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      const diff = i - normalizedTodayIdx;
      d.setDate(now.getDate() + diff);

      const isToday = i === normalizedTodayIdx;
      const isPast = i < normalizedTodayIdx;

      // Calculate if completed based on streak and today's status
      let isCompleted = false;
      if (isToday) {
        isCompleted = studiedToday;
      } else if (isPast) {
        const daysAgo = normalizedTodayIdx - i;
        isCompleted = streak >= (studiedToday ? daysAgo + 1 : daysAgo);
      }

      days.push({
        dayLabel: labels[i],
        dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
        isToday,
        isPast,
        isCompleted
      });
    }

    return days;
  });

  readonly nextMilestone = computed<{ target: number; reward: string; progress: number }>(() => {
    const current = this.streakCount();
    if (current < 3) {
      return { target: 3, reward: '+10 Kim Cương', progress: Math.min(100, Math.round((current / 3) * 100)) };
    } else if (current < 7) {
      return { target: 7, reward: '+30 Kim Cương & Huy Hiệu Chăm Chỉ', progress: Math.min(100, Math.round((current / 7) * 100)) };
    } else if (current < 14) {
      return { target: 14, reward: '+60 Kim Cương & Khung Avatar Lửa', progress: Math.min(100, Math.round((current / 14) * 100)) };
    } else if (current < 30) {
      return { target: 30, reward: '+150 Kim Cương & Danh Hiệu Kỷ Luật', progress: Math.min(100, Math.round((current / 30) * 100)) };
    } else {
      const next100 = Math.ceil((current + 1) / 30) * 30;
      return { target: next100, reward: '+300 Kim Cương Huyền Thoại', progress: Math.min(100, Math.round((current / next100) * 100)) };
    }
  });

  goToDecks(): void {
    this.close.emit();
    this.router.navigate(['/deck']);
  }

  goToToeic(): void {
    this.close.emit();
    this.router.navigate(['/reader']);
  }

  goToGrammar(): void {
    this.close.emit();
    this.router.navigate(['/grammar']);
  }

  goToVocabVault(): void {
    this.close.emit();
    this.router.navigate(['/vocab']);
  }

  onClose(): void {
    this.close.emit();
  }
}
