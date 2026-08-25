import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CardApiService } from '@services/card-api.service';
import { PendingItemApiService } from '@services/pending-item-api.service';
import { PendingCountService } from '@services/pending-count.service';
import { PronunciationService } from '@core/services/pronunciation.service';
import { Card, WordRelation, CardDetailResponse } from '@models/index';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { computed } from '@angular/core';

type RelationTab = 'family' | 'collocation' | 'synonym';

@Component({
  selector: 'app-word-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './word-detail.component.html',
  styleUrls: ['./word-detail.component.scss'],
})
export class WordDetailComponent implements OnInit, OnDestroy {
  card = signal<Card | null>(null);
  reverseRelations = signal<Card[]>([]);
  loading = signal(true);
  activeRelTab = signal<RelationTab>('family');
  activeExampleFormality = signal<string>('all');
  addingPending = signal<Set<string>>(new Set());

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Kho Từ Vựng', url: '/vocab', icon: 'fa-solid fa-book-bookmark' },
    { label: this.card()?.word || 'Chi Tiết Từ' }
  ]);

  // Pronunciation & Accents
  playingAccent = signal<'us' | 'uk' | null>(null);

  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cardApi: CardApiService,
    private pendingApi: PendingItemApiService,
    public pendingCountService: PendingCountService,
    private pronunciationService: PronunciationService
  ) {}

  ngOnInit() {
    this.pendingCountService.refresh();

    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadCard(id);
      }
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  loadCard(id: string) {
    this.loading.set(true);
    this.cardApi.getCardDetail(id).subscribe({
      next: (res: CardDetailResponse) => {
        const c = res?.card;
        this.card.set(c);
        this.reverseRelations.set(res?.reverseRelations ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  async playAccent(accent: 'us' | 'uk') {
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

  get usIpa(): string {
    return this.card()?.ipa || '';
  }

  get ukIpa(): string {
    return this.card()?.ipa || '';
  }

  get familyRelations(): WordRelation[] {
    return this.card()?.relations?.filter(r => (r.type || r.relationType) === 'family') ?? [];
  }

  get collocationRelations(): WordRelation[] {
    return this.card()?.relations?.filter(r => (r.type || r.relationType) === 'collocation') ?? [];
  }

  get synonymRelations(): WordRelation[] {
    return this.card()?.relations?.filter(r => (r.type || r.relationType) === 'synonym') ?? [];
  }

  get filteredExamples() {
    const examples = this.card()?.examples ?? [];
    const f = this.activeExampleFormality();
    if (f === 'all') return examples;
    return examples.filter(e => e.formality === f);
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
      noun: 'n', verb: 'v', adjective: 'adj', adverb: 'adv'
    };
    return pos ? (map[pos] ?? pos) : '';
  }

  getFormalityLabel(f?: string): string {
    const map: Record<string, string> = {
      formal: 'Trang trọng', informal: 'Thông thường', written: 'Văn viết'
    };
    return f ? (map[f] ?? f) : '';
  }

  getFormalityClass(f?: string): string {
    return f ? `formality-${f}` : '';
  }

  addToPending(rel: WordRelation) {
    const key = this.getRelationWord(rel);
    if (!key || this.isWordInCollector(rel) || this.addingPending().has(key)) return;

    this.addingPending.update(s => { const n = new Set(s); n.add(key); return n; });

    this.pendingApi.create({
      content: key,
      sourceType: rel.type || rel.relationType,
      sourceCardId: this.card()?.id
    }).subscribe({
      next: () => {
        this.addingPending.update(s => { const n = new Set(s); n.delete(key); return n; });
        this.pendingCountService.addPendingWord(key);
      },
      error: () => {
        this.addingPending.update(s => { const n = new Set(s); n.delete(key); return n; });
      }
    });
  }

  navigateToRelated(cardId?: string) {
    if (!cardId) return;
    this.router.navigate(['/vocab/word', cardId]);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  filterByTopic(topic?: string) {
    if (!topic) return;
    this.router.navigate(['/vocab'], { queryParams: { topic } });
  }

  startPractice() {
    this.router.navigate(['/vocab/practice']);
  }

  goBack() {
    this.router.navigate(['/vocab']);
  }

  getStageLabel(stage?: number): string {
    const labels = ['Mới', 'Nhận biết', 'Gợi nhớ', 'Phát âm', 'Điền từ', 'Thành thạo'];
    return labels[stage ?? 0] ?? 'Mới';
  }
}
