# Troubleshooting Guide

This guide helps you resolve common issues when setting up and running the Sainte platform.

## Quick Fix: Everything Broke

If you're seeing errors and the platform stopped working, run this automated setup:

```bash
./setup.sh
```

This script will:
- ✅ Install all dependencies
- ✅ Create `.env` files with correct configuration
- ✅ Start Docker services (PostgreSQL, Redis, Weaviate)
- ✅ Generate Prisma client
- ✅ Run database migrations
- ✅ Seed database with test users

## Common Issues

### 1. "Cannot connect to database"

**Symptoms:**
- Backend fails to start with database connection errors
- Error: `Can't reach database server at localhost:5432`

**Solution:**
```bash
# Start Docker services
docker compose up -d postgres redis weaviate

# Check if services are running
docker compose ps

# All services should show as "healthy"
```

**If services won't start:**
```bash
# Stop all containers
docker compose down

# Remove volumes (WARNING: This deletes all data)
docker compose down -v

# Start fresh
docker compose up -d
```

### 2. "Prisma Client not generated"

**Symptoms:**
- Error: `Cannot find module '@prisma/client'`
- Error: `PrismaClient is unable to run in the browser`

**Solution:**
```bash
cd packages/backend
npm run prisma:generate
cd ../..
```

### 3. "Database migrations not applied"

**Symptoms:**
- Prisma errors about missing tables
- SQL errors when starting backend

**Solution:**
```bash
cd packages/backend
npm run prisma:migrate
cd ../..
```

### 4. "Missing environment variables"

**Symptoms:**
- Backend crashes on startup
- Error: `JWT_SECRET is required`
- Error: `DATABASE_URL is not set`

**Solution:**

Create `.env` files manually:

**Backend (`packages/backend/.env`):**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sainte_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY=""
TRANSCRIPTION_STRATEGY="local"
LOCAL_WHISPER_URL="http://localhost:8000/transcribe"
LOCAL_WHISPER_TIMEOUT="30000"
DELETE_AUDIO_AFTER_TRANSCRIPTION="true"
WEAVIATE_URL="http://localhost:8080"
WEAVIATE_API_KEY=""
```

**Dashboard (`packages/dashboard/.env`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Mobile (`packages/mobile/.env`):**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 5. "Port already in use"

**Symptoms:**
- Error: `Port 3000 is already in use`
- Backend or dashboard won't start

**Solution:**
```bash
# Find and kill process using the port
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Or use the stop script
./stop.sh
```

### 6. "Docker not running"

**Symptoms:**
- Error: `Cannot connect to the Docker daemon`
- Docker commands fail

**Solution:**
- **macOS:** Open Docker Desktop
- **Linux:** `sudo systemctl start docker`
- **Windows:** Start Docker Desktop

### 7. "Node modules not installed"

**Symptoms:**
- Error: `Cannot find module 'express'`
- Missing dependencies errors

**Solution:**
```bash
# Install all dependencies
npm install

# If issues persist, clean install
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules
npm install
```

### 8. "Weaviate connection errors"

**Symptoms:**
- Warning: `Memory schema note: Error: usage error (404)`
- Weaviate schema errors

**Note:** These are usually just warnings during first startup. The schemas are created automatically. If Weaviate is completely unreachable:

```bash
# Restart Weaviate
docker compose restart weaviate

# Check if it's healthy
docker compose ps weaviate
```

### 9. "Authentication fails in mobile app"

**Symptoms:**
- Login fails with valid credentials
- Network errors in mobile app

**Solution:**

1. **If using physical device:** Update the API URL in `packages/mobile/.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3000
   ```
   Find your IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)

2. **If using simulator/emulator:** The localhost URL should work.

3. **Verify backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

### 10. "Migration conflicts"

**Symptoms:**
- Error: `Migration ... conflicts with existing migration`
- Database schema out of sync

**Solution:**
```bash
cd packages/backend

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or apply migrations manually
npx prisma migrate deploy

cd ../..
```

## Verification Steps

After fixing issues, verify everything works:

### 1. Check Docker Services
```bash
docker compose ps
```
All services should show as "healthy".

### 2. Test Backend
```bash
# Health check
curl http://localhost:3000/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"patient123"}'
```

### 3. Check Running Services
```bash
./status.sh
```

## Getting Help

If you're still having issues:

1. **Check the logs:**
   ```bash
   # Backend logs
   tail -f backend.log
   
   # Dashboard logs
   tail -f dashboard.log
   
   # Docker logs
   docker compose logs -f
   ```

2. **Collect system info:**
   ```bash
   node -v
   npm -v
   docker -v
   docker compose version
   ```

3. **Open an issue:** Include:
   - Error messages
   - System information
   - Steps to reproduce
   - Relevant log output

## Quick Reference

| Command | Purpose |
|---------|---------|
| `./setup.sh` | Complete automated setup |
| `./dev.sh` | Start backend + dashboard |
| `./start.sh` | Start Docker services only |
| `./stop.sh` | Stop all services |
| `./status.sh` | Check service status |
| `docker compose ps` | Check Docker containers |
| `docker compose logs -f` | View Docker logs |
| `npm run dev:backend` | Start backend only |
| `npm run dev:dashboard` | Start dashboard only |
| `npm run dev:mobile` | Start mobile app |

## Database Management

### Reset Database
```bash
cd packages/backend
npm run prisma:migrate reset  # WARNING: Deletes all data
cd ../..
```

### View Database
```bash
cd packages/backend
npx prisma studio  # Opens GUI at http://localhost:5555
cd ../..
```

### Create New Migration
```bash
cd packages/backend
# Edit prisma/schema.prisma first
npx prisma migrate dev --name your_migration_name
cd ../..
```

## Clean Slate Setup

If everything is completely broken, start fresh:

```bash
# Stop everything
./stop.sh
docker compose down -v

# Clean node modules
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules

# Run setup
./setup.sh
```

## Environment-Specific Issues

### GitHub Codespaces

If running in Codespaces:
- Ports are automatically forwarded
- Use the Codespaces URL instead of localhost
- Check "Ports" tab in VS Code

### WSL (Windows Subsystem for Linux)

If running on WSL:
- Docker Desktop for Windows must be running
- Enable WSL integration in Docker Desktop settings
- Use WSL filesystem paths, not Windows paths

### macOS Apple Silicon (M1/M2/M3)

If on Apple Silicon:
- Some Docker images may need platform flag
- Add to docker-compose.yml if needed:
  ```yaml
  platform: linux/amd64
  ```
