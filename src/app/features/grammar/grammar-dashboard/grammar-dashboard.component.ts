import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PaginatorComponent } from '@shared/components/paginator/paginator.component';
import { BulkActionsBarComponent } from '@shared/components/bulk-actions-bar/bulk-actions-bar.component';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { GrammarApiService } from '@core/services/grammar-api.service';
import { CardApiService } from '@core/services/card-api.service';
import { PronunciationService } from '@core/services/pronunciation.service';
import { Card } from '@models/index';
import { GrammarCardComponent } from '../components/grammar-card/grammar-card.component';
import { GrammarCardModalComponent } from '../components/grammar-card-modal/grammar-card-modal.component';
import { GrammarSearchModalComponent } from '../components/grammar-search-modal/grammar-search-modal.component';
import { GrammarEditModalComponent } from '../components/grammar-edit-modal/grammar-edit-modal.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { NavSidebarComponent, SidebarItem } from '@shared/components/nav-sidebar/nav-sidebar.component';
import { VocabCardComponent } from '@shared/components/vocab-card/vocab-card.component';
import { GlassPanelComponent } from '@shared/components/glass-panel/glass-panel.component';
import { DataFilterBarComponent } from '@shared/components/data-filter-bar/data-filter-bar.component';
import {
  GrammarPoint,
  MostMissedGrammar,
  GRAMMAR_CATEGORIES,
  GrammarCategoryOption
} from '../models/grammar.model';
import {
  USAGE_CATEGORY_GROUPS,
  PosUsageGroup,
  UsageCategoryItem
} from '../config/usage-categories.config';

