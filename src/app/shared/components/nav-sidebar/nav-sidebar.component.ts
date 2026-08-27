import { Component, input, model, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SidebarItem {
  key: string;
  label: string;
  labelSub?: string;
  icon?: string;
  color?: string;
  count?: number;
  badge?: string;
}

export interface SidebarSection {
  title?: string;
  icon?: string;
  items: SidebarItem[];
}

import { GlassPanelComponent } from '../glass-panel/glass-panel.component';

@Component({
  selector: 'app-nav-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, GlassPanelComponent],
  templateUrl: './nav-sidebar.component.html',
  styleUrls: ['./nav-sidebar.component.scss']
})
export class NavSidebarComponent {
  readonly title = input<string>('Danh Mục');
  readonly icon = input<string>('fa-solid fa-list');
  readonly items = input<SidebarItem[]>([]);
  readonly sections = input<SidebarSection[]>([]);
  readonly showSearch = input<boolean>(false);
  readonly searchPlaceholder = input<string>('Lọc nhanh...');
  readonly searchFilter = signal<string>('');

  readonly activeKey = model<string>('');
  readonly itemSelected = output<SidebarItem>();

  readonly displayItems = computed(() => {
    const list = this.items();
    const query = this.searchFilter().trim().toLowerCase();
    if (!query) return list;
    return list.filter(item =>
      item.label.toLowerCase().includes(query) ||
      (item.labelSub && item.labelSub.toLowerCase().includes(query))
    );
  });

  selectItem(item: SidebarItem): void {
    this.activeKey.set(item.key);
    this.itemSelected.emit(item);
  }
}
