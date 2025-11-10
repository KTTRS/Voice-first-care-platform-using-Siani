# Mobile App Testing Checklist

## Pre-Test Setup

### 1. Backend Services

- [ ] PostgreSQL running (port 5432)
- [ ] Redis running (port 6379)
- [ ] Weaviate running (port 8080)
- [ ] Backend API running (port 3000)
- [ ] Health check responds: `curl http://localhost:3000/health`

### 2. Database

- [ ] Migrations applied
- [ ] Seed data loaded
- [ ] Test user exists: `john.doe@example.com`

### 3. Mobile App

- [ ] Dependencies installed (1467 packages)
- [ ] AsyncStorage package available
- [ ] Expo CLI available globally or via npx

## Test Scenarios

### Scenario 1: First Launch (No Token)

**Expected Behavior**: App should redirect to login screen

**Steps**:

1. Start mobile app: `cd packages/mobile && ./start-mobile.sh`
2. Open in simulator/device
3. Observe initial screen

**Pass Criteria**:

- [ ] Login screen is displayed
- [ ] Email and password fields visible
- [ ] "Login" button visible
- [ ] Test credentials displayed

**Fail Criteria**:

- [ ] App crashes on launch
- [ ] Stuck on blank screen
- [ ] Shows home screen without login

---

### Scenario 2: Successful Login

**Expected Behavior**: User can login with valid credentials

**Test Credentials**:

- Email: `john.doe@example.com`
- Password: `patient123`

**Steps**:

1. Enter email in email field
2. Enter password in password field
3. Tap "Login" button
4. Wait for response

**Pass Criteria**:

- [ ] Loading indicator appears
- [ ] Successfully navigates to home screen
- [ ] Welcome message shows user name: "Welcome, John Doe!"
- [ ] Logout button visible in header
- [ ] Navigation buttons visible (Goals, Feed)

**Fail Criteria**:

- [ ] Error message appears
- [ ] Stuck on login screen
- [ ] App crashes
- [ ] No loading indicator

---

### Scenario 3: Invalid Login

**Expected Behavior**: Error message for wrong credentials

**Test Credentials**:

- Email: `wrong@example.com`
- Password: `wrongpassword`

**Steps**:

1. Enter invalid email
2. Enter invalid password
3. Tap "Login" button

**Pass Criteria**:

- [ ] Error message displayed
- [ ] Stays on login screen
- [ ] Can retry with correct credentials

**Fail Criteria**:

- [ ] App crashes
- [ ] No error message
- [ ] Blank screen

---

### Scenario 4: Navigate to Goals

**Expected Behavior**: Goals screen loads user's goals

**Steps**:

1. Ensure logged in
2. Tap "🎯 View Goals" button
3. Wait for goals to load

**Pass Criteria**:

- [ ] Goals screen appears
- [ ] Goals list is displayed
- [ ] Shows user's goals from seed data
- [ ] Goals have titles and descriptions
- [ ] Can navigate back to home

**Fail Criteria**:

- [ ] Blank screen
- [ ] Error message
- [ ] No goals displayed
- [ ] App crashes

---

### Scenario 5: Navigate to Feed

**Expected Behavior**: Feed screen loads activity feed

**Steps**:

1. Ensure logged in
2. Tap "📰 View Feed" button
3. Wait for feed to load

**Pass Criteria**:

- [ ] Feed screen appears
- [ ] Feed events are displayed
- [ ] Events show timestamps
- [ ] Events show descriptions
- [ ] Can navigate back to home

**Fail Criteria**:

- [ ] Blank screen
- [ ] Error message
- [ ] No events displayed
- [ ] App crashes

---

### Scenario 6: Logout

**Expected Behavior**: User can logout and return to login screen

**Steps**:

1. Ensure logged in on home screen
2. Tap "Logout" button in header
3. Observe confirmation dialog
4. Tap "Logout" in dialog

**Pass Criteria**:

- [ ] Confirmation dialog appears
- [ ] Dialog asks "Are you sure you want to logout?"
- [ ] After confirming, navigates to login screen
- [ ] Token removed from storage
- [ ] Cannot access home screen without login

