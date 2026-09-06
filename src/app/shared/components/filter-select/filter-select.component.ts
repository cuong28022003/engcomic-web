import {
  Component,
  input,
  model,
  output,
  computed,
  signal,
  inject,
  ElementRef,
  HostListener,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterSelectOption<T = any> {
  value: T;
  label: string;
  count?: number;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-filter-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-select.component.html',
  styleUrls: ['./filter-select.component.scss']
})
export class FilterSelectComponent implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);

  /** Selected value (supports two-way binding [(value)]) */
  readonly value = model<any>('all');

  /** Options array if supplied dynamically */
  readonly options = input<FilterSelectOption[]>([]);

  /** Leading FontAwesome icon class, e.g. 'fa-solid fa-spell-check' */
  readonly icon = input<string>('');

  /** Text prefix preceding the select control, e.g. 'Từ loại:' */
  readonly prefix = input<string>('');

  /** Placeholder label for default empty value */
  readonly placeholder = input<string>('');

  /** Hover title tooltip */
  readonly title = input<string>('');

  /** Disabled state */
  readonly disabled = input<boolean>(false);

  /** Value that represents "no active filter", defaults to 'all' */
  readonly defaultValue = input<any>('all');

  /** Additional custom wrapper class */
  readonly customClass = input<string>('');

  /** Dropdown menu alignment: 'auto' | 'left' | 'right' */
  readonly dropdownAlign = input<'auto' | 'left' | 'right'>('auto');

  /** Emitted when value changes */
  readonly valueChange = output<any>();

  /** Dropdown open state */
  readonly isOpen = signal<boolean>(false);

  /** Whether the dropdown panel should align to the right edge */
  readonly alignRight = signal<boolean>(false);

  /** Parsed options from projected <option> elements */
  readonly projectedOptions = signal<FilterSelectOption[]>([]);

  private mutationObserver?: MutationObserver;

  /** Indicates whether the current filter is actively applied (not default) */
  readonly isActive = computed(() => {
    const v = this.value();
    const d = this.defaultValue();
    return v !== undefined && v !== null && v !== '' && String(v) !== String(d);
  });

  /** Resolved list of all options (explicit input options take precedence over projected) */
  readonly allOptions = computed<FilterSelectOption[]>(() => {
    const explicit = this.options();
    if (explicit && explicit.length > 0) {
      return explicit;
    }
    return this.projectedOptions();
  });

  /** Currently selected option item */
  readonly selectedOption = computed<FilterSelectOption | undefined>(() => {
    const curVal = this.value();
    const curValStr = curVal !== undefined && curVal !== null ? String(curVal) : '';
    return this.allOptions().find(opt => String(opt.value) === curValStr);
  });

  /** Display label shown on the trigger */
  readonly displayLabel = computed<string>(() => {
    const sel = this.selectedOption();
    if (sel) {
      return sel.label;
    }
    if (this.placeholder()) {
      return this.placeholder();
    }
    const defValStr = String(this.defaultValue());
    const curValStr = String(this.value());
    if (curValStr === defValStr && this.allOptions().length > 0) {
      return this.allOptions()[0].label;
    }
    return 'Chọn...';
  });

  /** Display count badge if the selected option has a count */
  readonly displayCount = computed<number | undefined>(() => {
    return this.selectedOption()?.count;
  });

  ngAfterViewInit(): void {
    this.parseProjectedOptions();

    // Observe changes in projected content slot (e.g. async @for loops or count updates)
    const slot = this.el.nativeElement.querySelector('.projected-options-slot');
    if (slot && typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => {
        this.parseProjectedOptions();
      });
      this.mutationObserver.observe(slot, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
  }

  private parseProjectedOptions(): void {
    const slot = this.el.nativeElement.querySelector('.projected-options-slot');
    if (!slot) return;

    const optionEls = slot.querySelectorAll('option');
    if (!optionEls || optionEls.length === 0) return;

    const list: FilterSelectOption[] = Array.from(optionEls).map((opt: any) => {
      const rawText = opt.textContent?.trim() || opt.value || '';
      // Extract count pattern like "Tất cả từ loại (15)" or "Ready (3)"
      const countMatch = rawText.match(/^(.*?)\s*\((\d+)\)$/);
      if (countMatch) {
        return {
          value: opt.value,
          label: countMatch[1].trim(),
          count: parseInt(countMatch[2], 10),
          disabled: opt.disabled
        };
      }
      return {
        value: opt.value,
        label: rawText,
        disabled: opt.disabled
      };
    });

    this.projectedOptions.set(list);
  }

  isSelected(opt: FilterSelectOption): boolean {
    const cur = this.value();
    if (cur === undefined || cur === null) return false;
    return String(opt.value) === String(cur);
  }

  isDefaultSelected(): boolean {
    const cur = this.value();
    const def = this.defaultValue();
    return String(cur) === String(def);
  }

  toggleDropdown(event: MouseEvent): void {
    if (this.disabled()) return;
    event.stopPropagation();
    const nextState = !this.isOpen();
    if (nextState) {
      this.checkAlignment();
    }
    this.isOpen.set(nextState);
  }

  selectOption(opt: FilterSelectOption, event: MouseEvent): void {
    event.stopPropagation();
    if (opt.disabled || this.disabled()) return;
    this.value.set(opt.value);
    this.valueChange.emit(opt.value);
    this.isOpen.set(false);
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.checkAlignment();
        this.isOpen.set(true);
      }
    }
  }

  private checkAlignment(): void {
    if (this.dropdownAlign() === 'right') {
      this.alignRight.set(true);
      return;
    }
    if (this.dropdownAlign() === 'left') {
      this.alignRight.set(false);
      return;
    }
    const rect = this.el.nativeElement.getBoundingClientRect();
    const spaceOnRight = window.innerWidth - rect.left;
    this.alignRight.set(spaceOnRight < 270);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
    }
  }
}
