  import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type PageHeaderTheme = 'vocab' | 'grammar' | 'deck' | 'reader' | 'collector' | 'admin' | 'custom';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly icon = input<string>('');
  readonly theme = input<PageHeaderTheme>('custom');
  readonly customIconBg = input<string>('');
  readonly customIconColor = input<string>('');
  readonly badge = input<string>('');
  readonly backUrl = input<string>('');
  readonly showBack = input<boolean>(false);
}
