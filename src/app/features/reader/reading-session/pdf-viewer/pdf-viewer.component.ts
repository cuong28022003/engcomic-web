import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeResourceUrlPipe } from '@shared/pipes/safe-resource-url.pipe';
import { environment } from '@env/environment';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, SafeResourceUrlPipe],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent {
  @Input() pdfUrl: string | null | undefined = '';

  get resolvedPdfUrl(): string {
    if (!this.pdfUrl) return '';
    const url = this.pdfUrl.trim();

    if (url.startsWith('blob:')) {
      return url;
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

  openInNewTab() {
    const url = this.resolvedPdfUrl;
    if (url) {
      window.open(url, '_blank');
    }
  }
}