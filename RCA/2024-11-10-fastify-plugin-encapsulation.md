# RCA: Fastify Plugin Encapsulation Issue

**Date:** 2024-11-10
**Severity:** High
**Component:** motorghar-fastify-gateway
**Status:** Resolved

---

## Summary

The `/v1/auth/me` endpoint was failing with 401 Unauthorized even when a valid JWT token was provided in the Authorization header. The root cause was Fastify's plugin encapsulation preventing the auth plugin's `onRequest` hook from accessing routes registered in a different encapsulation scope.

---

## Timeline

1. **Initial Symptom**: `/v1/auth/login` worked correctly and returned a valid JWT token
2. **Failure Point**: `/v1/auth/me` with the valid token returned 401 with error code `AUTH_REQUIRED`
3. **Investigation**: Discovered `request.user` was `undefined` in the route handler
4. **Root Cause**: Fastify plugin encapsulation prevented auth hook from running for routes
5. **Resolution**: Wrapped plugins with `fastify-plugin` to break encapsulation

---

## The Problem

### Symptoms

- ✅ `POST /v1/auth/login` - Returns valid JWT token
- ❌ `GET /v1/auth/me` with valid token - Returns 401 Unauthorized
- ❌ `request.user` is `undefined` in protected route handlers
- ✅ Token verification logic works correctly in isolation

### Error Response

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "User not authenticated"
  },
  "meta": {
    "timestamp": "2024-11-10T...",
    "requestId": "req-xxx"
  }
}
```

---

## Root Cause Analysis

### Understanding Fastify Plugin Encapsulation

Fastify uses **plugin encapsulation** to create isolated contexts. This is a powerful feature for modularity, but it means:

1. Plugins registered in one context don't automatically affect sibling contexts
2. Hooks (like `onRequest`) only apply to routes in the same or child contexts
3. Parent contexts cannot be modified by child plugins

### Our Application Structure (Broken)

```typescript
// app.ts
export async function buildApp() {
  const fastify = Fastify({ ... });

  // Creates encapsulated context A
  await fastify.register(registerPlugins);  // ← Auth hook registered here

  // Creates encapsulated context B (sibling to A)
  await fastify.register(registerRoutes);   // ← Routes registered here

  return fastify;
}
```

```typescript
// plugins/index.ts (Context A)
export const registerPlugins: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin);  // Hook registered in Context A
};

// plugins/auth.ts
export const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    // This hook ONLY applies to Context A, not Context B!
    const token = extractTokenFromHeader(request.headers.authorization);
    if (token) {
      request.user = verifyToken(token);
    }
  });
};
```

```typescript
// routes/index.ts (Context B - Sibling to A)
export const registerRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authRoutes);
};

// routes/auth.ts
export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/v1/auth/me', async (request, reply) => {
    // request.user is undefined because the hook from Context A never ran!
    if (!request.user) {
      return reply.status(401).send({ error: 'AUTH_REQUIRED' });
    }
    // ...
  });
};
```

### Visual Representation

```
Root Fastify Instance
│
├─ Context A (registerPlugins)
│  ├─ corsPlugin
│  ├─ requestLoggerPlugin
│  ├─ errorHandlerPlugin
│  └─ authPlugin ← onRequest hook lives here
│     └─ Hook: Set request.user
│
└─ Context B (registerRoutes) ← Sibling to Context A, cannot access its hooks!
   ├─ /health
   ├─ authRoutes
   │  ├─ POST /v1/auth/login ✅ (doesn't need request.user)
   │  └─ GET /v1/auth/me ❌ (needs request.user, but hook never runs)
   └─ proxyRoutes
```

**Result:** The `onRequest` hook in Context A never executes for routes in Context B, so `request.user` is never set.

---

## The Solution

Use `fastify-plugin` to break encapsulation barriers and make the auth plugin's hooks available globally.

### Code Changes

#### 1. Wrap the auth plugin implementation

```typescript
// plugins/auth.ts (BEFORE)
export const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    // Hook logic...
  });
};
```

```typescript
// plugins/auth.ts (AFTER)
import fp from 'fastify-plugin';

const authPluginImpl: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    // Hook logic...
  });
};

