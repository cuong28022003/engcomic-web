import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardApiService } from '@services/card-api.service';
import { DeckApiService } from '@services/deck-api.service';
import { BatchImportResult, Deck } from '@models/index';

type ImportStep = 'prompt' | 'paste' | 'preview' | 'result';

interface PreviewCard {
  word: string;
  ipa?: string;
  partOfSpeech?: string;
  meaningVi: string;
  definitionEn?: string;
  examplesCount: number;
  relationsCount: number;
  valid: boolean;
  error?: string;
}

@Component({
  selector: 'app-vocab-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vocab-import.component.html',
  styleUrls: ['./vocab-import.component.scss'],
})
export class VocabImportComponent {
  step = signal<ImportStep>('paste');
  jsonInput = '';
  previewCards = signal<PreviewCard[]>([]);
  parseError = signal('');
  importing = signal(false);
  importResult = signal<BatchImportResult | null>(null);
  decks = signal<Deck[]>([]);
  selectedDeckId = '';

  readonly PROMPT_TEMPLATE = `Với mỗi mục trong danh sách sau: [THÊM TỪ VÀO ĐÂY]
Trả về JSON array, mỗi phần tử theo schema:
{ "word": "", "ipa": "", "part_of_speech": "", "meaning_vi": "", "definition_en": "",
  "usage_note": null, "topic": "",
  "examples": [{"text": "", "formality": "formal|informal|written"}],
  "relations": [{"text": "", "type": "family|collocation|synonym", "pos": ""}] }
Nếu mục là cụm từ, ipa và part_of_speech có thể null.
Chỉ trả JSON thuần, không markdown, không giải thích thêm.`;

  constructor(
    private cardApi: CardApiService,
    private deckApi: DeckApiService,
    private router: Router
  ) {
    this.loadDecks();
  }

  loadDecks() {
    // Decks require userId — skip for now, deck selection is optional
    this.decks.set([]);
  }

  copyPrompt() {
    navigator.clipboard.writeText(this.PROMPT_TEMPLATE);
  }

  parseJson() {
    this.parseError.set('');
    if (!this.jsonInput.trim()) {
      this.parseError.set('Vui lòng dán JSON vào ô trên.');
      return;
    }

    try {
      let cleaned = this.jsonInput.trim();
      // Strip markdown code blocks if present
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) throw new Error('JSON phải là array');

      const cards: PreviewCard[] = parsed.map((entry: any) => {
        const missing = [];
        if (!entry.word) missing.push('word');
        if (!entry.meaning_vi) missing.push('meaning_vi');
        return {
          word: entry.word ?? '?',
          ipa: entry.ipa,
          partOfSpeech: entry.part_of_speech,
          meaningVi: entry.meaning_vi ?? '',
          definitionEn: entry.definition_en,
          examplesCount: Array.isArray(entry.examples) ? entry.examples.length : 0,
          relationsCount: Array.isArray(entry.relations) ? entry.relations.length : 0,
          valid: missing.length === 0,
          error: missing.length > 0 ? `Thiếu: ${missing.join(', ')}` : undefined,
        };
      });

      this.previewCards.set(cards);
      this.step.set('preview');
    } catch (e: any) {
      this.parseError.set(`Lỗi parse JSON: ${e.message}`);
    }
  }

  get validCount(): number {
    return this.previewCards().filter(c => c.valid).length;
  }

  doImport() {
    if (this.validCount === 0 || this.importing()) return;
    this.importing.set(true);

    this.cardApi.batchImport({
      jsonContent: this.jsonInput,
      deckId: this.selectedDeckId || undefined,
    }).subscribe({
      next: (res) => {
        this.importResult.set(res);
        this.importing.set(false);
        this.step.set('result');
      },
      error: () => {
        this.importing.set(false);
      }
    });
  }

  reset() {
    this.jsonInput = '';
    this.previewCards.set([]);
    this.parseError.set('');
    this.importResult.set(null);
    this.step.set('paste');
  }

  goToDashboard() {
    this.router.navigate(['/vocab']);
  }
}
