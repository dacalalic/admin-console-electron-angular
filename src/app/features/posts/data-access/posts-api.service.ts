import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Post } from '../../../shared/models/post.model';

interface JsonPlaceholderPostDto {
  id: number;
  userId: number;
  title: string;
  body: string;
}

@Injectable({
  providedIn: 'root',
})
export class PostsApiService {
  private readonly http = inject(HttpClient);

  getPostsByUserId(userId: number): Observable<Post[]> {
    return this.http
      .get<JsonPlaceholderPostDto[]>(`https://jsonplaceholder.typicode.com/posts?userId=${userId}`)
      .pipe(
        map((posts) =>
          posts.map((post) => ({
            id: post.id,
            userId: post.userId,
            title: post.title,
            body: post.body,
            comments: null,
          })),
        ),
      );
  }
}
