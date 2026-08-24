import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '@core/services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Impure to trigger re-evaluation when language signal changes
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';
    // Reading the signal automatically tracks dependency
    this.translationService.currentLang();
    return this.translationService.t(key, params);
  }
}
