import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-search-box" [class.focused]="isFocused">
      <i class="fa-solid fa-magnifying-glass search-icon"></i>
      <input
        type="text"
        [placeholder]="placeholder"
        [(ngModel)]="value"
        (ngModelChange)="onInputChange($event)"
        (focus)="isFocused = true"
        (blur)="isFocused = false"
        (keyup.enter)="onEnter()"
      />
      <button
        *ngIf="value"
        class="clear-btn"
        (click)="clear()"
        type="button"
        title="Xóa tìm kiếm"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `,
  styles: [`
    .app-search-box {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      padding: 2px 14px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &.focused {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(255, 51, 119, 0.15);
        background: var(--bg-card-hover);
      }

      .search-icon {
        color: var(--text-muted);
        font-size: 0.88rem;
        margin-right: 10px;
      }

      input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: var(--text-main);
        font-size: 0.9rem;
        padding: 8px 0;

        &::placeholder {
          color: var(--text-dim);
        }
      }

      .clear-btn {
        background: transparent;
        border: none;
        color: var(--text-dim);
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.82rem;
        transition: color 0.15s;

        &:hover {
          color: var(--primary-color);
        }
      }
    }
  `]
})
export class SearchBoxComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Tìm kiếm...';
  @Input() debounce = 300;
  @Input() value = '';

  @Output() searchChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();

  isFocused = false;
  private inputSubject = new Subject<string>();
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.inputSubject.pipe(
      debounceTime(this.debounce),
      distinctUntilChanged()
    ).subscribe((text) => {
      this.searchChange.emit(text.trim());
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onInputChange(val: string): void {
    this.inputSubject.next(val);
  }

  onEnter(): void {
    this.searchSubmit.emit(this.value.trim());
  }

  clear(): void {
    this.value = '';
    this.searchChange.emit('');
    this.searchSubmit.emit('');
  }
}
