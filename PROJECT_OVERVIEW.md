# Project Overview - Sainte AI Care Platform

## 📦 Package Structure

```
sainte-ai-care-platform/
├── 📄 Configuration Files
│   ├── package.json              # Root monorepo configuration
│   ├── docker-compose.yml        # PostgreSQL + Weaviate setup
│   └── .devcontainer/            # GitHub Codespaces config
│       └── devcontainer.json
│
├── 📚 Documentation
│   ├── README.md                 # Main documentation
│   ├── QUICKSTART.md            # Quick start guide
│   ├── ARCHITECTURE.md          # System architecture
│   ├── CONTRIBUTING.md          # Contribution guidelines
│   └── SECURITY.md              # Security analysis
│
└── 📦 Packages/
    │
    ├── 🔧 Backend API (Node.js + TypeScript + Express + Prisma)
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── .env.example
    │   │
    │   ├── prisma/
    │   │   ├── schema.prisma     # Database schema
    │   │   ├── seed.ts           # Seed script
    │   │   └── migrations/       # Database migrations
    │   │
    │   └── src/
    │       ├── index.ts          # Express app entry
    │       ├── middleware/
    │       │   ├── auth.ts       # JWT authentication
    │       │   ├── errorHandler.ts
    │       │   └── rateLimiter.example.ts
    │       ├── routes/
    │       │   ├── auth.ts       # Login/Register
    │       │   ├── patients.ts   # Patient management
    │       │   ├── signals.ts    # Health signals
    │       │   ├── referrals.ts  # Referral tracking
    │       │   └── memory.ts     # AI memory
    │       ├── services/
    │       │   ├── embedding.service.ts    # OpenAI
    │       │   ├── vectordb.service.ts     # Weaviate
    │       │   └── scoring.service.ts      # Signal scoring
    │       └── utils/
    │           └── db.ts         # Prisma client
    │
    ├── 🎨 Dashboard (Next.js 14 + Tailwind CSS)
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── next.config.js
    │   ├── tailwind.config.js
    │   ├── .env.example
    │   │
    │   └── src/
    │       └── app/
    │           ├── layout.tsx    # Root layout
    │           ├── page.tsx      # Landing page
    │           └── globals.css   # Global styles
    │
    └── 📱 Mobile App (React Native + Expo)
        ├── package.json
        ├── tsconfig.json
        ├── app.json              # Expo configuration
        ├── babel.config.js
        ├── .env.example
        │
        └── app/
            ├── _layout.tsx       # Root layout
            └── index.tsx         # Home screen
```

## 🎯 Key Features Implemented

### Backend API
✅ JWT Authentication with bcrypt  
✅ Role-based access control (5 roles)  
✅ PostgreSQL database with Prisma ORM  
✅ RESTful API endpoints  
✅ OpenAI embeddings integration  
✅ Weaviate vector database  
✅ Signal scoring engine  
✅ Referral tracking system  
✅ Memory module for AI conversations  

### Dashboard
✅ Next.js 14 with App Router  
✅ Tailwind CSS styling  
✅ Responsive design  
✅ Landing page with features  
✅ TypeScript configuration  

### Mobile App
✅ Expo with React Native  
✅ Expo Router navigation  
✅ Welcome screen  
✅ Cross-platform support  
✅ TypeScript configuration  

## 🗄️ Database Schema

### Models
- **User** - Authentication and profiles
- **Patient** - Medical information
- **Signal** - Health signals (vitals, symptoms, etc.)
- **Referral** - Care coordination
- **Memory** - AI conversation context

### Enums
- `UserRole`: ADMIN | DOCTOR | NURSE | PATIENT | CAREGIVER
- `SignalType`: VITAL_SIGN | SYMPTOM | MEDICATION | MOOD | ACTIVITY
- `SignalSeverity`: LOW | MEDIUM | HIGH | CRITICAL
- `ReferralStatus`: PENDING | ACCEPTED | COMPLETED | CANCELLED

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Patients
- `GET /api/patients` - List all patients
- `GET /api/patients/:id` - Get patient details
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient

### Signals
- `GET /api/signals/patient/:patientId` - Get patient signals
- `POST /api/signals` - Create signal
- `GET /api/signals/high-priority` - Get critical signals
- `GET /api/signals/analytics/:patientId` - Get analytics

### Referrals
- `GET /api/referrals/mine` - Get user's referrals
- `GET /api/referrals/patient/:patientId` - Get patient referrals
- `POST /api/referrals` - Create referral
- `PATCH /api/referrals/:id` - Update referral
- `GET /api/referrals/analytics/overview` - Get analytics

### Memory
- `POST /api/memory` - Store memory
- `POST /api/memory/search` - Search memories
- `GET /api/memory/conversation/:id` - Get conversation memories
- `GET /api/memory/stats` - Get statistics
- `DELETE /api/memory/:id` - Delete memory

## 🧪 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sainte.ai | admin123 |
| Doctor | doctor@sainte.ai | doctor123 |
| Nurse | nurse@sainte.ai | nurse123 |
| Patient 1 | john.doe@example.com | patient123 |
| Patient 2 | jane.smith@example.com | patient123 |

## 🔒 Security

### Implemented
✅ JWT authentication  
✅ bcrypt password hashing  
✅ Role-based authorization  
✅ Input validation (Zod)  
✅ SQL injection protection (Prisma)  
✅ CORS & Helmet.js  

### Production Recommendations
⚠️ Add rate limiting  
⚠️ Enable HTTPS/SSL  
⚠️ Implement audit logging  
⚠️ HIPAA compliance review  

## 🚀 Quick Start Commands

```bash
# Start databases
docker-compose up -d

# Setup backend
cd packages/backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev

# Start dashboard
cd packages/dashboard
npm run dev

# Start mobile
cd packages/mobile
npm run dev
```

## 📊 Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Node.js, TypeScript, Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Vector DB | Weaviate |
| AI | OpenAI Embeddings |
| Dashboard | Next.js 14, React 18, Tailwind CSS |
| Mobile | React Native, Expo |
| Auth | JWT, bcrypt |
| Validation | Zod |
| Security | Helmet.js, CORS |

## 📝 Lines of Code

- Backend: ~2,500 lines
- Dashboard: ~300 lines
- Mobile: ~250 lines
- Documentation: ~1,500 lines
- **Total: ~4,550 lines**

## 🎓 Learning Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Weaviate Documentation](https://weaviate.io/developers/weaviate)
- [OpenAI API Reference](https://platform.openai.com/docs)

---

**Built with ❤️ for better healthcare**
