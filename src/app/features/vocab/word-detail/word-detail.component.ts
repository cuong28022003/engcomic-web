import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardApiService } from '@services/card-api.service';
import { PendingItemApiService } from '@services/pending-item-api.service';
import { Card, WordRelation, CardDetailResponse } from '@models/index';

type RelationTab = 'family' | 'collocation' | 'synonym';

@Component({
  selector: 'app-word-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './word-detail.component.html',
  styleUrls: ['./word-detail.component.scss'],
})
export class WordDetailComponent implements OnInit {
  card = signal<Card | null>(null);
  reverseRelations = signal<Card[]>([]);
  loading = signal(true);
  activeRelTab = signal<RelationTab>('family');
  activeExampleFormality = signal<string>('all');
  addingPending = signal<Set<string>>(new Set());
  addedPending = signal<Set<string>>(new Set());

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cardApi: CardApiService,
    private pendingApi: PendingItemApiService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadCard(id);
  }

  loadCard(id: string) {
    this.loading.set(true);
    this.cardApi.getCardDetail(id).subscribe({
      next: (res: CardDetailResponse) => {
        this.card.set(res.card);
        this.reverseRelations.set(res.reverseRelations ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
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
    const key = rel.text || rel.relatedText || rel.word || '';
    if (!key || this.addedPending().has(key) || this.addingPending().has(key)) return;

    this.addingPending.update(s => { const n = new Set(s); n.add(key); return n; });

    this.pendingApi.create({
      content: key,
      sourceType: rel.type || rel.relationType,
      sourceCardId: this.card()?.id
    }).subscribe({
      next: () => {
        this.addingPending.update(s => { const n = new Set(s); n.delete(key); return n; });
        this.addedPending.update(s => { const n = new Set(s); n.add(key); return n; });
      },
      error: () => {
        this.addingPending.update(s => { const n = new Set(s); n.delete(key); return n; });
      }
    });
  }

  navigateToRelated(cardId: string) {
    this.router.navigate(['/vocab/word', cardId]);
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
