import {
  Directive,
  EventEmitter,
  HostListener,
  Output,
  Input,
} from '@angular/core';

@Directive({
  selector: '[appScrollEvent]',
  standalone: true,
})
export class ScrollEventDirective {
  @Input() scrollThreshold = 300;
  @Output() scrollPosition = new EventEmitter<number>();
  @Output() isScrolledPast = new EventEmitter<boolean>();
  @Output() reachedBottom = new EventEmitter<void>();

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    this.scrollPosition.emit(scrollY);
    this.isScrolledPast.emit(scrollY > this.scrollThreshold);

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    if (scrollY + windowHeight >= documentHeight - 100) {
      this.reachedBottom.emit();
    }
  }
}
