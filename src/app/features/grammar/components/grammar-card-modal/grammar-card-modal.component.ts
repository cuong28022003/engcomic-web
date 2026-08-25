import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { GrammarPoint, GRAMMAR_CATEGORIES } from '../../models/grammar.model';

export interface ParsedStructureCase {
  type: 'positive' | 'negative' | 'question' | 'general';
  label: string;
  badgeClass: string;
  icon: string;
  formula: string;
}

@Component({
  selector: 'app-grammar-card-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './grammar-card-modal.component.html',
  styleUrls: ['./grammar-card-modal.component.scss']
})
export class GrammarCardModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly grammarPoint = input<GrammarPoint | null>(null);

  readonly close = output<void>();
  readonly edit = output<GrammarPoint>();
  readonly delete = output<GrammarPoint>();

  readonly categoryInfo = computed(() => {
    const cat = this.grammarPoint()?.category?.toLowerCase();
    return GRAMMAR_CATEGORIES.find(c => c.key === cat) || {
      key: cat || 'general',
      label: this.grammarPoint()?.category || 'Ngữ pháp',
      icon: 'fa-solid fa-book',
      color: '#6366f1'
    };
  });

  /** Phân tích trường structure thành từng dạng công thức riêng biệt trực quan */
  readonly parsedStructures = computed<ParsedStructureCase[]>(() => {
    const raw = this.grammarPoint()?.structure?.trim() || '';
    if (!raw) return [];

    // Split by newlines or pipe delimiter |
    const segments = raw.split(/\r?\n| \| /).map(s => s.trim()).filter(s => s.length > 0);

    return segments.map(seg => {
      if (seg.startsWith('(+)') || seg.toLowerCase().includes('khẳng định')) {
        return {
          type: 'positive',
          label: 'Khẳng định (+)',
          badgeClass: 'badge-pos',
          icon: 'fa-solid fa-plus',
          formula: seg.replace(/^\(\+\)\s*/, '').replace(/^[Kk]hẳng định:?\s*/, '')
        };
      } else if (seg.startsWith('(-)') || seg.toLowerCase().includes('phủ định')) {
        return {
          type: 'negative',
          label: 'Phủ định (-)',
          badgeClass: 'badge-neg',
          icon: 'fa-solid fa-minus',
          formula: seg.replace(/^\(-\)\s*/, '').replace(/^[Pp]hủ định:?\s*/, '')
        };
      } else if (seg.startsWith('(?)') || seg.toLowerCase().includes('nghi vấn') || seg.toLowerCase().includes('câu hỏi')) {
        return {
          type: 'question',
          label: 'Nghi vấn (?)',
          badgeClass: 'badge-que',
          icon: 'fa-solid fa-question',
          formula: seg.replace(/^\(\?\)\s*/, '').replace(/^[Nn]ghi vấn:?\s*/, '').replace(/^[Cc]âu hỏi:?\s*/, '')
        };
      } else {
        return {
          type: 'general',
          label: 'Cấu trúc',
          badgeClass: 'badge-gen',
          icon: 'fa-solid fa-code',
          formula: seg
        };
      }
    });
  });

  onClose(): void {
    this.close.emit();
  }

  onEdit(): void {
    const p = this.grammarPoint();
    if (p) this.edit.emit(p);
  }

  onDelete(): void {
    const p = this.grammarPoint();
    if (p) this.delete.emit(p);
  }
}