**Fail Criteria**:

- [ ] No confirmation dialog
- [ ] Stays on home screen
- [ ] Can still access protected screens
- [ ] App crashes

---

### Scenario 7: Cancel Logout

**Expected Behavior**: User can cancel logout

**Steps**:

1. Ensure logged in on home screen
2. Tap "Logout" button
3. Tap "Cancel" in dialog

**Pass Criteria**:

- [ ] Dialog closes
- [ ] Stays on home screen
- [ ] Still logged in
- [ ] Can continue using app

**Fail Criteria**:

- [ ] Forced to logout
- [ ] App crashes

---

### Scenario 8: Token Persistence

**Expected Behavior**: Login persists after app restart

**Steps**:

1. Login successfully
2. Navigate to home screen
3. Close app completely (force quit)
4. Reopen app

**Pass Criteria**:

- [ ] App reopens to home screen (not login)
- [ ] Welcome message still shows
- [ ] Can navigate to Goals and Feed
- [ ] No need to login again

**Fail Criteria**:

- [ ] Redirected to login screen
- [ ] Token lost
- [ ] Must login again

---

### Scenario 9: Protected Routes

**Expected Behavior**: Cannot access protected screens without token

**Steps**:

1. Ensure logged out
2. Try to manually navigate to `/goals` or `/feed`

**Pass Criteria**:

- [ ] Redirected to login screen
- [ ] Cannot access protected content
- [ ] Must login first

**Fail Criteria**:

- [ ] Can access protected screens
- [ ] No redirect

---

### Scenario 10: API Authentication

**Expected Behavior**: API requests include Bearer token

**Steps**:

1. Login successfully
2. Navigate to Goals screen
3. Check network requests (enable React Native debugger)

**Pass Criteria**:

- [ ] API request includes `Authorization: Bearer <token>` header
- [ ] Token matches stored token
- [ ] Backend returns 200 OK
- [ ] Data loads successfully

**Fail Criteria**:

- [ ] No Authorization header
- [ ] Wrong token format
- [ ] Backend returns 401/403
- [ ] No data loads

---

### Scenario 11: Token Expiration (Manual Test)

**Expected Behavior**: Expired token redirects to login

**Steps**:

1. Login successfully
2. Manually edit token in AsyncStorage to be expired
3. Navigate to Goals or Feed

**Pass Criteria**:

- [ ] Backend returns 403 Forbidden
- [ ] App handles error gracefully
- [ ] Redirects to login screen (if error handling implemented)

**Note**: This scenario may fail if error handling isn't implemented yet

---

### Scenario 12: Network Error Handling

**Expected Behavior**: App handles network errors

**Steps**:

1. Stop backend server
2. Try to login
3. Restart backend and try again

**Pass Criteria**:

- [ ] Shows network error message
- [ ] Doesn't crash
- [ ] Can retry when backend is back

**Fail Criteria**:

- [ ] App crashes
- [ ] No error message
- [ ] Stuck loading

---

## Browser Testing (Expo Web)

### Scenario 13: Web Browser Test

**Expected Behavior**: App works in web browser

**Steps**:

1. Start Expo: `npx expo start`
2. Press `w` to open in web browser
3. Test login flow

**Pass Criteria**:

- [ ] App loads in browser
- [ ] Can login successfully
- [ ] Can navigate screens
- [ ] AsyncStorage works (localStorage in browser)

**Note**: Some React Native features may not work perfectly in web

---

## iOS Simulator Testing

### Scenario 14: iOS Simulator

**Expected Behavior**: App works on iOS

**Steps**:

1. Start Expo: `npx expo start`
2. Press `i` to open iOS simulator
3. Run through all scenarios above

**Pass Criteria**:

- [ ] All scenarios pass on iOS
- [ ] Keyboard handling works (KeyboardAvoidingView)
- [ ] Navigation works
- [ ] AsyncStorage works

---

## Android Emulator Testing

### Scenario 15: Android Emulator

**Expected Behavior**: App works on Android

**Steps**:

1. Start Expo: `npx expo start`
2. Press `a` to open Android emulator
3. Run through all scenarios above

**Pass Criteria**:

