import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar-frame',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar-frame.component.html',
  styleUrls: ['./avatar-frame.component.scss']
})
export class AvatarFrameComponent {
  readonly avatarUrl = input<string>('');
  readonly frameId = input<string>('frame_default');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly showGlow = input<boolean>(true);

  readonly safeAvatarUrl = computed<string>(() => {
    const url = this.avatarUrl();
    if (url && url.trim().length > 0) return url;
    return 'https://api.dicebear.com/7.x/bottts/svg?seed=EngComicMaster';
  });

  readonly frameClass = computed<string>(() => {
    const id = this.frameId() || 'frame_default';
    return `frame-${id.replace('frame_', '')}`;
  });
}
