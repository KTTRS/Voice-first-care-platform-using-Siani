# Mobile App Quick Reference

## 🚀 Start Commands

```bash
# Start mobile app
cd packages/mobile
./start-mobile.sh

# Or manually
npx expo start

# Platform shortcuts
i  # iOS simulator
a  # Android emulator
w  # Web browser
r  # Reload
c  # Clear cache
```

## 🔐 Test Credentials

```
Email: john.doe@example.com
Password: patient123
```

## 📱 App Structure

```
/                  # Home screen (requires auth)
/login             # Login screen (public)
/goals             # Goals list (requires auth)
/feed              # Activity feed (requires auth)
```

## 🛠️ Key Files

```
packages/mobile/
├── app/
│   ├── _layout.tsx      # Auth routing
│   ├── index.tsx        # Home screen
│   ├── login.tsx        # Login screen
│   ├── goals.tsx        # Goals screen
│   └── feed.tsx         # Feed screen
└── lib/
    └── api.ts           # API client with auth
```

## 🔑 API Functions

```typescript
// Authentication
await login(email, password);
await logout();
await register(data);

// Token management
await getToken();
await setToken(token);
await removeToken();

// User data
await getUser();
await setUser(user);

// API calls (auto-includes token)
await fetchAPI("/goals");
await fetchAPI("/feed");
```

## 🌐 API Endpoints

```
POST /api/auth/login      # Login
POST /api/auth/register   # Register
GET  /api/goals           # Goals list
GET  /api/feed            # Feed events
GET  /health              # Health check
```

## 💾 AsyncStorage Keys

```
accessToken  # JWT token
user         # User data object
```

## 🐛 Debugging

```bash
# View logs
npx react-native log-ios
npx react-native log-android

# Clear cache
npx expo start --clear

# Reset app data
xcrun simctl uninstall booted com.anonymous.mobile  # iOS
adb uninstall com.anonymous.mobile                   # Android

# Check backend
curl http://localhost:3000/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"password123"}'
```

## 🔧 Common Issues

### "Network request failed"

- Backend not running
- Wrong API URL
- iOS: Use `localhost`
- Android emulator: Use `10.0.2.2`
- Physical device: Use computer's IP

### "401 Unauthorized"

- Not logged in
- Token expired (7 days)
- Token missing from request

### "403 Forbidden"

- Invalid token
- Token expired
- Wrong JWT_SECRET

### App stuck on login

- Check backend running
- Verify credentials
- Check console errors

## 📚 Documentation

- **Mobile Auth Guide**: `MOBILE_AUTH_GUIDE.md`
- **Implementation Summary**: `MOBILE_IMPLEMENTATION_SUMMARY.md`
- **Testing Checklist**: `MOBILE_TESTING_CHECKLIST.md`
- **Main README**: `README.md`

## 🎯 Testing Flow

1. ✅ Backend running
2. ✅ Start mobile app
3. ✅ Login with test credentials
4. ✅ Navigate to Goals
5. ✅ Navigate to Feed
6. ✅ Logout
7. ✅ Verify redirect to login
8. ✅ Login again
9. ✅ Close and reopen app
10. ✅ Verify still logged in

## 🔒 Security Notes

- Passwords hashed with bcrypt
- JWT signed with secret
- 7-day token expiration
- Tokens in AsyncStorage (secure)
- Bearer token in headers
- Change JWT_SECRET in production

## 📱 Platform Support

- ✅ iOS Simulator
- ✅ Android Emulator
- ✅ Physical devices (Expo Go)
- ✅ Web browser (limited)

## 🚨 Known Limitations

- No refresh tokens
- No biometric auth
- No password reset
- No offline support
- Basic error handling
- Test-token still active on backend

## ⚡ Quick Tips

- Use `./start-mobile.sh` for quick start
- Test credentials always visible on login screen
- Logout requires confirmation
- Token persists across app restarts
- All API calls auto-authenticated
- Backend seed data pre-loaded

## 📞 Need Help?

- Check `MOBILE_AUTH_GUIDE.md` for detailed auth docs
- Check `MOBILE_TESTING_CHECKLIST.md` for testing scenarios
- Check `MOBILE_IMPLEMENTATION_SUMMARY.md` for overview
- Check backend logs: `docker-compose logs -f`
- Check mobile logs: `npx react-native log-ios`

---

**Happy Coding!** 🎉
