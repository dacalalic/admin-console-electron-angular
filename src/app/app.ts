import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LoggerService } from './core/logging/logger.service';
import { AuthFacade } from './features/auth/data-access/auth-facade.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App implements OnInit {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  async ngOnInit(): Promise<void> {
    this.logger.info('app-flow', 'App initialization started.');
    await this.authFacade.restoreSession();
    this.logger.info('app-flow', 'Session restore finished.', {
      isSignedIn: this.authFacade.isSignedIn(),
      route: this.router.url,
    });

    if (this.authFacade.isSignedIn() && this.router.url === '/sign-in') {
      this.logger.info('app-flow', 'Redirecting signed-in user to posts page.');
      await this.router.navigate(['/posts']);
    }
  }
}
