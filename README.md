# Sainte - AI Care Platform

A comprehensive full-stack AI care platform with voice-first interface, built with modern technologies for intelligent patient monitoring and care coordination.

## 🌟 Features

### Core Capabilities

- **Voice-First Interface**: Natural language interactions for patient care
- **AI-Powered Memory**: Context-aware conversations using OpenAI embeddings and vector database
- **Signal Scoring Engine**: Intelligent health signal analysis and prioritization
- **Referral Loop Tracking**: Automated care coordination and referral management
- **Role-Based Access Control**: Secure JWT authentication with multiple user roles
- **Real-Time Monitoring**: Track vital signs, symptoms, medications, mood, and activities

### Technology Stack

#### Backend (Node.js + TypeScript)

- **Framework**: Express.js for RESTful API
- **ORM**: Prisma with PostgreSQL database
- **Authentication**: JWT-based with bcrypt password hashing
- **AI Services**: OpenAI embeddings for semantic search
- **Vector Database**: Weaviate for memory storage and retrieval
- **Validation**: Zod for type-safe request validation

#### Dashboard (Next.js)

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **UI**: React 18 with TypeScript
- **API Client**: Axios for backend communication

#### Mobile App (React Native + Expo)

- **Framework**: Expo with React Native
- **Navigation**: Expo Router
- **Storage**: AsyncStorage for local data
- **API Client**: Axios for backend communication

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for databases)
- PostgreSQL 15+ (if not using Docker)
- Weaviate (if not using Docker)
- OpenAI API key (optional, for AI features)

### Option 1: GitHub Codespaces (Recommended)

1. Click "Code" → "Open with Codespaces"
2. Wait for the environment to set up
3. Start the services (see Running the Platform below)

### Option 2: Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/KTTRS/Voice-first-care-platform-using-Siani.git
   cd Voice-first-care-platform-using-Siani
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start Docker services**

   ```bash
   docker-compose up -d
   ```

   This starts PostgreSQL and Weaviate.

4. **Configure environment variables**

   ```bash
   # Backend
   cp packages/backend/.env.example packages/backend/.env

   # Dashboard
   cp packages/dashboard/.env.example packages/dashboard/.env

   # Mobile
   cp packages/mobile/.env.example packages/mobile/.env
   ```

   Edit `packages/backend/.env` and add your OpenAI API key if you want AI features.

5. **Set up the database**
   ```bash
   cd packages/backend
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   cd ../..
   ```

## 🏃 Running the Platform

### Backend API

```bash
npm run dev:backend
```

The API will be available at http://localhost:3000

API endpoints:

- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/patients` - List patients (authenticated)
- `POST /api/signals` - Create health signal (authenticated)
- `GET /api/referrals/mine` - Get my referrals (authenticated)
- `POST /api/memory` - Store memory (authenticated)
- `POST /api/memory/search` - Search memories (authenticated)

### Dashboard

```bash
npm run dev:dashboard
```

The dashboard will be available at http://localhost:3001

### Mobile App

```bash
npm run dev:mobile
```

Or use the start script:

```bash
cd packages/mobile
./start-mobile.sh
```

Then:

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

**Login with test credentials:**

- Email: `john.doe@example.com`
- Password: `patient123`

📱 See [MOBILE_AUTH_GUIDE.md](MOBILE_AUTH_GUIDE.md) for complete authentication documentation.

## 👤 Test Credentials

After running the seed script, you can use these credentials:

| Role    | Email                  | Password   |
| ------- | ---------------------- | ---------- |
| Admin   | admin@sainte.ai        | admin123   |
| Doctor  | doctor@sainte.ai       | doctor123  |
| Nurse   | nurse@sainte.ai        | nurse123   |
| Patient | john.doe@example.com   | patient123 |
| Patient | jane.smith@example.com | patient123 |

**Mobile App**: Use `john.doe@example.com` / `patient123` to test the mobile login flow.

## 📊 Database Schema

### Users & Roles

- **ADMIN**: Full system access
- **DOCTOR**: Manage patients, view all data
- **NURSE**: Assist in patient care
- **PATIENT**: View own data, record symptoms
- **CAREGIVER**: Support patient care

### Core Models

- **User**: Authentication and profile
- **Patient**: Patient medical information
- **Signal**: Health signals (vitals, symptoms, etc.)
- **Referral**: Care coordination between providers
- **Memory**: AI-powered conversation context

## 🔧 Development

### Project Structure

```
sainte-ai-care-platform/
├── packages/
│   ├── backend/          # Node.js + Express + Prisma API
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── services/ # Business logic
│   │   │   ├── middleware/ # Auth, error handling
│   │   │   └── utils/    # Helpers
│   │   └── prisma/       # Database schema & seed
│   ├── dashboard/        # Next.js admin dashboard
│   │   └── src/
│   │       ├── app/      # App router pages
│   │       ├── components/ # React components
│   │       └── lib/      # Utilities
│   └── mobile/           # React Native + Expo app
│       └── app/          # Expo router screens
├── docker-compose.yml    # PostgreSQL + Weaviate
└── .devcontainer/        # Codespaces configuration
```

### Building for Production

```bash
# Build all packages
npm run build:all

# Start backend in production
cd packages/backend
npm start

# Start dashboard in production
cd packages/dashboard
npm run build
npm start
```

## 🧪 Testing

```bash
# Run all tests
npm run test:all

# Test individual packages
cd packages/backend && npm test
cd packages/dashboard && npm test
cd packages/mobile && npm test
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Role-Based Access**: Granular permissions by user role
- **CORS Protection**: Configured cross-origin resource sharing
- **Helmet.js**: Security headers for Express
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Protection**: Parameterized queries via Prisma

⚠️ **Production Security Checklist**:

- [ ] Enable rate limiting (see `SECURITY.md`)
- [ ] Configure HTTPS/SSL
- [ ] Set strong JWT secrets
- [ ] Enable request logging
- [ ] Implement audit trails
- [ ] Review and apply security patches
- [ ] Conduct security audit for HIPAA compliance

See `SECURITY.md` for detailed security analysis and recommendations.

## 🤖 AI Features

### Memory Module

- **OpenAI Embeddings**: Converts text to semantic vectors
- **Weaviate Vector DB**: Fast similarity search
- **Context Retention**: Remembers patient preferences and history
- **Importance Scoring**: Prioritizes relevant memories

### Signal Scoring Engine

- **Automated Severity Assessment**: Analyzes health signals
- **Priority Scoring**: 0-100 scale for urgency
- **Multi-Factor Analysis**: Considers type, value, metadata
- **Smart Alerts**: Identifies critical situations

## 📝 API Documentation

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Example Requests

**Register User**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123",
    "firstName": "John",
    "lastName": "Smith",
    "role": "PATIENT"
  }'
```

**Create Health Signal**

```bash
curl -X POST http://localhost:3000/api/signals \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "VITAL_SIGN",
    "value": "98.6",
    "patientId": "<patient-id>",
    "metadata": {
      "vitalType": "temperature",
      "unit": "fahrenheit"
    }
  }'
```

## 🌐 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sainte_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
OPENAI_API_KEY="sk-..."
WEAVIATE_URL="http://localhost:8080"
```

### Dashboard (.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Mobile (.env)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with ❤️ for better healthcare
- Powered by OpenAI, Weaviate, and modern web technologies
- Designed for voice-first patient interactions

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

**Sainte** - Intelligent care, delivered naturally.
