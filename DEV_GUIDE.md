# 🚀 Sainte Platform - Quick Start

## One-Command Startup

```bash
./dev.sh
```

That's it! Everything will start automatically.

## What It Does

1. ✅ Starts PostgreSQL, Redis, and Weaviate in Docker
2. ✅ Waits for all services to be healthy
3. ✅ Runs database migrations
4. ✅ Starts backend server (port 3000)
5. ✅ Starts dashboard (port 3001)

## Commands

### Start Everything

```bash
./dev.sh
```

### Check Status

```bash
./status.sh
```

### Stop Everything

```bash
./stop.sh
```

### View Logs

```bash
# Backend
tail -f backend.log

# Dashboard
tail -f dashboard.log

# Infrastructure
docker-compose logs -f
```

## Access Points

- **Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Weaviate**: localhost:8080

## Troubleshooting

### Services won't start

```bash
./stop.sh
./dev.sh
```

### Database issues

```bash
cd packages/backend
npx prisma migrate reset --force
npx prisma db seed
cd ../..
```

### Port conflicts

```bash
# Check what's using ports
lsof -i:3000
lsof -i:3001

# Kill processes
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### View all errors

```bash
# Backend errors
tail -100 backend.log | grep -i error

# Dashboard errors
tail -100 dashboard.log | grep -i error
```

## Architecture

- **Infrastructure**: Docker Compose (PostgreSQL, Redis, Weaviate)
- **Backend**: Node.js running locally for hot reload
- **Dashboard**: Next.js running locally for fast refresh
- **Why hybrid?**: Docker for stateful services, local for development speed

## Environment Variables

All configuration is in `packages/backend/.env`. The dev script automatically loads it.

## Development Workflow

1. Start platform: `./dev.sh`
2. Make code changes (auto-reloads)
3. Check logs: `tail -f backend.log`
4. Check status: `./status.sh`
5. Stop when done: `./stop.sh`

## Clean Start

```bash
# Nuclear option - removes all data and starts fresh
docker-compose down -v
rm -rf node_modules packages/*/node_modules
npm install
cd packages/backend && npm install && cd ../..
cd packages/dashboard && npm install && cd ../..
./dev.sh
```
