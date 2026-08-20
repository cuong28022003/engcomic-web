import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MistakeItem } from '../models';
import { MistakeQueueService } from '../services/mistake-queue.service';
import { MistakeItemComponent } from './mistake-item/mistake-item.component';
import { AiPromptBuilderComponent } from './ai-prompt-builder/ai-prompt-builder.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-mistake-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MistakeItemComponent,
    AiPromptBuilderComponent,
    EmptyStateComponent
  ],
  templateUrl: './mistake-queue.component.html',
  styleUrls: ['./mistake-queue.component.scss']
})
export class MistakeQueueComponent implements OnInit, OnDestroy {
  mistakes: MistakeItem[] = [];
  private sub?: Subscription;

  activeTab: 'all' | 'pending' | 'explained' | 'resolved' = 'all';
  searchQuery = '';

  showPromptModal = false;

  constructor(public mistakeQueueService: MistakeQueueService) {}

  ngOnInit() {
    this.sub = this.mistakeQueueService.mistakes$.subscribe(list => {
      this.mistakes = list;
    });
    this.mistakeQueueService.fetchFromBackend();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  get pendingCount(): number {
    return this.mistakes.filter(m => m.status === 'pending').length;
  }

  get explainedCount(): number {
    return this.mistakes.filter(m => m.status === 'explained').length;
  }

  get resolvedCount(): number {
    return this.mistakes.filter(m => m.status === 'resolved').length;
  }

  get filteredMistakes(): MistakeItem[] {
    return this.mistakes.filter(m => {
      if (this.activeTab !== 'all' && m.status !== this.activeTab) {
        return false;
      }
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const testMatch = m.testName?.toLowerCase().includes(q);
        const numMatch = m.questionNumber.toString().includes(q);
        return testMatch || numMatch;
      }
      return true;
    });
  }

  onSaveExplanation(event: { id: string; explanation: string }) {
    this.mistakeQueueService.updateMistake(event.id, event.explanation);
  }

  onMarkResolved(id: string) {
    this.mistakeQueueService.markAsResolved(id);
  }

  onDeleteMistake(id: string) {
    this.mistakeQueueService.deleteMistake(id);
  }
}