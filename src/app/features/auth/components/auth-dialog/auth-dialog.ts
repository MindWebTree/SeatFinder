import { ChangeDetectionStrategy, Component, Inject, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../../core/services/auth.service';
import { CATEGORY_OPTIONS, StateDto } from '../../../../core/models/counselling.models';

type Mode = 'signup' | 'login';
type Step = 'form' | 'otp';

export interface AuthDialogData {
  states: StateDto[];
  neetRank?: number | null;
  category?: string;
}

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-dialog.html'
})
export class AuthDialogComponent {
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<AuthDialogComponent>);
  protected readonly data = inject<AuthDialogData>(MAT_DIALOG_DATA);

  protected readonly mode = signal<Mode>('signup');
  protected readonly step = signal<Step>('form');
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');

  // Signup fields
  protected readonly fullName = signal('');
  protected readonly email = signal('');
  protected readonly phoneNumber = signal('');
  protected readonly stateId = signal<number | null>(null);
  protected readonly neetRank = signal<number | null>(this.data.neetRank ?? null);
  protected readonly category = signal<string>(this.data.category ?? '');
  protected readonly categories = CATEGORY_OPTIONS;

  // Login field (either email or phone in one box)
  protected readonly loginIdentifier = signal('');

  protected readonly otpCode = signal('');

  protected readonly canSendOtp = computed(() => {
    if (this.mode() === 'signup') {
      return !!this.fullName().trim()
        && (!!this.email().trim() || !!this.phoneNumber().trim())
        && !!this.stateId()
        && !!this.neetRank()
        && !!this.category();
    }
    return !!this.loginIdentifier().trim();
  });

  protected switchMode(mode: Mode): void {
    this.mode.set(mode);
    this.step.set('form');
    this.errorMessage.set('');
  }

  private isEmail(value: string): boolean {
    return value.includes('@');
  }

  protected sendOtp(): void {
    this.errorMessage.set('');
    this.submitting.set(true);

    if (this.mode() === 'signup') {
      this.authService.register({
        fullName: this.fullName().trim(),
        email: this.email().trim(),
        phoneNumber: this.phoneNumber().trim(),
        stateId: this.stateId()!,
        neetRank: this.neetRank()!,
        category: this.category()
      }).subscribe({
        next: () => {
          // After registration, send OTP to the provided contact
          const contact = this.email().trim() || this.phoneNumber().trim();
          this.authService.sendOtp({ emailOrPhoneNumber: contact }).subscribe({
            next: () => {
              this.submitting.set(false);
              this.step.set('otp');
            },
            error: (err) => {
              this.submitting.set(false);
              this.errorMessage.set(err?.error?.message ?? 'Could not send the code. Try again.');
            }
          });
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Registration failed. Try again.');
        }
      });
      return;
    }

    this.authService.sendOtp({ emailOrPhoneNumber: this.loginIdentifier().trim() }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.step.set('otp');
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not send the code. Try again.');
      }
    });
  }

  protected verifyOtp(): void {
    if (!this.otpCode().trim()) return;
    this.errorMessage.set('');
    this.submitting.set(true);

    const base =
      this.mode() === 'signup'
        ? { emailOrPhoneNumber: this.email().trim() || this.phoneNumber().trim() }
        : { emailOrPhoneNumber: this.loginIdentifier().trim() };

    this.authService
      .verifyOtp({
        otpCode: this.otpCode().trim(),
        ...base,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Incorrect code. Try again.');
        }
      });
  }

  protected close(): void {
    this.dialogRef.close(false);
  }
}
