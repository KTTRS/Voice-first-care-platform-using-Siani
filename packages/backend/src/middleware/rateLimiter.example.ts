// Rate limiting middleware for production use
// 
// To enable rate limiting:
// 1. Install: npm install express-rate-limit
// 2. Import this file in src/index.ts
// 3. Apply limiters to routes as shown below

/*
import rateLimit from 'express-rate-limit';

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for write operations
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 write requests per windowMs
  message: 'Too many write operations from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Usage in routes:
// 
// Auth routes:
// router.post('/login', authLimiter, async (req, res) => { ... });
// router.post('/register', authLimiter, async (req, res) => { ... });
//
// Read routes:
// router.get('/patients', apiLimiter, authenticate, async (req, res) => { ... });
//
// Write routes:
// router.post('/signals', writeLimiter, authenticate, async (req, res) => { ... });
// router.put('/patients/:id', writeLimiter, authenticate, async (req, res) => { ... });

// For distributed systems with multiple servers, use a Redis store:
// 
// import RedisStore from 'rate-limit-redis';
// import { createClient } from 'redis';
// 
// const redisClient = createClient({
//   url: process.env.REDIS_URL,
// });
// 
// export const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   store: new RedisStore({
//     client: redisClient,
//     prefix: 'rl:',
//   }),
// });
*/

export {};
