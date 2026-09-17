import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToeicSection } from '../../models';

const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'wav', 'aac', 'ogg'];
const MAX_AUDIO_SIZE = 200 * 1024 * 1024;

@Component({
  selector: 'app-pdf-upload-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-upload-step.component.html',
  styleUrls: ['./pdf-upload-step.component.scss']
})
export class PdfUploadStepComponent implements OnInit {
  @Input() testName = '';
  @Input() pdfUrl = '';
  @Input() selectedFile: File | null = null;
  @Input() section: ToeicSection = 'reading';
  @Input() audioFile: File | null = null;

  @Output() stepCompleted = new EventEmitter<{ testName: string; pdfFile: File | null; pdfUrl: string; section: ToeicSection; audioFile: File | null }>();

  readonly selectedSection = signal<ToeicSection>('reading');

  isDragging = false;
  isAudioDragging = false;
  errorMessage = '';

  ngOnInit(): void {
    this.selectedSection.set(this.section);
  }

  selectSection(sec: ToeicSection): void {
    this.selectedSection.set(sec);
    this.errorMessage = '';
  }

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

  onAudioDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isAudioDragging = true;
  }

  onAudioDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isAudioDragging = false;
  }

  onAudioDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isAudioDragging = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleAudioFile(event.dataTransfer.files[0]);
    }
  }

  onAudioFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleAudioFile(input.files[0]);
    }
  }

  handleAudioFile(file: File) {
    const ext = file.name.toLowerCase().split('.').pop() || '';
    if (!AUDIO_EXTENSIONS.includes(ext)) {
      this.errorMessage = 'Vui lòng chọn tệp audio định dạng MP3, M4A, WAV, AAC hoặc OGG';
      return;
    }
    if (file.size > MAX_AUDIO_SIZE) {
      this.errorMessage = 'Dung lượng tệp audio không được vượt quá 200MB';
      return;
    }
    this.errorMessage = '';
    this.audioFile = file;
  }

  removeAudioFile() {
    this.audioFile = null;
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
    if (this.selectedSection() === 'listening' && !this.audioFile) {
      this.errorMessage = 'Đề Listening bắt buộc phải có tệp audio bài nghe';
      return;
    }
    this.errorMessage = '';
    this.stepCompleted.emit({
      testName: this.testName.trim(),
      pdfFile: this.selectedFile,
      pdfUrl: this.pdfUrl.trim(),
      section: this.selectedSection(),
      audioFile: this.audioFile
    });
  }
}