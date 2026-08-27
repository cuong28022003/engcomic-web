import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type GlassPanelPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type GlassPanelRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type GlassPanelVariant = 'default' | 'card' | 'glow' | 'subtle' | 'elevated' | 'accent' | 'borderless';
export type GlassPanelBlur = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-glass-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './glass-panel.component.html',
  styleUrls: ['./glass-panel.component.scss']
})
export class GlassPanelComponent {
  readonly padding = input<GlassPanelPadding>('md');
  readonly radius = input<GlassPanelRadius>('md');
  readonly variant = input<GlassPanelVariant>('default');
  readonly blur = input<GlassPanelBlur>('md');
  readonly glowColor = input<string>('');
  readonly interactive = input<boolean>(false);
  readonly bordered = input<boolean>(true);
  readonly customClass = input<string>('');

  readonly panelClick = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (this.interactive()) {
      this.panelClick.emit(event);
    }
  }
}
