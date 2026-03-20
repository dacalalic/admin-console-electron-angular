import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { User } from '../../../shared/models/user.model';

interface JsonPlaceholderUserDto {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);

  getUserById(userId: number): Observable<User | null> {
    return this.http
      .get<JsonPlaceholderUserDto>(`https://jsonplaceholder.typicode.com/users/${userId}`)
      .pipe(
        map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        })),
      );
  }
}