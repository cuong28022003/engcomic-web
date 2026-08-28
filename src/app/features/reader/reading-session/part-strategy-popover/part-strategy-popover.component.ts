import { Component, signal, input, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PartStrategyData {
  part: number;
  name: string;
  questionRange: string;
  recommendedTime: string;
  timePerQuestion: string;
  color: string;
  gradient: string;
  coreTactics: string[];
  commonTraps: string[];
  proTips: string;
}

export const TOEIC_READING_STRATEGIES: PartStrategyData[] = [
  {
    part: 5,
    name: 'Hoàn Thành Câu (Incomplete Sentences)',
    questionRange: 'Câu 101 - 130 (30 câu)',
    recommendedTime: '10 - 12 phút',
    timePerQuestion: '~20 - 30 giây / câu',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    coreTactics: [
      'Nhìn 4 đáp án trước: Nếu cùng gốc từ (Grammar) ➔ Xét vị trí trước/sau chỗ trống để chọn từ loại (N/V/Adj/Adv) trong 5-10 giây.',
      'Nếu 4 đáp án khác gốc từ (Vocabulary) ➔ Dịch nhanh theo ngữ cảnh và nhận diện cụm từ cố định (Collocations).',
      'Xác định thành phần nòng cốt câu: Chủ ngữ (S) + Động từ chính (V) để tránh chọn nhầm dạng động từ.',
      'Câu nào quá 40 giây chưa chọn được ➔ Chọn đáp án khả dĩ nhất và gắn cờ (⚑) làm tiếp, không dừng lại quá lâu.'
    ],
    commonTraps: [
      'Bẫy Rút gọn Mệnh đề quan hệ: Chủ động dùng V-ing, Bị động dùng V-ed/V3.',
      'Bẫy Liên từ vs Giới từ: Although/Because + Mệnh đề (S+V) vs Despite/Because of + Cụm danh từ/V-ing.'
    ],
    proTips: 'Tiết kiệm thời gian ở Part 5 là chìa khóa sống còn để có đủ thời gian làm bài đọc dài ở Part 7!'
  },
  {
    part: 6,
    name: 'Hoàn Thành Đoạn Văn (Text Completion)',
    questionRange: 'Câu 131 - 146 (16 câu - 4 đoạn)',
    recommendedTime: '8 - 10 phút',
    timePerQuestion: '~2 - 2.5 phút / đoạn văn',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7e22ce 0%, #c084fc 100%)',
    coreTactics: [
      'Đọc câu đầu tiên để nắm ngay loại văn bản (Email, Thông báo, Bài báo, Thư mời) và mục đích chính.',
      'Với câu điền từ nối: Đọc câu phía trước và câu phía sau để xác định quan hệ logic (Nguyên nhân, Tương phản, Bổ sung).',
      'Với câu điền cả câu: Tìm từ khóa móc nối (Đại từ thay thế He/She/They/This/These) kết nối ngữ nghĩa với câu liền kề.'
    ],
    commonTraps: [
      'Không đọc mạch văn xung quanh mà chỉ nhìn chỗ trống ➔ Rất dễ chọn sai thì của động từ hoặc sai từ nối logic.'
    ],
    proTips: 'Đoạn văn trong Part 6 là một thể thống nhất, đừng đọc từng câu rời rạc!'
  },
  {
    part: 7,
    name: 'Đọc Hiểu Đoạn Văn (Reading Comprehension)',
    questionRange: 'Câu 147 - 200 (54 câu)',
    recommendedTime: '50 - 55 phút',
    timePerQuestion: '~50 - 60 giây / câu',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
    coreTactics: [
      'Đoạn Đơn (147 - 175): Đọc câu hỏi trước để lấy từ khóa (Keywords/Scan), sau đó lướt nhanh bài đọc để tìm vị trí thông tin.',
      'Đoạn Kép & Đoạn Ba (176 - 200): Lướt tiêu đề các bài đọc để hiểu mối quan hệ (Email đặt hàng ➔ Hóa đơn đối chiếu ➔ Đơn phản hồi).',
      'Nhận diện Paraphrasing: Đáp án đúng hầu như luôn dùng từ đồng nghĩa để diễn đạt lại ý trong bài đọc.'
    ],
    commonTraps: [
      'Bẫy thông tin trùng từ 100%: Đáp án chứa từ y hệt trong bài đọc thường là bẫy gây nhiễu, hãy chú ý từ đồng nghĩa.'
    ],
    proTips: 'Nếu sắp hết giờ, hãy ưu tiên làm các câu hỏi tìm chi tiết cụ thể (Thời gian, Tên người, Địa điểm) trước các câu hỏi suy luận (Inference/Main idea)!'
  }
];

@Component({
  selector: 'app-part-strategy-popover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './part-strategy-popover.component.html',
  styleUrls: ['./part-strategy-popover.component.scss']
})
export class PartStrategyPopoverComponent {
  private elementRef = inject(ElementRef);

  readonly initialPart = input<number>(5);

  readonly strategies = signal<PartStrategyData[]>(TOEIC_READING_STRATEGIES);
  readonly selectedPart = signal<number>(5);
  readonly isOpen = signal<boolean>(false);

  readonly currentStrategy = () => {
    return this.strategies().find(s => s.part === this.selectedPart()) || this.strategies()[0];
  };

  private closeTimeout: any = null;

  toggleOpen(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    this.isOpen.update(v => !v);
  }

  openPopover(): void {
    this.cancelClose();
    this.isOpen.set(true);
  }

  scheduleClose(delayMs = 350): void {
    this.cancelClose();
    this.closeTimeout = setTimeout(() => {
      this.isOpen.set(false);
      this.closeTimeout = null;
    }, delayMs);
  }

  cancelClose(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  closePopover(): void {
    this.cancelClose();
    this.isOpen.set(false);
  }

  selectPart(part: number): void {
    this.selectedPart.set(part);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closePopover();
    }
  }
}
