import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPwd = control.get('newPassword')?.value;
  const confirmPwd = control.get('confirmPassword')?.value;
  return newPwd && confirmPwd && newPwd !== confirmPwd ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly success = signal(false);

  readonly showOld = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  readonly form = this.fb.group(
    {
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d).+$/)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordsMatchValidator }
  );

  get oldPwd() { return this.form.get('oldPassword')!; }
  get newPwd() { return this.form.get('newPassword')!; }
  get confirmPwd() { return this.form.get('confirmPassword')!; }

  getPasswordStrength(): { level: 'weak' | 'fair' | 'strong'; label: string; pct: number } {
    const val = this.newPwd.value || '';
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasNum = /\d/.test(val);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"|,.<>\/?]/.test(val);
    const score = (val.length >= 8 ? 1 : 0) + (hasUpper && hasLower ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpecial ? 1 : 0);
    if (score <= 2) return { level: 'weak', label: 'Yếu', pct: 33 };
    if (score === 3) return { level: 'fair', label: 'Trung bình', pct: 66 };
    return { level: 'strong', label: 'Mạnh', pct: 100 };
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.auth.changePassword(this.oldPwd.value!, this.newPwd.value!).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.form.reset();
        this.toast.success('Đổi mật khẩu thành công! Hãy dùng mật khẩu mới khi đăng nhập.');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = typeof err === 'string' ? err : (err?.error?.message || err?.error?.details?.[0] || 'Đổi mật khẩu thất bại');
        this.toast.error(msg);
      }
    });
  }
}
