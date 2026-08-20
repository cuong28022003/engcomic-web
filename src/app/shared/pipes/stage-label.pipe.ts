import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stageLabel',
  standalone: true,
})
export class StageLabelPipe implements PipeTransform {
  private static readonly STAGE_LABELS: Record<number, string> = {
    0: 'Mới',
    1: 'Nhận biết',
    2: 'Ngữ cảnh & Sắc thái',
    3: 'Phát âm',
    4: 'Sản sinh có hỗ trợ',
    5: 'Sản sinh tự do',
    6: 'Ứng dụng thực tế',
  };

  transform(stage: number | null | undefined): string {
    if (stage === null || stage === undefined) return 'Mới';
    return StageLabelPipe.STAGE_LABELS[stage] ?? 'Mới';
  }
}
