# 🚀 Quick Start - Sainte Platform

## New User? Start Here! 👇

### One Command Setup
```bash
./setup.sh
```

That's it! The script handles everything automatically.

---

## Common Commands

### Starting the Platform
```bash
./dev.sh              # Start backend + dashboard
# OR
npm run dev:backend   # Backend only (port 3000)
npm run dev:dashboard # Dashboard only (port 3001)
npm run dev:mobile    # Mobile app
```

### Checking Status
```bash
./status.sh           # Check all services
docker compose ps     # Check Docker containers
```

### Stopping Everything
```bash
./stop.sh            # Stop all services
docker compose down  # Stop Docker containers
```

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sainte.ai | admin123 |
| Doctor | doctor@sainte.ai | doctor123 |
| Nurse | nurse@sainte.ai | nurse123 |
| Patient | john.doe@example.com | patient123 |
| Patient | jane.smith@example.com | patient123 |

---

## Endpoints

- **Backend API**: http://localhost:3000
- **Dashboard**: http://localhost:3001
- **Health Check**: http://localhost:3000/health
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Weaviate**: localhost:8080

---

## Something Broke? 🔧

### Quick Fix
```bash
./setup.sh  # Re-runs complete setup
```

### Need Help?
Read [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions to common issues.

---

## Project Structure

```
voice-first-care-platform/
├── packages/
│   ├── backend/      # Node.js API (Express + Prisma)
│   ├── dashboard/    # Next.js admin dashboard
│   └── mobile/       # React Native + Expo app
├── setup.sh          # ⭐ Automated setup script
├── dev.sh            # Start backend + dashboard
├── status.sh         # Check service status
├── stop.sh           # Stop all services
└── TROUBLESHOOTING.md # Detailed troubleshooting guide
```

---

## NPM Scripts

```bash
npm run dev:backend   # Start backend
npm run dev:dashboard # Start dashboard
npm run dev:mobile    # Start mobile app
npm run build:all     # Build all packages
npm run test:all      # Test all packages
```

---

## Database Commands

```bash
cd packages/backend

# View database in GUI
npx prisma studio  # Opens at http://localhost:5555

# Reset database (⚠️ deletes all data)
npm run prisma:migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name

cd ../..
```

---

## Need More Info?

- **Setup Details**: [README.md](README.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Fix History**: [FIX_SUMMARY.md](FIX_SUMMARY.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)

---

**🎯 Remember:** When in doubt, run `./setup.sh`
