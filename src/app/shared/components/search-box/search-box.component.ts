import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss']
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
