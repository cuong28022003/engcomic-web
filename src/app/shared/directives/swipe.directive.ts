import {
  Directive,
  EventEmitter,
  HostListener,
  Output,
  Input,
} from '@angular/core';

@Directive({
  selector: '[appSwipe]',
  standalone: true,
})
export class SwipeDirective {
  @Input() swipeThreshold = 50;

  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();
  @Output() swipeUp = new EventEmitter<void>();
  @Output() swipeDown = new EventEmitter<void>();

  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.touchStartX = touch.screenX;
    this.touchStartY = touch.screenY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.touchEndX = touch.screenX;
    this.touchEndY = touch.screenY;
    this.handleSwipe();
  }

  private handleSwipe(): void {
    const diffX = this.touchEndX - this.touchStartX;
    const diffY = this.touchEndY - this.touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > this.swipeThreshold) {
        if (diffX < 0) {
          this.swipeLeft.emit();
        } else {
          this.swipeRight.emit();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) > this.swipeThreshold) {
        if (diffY < 0) {
          this.swipeUp.emit();
        } else {
          this.swipeDown.emit();
        }
      }
    }
  }
}
