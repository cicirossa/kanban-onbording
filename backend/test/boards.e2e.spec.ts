import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from 'bun:test';
import request from 'supertest';
import type { App } from 'supertest/types';
import { setupTestApp, type TestContext } from './utils/setup-app';
import { adminEmail, adminToken, createUser, tokenFor } from './utils/auth';
import { cleanDatabase } from './utils/db-clean';

describe('Boards (e2e)', () => {
  let ctx: TestContext;
  let server: App;
  let admin: string;

  beforeAll(async () => {
    ctx = await setupTestApp();
    server = ctx.app.getHttpServer() as App;
    admin = await adminToken(ctx);
  });

  beforeEach(async () => {
    await cleanDatabase(ctx.dataSource, adminEmail());
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function createBoard(title: string): Promise<number> {
    const res = await request(server)
      .post('/api/boards')
      .set('Authorization', `Bearer ${admin}`)
      .send({ title, description: 'temp' })
      .expect(201);
    return res.body.id as number;
  }

  describe('POST /boards', () => {
    it('creates a board for the owner', async () => {
      const res = await request(server)
        .post('/api/boards')
        .set('Authorization', `Bearer ${admin}`)
        .send({ title: 'Roadmap', description: 'Q3' })
        .expect(201);

      expect(res.body.title).toBe('Roadmap');
    });

    it('rejects a missing title with 400', async () => {
      await request(server)
        .post('/api/boards')
        .set('Authorization', `Bearer ${admin}`)
        .send({ description: 'no title' })
        .expect(400);
    });

    it('forbids creation without boards.create with 403', async () => {
      const user = await createUser(ctx, { email: 'noboards@b.com' });
      await request(server)
        .post('/api/boards')
        .set('Authorization', `Bearer ${tokenFor(ctx, user.id, user.email)}`)
        .send({ title: 'nope' })
        .expect(403);
    });
  });

  describe('GET /boards', () => {
    it('lists only the current user boards', async () => {
      await createBoard('mine');
      const res = await request(server)
        .get('/api/boards')
        .set('Authorization', `Bearer ${admin}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((b: { title: string }) => b.title === 'mine')).toBe(
        true,
      );
    });

    it('returns a single board (with columns) and 404 for a missing one', async () => {
      const id = await createBoard('single');
      const res = await request(server)
        .get(`/api/boards/${id}`)
        .set('Authorization', `Bearer ${admin}`)
        .expect(200);
      expect(Array.isArray(res.body.columns)).toBe(true);

      await request(server)
        .get('/api/boards/999999')
        .set('Authorization', `Bearer ${admin}`)
        .expect(404);
    });
  });

  describe('owner privacy', () => {
    it("returns 404 (not 403) when reading another user's board", async () => {
      const id = await createBoard('admin-only');
      // user B can read boards in general, but not THIS one — it isn't theirs.
      const userB = await createUser(ctx, {
        email: 'userb@b.com',
        permissionNames: ['boards.read'],
      });
      await request(server)
        .get(`/api/boards/${id}`)
        .set('Authorization', `Bearer ${tokenFor(ctx, userB.id, userB.email)}`)
        .expect(404);
    });
  });

  describe('PATCH /boards/:id', () => {
    it('updates a board', async () => {
      const id = await createBoard('patch');
      const res = await request(server)
        .patch(`/api/boards/${id}`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ title: 'patched' })
        .expect(200);
      expect(res.body.title).toBe('patched');
    });

    it('returns 404 for a missing board', async () => {
      await request(server)
        .patch('/api/boards/999999')
        .set('Authorization', `Bearer ${admin}`)
        .send({ title: 'x' })
        .expect(404);
    });
  });

  describe('DELETE /boards/:id', () => {
    it('deletes a board', async () => {
      const id = await createBoard('delete');
      await request(server)
        .delete(`/api/boards/${id}`)
        .set('Authorization', `Bearer ${admin}`)
        .expect(200);
    });

    it('returns 404 for a missing board', async () => {
      await request(server)
        .delete('/api/boards/999999')
        .set('Authorization', `Bearer ${admin}`)
        .expect(404);
    });
  });
});
