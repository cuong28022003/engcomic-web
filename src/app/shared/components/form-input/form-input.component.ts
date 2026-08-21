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
  readonly type = input<'text' | 'password' | 'email' | 'number'>('text');
  readonly icon = input<string>('');
  readonly errorMessage = input<string>('');
  readonly disabled = input<boolean>(false);

  readonly value = model<string>('');

  readonly showPassword = signal<boolean>(false);

  readonly currentType = computed<'text' | 'password' | 'email' | 'number'>(() => {
    if (this.type() === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type();
  });

  togglePassword(): void {
    this.showPassword.update(show => !show);
  }

  onInputChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
  }
}