- [ ] All scenarios pass on Android
- [ ] Keyboard handling works
- [ ] Navigation works
- [ ] AsyncStorage works

**Note**: Android emulator uses `http://10.0.2.2:3000` to access localhost

---

## Physical Device Testing

### Scenario 16: Physical Device (Expo Go)

**Expected Behavior**: App works on real device

**Steps**:

1. Install Expo Go app on phone
2. Start Expo: `npx expo start`
3. Scan QR code with camera (iOS) or Expo Go app (Android)
4. Run through all scenarios above

**Pass Criteria**:

- [ ] App loads on physical device
- [ ] Can login successfully
- [ ] All features work

**Note**: Backend must be accessible from device (use computer's IP address)

---

## Performance Testing

### Scenario 17: Performance Check

**Expected Behavior**: App is responsive

**Checks**:

- [ ] Login response < 2 seconds
- [ ] Screen navigation is smooth
- [ ] No lag when scrolling goals/feed
- [ ] No memory leaks
- [ ] App doesn't freeze

---

## Security Testing

### Scenario 18: Security Checks

**Expected Behavior**: App follows security best practices

**Checks**:

- [ ] Password field is masked
- [ ] Token not visible in logs
- [ ] Token stored securely in AsyncStorage
- [ ] HTTPS used in production
- [ ] No sensitive data in error messages

---

## Bug Tracking Template

### Bug Report

```markdown
**Bug**: [Short description]

**Severity**: Critical | High | Medium | Low

**Scenario**: [Which test scenario]

**Steps to Reproduce**:

1.
2.
3.

**Expected**: [What should happen]

**Actual**: [What actually happened]

**Environment**:

- Platform: iOS | Android | Web
- Device: Simulator | Emulator | Physical
- Expo Version:
- Backend Running: Yes | No

**Screenshots**: [If applicable]

**Logs**: [Error messages]
```

---

## Test Results Summary

**Date**: \***\*\_\*\***
**Tester**: \***\*\_\*\***
**Environment**: \***\*\_\*\***

| Scenario               | Status        | Notes |
| ---------------------- | ------------- | ----- |
| 1. First Launch        | ☐ Pass ☐ Fail |       |
| 2. Successful Login    | ☐ Pass ☐ Fail |       |
| 3. Invalid Login       | ☐ Pass ☐ Fail |       |
| 4. Navigate to Goals   | ☐ Pass ☐ Fail |       |
| 5. Navigate to Feed    | ☐ Pass ☐ Fail |       |
| 6. Logout              | ☐ Pass ☐ Fail |       |
| 7. Cancel Logout       | ☐ Pass ☐ Fail |       |
| 8. Token Persistence   | ☐ Pass ☐ Fail |       |
| 9. Protected Routes    | ☐ Pass ☐ Fail |       |
| 10. API Authentication | ☐ Pass ☐ Fail |       |
| 11. Token Expiration   | ☐ Pass ☐ Fail |       |
| 12. Network Error      | ☐ Pass ☐ Fail |       |
| 13. Web Browser        | ☐ Pass ☐ Fail |       |
| 14. iOS Simulator      | ☐ Pass ☐ Fail |       |
| 15. Android Emulator   | ☐ Pass ☐ Fail |       |
| 16. Physical Device    | ☐ Pass ☐ Fail |       |
| 17. Performance        | ☐ Pass ☐ Fail |       |
| 18. Security           | ☐ Pass ☐ Fail |       |

**Overall Pass Rate**: \_\_\_\_ / 18

**Critical Issues**:

**Recommendations**:

---

## Quick Test Commands

```bash
# Check backend health
curl http://localhost:3000/health

# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"patient123"}'

# Start mobile app
cd packages/mobile && ./start-mobile.sh

# Clear app data (iOS simulator)
xcrun simctl uninstall booted com.anonymous.mobile

# Clear app data (Android emulator)
adb uninstall com.anonymous.mobile

# View React Native logs
npx react-native log-ios
npx react-native log-android
```

---

**Ready to Test!** 🚀

Start with Scenario 1 and work through each test systematically.
Document any failures and create bug reports.
