import { Routes } from '@angular/router';
import { authGuard } from './features/auth/guards/auth.guard';
import { SignInPageComponent } from './features/auth/pages/sign-in/sign-in-page';
import { PostsPageComponent } from './features/posts/pages/posts/posts-page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'sign-in',
  },
  {
    path: 'sign-in',
    component: SignInPageComponent,
  },
  {
    path: 'posts',
    component: PostsPageComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'sign-in',
  },
];
