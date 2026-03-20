import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthFacade } from './features/auth/data-access/auth-facade.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App implements OnInit {
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.authFacade.restoreSession();

    if (this.authFacade.isSignedIn() && this.router.url === '/sign-in') {
      await this.router.navigate(['/posts']);
    }
  }
}