@Component({
  selector: 'app-grammar-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingComponent,
    EmptyStateComponent,
    PaginatorComponent,
    BulkActionsBarComponent,
    GrammarCardComponent,
    GrammarCardModalComponent,
    GrammarSearchModalComponent,
    GrammarEditModalComponent,
    PageHeaderComponent,
    NavSidebarComponent,
    VocabCardComponent,
    GlassPanelComponent,
    DataFilterBarComponent
  ],
  templateUrl: './grammar-dashboard.component.html',
  styleUrls: ['./grammar-dashboard.component.scss']
})
export class GrammarDashboardComponent implements OnInit {
  private grammarApi = inject(GrammarApiService);
  private cardApi = inject(CardApiService);
  private pronunciation = inject(PronunciationService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // ── Topbar Tab State ──
  readonly activeTab = signal<'points' | 'functional'>('points');
  readonly pointsViewMode = signal<'grid' | 'list'>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('grammar_points_view_mode') as 'grid' | 'list') || 'grid'
  );
  readonly functionalViewMode = signal<'grid' | 'list'>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('grammar_func_view_mode') as 'grid' | 'list') || 'grid'
  );

  // ── Grammar Points State ──
  readonly categories = GRAMMAR_CATEGORIES;
  readonly selectedCategory = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly allPoints = signal<GrammarPoint[]>([]);
  readonly mostMissed = signal<MostMissedGrammar[]>([]);
  readonly loading = signal<boolean>(false);

  // ── Functional Grammar State ──
  readonly usageGroups: PosUsageGroup[] = USAGE_CATEGORY_GROUPS;
  readonly selectedFuncPos = signal<string>('preposition');
  readonly selectedFuncCatKey = signal<string>('time');
  readonly userCards = signal<Card[]>([]);
  readonly loadingCards = signal<boolean>(false);

  // Pagination Signals
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(12);

  // Selection State
  readonly selectedIds = signal<Set<string>>(new Set<string>());

  // Modals
  readonly selectedCard = signal<GrammarPoint | null>(null);
  readonly showCardModal = signal<boolean>(false);
  readonly showSearchModal = signal<boolean>(false);
  readonly showEditModal = signal<boolean>(false);
  readonly editingPoint = signal<GrammarPoint | null>(null);

  // ── Computed for Sidebar Items & Category Info ──
  getCategoryInfo(catKey?: string): GrammarCategoryOption {
    if (!catKey || catKey === 'all') {
      return { key: 'all', label: 'Tất cả chủ đề', icon: 'fa-solid fa-layer-group', color: '#6366f1' };
    }
    return this.categories.find(c => c.key.toLowerCase() === catKey.toLowerCase()) || {
      key: catKey,
      label: catKey,
      icon: 'fa-solid fa-book',
      color: '#6366f1'
    };
  }

  getCategoryCount(catKey: string): number {
    const all = this.allPoints();
    if (catKey === 'all') return all.length;
    return all.filter(p => p.category?.toLowerCase() === catKey.toLowerCase()).length;
  }

  readonly activeCategoryInfo = computed<GrammarCategoryOption>(() => {
    return this.getCategoryInfo(this.selectedCategory());
  });

  readonly pointsSidebarItems = computed<SidebarItem[]>(() => {
    return this.categories.map(cat => ({
      key: cat.key,
      label: cat.label,
      icon: cat.icon,
      color: cat.color,
      count: this.getCategoryCount(cat.key)
    }));
  });

  readonly activeFunctionalGroup = computed<PosUsageGroup>(() => {
    return this.usageGroups.find(g => g.posKey === this.selectedFuncPos()) || this.usageGroups[0];
  });

  readonly functionalSidebarItems = computed<SidebarItem[]>(() => {
    const grp = this.activeFunctionalGroup();
    return grp.categories.map(cat => ({
      key: cat.key,
      label: cat.labelVi,
      labelSub: cat.labelEn,
      icon: cat.icon,
      color: cat.color
    }));
  });

  readonly activeFunctionalCategory = computed<UsageCategoryItem | undefined>(() => {
    const grp = this.activeFunctionalGroup();
    return grp.categories.find(c => c.key === this.selectedFuncCatKey()) || grp.categories[0];
  });

  readonly matchedCards = computed<Card[]>(() => {
    const item = this.activeFunctionalCategory();
    if (!item) return [];
    const all = this.userCards();
    return all.filter(c => c.usages && c.usages.some(u => u.category === item.key));
  });

  // Computed for Points Filter & Pagination
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

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly isAllPointsSelected = computed(() => {
    const points = this.filteredPoints();
    if (points.length === 0) return false;
    const ids = this.selectedIds();
    return points.every(p => p.id && ids.has(p.id));
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      const cat = params.get('cat');
      const funcPos = params.get('pos');
      const funcCat = params.get('func');

      if (tab === 'functional') {
        this.activeTab.set('functional');
        if (funcPos) this.selectedFuncPos.set(funcPos);
        if (funcCat) this.selectedFuncCatKey.set(funcCat);
      } else {
        this.activeTab.set('points');
        if (cat) this.selectedCategory.set(cat);
      }
    });

    this.loadData();
    this.loadUserCards();
  }

  setTab(tab: 'points' | 'functional'): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
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

  loadUserCards(): void {
    this.loadingCards.set(true);
    this.cardApi.getDashboard({ page: 0, size: 1000 }).subscribe({
      next: (res) => {
        const list = res.cards?.content ?? (Array.isArray(res.cards) ? res.cards : []);
        this.userCards.set(list);
        this.loadingCards.set(false);
      },
      error: () => {
        this.userCards.set([]);
        this.loadingCards.set(false);
      }
    });
  }

  // ── Tab 1 Category Selection ──────────────────────────────────────
  onPointsCategorySelected(item: SidebarItem): void {
    this.selectedCategory.set(item.key);
    this.currentPage.set(1);
    this.clearAllSelection();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: 'points', cat: item.key === 'all' ? null : item.key },
      queryParamsHandling: 'merge'
    });
  }

  // ── Tab 2 POS & Category Selection ─────────────────────────────────
  selectFuncPos(posKey: string): void {
    this.selectedFuncPos.set(posKey);
    const grp = this.usageGroups.find(g => g.posKey === posKey);
    if (grp && grp.categories.length > 0) {
      this.selectedFuncCatKey.set(grp.categories[0].key);
    }
  }

  onFunctionalCategorySelected(item: SidebarItem): void {
    this.selectedFuncCatKey.set(item.key);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: 'functional', pos: this.selectedFuncPos(), func: item.key },
      queryParamsHandling: 'merge'
    });
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  playAudio(word?: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (word && word.trim()) {
      this.pronunciation.speak(word.trim(), 'us');
    }
  }

  onVocabCardClick(card: Card): void {
    if (card.id) {
      this.goToWordDetail(card.id);
    }
  }

  setPointsViewMode(mode: 'grid' | 'list'): void {
    this.pointsViewMode.set(mode);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('grammar_points_view_mode', mode);
      }
    } catch {}
  }

  setFunctionalViewMode(mode: 'grid' | 'list'): void {
    this.functionalViewMode.set(mode);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('grammar_func_view_mode', mode);
      }
    } catch {}
  }

  goToWordDetail(cardId?: string): void {
    if (!cardId) return;
    this.router.navigate(['/vocab/word', cardId]);
  }

  // ── Selection Methods ──────────────────────────────────────────────
  isSelected(id?: string): boolean {
    return !!id && this.selectedIds().has(id);
  }

  toggleSelection(id?: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!id) return;

    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleSelectAll(): void {
    if (this.isAllPointsSelected()) {
      this.clearAllSelection();
    } else {
      this.selectAllPoints();
    }
  }

  selectAllPoints(): void {
    const all = this.filteredPoints();
    const ids = new Set<string>();
    all.forEach(p => {
      if (p.id) ids.add(p.id);
    });
    this.selectedIds.set(ids);
  }

  clearAllSelection(): void {
    this.selectedIds.set(new Set<string>());
  }

  onPointSelectChange(event: { id: string; selected: boolean }): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (event.selected) {
        next.add(event.id);
      } else {
        next.delete(event.id);
      }
      return next;
    });
  }

  // ── Actions from Bulk Actions Bar ──────────────────────────────────
  editSelectedPoint(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length !== 1) return;

    const point = this.allPoints().find(p => p.id === ids[0]);
    if (point) {
      this.openEditModal(point);
    }
  }

  deleteSelectedPoints(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    const count = ids.length;
    const msg = count === 1
      ? `Bạn có chắc chắn muốn xóa điểm ngữ pháp đã chọn? Hành động này không thể hoàn tác.`
      : `Bạn có chắc chắn muốn xóa toàn bộ ${count} điểm ngữ pháp đã chọn? Hành động này không thể hoàn tác.`;

    this.confirmDialog.confirm({
      title: `Xóa ${count} Điểm Ngữ Pháp`,
      message: msg,
      confirmText: 'Xóa ngay',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    }).subscribe((confirmed) => {
      if (confirmed) {
        const deleteObservables = ids.map(id => this.grammarApi.deleteGrammarPoint(id));
        forkJoin(deleteObservables).subscribe({
          next: () => {
            this.toast.success(`Đã xóa thành công ${count} điểm ngữ pháp!`);
            this.clearAllSelection();
            this.loadData();
          },
          error: () => {
            this.toast.error('Có lỗi xảy ra trong quá trình xóa dữ liệu.');
            this.loadData();
          }
        });
      }
    });
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
    this.clearAllSelection();
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
            this.clearAllSelection();
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
