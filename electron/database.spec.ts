import Database from 'better-sqlite3';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppDatabase, DbPost, DbUser } from './database';

describe('AppDatabase integration', () => {
  let tempDirPath: string;
  let tempDbPath: string;
  let appDatabase: AppDatabase;

  const userOne: DbUser = {
    id: 1,
    name: 'User One',
    email: 'user.one@example.com',
  };

  const userTwo: DbUser = {
    id: 2,
    name: 'User Two',
    email: 'user.two@example.com',
  };

  beforeEach(async () => {
    tempDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'admin-console-db-test-'));
    tempDbPath = path.join(tempDirPath, 'integration.sqlite');
    appDatabase = new AppDatabase(tempDbPath);
  });

  afterEach(async () => {
    appDatabase.close();
    await fs.rm(tempDirPath, { recursive: true, force: true });
  });

  function openRawDatabase(): Database.Database {
    return new Database(tempDbPath);
  }

  it('initializes schema correctly', () => {
    const rawDatabase = openRawDatabase();

    try {
      const tables = rawDatabase
        .prepare(
          `
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
            AND name IN ('users', 'session', 'posts')
          ORDER BY name ASC
        `,
        )
        .all() as { name: string }[];

      expect(tables.map((table) => table.name)).toEqual(['posts', 'session', 'users']);
    } finally {
      rawDatabase.close();
    }
  });

  it('creates the single session row if missing', () => {
    const firstRawDatabase = openRawDatabase();

    try {
      const firstSessionRows = firstRawDatabase
        .prepare('SELECT id, user_id as userId FROM session ORDER BY id ASC')
        .all() as { id: number; userId: number | null }[];

      expect(firstSessionRows).toEqual([{ id: 1, userId: null }]);
    } finally {
      firstRawDatabase.close();
    }

    appDatabase.close();
    appDatabase = new AppDatabase(tempDbPath);

    const secondRawDatabase = openRawDatabase();

    try {
      const sessionRowCount = secondRawDatabase
        .prepare('SELECT COUNT(*) as count FROM session WHERE id = 1')
        .get() as { count: number };

      expect(sessionRowCount.count).toBe(1);
    } finally {
      secondRawDatabase.close();
    }
  });

  it('saveUser inserts a new user', () => {
    appDatabase.saveUser(userOne);

    const rawDatabase = openRawDatabase();

    try {
      const users = rawDatabase
        .prepare('SELECT id, name, email FROM users ORDER BY id ASC')
        .all() as DbUser[];

      expect(users).toEqual([userOne]);
    } finally {
      rawDatabase.close();
    }
  });

  it('saveUser updates an existing user', () => {
    appDatabase.saveUser(userOne);
    appDatabase.saveUser({
      id: userOne.id,
      name: 'Updated Name',
      email: 'updated@example.com',
    });

    const rawDatabase = openRawDatabase();

    try {
      const users = rawDatabase
        .prepare('SELECT id, name, email FROM users ORDER BY id ASC')
        .all() as DbUser[];

      expect(users).toEqual([
        {
          id: userOne.id,
          name: 'Updated Name',
          email: 'updated@example.com',
        },
      ]);
    } finally {
      rawDatabase.close();
    }
  });

  it('setActiveSession + getActiveSessionUser work correctly', () => {
    appDatabase.saveUser(userOne);
    appDatabase.setActiveSession(userOne.id);

    expect(appDatabase.getActiveSessionUser()).toEqual(userOne);
  });

  it('clearActiveSession clears the active session', () => {
    appDatabase.saveUser(userOne);
    appDatabase.setActiveSession(userOne.id);
    appDatabase.clearActiveSession();

    expect(appDatabase.getActiveSessionUser()).toBeNull();
  });

  it('savePosts inserts posts', () => {
    appDatabase.saveUser(userOne);

    const posts: DbPost[] = [
      {
        id: 101,
        userId: userOne.id,
        title: 'First post',
        body: 'First body',
        comments: null,
      },
      {
        id: 102,
        userId: userOne.id,
        title: 'Second post',
        body: 'Second body',
        comments: 3,
      },
    ];

    appDatabase.savePosts(posts);

    expect(appDatabase.getPostsByUserId(userOne.id)).toEqual(posts);
  });

  it('savePosts updates existing posts without duplicating them', () => {
    appDatabase.saveUser(userOne);
    appDatabase.saveUser(userTwo);

    appDatabase.savePosts([
      {
        id: 201,
        userId: userOne.id,
        title: 'Original title',
        body: 'Original body',
        comments: 2,
      },
    ]);

    appDatabase.savePosts([
      {
        id: 201,
        userId: userTwo.id,
        title: 'Updated title',
        body: 'Updated body',
        comments: 99,
      },
    ]);

    const rawDatabase = openRawDatabase();

    try {
      const postRows = rawDatabase
        .prepare(
          `
          SELECT id, user_id as userId, title, body, comments
          FROM posts
          WHERE id = 201
        `,
        )
        .all() as DbPost[];

      expect(postRows).toHaveLength(1);
      expect(postRows[0]).toEqual({
        id: 201,
        userId: userTwo.id,
        title: 'Updated title',
        body: 'Updated body',
        comments: 2,
      });
    } finally {
      rawDatabase.close();
    }
  });

  it('getPostsByUserId returns only the requested user posts in order', () => {
    appDatabase.saveUser(userOne);
    appDatabase.saveUser(userTwo);

    appDatabase.savePosts([
      {
        id: 30,
        userId: userOne.id,
        title: 'User one - third',
        body: 'Body 30',
        comments: null,
      },
      {
        id: 10,
        userId: userOne.id,
        title: 'User one - first',
        body: 'Body 10',
        comments: null,
      },
      {
        id: 20,
        userId: userTwo.id,
        title: 'User two - only',
        body: 'Body 20',
        comments: null,
      },
      {
        id: 25,
        userId: userOne.id,
        title: 'User one - second',
        body: 'Body 25',
        comments: null,
      },
    ]);

    expect(appDatabase.getPostsByUserId(userOne.id)).toEqual([
      {
        id: 10,
        userId: userOne.id,
        title: 'User one - first',
        body: 'Body 10',
        comments: null,
      },
      {
        id: 25,
        userId: userOne.id,
        title: 'User one - second',
        body: 'Body 25',
        comments: null,
      },
      {
        id: 30,
        userId: userOne.id,
        title: 'User one - third',
        body: 'Body 30',
        comments: null,
      },
    ]);
  });

  it('updatePostComments updates only the target post', () => {
    appDatabase.saveUser(userOne);

    appDatabase.savePosts([
      {
        id: 301,
        userId: userOne.id,
        title: 'Target post',
        body: 'Target body',
        comments: null,
      },
      {
        id: 302,
        userId: userOne.id,
        title: 'Untouched post',
        body: 'Untouched body',
        comments: 5,
      },
    ]);

    appDatabase.updatePostComments(301, 12);

    expect(appDatabase.getPostsByUserId(userOne.id)).toEqual([
      {
        id: 301,
        userId: userOne.id,
        title: 'Target post',
        body: 'Target body',
        comments: 12,
      },
      {
        id: 302,
        userId: userOne.id,
        title: 'Untouched post',
        body: 'Untouched body',
        comments: 5,
      },
    ]);
  });
});
