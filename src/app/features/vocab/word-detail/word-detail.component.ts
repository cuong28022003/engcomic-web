import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CardApiService } from '@services/card-api.service';
import { PendingItemApiService } from '@services/pending-item-api.service';
import { PendingCountService } from '@services/pending-count.service';
import { PronunciationService } from '@core/services/pronunciation.service';
import { Card, WordRelation, CardDetailResponse, WordUsage } from '@models/index';
import { ToastService } from '@core/services/toast.service';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { GlassPanelComponent } from '@shared/components/glass-panel/glass-panel.component';
import { USAGE_CATEGORY_GROUPS } from '../config/usage-categories.config';

export interface UsageCategoryMeta {
  key: string;
  label: string;
  icon: string;
  color: string;
  count: number;
}

type RelationTab = 'family' | 'collocation' | 'synonym';

@Component({
  selector: 'app-word-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent, LoadingComponent, GlassPanelComponent],
  templateUrl: './word-detail.component.html',
  styleUrls: ['./word-detail.component.scss'],
})
export class WordDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardApi = inject(CardApiService);
  private pendingApi = inject(PendingItemApiService);
  public pendingCountService = inject(PendingCountService);
  private pronunciationService = inject(PronunciationService);
  private toast = inject(ToastService);

  readonly card = signal<Card | null>(null);
  readonly reverseRelations = signal<Card[]>([]);
  readonly loading = signal<boolean>(true);
  readonly activeRelTab = signal<RelationTab>('family');
  readonly addingPending = signal<Set<string>>(new Set());
  readonly playingExampleText = signal<string | null>(null);
  readonly playingAccent = signal<'us' | 'uk' | null>(null);

  // Horizontal Usage Category Switcher State
  readonly selectedUsageCategory = signal<string>('all');

  readonly breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Kho Từ Vựng', url: '/vocab', icon: 'fa-solid fa-book-bookmark' },
    { label: this.card()?.word || this.card()?.front || 'Chi Tiết Từ' }
  ]);

  readonly usageCategories = computed<UsageCategoryMeta[]>(() => {
    const usages = this.card()?.usages || [];
    if (usages.length === 0) return [];

    const map = new Map<string, UsageCategoryMeta>();

    usages.forEach((u) => {
      const catKey = u.category || 'other';
      if (!map.has(catKey)) {
        const meta = this.getCategoryMeta(catKey) || {
          label: catKey === 'other' ? 'Khác' : catKey,
          icon: 'fa-solid fa-tag',
          color: '#6366f1',
        };
        map.set(catKey, {
          key: catKey,
          label: meta.label,
          icon: meta.icon,
          color: meta.color,
          count: 1,
        });
      } else {
        map.get(catKey)!.count += 1;
      }
    });

    return Array.from(map.values());
  });

  readonly activeUsages = computed<WordUsage[]>(() => {
    const usages = this.card()?.usages || [];
    const selected = this.selectedUsageCategory();
    if (selected === 'all') return usages;
    return usages.filter((u) => (u.category || 'other') === selected);
  });

  private routeSub?: Subscription;

  ngOnInit(): void {
    this.pendingCountService.refresh();

    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadCard(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadCard(id: string): void {
    this.loading.set(true);
    this.cardApi.getCardDetail(id).subscribe({
      next: (res: CardDetailResponse) => {
        const c = res?.card;
        this.card.set(c);
        this.reverseRelations.set(res?.reverseRelations ?? []);
        this.selectedUsageCategory.set('all');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectUsageCategory(key: string): void {
    this.selectedUsageCategory.set(key);
  }

  async playAccent(accent: 'us' | 'uk'): Promise<void> {
    const c = this.card();
    const word = c?.word || c?.front;
    if (!word) return;

    this.playingAccent.set(accent);
    try {
      await this.pronunciationService.speak(word, accent);
    } finally {
      this.playingAccent.set(null);
    }
  }

  async playExampleAudio(text?: string, event?: MouseEvent): Promise<void> {
    if (event) event.stopPropagation();
    if (!text || !text.trim()) return;
    const clean = text.trim();
    this.playingExampleText.set(clean);
    try {
      await this.pronunciationService.speak(clean, 'us');
    } finally {
      this.playingExampleText.set(null);
    }
  }

  copyWord(): void {
    const word = this.card()?.word || this.card()?.front;
    if (!word) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(word).then(() => {
        this.toast.success(`Đã sao chép từ: "${word}"`);
      });
    }
  }

  copyStructure(structure?: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!structure) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(structure).then(() => {
        this.toast.info(`Đã sao chép cấu trúc: "${structure}"`);
      });
    }
  }

  getCategoryMeta(catKey?: string): { label: string; icon: string; color: string } | null {
    if (!catKey) return null;
    for (const grp of USAGE_CATEGORY_GROUPS) {
      const item = grp.categories.find((c) => c.key === catKey);
      if (item) {
        return { label: item.labelVi, icon: item.icon, color: item.color };
      }
    }
    return { label: catKey, icon: 'fa-solid fa-tag', color: '#6366f1' };
  }

  get usIpa(): string {
    return this.card()?.ipa || '';
  }

  get ukIpa(): string {
    return this.card()?.ipa || '';
  }

  get familyRelations(): WordRelation[] {
    return this.card()?.relations?.filter((r) => (r.type || r.relationType) === 'family') ?? [];
  }

  get collocationRelations(): WordRelation[] {
    return this.card()?.relations?.filter((r) => (r.type || r.relationType) === 'collocation') ?? [];
  }

  get synonymRelations(): WordRelation[] {
    return this.card()?.relations?.filter((r) => (r.type || r.relationType) === 'synonym') ?? [];
  }

  getRelationWord(rel: WordRelation): string {
    return (rel.text || rel.relatedText || rel.word || '').trim();
  }

  isWordInCollector(rel: WordRelation): boolean {
    const word = this.getRelationWord(rel);
    return this.pendingCountService.isWordPending(word);
  }

  getPosLabel(pos?: string): string {
    const map: Record<string, string> = {
      noun: 'n',
      verb: 'v',
      adjective: 'adj',
      adverb: 'adv',
      preposition: 'prep',
      conjunction: 'conj',
      idiom: 'idiom',
      phrasal_verb: 'phr v',
    };
    return pos ? (map[pos.toLowerCase()] ?? pos) : '';
  }

  getPosFullLabel(pos?: string): string {
    const map: Record<string, string> = {
      noun: 'Danh từ (n)',
      verb: 'Động từ (v)',
      adjective: 'Tính từ (adj)',
      adverb: 'Trạng từ (adv)',
      preposition: 'Giới từ (prep)',
      conjunction: 'Liên từ (conj)',
      phrase: 'Cụm từ',
      idiom: 'Thành ngữ (idiom)',
    };
    return pos ? (map[pos.toLowerCase()] ?? pos) : 'Từ vựng';
  }

  getPosClass(pos?: string): string {
    const p = (pos || '').toLowerCase();
    if (p.includes('noun') || p === 'n') return 'pos-noun';
    if (p.includes('verb') || p === 'v') return 'pos-verb';
    if (p.includes('adj') || p === 'a') return 'pos-adj';
    if (p.includes('adv')) return 'pos-adv';
    return 'pos-other';
  }

  getStatusClass(status?: string): string {
    const map: Record<string, string> = {
      new: 'status-new',
      learning: 'status-learning',
      mature: 'status-mature',
      leech: 'status-leech',
      review: 'status-review',
    };
    return map[status ?? 'new'] ?? 'status-new';
  }

  getStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      new: 'Mới nạp',
      learning: 'Đang học',
      mature: 'Thành thạo',
      leech: 'Cần chú ý (Leech)',
      review: 'Cần ôn tập',
    };
    return map[status ?? 'new'] ?? 'Mới';
  }

  getStageLabel(stage?: number): string {
    const labels = ['Mới nạp', 'Nhận biết', 'Gợi nhớ', 'Phát âm', 'Điền từ', 'Thành thạo'];
    return labels[stage ?? 0] ?? 'Mới';
  }

  formatNextReview(nextReview?: string | Date, status?: string): string {
    if (status === 'new' || !nextReview) return 'Chưa có lịch';
    const d = new Date(nextReview);
    if (isNaN(d.getTime())) return 'Chưa có lịch';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = Math.round((startOfTarget - startOfToday) / 86400000);

    if (diffDays < 0) return 'Đã quá hạn';
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Ngày mai';
    return `${diffDays} ngày tới`;
  }

  isOverdue(nextReview?: string | Date, status?: string): boolean {
    if (status === 'new' || !nextReview) return false;
    const d = new Date(nextReview);
    if (isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
  }

  getFormalityLabel(f?: string): string {
    const map: Record<string, string> = {
      formal: 'Trang trọng',
      informal: 'Thông thường',
      written: 'Văn viết',
    };
    return f ? (map[f] ?? f) : '';
  }

  getFormalityClass(f?: string): string {
    return f ? `formality-${f}` : '';
  }

  addToPending(rel: WordRelation): void {
    const key = this.getRelationWord(rel);
    if (!key || this.isWordInCollector(rel) || this.addingPending().has(key)) return;

    this.addingPending.update((s) => {
      const n = new Set(s);
      n.add(key);
      return n;
    });

    this.pendingApi
      .create({
        content: key,
        sourceType: rel.type || rel.relationType,
        sourceCardId: this.card()?.id,
      })
      .subscribe({
        next: () => {
          this.addingPending.update((s) => {
            const n = new Set(s);
            n.delete(key);
            return n;
          });
          this.pendingCountService.addPendingWord(key);
          this.toast.success(`Đã thêm "${key}" vào Word Collector!`);
        },
        error: () => {
          this.addingPending.update((s) => {
            const n = new Set(s);
            n.delete(key);
            return n;
          });
          this.toast.error(`Không thể thêm "${key}".`);
        },
      });
  }

  navigateToRelated(cardId?: string): void {
    if (!cardId) return;
    this.router.navigate(['/vocab/word', cardId]);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  filterByTopic(topic?: string): void {
    if (!topic) return;
    this.router.navigate(['/vocab'], { queryParams: { topic } });
  }

  readonly togglingFavorite = signal<boolean>(false);

  toggleFavorite(): void {
    const c = this.card();
    if (!c?.id || this.togglingFavorite()) return;

    this.togglingFavorite.set(true);
    const newStatus = !(c.isFavorite || c.favorite);

    // Optimistic update
    this.card.update((curr) => curr ? { ...curr, favorite: newStatus, isFavorite: newStatus } : null);

    this.cardApi.toggleFavorite(c.id).subscribe({
      next: (updated) => {
        this.togglingFavorite.set(false);
        const isFav = updated?.isFavorite ?? updated?.favorite ?? newStatus;
        this.card.update((curr) => curr ? { ...curr, favorite: isFav, isFavorite: isFav } : null);
        if (isFav) {
          this.toast.success(`Đã lưu "${c.word || c.front}" vào danh sách yêu thích! ⭐`);
        } else {
          this.toast.info(`Đã bỏ lưu "${c.word || c.front}" khỏi danh sách yêu thích.`);
        }
      },
      error: () => {
        this.togglingFavorite.set(false);
        // Revert on error
        this.card.update((curr) => curr ? { ...curr, favorite: !newStatus, isFavorite: !newStatus } : null);
        this.toast.error('Không thể cập nhật trạng thái lưu từ.');
      }
    });
  }

  startPractice(): void {
    this.router.navigate(['/vocab/practice']);
  }

  goBack(): void {
    this.router.navigate(['/vocab']);
  }
}
