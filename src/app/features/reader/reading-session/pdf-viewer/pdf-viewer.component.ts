import { Component, ElementRef, HostListener, Input, OnInit, OnChanges, SimpleChanges, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { WordLookupPopupComponent } from './word-lookup-popup/word-lookup-popup.component';
import { environment } from '@env/environment';

// Configure assets folder for worker and viewer scripts
pdfDefaultOptions.assetsFolder = 'assets';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule, WordLookupPopupComponent],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent implements OnInit, OnChanges {
  @Input() pdfUrl: string | null | undefined = '';
  @Input() testId: string | null | undefined = '';

  @ViewChild('pdfContainer') pdfContainerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('viewerCanvasArea') canvasAreaRef?: ElementRef<HTMLDivElement>;

  // Preset zoom levels in percentage: 60%, 75%, 90%, 100%, 115%, 130%, 150%, 175%, 200%
  readonly zoomLevels = [60, 75, 90, 100, 115, 130, 150, 175, 200];
  readonly zoomPercent = signal<number>(100);
  readonly zoom = signal<string | number>('page-width');

  readonly isLoaded = signal<boolean>(false);
  readonly hasLoadError = signal<boolean>(false);
  readonly loadErrorMessage = signal<string>('');

  readonly selectedText = signal<string>('');
  readonly popupPosition = signal<{ top: number; left: number; placement?: 'top' | 'bottom' } | null>(null);

  readonly currentPage = signal<number>(1);

  get storageKey(): string {
    if (this.testId && this.testId.trim().length > 0) {
      return `toeic_pdf_page_${this.testId.trim()}`;
    }
    if (this.pdfUrl && this.pdfUrl.trim().length > 0) {
      return `toeic_pdf_page_url_${encodeURIComponent(this.pdfUrl.trim().slice(-40))}`;
    }
    return 'toeic_pdf_last_page';
  }

  ngOnInit(): void {
    pdfDefaultOptions.assetsFolder = 'assets';
    this.restoreSavedPage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['testId'] || changes['pdfUrl']) {
      this.restoreSavedPage();
    }
  }

  private restoreSavedPage(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const pageNum = parseInt(saved, 10);
        if (!isNaN(pageNum) && pageNum >= 1) {
          this.currentPage.set(pageNum);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  get resolvedPdfUrl(): string {
    if (!this.pdfUrl) return '';
    let url = this.pdfUrl.trim();

    if (url.startsWith('blob:')) {
      return url;
    }

    // Convert legacy /image/upload/ to /raw/upload/
    if (url.includes('res.cloudinary.com') && url.includes('/image/upload/') && url.toLowerCase().endsWith('.pdf')) {
      url = url.replace('/image/upload/', '/raw/upload/');
    }

    // Route Cloudinary URLs through backend proxy to avoid browser Tracking Prevention & 401
    if (url.includes('res.cloudinary.com')) {
      return `${environment.apiUrl}/toeic/tests/proxy-pdf?url=${encodeURIComponent(url)}`;
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Relative backend path like /api/toeic/tests/file/...
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  onPdfLoaded(): void {
    this.isLoaded.set(true);
    this.hasLoadError.set(false);

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const pageNum = parseInt(saved, 10);
        if (!isNaN(pageNum) && pageNum >= 1) {
          this.currentPage.set(pageNum);
          setTimeout(() => {
            this.currentPage.set(pageNum);
          }, 150);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  onPageChange(page: number | undefined | null): void {
    if (page && page >= 1) {
      this.currentPage.set(page);
      try {
        localStorage.setItem(this.storageKey, String(page));
      } catch {
        // Ignore localStorage quota errors
      }
    }
  }

  onPdfLoadingFailed(error: any): void {
    console.error('PDF Loading failed:', error);
    this.hasLoadError.set(true);
    this.loadErrorMessage.set(typeof error === 'string' ? error : (error?.message || 'Không thể tải file PDF.'));
  }

  zoomIn(): void {
    const current = typeof this.zoom() === 'number' ? (this.zoom() as number) : this.zoomPercent();
    const next = this.zoomLevels.find(z => z > current) || Math.min(250, current + 15);
    this.zoom.set(next);
    this.zoomPercent.set(next);
  }

  zoomOut(): void {
    const current = typeof this.zoom() === 'number' ? (this.zoom() as number) : this.zoomPercent();
    const prev = [...this.zoomLevels].reverse().find(z => z < current) || Math.max(50, current - 15);
    this.zoom.set(prev);
    this.zoomPercent.set(prev);
  }

  fitPageWidth(): void {
    this.zoom.set('page-width');
    this.zoomPercent.set(100);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.popupPosition()) return;

    const target = event.target as HTMLElement;
    const isInsidePopup = target.closest('app-word-lookup-popup') || target.closest('.lookup-popup-card');
    if (!isInsidePopup) {
      this.clearSelection();
    }
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp(): void {
    // Instant execution on mouseup
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0 && text.length <= 250) {
      try {
        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const canvasArea = this.canvasAreaRef?.nativeElement || this.pdfContainerRef?.nativeElement;

        if (canvasArea && rect.width > 0 && rect.height > 0) {
          const canvasRect = canvasArea.getBoundingClientRect();

          // Check if selection intersects the viewer canvas area
          const isInside = (
            rect.right >= canvasRect.left &&
            rect.left <= canvasRect.right &&
            rect.bottom >= canvasRect.top &&
            rect.top <= canvasRect.bottom
          );

          if (isInside) {
            // Calculate exact position relative to the canvas area (where popup is rendered)
            const relTop = rect.top - canvasRect.top;
            const relBottom = rect.bottom - canvasRect.top;
            const relCenterLeft = rect.left - canvasRect.left + (rect.width / 2);

            // Space available from top of canvas area
            const isBottomPlacement = relTop < 220; // If less than 220px from top of canvas, place below

            let calculatedTop: number;
            let placement: 'top' | 'bottom';

            if (isBottomPlacement) {
              // Position 14px below the bottom edge of the selected text
              calculatedTop = relBottom + 14;
              placement = 'bottom';
            } else {
              // Position 14px above the top edge of the selected text
              calculatedTop = relTop - 14;
              placement = 'top';
            }

            // Clamp horizontal coordinates to keep popup card (320px) nicely within canvas boundaries
            const clampedLeft = Math.max(170, Math.min(canvasRect.width - 170, relCenterLeft));

            this.selectedText.set(text);
            this.popupPosition.set({
              top: calculatedTop,
              left: clampedLeft,
              placement
            });
            return;
          }
        }
      } catch {
        // Ignore selection measurement errors
      }
    }
  }

  clearSelection(): void {
    this.selectedText.set('');
    this.popupPosition.set(null);
  }

  openInNewTab(): void {
    const url = this.resolvedPdfUrl;
    if (url) {
      window.open(url, '_blank');
    }
  }
}