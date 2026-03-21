import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';

export interface DbUser {
  id: number;
  name: string;
  email: string;
}

export interface DbPost {
  id: number;
  userId: number;
  title: string;
  body: string;
  comments: number | null;
}

export class AppDatabase {
  private readonly db: Database.Database;

  constructor(dbPath = path.join(app.getPath('userData'), 'admin-console.db')) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');

    this.initialize();
  }

  close(): void {
    this.db.close();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS session (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        user_id INTEGER NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        comments INTEGER NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    const existingSession = this.db.prepare('SELECT id FROM session WHERE id = 1').get() as
      | { id: number }
      | undefined;

    if (!existingSession) {
      this.db.prepare('INSERT INTO session (id, user_id) VALUES (1, NULL)').run();
    }
  }

  saveUser(user: DbUser): void {
    this.db
      .prepare(
        `
        INSERT INTO users (id, name, email)
        VALUES (@id, @name, @email)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email
      `,
      )
      .run(user);
  }

  setActiveSession(userId: number): void {
    this.db.prepare('UPDATE session SET user_id = ? WHERE id = 1').run(userId);
  }

  clearActiveSession(): void {
    this.db.prepare('UPDATE session SET user_id = NULL WHERE id = 1').run();
  }

  getActiveSessionUser(): DbUser | null {
    const row = this.db
      .prepare(
        `
      SELECT u.id, u.name, u.email
      FROM session s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = 1
    `,
      )
      .get() as DbUser | undefined;

    return row ?? null;
  }

  savePosts(posts: DbPost[]): void {
    const statement = this.db.prepare(`
    INSERT INTO posts (id, user_id, title, body, comments)
    VALUES (@id, @userId, @title, @body, @comments)
    ON CONFLICT(id) DO UPDATE SET
      user_id = excluded.user_id,
      title = excluded.title,
      body = excluded.body
  `);

    const transaction = this.db.transaction((postsToSave: DbPost[]) => {
      for (const post of postsToSave) {
        statement.run(post);
      }
    });

    transaction(posts);
  }

  getPostsByUserId(userId: number): DbPost[] {
    const rows = this.db
      .prepare(
        `
      SELECT
        id,
        user_id as userId,
        title,
        body,
        comments
      FROM posts
      WHERE user_id = ?
      ORDER BY id ASC
    `,
      )
      .all(userId) as DbPost[];

    return rows;
  }

  updatePostComments(postId: number, comments: number): void {
    this.db
      .prepare(
        `
      UPDATE posts
      SET comments = ?
      WHERE id = ?
    `,
      )
      .run(comments, postId);
  }
}
