import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardApiService } from '@services/card-api.service';
import { ToastService } from '@services/toast.service';
import { Card } from '@models/index';

@Component({
  selector: 'app-leech-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leech-center.component.html',
  styleUrls: ['./leech-center.component.scss'],
})
export class LeechCenterComponent implements OnInit {
  leechCards = signal<Card[]>([]);
  isLoading = signal<boolean>(true);
  selectedCard = signal<Card | null>(null);
  memoryTipInput = '';
  isSaving = signal<boolean>(false);

  constructor(
    private cardApi: CardApiService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLeechCards();
  }

  loadLeechCards(): void {
    this.isLoading.set(true);
    this.cardApi.getLeechCards().subscribe({
      next: (cards) => {
        this.leechCards.set(cards);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openTipModal(card: Card): void {
    this.selectedCard.set(card);
    this.memoryTipInput = card.memoryTip || '';
  }

  closeModal(): void {
    this.selectedCard.set(null);
    this.memoryTipInput = '';
  }

  saveTipAndClearLeech(): void {
    const card = this.selectedCard();
    if (!card) return;

    this.isSaving.set(true);
    this.cardApi.clearLeechStatus(card.id, this.memoryTipInput).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.toast.success(res.message || 'Đã giải cứu từ Leech thành công!');
        this.closeModal();
        this.loadLeechCards();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(err.error?.message || 'Không thể giải cứu từ vựng.');
      }
    });
  }

  returnToVocab(): void {
    this.router.navigate(['/vocab']);
  }
}
