import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pdf-upload-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-upload-step.component.html',
  styleUrls: ['./pdf-upload-step.component.scss']
})
export class PdfUploadStepComponent {
  @Input() testName = '';
  @Input() pdfUrl = '';
  @Input() selectedFile: File | null = null;

  @Output() stepCompleted = new EventEmitter<{ testName: string; pdfFile: File | null; pdfUrl: string }>();

  isDragging = false;
  errorMessage = '';

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.errorMessage = 'Vui lòng chọn tệp định dạng PDF (.pdf)';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      this.errorMessage = 'Dung lượng tệp PDF không được vượt quá 50MB';
      return;
    }
    this.errorMessage = '';
    this.selectedFile = file;
    if (!this.testName) {
      this.testName = file.name.replace(/\.pdf$/i, '');
    }
  }

  removeFile() {
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onNext() {
    if (!this.testName.trim()) {
      this.errorMessage = 'Vui lòng nhập tên bài thi';
      return;
    }
    this.errorMessage = '';
    this.stepCompleted.emit({
      testName: this.testName.trim(),
      pdfFile: this.selectedFile,
      pdfUrl: this.pdfUrl.trim()
    });
  }
}