import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FormSelectOption {
  label: string;
  value: any;
  icon?: string;
}

@Component({
  selector: 'app-form-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-select.component.html',
  styleUrls: ['./form-select.component.scss']
})
export class FormSelectComponent {
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly options = input<FormSelectOption[]>([]);
  readonly icon = input<string>('');
  readonly errorMessage = input<string>('');
  readonly helperText = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);

  readonly value = model<any>('');

  onSelectChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.value.set(val);
  }
}