// Break encapsulation!
export const authPlugin = fp(authPluginImpl);
```

#### 2. Wrap the plugin registry

```typescript
// plugins/index.ts (BEFORE)
export const registerPlugins: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin);
  // ... other plugins
};
```

```typescript
// plugins/index.ts (AFTER)
import fp from 'fastify-plugin';

const registerPluginsImpl: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin);
  // ... other plugins
};

// Break encapsulation so plugins are available to all routes
export const registerPlugins = fp(registerPluginsImpl);
```

### Fixed Structure

```
Root Fastify Instance
│
├─ registerPlugins (wrapped with fp) ← No encapsulation boundary!
│  └─ authPlugin (wrapped with fp) ← Hook applies globally!
│     └─ Hook: Set request.user ✅
│
└─ registerRoutes
   └─ authRoutes
      ├─ POST /v1/auth/login ✅
      └─ GET /v1/auth/me ✅ ← Hook now runs, request.user is set!
```

---

## Testing

### Before Fix

```bash
# Login - works
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@motorghar.test","password":"admin123"}'
# Response: {"data":{"token":"eyJ..."}}

# Get user info - FAILS
TOKEN="eyJ..."
curl -X GET http://localhost:3000/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
# Response: {"error":{"code":"AUTH_REQUIRED"}} ❌
```

### After Fix

```bash
# Login - works
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@motorghar.test","password":"admin123"}'
# Response: {"data":{"token":"eyJ..."}}

# Get user info - WORKS
TOKEN="eyJ..."
curl -X GET http://localhost:3000/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
# Response: {"data":{"id":"...","email":"admin@motorghar.test","role":"admin"}} ✅
```

---

## Lessons Learned

### 1. Fastify Plugin Encapsulation is Opt-In, Not Opt-Out

- By default, all plugins create encapsulation boundaries
- Use `fastify-plugin` explicitly when you need cross-boundary behavior

### 2. Hooks and Decorators Need Special Attention

- `onRequest`, `onResponse`, `preHandler` hooks are scope-specific
- Decorators (like `request.user`) also need the plugin to break encapsulation

### 3. Test with Real Integration Tests

- Unit tests might not catch encapsulation issues
- Integration tests that span multiple plugin contexts are essential

---

## Prevention Strategies

### 1. Use `fastify-plugin` for Infrastructure Plugins

Plugins that provide:
- Global hooks (auth, logging, error handling)
- Decorators (request.user, request.log)
- Shared utilities

Should always be wrapped with `fastify-plugin`.

### 2. Follow Fastify Best Practices

```typescript
// ✅ Good: Infrastructure plugin
import fp from 'fastify-plugin';

const myAuthPlugin = fp(async (fastify) => {
  fastify.addHook('onRequest', authHandler);
});

// ✅ Good: Route plugin (encapsulation is fine)
const myRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/users', getUsers);
  fastify.post('/users', createUser);
};
```

### 3. Document Plugin Boundaries

Add comments explaining encapsulation decisions:

```typescript
// Break encapsulation - this auth hook must run for all routes
export const authPlugin = fp(authPluginImpl);

// Encapsulated - these routes are self-contained
export const userRoutes: FastifyPluginAsync = async (fastify) => {
  // ...
};
```

### 4. Add Integration Tests Early

```typescript
describe('Auth Integration', () => {
  it('should authenticate across plugin boundaries', async () => {
    const app = await buildApp();

    // Login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'test@example.com', password: 'pass' }
    });
    const { token } = loginRes.json().data;

    // Use token on protected route
    const meRes = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
      headers: { authorization: `Bearer ${token}` }
    });

    expect(meRes.statusCode).toBe(200); // Would fail before fix!
  });
});
```

---

## References

- [Fastify Plugin Guide](https://fastify.dev/docs/latest/Reference/Plugins/)
- [fastify-plugin Documentation](https://github.com/fastify/fastify-plugin)
- [Fastify Encapsulation](https://fastify.dev/docs/latest/Reference/Encapsulation/)

---

## Related Files

- `apps/motorghar/fastify-gateway/src/plugins/auth.ts`
- `apps/motorghar/fastify-gateway/src/plugins/index.ts`
- `apps/motorghar/fastify-gateway/src/routes/auth.ts`
- `apps/motorghar/fastify-gateway/src/app.ts`
