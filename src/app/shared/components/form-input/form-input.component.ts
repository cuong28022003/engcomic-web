import { Component, computed, input, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.scss']
})
export class FormInputComponent {
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly type = input<'text' | 'password' | 'email' | 'number' | 'textarea'>('text');
  readonly rows = input<number>(3);
  readonly icon = input<string>('');
  readonly errorMessage = input<string>('');
  readonly helperText = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);

  readonly value = model<string>('');

  readonly showPassword = signal<boolean>(false);

  readonly currentType = computed<'text' | 'password' | 'email' | 'number'>(() => {
    const t = this.type();
    if (t === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    if (t === 'textarea') {
      return 'text';
    }
    return t;
  });

  togglePassword(): void {
    this.showPassword.update(show => !show);
  }

  onInputChange(event: Event): void {
    const val = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.value.set(val);
  }
}