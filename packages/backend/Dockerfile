FROM node:20-alpine

WORKDIR /app

# Copy workspace root package.json
COPY package*.json ./

# Copy backend package files
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/tsconfig.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma/

# Install all dependencies from root
RUN npm install

# Copy backend source
COPY packages/backend/src ./packages/backend/src/

# Generate Prisma Client
WORKDIR /app/packages/backend
RUN npx prisma generate

WORKDIR /app

EXPOSE 3000

CMD ["sh", "-c", "cd /app/packages/backend && npx prisma migrate deploy && npm run dev"]
