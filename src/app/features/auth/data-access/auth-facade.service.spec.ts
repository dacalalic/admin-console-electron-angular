import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DesktopService } from '../../../core/services/desktop.service';
import { LoggerService } from '../../../core/logging/logger.service';
import { User } from '../../../shared/models/user.model';
import { AuthApiService } from './auth-api.service';
import { AuthFacade } from './auth-facade.service';

describe('AuthFacade', () => {
  let facade: AuthFacade;
  let authApiServiceMock: {
    getUserById: ReturnType<typeof vi.fn>;
  };
  let desktopServiceMock: {
    getSession: ReturnType<typeof vi.fn>;
    saveSession: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
  };
  let loggerServiceMock: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const persistedUser: User = {
    id: 1,
    name: 'Persisted User',
    email: 'persisted@example.com',
  };

  const signedInUser: User = {
    id: 2,
    name: 'Signed-In User',
    email: 'signed-in@example.com',
  };

  beforeEach(() => {
    authApiServiceMock = {
      getUserById: vi.fn(),
    };
    desktopServiceMock = {
      getSession: vi.fn().mockResolvedValue(null),
      saveSession: vi.fn().mockResolvedValue(undefined),
      clearSession: vi.fn().mockResolvedValue(undefined),
    };
    loggerServiceMock = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthFacade,
        { provide: AuthApiService, useValue: authApiServiceMock },
        { provide: DesktopService, useValue: desktopServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
      ],
    });

    facade = TestBed.inject(AuthFacade);
  });

  it('restoreSession sets the current user from desktop persistence', async () => {
    desktopServiceMock.getSession.mockResolvedValueOnce(persistedUser);

    await facade.restoreSession();

    expect(desktopServiceMock.getSession).toHaveBeenCalledOnce();
    expect(facade.currentUser()).toEqual(persistedUser);
    expect(facade.isSignedIn()).toBe(true);
  });

  it('signIn success loads a user, persists session, updates state, and returns success', async () => {
    authApiServiceMock.getUserById.mockReturnValue(of(signedInUser));

    const result = await facade.signIn(signedInUser.id);

    expect(result).toBe(true);
    expect(authApiServiceMock.getUserById).toHaveBeenCalledWith(signedInUser.id);
    expect(desktopServiceMock.saveSession).toHaveBeenCalledWith(signedInUser);
    expect(desktopServiceMock.clearSession).not.toHaveBeenCalled();
    expect(facade.currentUser()).toEqual(signedInUser);
    expect(facade.isSignedIn()).toBe(true);
  });

  it('signIn failure clears stale state, clears persisted session data, and returns failure', async () => {
    desktopServiceMock.getSession.mockResolvedValueOnce(persistedUser);
    await facade.restoreSession();
    expect(facade.currentUser()).toEqual(persistedUser);

    authApiServiceMock.getUserById.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );
    const result = await facade.signIn(999);

    expect(result).toBe(false);
    expect(desktopServiceMock.saveSession).not.toHaveBeenCalled();
    expect(desktopServiceMock.clearSession).toHaveBeenCalledOnce();
    expect(facade.currentUser()).toBeNull();
    expect(facade.isSignedIn()).toBe(false);
  });

  it('signOut clears state and persisted session', async () => {
    desktopServiceMock.getSession.mockResolvedValueOnce(persistedUser);
    await facade.restoreSession();
    expect(facade.currentUser()).toEqual(persistedUser);

    await facade.signOut();

    expect(desktopServiceMock.clearSession).toHaveBeenCalledOnce();
    expect(facade.currentUser()).toBeNull();
    expect(facade.isSignedIn()).toBe(false);
  });
});
