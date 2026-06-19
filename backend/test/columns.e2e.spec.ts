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

describe('Columns (e2e)', () => {
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

  async function createBoard(title = 'board'): Promise<number> {
    const res = await request(server)
      .post('/api/boards')
      .set('Authorization', `Bearer ${admin}`)
      .send({ title })
      .expect(201);
    return res.body.id as number;
  }

  async function createColumn(boardId: number, title: string): Promise<number> {
    const res = await request(server)
      .post('/api/columns')
      .set('Authorization', `Bearer ${admin}`)
      .send({ title, boardId })
      .expect(201);
    return res.body.id as number;
  }

  describe('POST /columns', () => {
    it('creates a column with a server-assigned position', async () => {
      const boardId = await createBoard();
      const res = await request(server)
        .post('/api/columns')
        .set('Authorization', `Bearer ${admin}`)
        .send({ title: 'To Do', boardId })
        .expect(201);
      expect(res.body.title).toBe('To Do');
      expect(typeof res.body.position).toBe('number');
    });

    it('forbids creation without columns.create with 403', async () => {
      const boardId = await createBoard();
      const user = await createUser(ctx, {
        email: 'nocols@b.com',
        permissionNames: ['boards.read'],
      });
      await request(server)
        .post('/api/columns')
        .set('Authorization', `Bearer ${tokenFor(ctx, user.id, user.email)}`)
        .send({ title: 'nope', boardId })
        .expect(403);
    });
  });

  describe('GET /columns?boardId=', () => {
    it('lists the columns of a board', async () => {
      const boardId = await createBoard();
      await createColumn(boardId, 'To Do');
      const res = await request(server)
        .get(`/api/columns?boardId=${boardId}`)
        .set('Authorization', `Bearer ${admin}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('PATCH /columns/:id', () => {
    it('renames a column', async () => {
      const boardId = await createBoard();
      const id = await createColumn(boardId, 'Doing');
      const res = await request(server)
        .patch(`/api/columns/${id}`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ title: 'In Progress' })
        .expect(200);
      expect(res.body.title).toBe('In Progress');
    });
  });

  describe('PATCH /columns/:id/move', () => {
    it('persists a new position', async () => {
      const boardId = await createBoard();
      const id = await createColumn(boardId, 'col');
      const res = await request(server)
        .patch(`/api/columns/${id}/move`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ position: 4096 })
        .expect(200);
      expect(res.body.position).toBe(4096);
    });
  });

  describe('DELETE /columns/:id', () => {
    it('deletes a column', async () => {
      const boardId = await createBoard();
      const id = await createColumn(boardId, 'gone');
      await request(server)
        .delete(`/api/columns/${id}`)
        .set('Authorization', `Bearer ${admin}`)
        .expect(200);
    });

    it('returns 404 for a missing column', async () => {
      await request(server)
        .delete('/api/columns/999999')
        .set('Authorization', `Bearer ${admin}`)
        .expect(404);
    });
  });
});
