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

describe('Cards (e2e)', () => {
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

  async function createBoard(): Promise<number> {
    const res = await request(server)
      .post('/api/boards')
      .set('Authorization', `Bearer ${admin}`)
      .send({ title: 'board' })
      .expect(201);
    return res.body.id as number;
  }

  async function createColumn(boardId: number): Promise<number> {
    const res = await request(server)
      .post('/api/columns')
      .set('Authorization', `Bearer ${admin}`)
      .send({ title: 'col', boardId })
      .expect(201);
    return res.body.id as number;
  }

  async function createCard(columnId: number, title = 'card'): Promise<number> {
    const res = await request(server)
      .post('/api/cards')
      .set('Authorization', `Bearer ${admin}`)
      .send({ title, columnId })
      .expect(201);
    return res.body.id as number;
  }

  describe('POST /cards', () => {
    it('creates a rich card with a default priority', async () => {
      const boardId = await createBoard();
      const columnId = await createColumn(boardId);
      const res = await request(server)
        .post('/api/cards')
        .set('Authorization', `Bearer ${admin}`)
        .send({
          title: 'Design',
          description: 'the landing page',
          priority: 'high',
          dueDate: '2026-07-01',
          columnId,
        })
        .expect(201);
      expect(res.body.title).toBe('Design');
      expect(res.body.priority).toBe('high');
      expect(typeof res.body.position).toBe('number');
    });

    it('rejects an invalid priority with 400', async () => {
      const boardId = await createBoard();
      const columnId = await createColumn(boardId);
      await request(server)
        .post('/api/cards')
        .set('Authorization', `Bearer ${admin}`)
        .send({ title: 'bad', priority: 'urgent', columnId })
        .expect(400);
    });

    it('forbids creation without cards.create with 403', async () => {
      const boardId = await createBoard();
      const columnId = await createColumn(boardId);
      const user = await createUser(ctx, {
        email: 'nocards@b.com',
        permissionNames: ['boards.read'],
      });
      await request(server)
        .post('/api/cards')
        .set('Authorization', `Bearer ${tokenFor(ctx, user.id, user.email)}`)
        .send({ title: 'nope', columnId })
        .expect(403);
    });
  });

  describe('PATCH /cards/:id', () => {
    it('updates editable fields', async () => {
      const boardId = await createBoard();
      const columnId = await createColumn(boardId);
      const id = await createCard(columnId);
      const res = await request(server)
        .patch(`/api/cards/${id}`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ title: 'Renamed', priority: 'low' })
        .expect(200);
      expect(res.body.title).toBe('Renamed');
      expect(res.body.priority).toBe('low');
    });
  });

  describe('PATCH /cards/:id/move', () => {
    it('moves a card to another column and persists the new position', async () => {
      const boardId = await createBoard();
      const from = await createColumn(boardId);
      const to = await createColumn(boardId);
      const id = await createCard(from);

      const res = await request(server)
        .patch(`/api/cards/${id}/move`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ columnId: to, position: 512 })
        .expect(200);

      expect(res.body.columnId).toBe(to);
      expect(res.body.position).toBe(512);
    });
  });

  describe('DELETE /cards/:id', () => {
    it('deletes a card', async () => {
      const boardId = await createBoard();
      const columnId = await createColumn(boardId);
      const id = await createCard(columnId);
      await request(server)
        .delete(`/api/cards/${id}`)
        .set('Authorization', `Bearer ${admin}`)
        .expect(200);
    });

    it('returns 404 for a missing card', async () => {
      await request(server)
        .delete('/api/cards/999999')
        .set('Authorization', `Bearer ${admin}`)
        .expect(404);
    });
  });
});
