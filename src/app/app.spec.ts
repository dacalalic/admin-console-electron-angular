import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { App } from './app';
import { LoggerService } from './core/logging/logger.service';
import { AuthFacade } from './features/auth/data-access/auth-facade.service';

describe('App', () => {
  let authFacadeMock: {
    restoreSession: ReturnType<typeof vi.fn>;
    isSignedIn: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    url: string;
    navigate: ReturnType<typeof vi.fn>;
  };
  let loggerMock: {
    info: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authFacadeMock = {
      restoreSession: vi.fn().mockResolvedValue(undefined),
      isSignedIn: vi.fn(() => false),
    };
    routerMock = {
      url: '/posts',
      navigate: vi.fn().mockResolvedValue(true),
    };
    loggerMock = {
      info: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: AuthFacade, useValue: authFacadeMock },
        { provide: Router, useValue: routerMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    }).compileComponents();
  });

  it('should create the app and restore the session on init', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
    expect(authFacadeMock.restoreSession).toHaveBeenCalledOnce();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should redirect signed-in users away from sign-in', async () => {
    authFacadeMock.isSignedIn.mockReturnValue(true);
    routerMock.url = '/sign-in';

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/posts']);
  });
});
