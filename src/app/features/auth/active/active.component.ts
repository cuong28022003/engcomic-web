import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-active',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="page"><h2>Active Page</h2><p><!-- TODO: implement --></p></div>',
  styles: ['.page { padding: 2rem; }']
})
export class ActiveComponent {}
