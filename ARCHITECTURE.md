# Architecture Documentation

## System Overview

Sainte is a full-stack AI care platform designed with a microservices-inspired monorepo architecture. The system consists of three main applications sharing a common backend API.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
├────────────────────────┬────────────────────────────────────┤
│   Next.js Dashboard    │   React Native Mobile App (Expo)   │
│   (Admin/Provider UI)  │   (Patient UI - Voice First)       │
└────────────┬───────────┴────────────┬───────────────────────┘
             │                        │
             │      REST API (JWT)    │
             └────────────┬───────────┘
                          │
         ┌────────────────▼────────────────┐
         │   Node.js + Express Backend     │
         │   (TypeScript + Prisma ORM)     │
         └────────┬──────────────┬─────────┘
                  │              │
         ┌────────▼────┐    ┌───▼──────────────┐
         │  PostgreSQL │    │  AI Services     │
         │  Database   │    │  - OpenAI API    │
         └─────────────┘    │  - Weaviate DB   │
                            └──────────────────┘
```

## Components

### 1. Backend API (`packages/backend`)

**Technology**: Node.js, TypeScript, Express, Prisma

**Responsibilities**:
- User authentication and authorization (JWT)
- CRUD operations for all entities
- Signal scoring and analysis
- Referral management
- Memory storage and retrieval
- AI service integration

**Key Services**:
- `EmbeddingService`: Creates text embeddings using OpenAI
- `VectorDBService`: Manages Weaviate vector database
- `SignalScoringEngine`: Analyzes and scores health signals

**API Structure**:
```
/api
  /auth         - Authentication endpoints
  /patients     - Patient management
  /signals      - Health signal tracking
  /referrals    - Referral loop management
  /memory       - AI memory storage/search
```

### 2. Dashboard (`packages/dashboard`)

**Technology**: Next.js 14, React 18, TypeScript, Tailwind CSS

**Responsibilities**:
- Admin and healthcare provider interface
- Patient monitoring and analytics
- Referral management
- System administration

**Key Features**:
- Server-side rendering for performance
- Real-time data updates
- Responsive design
- Role-based UI rendering

### 3. Mobile App (`packages/mobile`)

**Technology**: React Native, Expo, TypeScript

**Responsibilities**:
- Patient-facing mobile application
- Voice-first interaction design
- Symptom reporting
- Medication tracking
- Communication with care team

**Key Features**:
- Cross-platform (iOS/Android)
- Offline-first capability (planned)
- Push notifications (planned)
- Voice input integration (planned)

## Data Flow

### Authentication Flow
```
1. User submits credentials → Backend /api/auth/login
2. Backend validates credentials (bcrypt)
3. Backend generates JWT token
4. Client stores token (localStorage/AsyncStorage)
5. Client includes token in Authorization header for subsequent requests
6. Backend middleware validates token for protected routes
```

### Signal Scoring Flow
```
1. Signal data submitted → POST /api/signals
2. SignalScoringEngine.determineSeverity() analyzes signal
3. SignalScoringEngine.calculateScore() computes priority score
4. Signal stored in database with severity and score
5. High-priority signals trigger notifications (planned)
```

### Memory/AI Flow
```
1. User conversation content → POST /api/memory
2. EmbeddingService creates vector embedding via OpenAI
3. Memory stored in PostgreSQL (metadata)
4. Vector stored in Weaviate (semantic search)
5. Search query → POST /api/memory/search
6. Query embedding created
7. Weaviate performs similarity search
8. Relevant memories returned with context
```

## Database Schema

### Core Entities

**User**
- Authentication (email, password hash)
- Profile (name, phone)
- Role (ADMIN, DOCTOR, NURSE, PATIENT, CAREGIVER)

**Patient**
- Links to User
- Medical history
- Current medications
- Allergies
- Assigned healthcare providers

**Signal**
- Type (VITAL_SIGN, SYMPTOM, MEDICATION, MOOD, ACTIVITY)
- Severity (LOW, MEDIUM, HIGH, CRITICAL)
- Score (0-100)
- Timestamp
- Metadata (flexible JSON)

**Referral**
- Status (PENDING, ACCEPTED, COMPLETED, CANCELLED)
- Priority (1-5)
- From/To users
- Timestamps (created, updated, completed)

**Memory**
- Content (text)
- Embedding (vector, stored as JSON or in Weaviate)
- Metadata (conversation context)
- Importance score

## Security Architecture

### Authentication
- JWT tokens with configurable expiration
- bcrypt password hashing (10 rounds)
- Role-based access control (RBAC)

### Authorization
- Middleware checks JWT validity
- Role-based route protection
- Resource ownership validation

### Data Protection
- Environment variables for secrets
- CORS configuration
- Helmet.js security headers
- Input validation with Zod

## AI/ML Architecture

### OpenAI Integration
- Model: `text-embedding-ada-002`
- Purpose: Convert text to 1536-dimensional vectors
- Use cases: Memory search, semantic similarity

### Weaviate Vector Database
- Schema: Custom `Memory` class
- Vectorizer: None (using OpenAI)
- Search: Cosine similarity
- Filtering: By user ID, conversation ID

### Scoring Engine
- Rule-based system with configurable weights
- Severity multipliers per signal type
- Metadata-based adjustments
- 0-100 normalized scoring

## Deployment Architecture

### Development
- Docker Compose for local databases
- npm workspaces for monorepo management
- Hot reload for all applications

### Production (Recommended)
```
┌─────────────────┐
│   CDN/Vercel    │ ← Dashboard (Next.js)
└─────────────────┘
         │
┌─────────────────┐
│   Cloud Run     │ ← Backend API (containerized)
└─────────────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────────┐
│  DB  │  │ Weaviate  │
└──────┘  └───────────┘
```

### Scalability Considerations
- Stateless API design
- Database connection pooling (Prisma)
- Caching layer (Redis, planned)
- Horizontal scaling for API
- Vector DB clustering (Weaviate)

## Monitoring & Observability

### Logging
- Console logs in development
- Structured logging in production (planned)
- Error tracking (Sentry, planned)

### Metrics
- API response times
- Database query performance
- Vector search latency
- Memory usage

### Health Checks
- `/health` endpoint
- Database connectivity
- External service status

## Future Enhancements

1. **Real-time Features**: WebSocket integration for live updates
2. **Caching**: Redis for session management and API responses
3. **Message Queue**: For asynchronous processing (e.g., Bull)
4. **File Storage**: S3 for medical documents and images
5. **Advanced AI**: GPT-4 for conversation generation
6. **Analytics**: TimescaleDB for time-series data
7. **Notifications**: Push notifications via Firebase/APNs
8. **Audit Logs**: Comprehensive HIPAA-compliant logging
