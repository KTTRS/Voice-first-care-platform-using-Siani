# Quick Start Guide

Get the Sainte AI Care Platform running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Docker installed (for databases)
- Git installed

## Method 1: GitHub Codespaces (Easiest) ⭐

1. Click the "Code" button on GitHub
2. Select "Open with Codespaces"
3. Wait for the environment to initialize (~2 minutes)
4. Open three terminals and run:

**Terminal 1 - Start Databases:**
```bash
docker-compose up
```

**Terminal 2 - Start Backend:**
```bash
cd packages/backend
cp .env.example .env
# Edit .env if you have an OpenAI API key (optional)
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

**Terminal 3 - Start Dashboard:**
```bash
cd packages/dashboard
npm run dev
```

5. Open the dashboard at the forwarded port 3001 ✨

## Method 2: Local Development

### Step 1: Clone and Install
```bash
git clone https://github.com/KTTRS/Voice-first-care-platform-using-Siani.git
cd Voice-first-care-platform-using-Siani
npm install
```

### Step 2: Start Databases
```bash
docker-compose up -d
```

Wait for databases to be ready (~30 seconds):
```bash
docker-compose ps
# Both postgres and weaviate should show "healthy"
```

### Step 3: Configure Backend
```bash
cd packages/backend
cp .env.example .env
```

**Optional**: Edit `.env` and add your OpenAI API key for AI features:
```
OPENAI_API_KEY=sk-your-key-here
```

### Step 4: Initialize Database
```bash
# Still in packages/backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

You should see test credentials printed!

### Step 5: Start Backend
```bash
# Still in packages/backend
npm run dev
```

Backend runs at http://localhost:3000

### Step 6: Start Dashboard (New Terminal)
```bash
cd packages/dashboard
npm run dev
```

Dashboard runs at http://localhost:3001

### Step 7: Test the API

**Login as Admin:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sainte.ai",
    "password": "admin123"
  }'
```

Save the token from the response!

**Get Patients:**
```bash
curl http://localhost:3000/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Method 3: Mobile App

### Start Mobile App (After Backend is Running)
```bash
cd packages/mobile
npm run dev
```

Then:
- Press `w` for web browser
- Press `i` for iOS simulator (Mac only)
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Test Accounts

After seeding, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sainte.ai | admin123 |
| Doctor | doctor@sainte.ai | doctor123 |
| Nurse | nurse@sainte.ai | nurse123 |
| Patient | john.doe@example.com | patient123 |
| Patient | jane.smith@example.com | patient123 |

## API Endpoints to Try

### Authentication
```bash
POST /api/auth/login
POST /api/auth/register
```

### Patients (Authenticated)
```bash
GET /api/patients
GET /api/patients/:id
POST /api/patients
PUT /api/patients/:id
```

### Health Signals (Authenticated)
```bash
GET /api/signals/patient/:patientId
POST /api/signals
GET /api/signals/high-priority
GET /api/signals/analytics/:patientId
```

### Referrals (Authenticated)
```bash
GET /api/referrals/mine
POST /api/referrals
PATCH /api/referrals/:id
GET /api/referrals/analytics/overview
```

### Memory/AI (Authenticated, requires OpenAI key)
```bash
POST /api/memory
POST /api/memory/search
GET /api/memory/conversation/:conversationId
GET /api/memory/stats
```

## Troubleshooting

### Database Connection Error
```bash
# Check if Docker is running
docker ps

# Restart databases
docker-compose down
docker-compose up -d
```

### Port Already in Use
```bash
# Backend (port 3000)
lsof -ti:3000 | xargs kill -9

# Dashboard (port 3001)
lsof -ti:3001 | xargs kill -9
```

### Prisma Client Not Generated
```bash
cd packages/backend
npx prisma generate
```

### TypeScript Errors
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. ✅ Platform is running!
2. 📖 Read the [Architecture Documentation](ARCHITECTURE.md)
3. 🔒 Review [Security Considerations](SECURITY.md)
4. 🛠️ Check [Contributing Guidelines](CONTRIBUTING.md)
5. 🚀 Build amazing healthcare features!

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- See [SECURITY.md](SECURITY.md) for security best practices
- Open an issue on GitHub

Happy coding! 🎉
