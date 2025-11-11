# Sainte AI Care Platform - Developer Instructions

## Project Overview

**Sainte** is a voice-first AI healthcare platform with real-time emotional intelligence, prosody-driven speech synthesis, and multi-layered memory systems. The monorepo contains backend API (Node.js/Express/Prisma), Next.js dashboard, React Native mobile app, and an emotion classification engine.

## Architecture Principles

### Monorepo Structure
```
packages/
  backend/          # Node.js + TypeScript + Express + Prisma
  dashboard/        # Next.js 14 with App Router
  mobile/           # React Native + Expo
  emotion-engine/   # Standalone emotion classifier
```

### Service Layer Pattern
- Backend uses **service objects** (not controllers) in `src/services/`
- Services export singleton instances: `export const fooService = new FooService()`
- Routes import services and delegate business logic, not inline logic

### Intelligence Pipeline
The core intelligence flows through layered services (see `SIANI_INTELLIGENCE_INTEGRATION.md`):
1. **Voice Input** → Transcription (Whisper)
2. **Emotion Classification** → 3-state model (Calm/Guarded/Lit) in `emotionClassifier.service.ts`
3. **Relational Memory** → Context + trust tracking in `relationalMemory.service.ts`
4. **Signal Processing** → Health signal scoring in `signalScoring.service.ts`
5. **TTS + Prosody** → Emotion-aware speech with dynamic prosody parameters

## Development Workflows

### Start Everything
```bash
./dev.sh              # Starts Docker (PostgreSQL, Redis, Weaviate) + backend + dashboard
./status.sh           # Check service health
./stop.sh             # Stop all services
```

### Database Operations
```bash
cd packages/backend
npm run prisma:generate    # Generate Prisma client after schema changes
npm run prisma:migrate     # Create new migration
npm run prisma:seed        # Seed test data (creates admin, doctor, nurse, patients)
```

### Testing
- Integration test scripts: `test-*.sh` (28 test scripts)
- Run specific feature tests: `bash test-emotion-classifier.sh`, `bash test-glow-logic.sh`
- Backend tests: `cd packages/backend && npm test`

## Code Conventions

### Authentication & Authorization
- JWT middleware: `middleware/authenticate.ts` exports `authenticate()` and `AuthenticatedRequest`
- Role-based access: Use `middleware/rbac.ts` for scope-based permissions
- **Never** inline auth logic—always use middleware in routes

### Request Validation
- **All** route inputs validated with Zod schemas in `validators/` directory
- Pattern: `export const createFooSchema = z.object({ ... })`
- Apply in routes: `const data = createFooSchema.parse(req.body)`

### Error Handling
- Central error handler: `middleware/errorHandler.ts`
- Prisma errors handled by `utils/prismaError.ts`
- Return structured JSON: `{ error: "Message" }` for client errors

### Database Access
- **Always** use Prisma ORM (singleton in `utils/db.ts`)
- No raw SQL unless absolutely necessary
- Use Prisma relations for joins—avoid manual JOIN queries
- Enum types: Import from `@prisma/client` (UserRole, SignalType, etc.)

### Async Job Processing
- BullMQ queues in `jobs/queues/` (signalQueue, feedQueue, taskQueue)
- Workers in `jobs/workers/`
- Schedulers in `jobs/schedulers/` for cron-like tasks
- Redis connection managed via `ioredis` (configured in `jobs/queues.ts`)

## Key Technical Patterns

### Memory Storage (Dual-System)
1. **PostgreSQL** → Metadata, relationships (`Memory` model in schema.prisma)
2. **Weaviate** → Vector embeddings for semantic search
   - Service: `vectordb.service.ts`
   - Embeddings: OpenAI `text-embedding-ada-002` via `embedding.service.ts`

### Emotion State Mapping
- Mobile glow states: `calm`, `anxious`, `motivated`, `neutral` (see `GLOW_LOGIC_IMPLEMENTATION.md`)
- Maps to colors, pulse speeds, wave amplitudes
- Drives haptic feedback and avatar animations

### Prosody Control
- Dynamic SSML generation with emotion-based pitch/rate/volume
- Service: `prosody.service.ts`
- WebSocket support for real-time prosody streams (`prosody.routes.ts`)

### Signal Scoring
- Health signals (VITAL_SIGN, SYMPTOM, MEDICATION, MOOD, ACTIVITY)
- Auto-computed severity (LOW, MEDIUM, HIGH, CRITICAL) and score (0-100)
- Service: `signalScoring.service.ts` with rule-based weights

## Environment Requirements

### Backend `.env`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sainte_db"
JWT_SECRET="your-secret-key"
OPENAI_API_KEY="sk-..."
WEAVIATE_URL="http://localhost:8080"
REDIS_URL="redis://localhost:6379"
```

### Mobile `.env`
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Documentation Shortcuts

- **Quick Start**: `QUICKSTART.md` or `DEV_GUIDE.md`
- **Architecture**: `ARCHITECTURE.md` (diagrams + data flows)
- **Auth Setup**: `AUTH_IMPLEMENTATION.md`, `MOBILE_AUTH_GUIDE.md`
- **Feature Implementations**: 40+ `*_IMPLEMENTATION.md` files for deep dives
- **Quick References**: `*_QUICK_REFERENCE.md` files for API examples

## Common Pitfalls

1. **Don't bypass middleware**: Always use `authenticate` before accessing `req.user`
2. **Prisma client regeneration**: Run `npm run prisma:generate` after schema changes or you'll get type errors
3. **Test data**: Use seeded users (see `README.md` for credentials) like `john.doe@example.com`/`patient123`
4. **Docker services**: Backend depends on PostgreSQL, Redis, Weaviate—ensure `docker-compose up -d` runs first
5. **Port conflicts**: Backend=3000, Dashboard=3001, Postgres=5432, Redis=6379, Weaviate=8080

## Making Changes

### Adding Routes
1. Create route file in `packages/backend/src/routes/`
2. Import and mount in `src/index.ts` (see existing `app.use()` calls)
3. Add Zod validator in `validators/` if accepting input

### Adding Database Models
1. Update `packages/backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate` (creates migration)
3. Run `npm run prisma:generate` (updates types)
4. Update seed script if needed

### Integrating Intelligence Features
- Follow the pipeline pattern in `sianiIntelligence.service.ts`
- Chain: Emotion → Memory → Signal → Response
- Store context in relational memory for continuity
- See `SIANI_INTELLIGENCE_QUICK_REFERENCE.md` for examples
