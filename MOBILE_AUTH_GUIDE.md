# Mobile Authentication Guide

## Overview

This guide documents the complete JWT authentication system for the Sainte mobile app.

## Architecture

### Backend (JWT Authentication)

- **Location**: `packages/backend/src/routes/auth.ts`
- **Endpoints**:
  - `POST /api/auth/login` - User login
  - `POST /api/auth/register` - User registration
- **Token**: JWT with 7-day expiration
- **Middleware**: `packages/backend/src/middleware/authenticate.ts`

### Mobile (React Native + Expo)

- **API Client**: `packages/mobile/lib/api.ts`
- **Storage**: AsyncStorage for token persistence
- **Login Screen**: `packages/mobile/app/login.tsx`
- **Auth Routing**: `packages/mobile/app/_layout.tsx`

## Authentication Flow

```
1. User opens app
   ↓
2. _layout.tsx checks for stored token
   ↓
3. No token? → Redirect to /login
   ↓
4. User enters credentials
   ↓
5. login() API call to backend
   ↓
6. Backend validates credentials
   ↓
7. Backend returns { accessToken, user }
   ↓
8. Mobile saves token to AsyncStorage
   ↓
9. Mobile saves user to AsyncStorage
   ↓
10. Navigate to home screen (/)
    ↓
11. All subsequent API calls include Bearer token
    ↓
12. Backend middleware verifies JWT on protected routes
```

## Testing the Authentication

### 1. Start the Mobile App

```bash
cd packages/mobile
npx expo start
```

Options:

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

### 2. Test Login Flow

**Test Credentials** (from seed data):

```
Email: john.doe@example.com
Password: patient123
```

**Expected Behavior**:

1. App opens to login screen (no token stored)
2. Enter credentials and tap "Login"
3. Loading indicator appears
4. On success: Navigate to home screen with welcome message
5. Token stored in AsyncStorage
6. User data stored in AsyncStorage

### 3. Test Authenticated Requests

Navigate to **Goals** or **Feed** screens:

- Goals screen should load user's goals
- Feed screen should load user's feed events
- Both use stored token automatically

### 4. Test Logout

On home screen:

1. Tap "Logout" button in header
2. Confirmation dialog appears
3. Tap "Logout" to confirm
4. Token removed from AsyncStorage
5. Navigate back to login screen

### 5. Test Token Persistence

1. Login successfully
2. Close the app completely
3. Reopen the app
4. Should stay logged in (token persisted)
5. Should navigate directly to home screen

## API Client Functions

### Token Management

```typescript
// Get stored token
const token = await getToken();

// Save token after login
await setToken("jwt-token-here");

// Remove token on logout
await removeToken();
```

### User Data Management

```typescript
// Get stored user
const user = await getUser();

// Save user data
await setUser({ id: 1, email: "user@example.com", name: "User" });
```

### Authentication Functions

```typescript
// Login
const { accessToken, user } = await login("email@example.com", "password");

// Register
const { accessToken, user } = await register({
  email: "new@example.com",
  password: "password123",
  name: "New User",
});

// Logout
await logout(); // Clears token and user from storage
```

### Making Authenticated Requests

```typescript
// fetchAPI automatically includes stored token
const goals = await fetchAPI("/goals");
const feed = await fetchAPI("/feed");
```

## Backend JWT Configuration

### Environment Variables

```env
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

⚠️ **Important**: Change this secret in production!

### JWT Payload Structure

```typescript
{
  userId: number,    // User ID
  email: string,     // User email
  role: string       // User role (PATIENT, PROVIDER, ADMIN)
}
```

### Token Expiration

- Default: 7 days
- Location: `packages/backend/src/routes/auth.ts`
- Configurable via `JWT_EXPIRATION` env var

## Applying JWT Middleware to Routes

The JWT middleware is ready but not yet applied to all routes. To protect a route:

### Example: Protecting Goals Route

```typescript
import { authenticate } from '../middleware/authenticate';

