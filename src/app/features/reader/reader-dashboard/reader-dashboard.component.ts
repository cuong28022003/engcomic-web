import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReaderApiService } from '../services/reader-api.service';
import { MistakeQueueService } from '../services/mistake-queue.service';
import { TestSummary, ToeicDashboardData } from '../models';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-reader-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe, EmptyStateComponent],
  templateUrl: './reader-dashboard.component.html',
  styleUrls: ['./reader-dashboard.component.scss']
})
export class ReaderDashboardComponent implements OnInit {
  dashboardData: ToeicDashboardData | null = null;
  tests: TestSummary[] = [];
  loading = true;
  errorMessage = '';

  filterStatus: 'all' | 'not_started' | 'completed' = 'all';

  constructor(
    private readerApi: ReaderApiService,
    public mistakeQueueService: MistakeQueueService
  ) {}

  ngOnInit() {
    this.loadData();
    this.mistakeQueueService.fetchFromBackend();
  }

  loadData() {
    this.loading = true;
    this.errorMessage = '';

    this.readerApi.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.tests = data.recentTests || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Không thể tải dữ liệu';
      }
    });
  }

  get filteredTests(): TestSummary[] {
    if (this.filterStatus === 'all') return this.tests;
    return this.tests.filter(t => t.status === this.filterStatus);
  }
}