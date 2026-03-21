import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthFacade } from '../../data-access/auth-facade.service';
import { SignInPageComponent } from './sign-in-page';

describe('SignInPageComponent', () => {
  let authFacadeMock: {
    signIn: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authFacadeMock = {
      signIn: vi.fn().mockResolvedValue(true),
    };
    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [SignInPageComponent],
      providers: [
        { provide: AuthFacade, useValue: authFacadeMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  it('invalid form does not submit', async () => {
    const fixture = TestBed.createComponent(SignInPageComponent);
    const component = fixture.componentInstance;

    await component.submit();

    expect(authFacadeMock.signIn).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('successful sign-in navigates to posts', async () => {
    const fixture = TestBed.createComponent(SignInPageComponent);
    const component = fixture.componentInstance as SignInPageComponent & {
      form: { controls: { userId: { setValue(value: number): void } } };
    };

    component.form.controls.userId.setValue(4);
    await component.submit();

    expect(authFacadeMock.signIn).toHaveBeenCalledWith(4);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/posts']);
  });

  it('failed sign-in shows error', async () => {
    authFacadeMock.signIn.mockResolvedValue(false);
    const fixture = TestBed.createComponent(SignInPageComponent);
    const component = fixture.componentInstance as SignInPageComponent & {
      form: { controls: { userId: { setValue(value: number): void } } };
    };

    component.form.controls.userId.setValue(9);
    await component.submit();
    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.querySelector('.alert-error') as HTMLElement | null;

    expect(authFacadeMock.signIn).toHaveBeenCalledWith(9);
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(errorMessage?.textContent).toContain('User not found.');
  });
});
