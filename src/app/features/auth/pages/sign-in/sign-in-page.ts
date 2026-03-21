import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthFacade } from '../../data-access/auth-facade.service';

@Component({
  selector: 'app-sign-in-page',
  imports: [ReactiveFormsModule],
  template: `
    <main class="signin-shell">
      <section class="signin-panel">
        <div class="signin-copy">
          <p class="eyebrow">Control Center</p>
          <h1>Admin Console</h1>
          <p class="subtitle">Sign in with a user ID to access posts and moderation tools.</p>
        </div>

        <form class="signin-form" [formGroup]="form" (ngSubmit)="submit()">
          <label for="userId">User ID</label>
          <input
            id="userId"
            data-testid="sign-in-user-id"
            type="number"
            formControlName="userId"
            min="1"
            placeholder="e.g. 4"
            [class.invalid]="form.controls.userId.invalid && form.controls.userId.touched"
          />

          @if (form.controls.userId.invalid && form.controls.userId.touched) {
            <p class="validation-error">Please enter a valid positive number.</p>
          }

          @if (errorMessage()) {
            <p class="alert-error" data-testid="sign-in-error">{{ errorMessage() }}</p>
          }

          <button
            type="submit"
            data-testid="sign-in-submit"
            [disabled]="form.invalid || isSubmitting()"
          >
            {{ isSubmitting() ? 'Loading...' : 'Continue' }}
          </button>
        </form>
      </section>
    </main>
  `,
  styles: [
    `
      .signin-shell {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 2rem 1rem;
      }

      .signin-panel {
        width: min(720px, 100%);
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: linear-gradient(150deg, rgba(255, 253, 248, 0.98), rgba(247, 242, 234, 0.9));
        box-shadow: var(--shadow-soft);
        padding: 2.2rem;
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.6rem;
        animation: rise-in 260ms ease-out;
      }

      .eyebrow {
        margin: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--brand-strong);
        font-weight: 700;
      }

      .subtitle {
        margin: 0.6rem 0 0;
        color: var(--text-muted);
        max-width: 42ch;
      }

      h1 {
        margin: 0.25rem 0 0;
        font-size: clamp(1.6rem, 4.7vw, 2.35rem);
      }

      .signin-form {
        display: grid;
        gap: 0.85rem;
      }

      label {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      input {
        border: 1px solid #bfc6bd;
        background: rgba(255, 255, 255, 0.85);
        color: var(--text-strong);
        border-radius: 12px;
        padding: 0.8rem 0.9rem;
        outline: none;
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease;
      }

      input::placeholder {
        color: #849085;
      }

      input:focus {
        border-color: var(--brand);
        box-shadow: 0 0 0 3px rgba(31, 143, 99, 0.2);
      }

      input.invalid {
        border-color: var(--danger);
      }

      .validation-error,
      .alert-error {
        margin: 0;
        font-size: 0.9rem;
      }

      .validation-error {
        color: #8d4c3f;
      }

      .alert-error {
        color: var(--danger);
        background: #fff2ef;
        border: 1px solid #f2c7bf;
        border-radius: 10px;
        padding: 0.55rem 0.75rem;
      }

      button {
        margin-top: 0.35rem;
        border: none;
        border-radius: 12px;
        background: linear-gradient(120deg, var(--brand), #259f71);
        color: #f9fffb;
        font-weight: 700;
        padding: 0.82rem 1rem;
        cursor: pointer;
        transition:
          transform 140ms ease,
          filter 140ms ease;
      }

      button:hover:not(:disabled) {
        transform: translateY(-1px);
        filter: brightness(1.04);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      @media (min-width: 760px) {
        .signin-panel {
          padding: 2.4rem 2.4rem 2.3rem;
          grid-template-columns: 1.2fr 1fr;
          align-items: start;
        }

        .signin-form {
          border-left: 1px solid var(--line);
          padding-left: 1.4rem;
        }
      }
    `,
  ],
})
export class SignInPageComponent {
  private readonly router = inject(Router);
  private readonly authFacade = inject(AuthFacade);

  protected readonly form = new FormGroup({
    userId: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const userId = this.form.controls.userId.value;

    if (userId === null) {
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    const didSignIn = await this.authFacade.signIn(userId);

    this.isSubmitting.set(false);

    if (!didSignIn) {
      this.errorMessage.set('User not found.');
      return;
    }

    void this.router.navigate(['/posts']);
  }
}
