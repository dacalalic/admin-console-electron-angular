import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthFacade } from '../../data-access/auth-facade.service';

@Component({
  selector: 'app-sign-in-page',
  imports: [ReactiveFormsModule],
  template: `
    <main>
      <h1>Admin Console</h1>
      <h2>Sign in as user</h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label for="userId">User ID</label>
        <input id="userId" type="number" formControlName="userId" />

        @if (errorMessage()) {
          <p>{{ errorMessage() }}</p>
        }

        <button type="submit" [disabled]="form.invalid || isSubmitting()">
          {{ isSubmitting() ? 'Loading...' : 'Continue' }}
        </button>
      </form>
    </main>
  `,
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