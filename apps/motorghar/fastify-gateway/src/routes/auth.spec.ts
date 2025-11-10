import { buildApp } from '../app';
import { FastifyInstance } from 'fastify';

describe('Auth Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/auth/login', () => {
    it('should return token for valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'admin@motorghar.test',
          password: 'admin123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.token).toBeDefined();
      expect(body.data.user.role).toBe('admin');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'wrong@email.com',
          password: 'wrongpass',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /v1/auth/me', () => {
    it('should return user info with valid token', async () => {
      // First login
      const loginRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'admin@motorghar.test',
          password: 'admin123',
        },
      });

      const { token } = JSON.parse(loginRes.body).data;

      // Then get user info
      const response = await app.inject({
        method: 'GET',
        url: '/v1/auth/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.email).toBe('admin@motorghar.test');
    });

    it('should return 401 without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});