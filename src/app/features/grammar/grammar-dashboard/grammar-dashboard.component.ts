import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PaginatorComponent } from '@shared/components/paginator/paginator.component';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { GrammarApiService } from '@core/services/grammar-api.service';
import { GrammarCardModalComponent } from '../components/grammar-card-modal/grammar-card-modal.component';
import { GrammarSearchModalComponent } from '../components/grammar-search-modal/grammar-search-modal.component';
import { GrammarEditModalComponent } from '../components/grammar-edit-modal/grammar-edit-modal.component';
import {
  GrammarPoint,
  MostMissedGrammar,
  GRAMMAR_CATEGORIES,
  GrammarCategoryOption
} from '../models/grammar.model';

@Component({
  selector: 'app-grammar-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingComponent,
    EmptyStateComponent,
    PaginatorComponent,
    GrammarCardModalComponent,
    GrammarSearchModalComponent,
    GrammarEditModalComponent
  ],
  templateUrl: './grammar-dashboard.component.html',
  styleUrls: ['./grammar-dashboard.component.scss']
})
export class GrammarDashboardComponent implements OnInit {
  private grammarApi = inject(GrammarApiService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  readonly categories = GRAMMAR_CATEGORIES;
  readonly selectedCategory = signal<string>('all');
  readonly searchQuery = signal<string>('');

  readonly allPoints = signal<GrammarPoint[]>([]);
  readonly mostMissed = signal<MostMissedGrammar[]>([]);
  readonly loading = signal<boolean>(false);

  // Pagination Signals
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // Modals
  readonly selectedCard = signal<GrammarPoint | null>(null);
  readonly showCardModal = signal<boolean>(false);
  readonly showSearchModal = signal<boolean>(false);
  readonly showEditModal = signal<boolean>(false);
  readonly editingPoint = signal<GrammarPoint | null>(null);

  readonly filteredPoints = computed(() => {
    let list = this.allPoints();
    const cat = this.selectedCategory();
    if (cat !== 'all') {
      list = list.filter(p => p.category?.toLowerCase() === cat.toLowerCase());
    }
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        p.topic.toLowerCase().includes(q) ||
        p.shortRule?.toLowerCase().includes(q) ||
        p.structure?.toLowerCase().includes(q) ||
        p.signalWords?.some(w => w.toLowerCase().includes(q)) ||
        p.searchKeywords?.some(k => k.toLowerCase().includes(q))
      );
    }
    return list;
  });

  readonly paginatedPoints = computed(() => {
    const list = this.filteredPoints();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.grammarApi.getGrammarPoints().subscribe({
      next: (points) => {
        this.allPoints.set(points || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });

    this.grammarApi.getMostMissedGrammar(5).subscribe({
      next: (data) => {
        this.mostMissed.set(data || []);
      },
      error: () => {}
    });
  }

  selectCategory(catKey: string): void {
    this.selectedCategory.set(catKey);
    this.currentPage.set(1);
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  getCategoryInfo(catKey: string): GrammarCategoryOption {
    const cat = catKey?.toLowerCase();
    return this.categories.find(c => c.key === cat) || {
      key: cat || 'general',
      label: catKey || 'Ngữ pháp',
      icon: 'fa-solid fa-book',
      color: '#6366f1'
    };
  }

  getCategoryCount(catKey: string): number {
    if (catKey === 'all') return this.allPoints().length;
    return this.allPoints().filter(p => p.category?.toLowerCase() === catKey.toLowerCase()).length;
  }

  openCard(point: GrammarPoint): void {
    this.selectedCard.set(point);
    this.showCardModal.set(true);
  }

  closeCardModal(): void {
    this.showCardModal.set(false);
    this.selectedCard.set(null);
  }

  openCreateModal(): void {
    this.editingPoint.set(null);
    this.showEditModal.set(true);
  }

  openEditModal(point: GrammarPoint, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.closeCardModal();
    this.editingPoint.set(point);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingPoint.set(null);
  }

  onPointSaved(): void {
    this.loadData();
  }

  deletePoint(point: GrammarPoint, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!point.id) return;

    this.confirmDialog.confirm({
      title: 'Xóa Điểm Ngữ Pháp',
      message: `Bạn có chắc chắn muốn xóa điểm ngữ pháp "${point.topic}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa ngay',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.grammarApi.deleteGrammarPoint(point.id).subscribe({
          next: () => {
            this.toast.success(`Đã xóa "${point.topic}" thành công!`);
            this.closeCardModal();
            this.loadData();
          },
          error: (err) => {
            this.toast.error(err?.message || 'Không thể xóa điểm ngữ pháp.');
          }
        });
      }
    });
  }

  openSearchModal(): void {
    this.showSearchModal.set(true);
  }

  closeSearchModal(): void {
    this.showSearchModal.set(false);
  }
}