// Before
router.get('/goals', async (req, res) => { ... });

// After
router.get('/goals', authenticate, async (req, res) => { ... });
```

### Accessing User Info in Protected Routes

```typescript
router.get("/goals", authenticate, async (req, res) => {
  const userId = req.user.id; // From JWT payload
  const userEmail = req.user.email; // From JWT payload
  const userRole = req.user.role; // From JWT payload

  // Fetch user's goals
  const goals = await prisma.goal.findMany({
    where: { userId },
  });

  res.json(goals);
});
```

## Security Best Practices

### Mobile App

- ✅ Tokens stored in AsyncStorage (secure on device)
- ✅ Tokens sent in Authorization header (not in URL)
- ✅ No sensitive data in logs
- ⚠️ Consider implementing token refresh for production
- ⚠️ Add biometric authentication for enhanced security

### Backend

- ✅ Passwords hashed with bcrypt
- ✅ JWT signed with secret
- ✅ 7-day token expiration
- ⚠️ Change JWT_SECRET in production
- ⚠️ Implement refresh tokens for production
- ⚠️ Add rate limiting on auth endpoints
- ⚠️ Consider HTTPS only in production

## Troubleshooting

### Login fails with 401

- Check credentials match seeded users
- Verify backend is running: `curl http://localhost:3000/health`
- Check backend logs for errors

### "No token" error on protected routes

- Ensure user is logged in
- Check AsyncStorage has token: Enable React Native Debugger
- Verify token is being sent: Check network requests

### Token expired (403 error)

- Login again to get new token
- Consider implementing automatic token refresh

### App stuck on login screen after successful login

- Check navigation logic in login.tsx
- Verify `router.replace('/')` is called after login
- Check \_layout.tsx auth routing logic

### Protected routes return 403

- Verify JWT_SECRET matches between login and middleware
- Check token format in Authorization header
- Ensure middleware extracts userId correctly

## Migration from Test Token

Many routes currently use the old test-token authentication from `utils/auth.ts`:

```typescript
// Old way (test-token)
import { authenticate } from "../utils/auth";
router.get("/goals", authenticate, async (req, res) => {
  const userId = req.userId; // From test token
});
```

To migrate to JWT:

```typescript
// New way (JWT)
import { authenticate } from "../middleware/authenticate";
router.get("/goals", authenticate, async (req, res) => {
  const userId = req.user.id; // From JWT payload
});
```

**Routes to migrate**:

- `/api/goals/*`
- `/api/feed/*`
- `/api/streaks/*`
- `/api/daily-actions/*`
- `/api/signals/*`
- `/api/memory-moments/*`
- `/api/referral-loops/*`

## Testing Checklist

- [ ] Backend running on port 3000
- [ ] Mobile app starts successfully
- [ ] Login screen appears on first launch
- [ ] Can login with test credentials
- [ ] Welcome message shows user name
- [ ] Goals screen loads user goals
- [ ] Feed screen loads user feed
- [ ] Logout confirmation appears
- [ ] Logout clears token and redirects to login
- [ ] App persists login after restart
- [ ] Invalid credentials show error
- [ ] Network errors handled gracefully

## Next Steps

1. **Test the complete flow** - Follow testing steps above
2. **Migrate protected routes** - Apply JWT middleware to all routes
3. **Add error handling** - Handle 401/403 errors in mobile app
4. **Implement refresh tokens** - For better security in production
5. **Add registration screen** - Allow new users to sign up
6. **Add biometrics** - Face ID / Touch ID on mobile
7. **Add password reset** - Email-based password recovery
8. **Security audit** - Review before production deployment

## Resources

- **Expo Documentation**: https://docs.expo.dev/
- **AsyncStorage**: https://react-native-async-storage.github.io/async-storage/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
- **React Native Security**: https://reactnative.dev/docs/security
