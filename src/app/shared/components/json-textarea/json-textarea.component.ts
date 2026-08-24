import { Component, input, model, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-json-textarea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './json-textarea.component.html',
  styleUrls: ['./json-textarea.component.scss']
})
export class JsonTextareaComponent {
  readonly label = input<string>('Dán kết quả JSON từ AI vào đây:');
  readonly placeholder = input<string>('[ { ... } ]');
  readonly rows = input<number>(9);
  readonly errorMessage = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(true);

  readonly value = model<string>('');

  lineCount = computed<number>(() => {
    const text = this.value();
    if (!text) return 0;
    return text.split('\n').length;
  });

  onInputChange(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.value.set(val);
  }

  async pasteFromClipboard(): Promise<void> {
    if (this.disabled()) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Auto strip markdown code fences if present
        let cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        this.value.set(cleaned);
      }
    } catch {
      // Clipboard permissions or not supported
    }
  }

  clearContent(): void {
    if (this.disabled()) return;
    this.value.set('');
  }

  formatJson(): void {
    if (this.disabled()) return;
    const raw = this.value().trim();
    if (!raw) return;

    try {
      let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      this.value.set(JSON.stringify(parsed, null, 2));
    } catch {
      // Leave as is if invalid JSON
    }
  }
}
