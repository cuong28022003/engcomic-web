import { Component, ElementRef, HostListener, Input, OnInit, ViewChild, signal } from '@angular/core';
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
export class PdfViewerComponent implements OnInit {
  @Input() pdfUrl: string | null | undefined = '';

  @ViewChild('pdfContainer') pdfContainerRef?: ElementRef<HTMLDivElement>;

  // Preset zoom levels in percentage: 60%, 75%, 90%, 100%, 115%, 130%, 150%, 175%, 200%
  readonly zoomLevels = [60, 75, 90, 100, 115, 130, 150, 175, 200];
  readonly zoomPercent = signal<number>(100);
  readonly zoom = signal<string | number>('page-width');

  readonly isLoaded = signal<boolean>(false);
  readonly hasLoadError = signal<boolean>(false);
  readonly loadErrorMessage = signal<string>('');

  readonly selectedText = signal<string>('');
  readonly popupPosition = signal<{ top: number; left: number } | null>(null);

  ngOnInit(): void {
    pdfDefaultOptions.assetsFolder = 'assets';
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
        const container = this.pdfContainerRef?.nativeElement;

        if (container && rect.width > 0 && rect.height > 0) {
          const containerRect = container.getBoundingClientRect();

          // Check if selection intersects the viewer pane
          const isInside = (
            rect.right >= containerRect.left &&
            rect.left <= containerRect.right &&
            rect.bottom >= containerRect.top &&
            rect.top <= containerRect.bottom
          );

          if (isInside) {
            const calculatedTop = rect.top - containerRect.top + container.scrollTop;
            const calculatedLeft = rect.left - containerRect.left + (rect.width / 2);

            // Clamp coordinates to prevent clipping
            const clampedLeft = Math.max(160, Math.min(containerRect.width - 160, calculatedLeft));
            const clampedTop = Math.max(60, calculatedTop);

            this.selectedText.set(text);
            this.popupPosition.set({
              top: clampedTop,
              left: clampedLeft
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