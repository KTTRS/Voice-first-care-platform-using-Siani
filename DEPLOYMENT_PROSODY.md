# Prosody WebSocket Deployment Guide

**Status**: ✅ Ready for Staging  
**Date**: November 10, 2025  
**Version**: 1.0.0

---

## 📋 Pre-Deployment Checklist

### Backend

- [x] WebSocket prosody endpoint (`/prosody`)
- [x] TTS API routes (`/api/tts/synthesize`)
- [x] Prosody service (pitch detection, energy calculation)
- [x] TypeScript compilation errors resolved
- [x] Dependencies installed (`ws`, `@types/ws`)
- [ ] Google Cloud TTS configured (optional)
- [ ] Environment variables configured
- [ ] Load testing completed
- [ ] Security audit

### Mobile

- [x] `useProsodyStream` hook
- [x] `SianiAvatar` prosody integration
- [x] Conversation screen updated
- [ ] WebSocket reconnection logic
- [ ] Error handling for network failures
- [ ] Performance testing

### Testing

- [x] Formula validation
- [x] WebSocket connection test
- [ ] End-to-end prosody streaming
- [ ] Load testing (multiple clients)
- [ ] Cross-platform testing (iOS, Android, Web)

---

## 🔧 Environment Configuration

### Backend (`.env`)

```bash
# Server
PORT=3000
NODE_ENV=production

# Prosody WebSocket
PROSODY_WS_PATH=/prosody
PROSODY_SAMPLE_RATE=16000
PROSODY_FRAME_SIZE=1024
PROSODY_HOP_SIZE=512

# Google Cloud TTS (Optional)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
GOOGLE_CLOUD_PROJECT=your-project-id

# CORS Origins
CORS_ORIGINS=https://your-app.com,https://staging.your-app.com
```

### Mobile (`.env`)

```bash
# Prosody WebSocket
EXPO_PUBLIC_PROSODY_WS_URL=wss://api.your-app.com/prosody

# Backend API
EXPO_PUBLIC_API_URL=https://api.your-app.com
```

---

## 🚀 Deployment Steps

### 1. Backend Deployment

#### Option A: Docker (Recommended)

```bash
# Build Docker image
cd packages/backend
docker build -t siani-backend:prosody-v1 .

# Run container
docker run -d \
  --name siani-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -v /path/to/credentials.json:/app/credentials.json:ro \
  siani-backend:prosody-v1

# Check logs
docker logs -f siani-backend
```

#### Option B: PM2 (Node.js Process Manager)

```bash
cd packages/backend

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/index.js \
  --name siani-backend \
  --instances 4 \
  --exec-mode cluster

# Save PM2 configuration
pm2 save

# Enable startup on boot
pm2 startup
```

#### Option C: Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: siani-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: siani-backend
  template:
    metadata:
      labels:
        app: siani-backend
    spec:
      containers:
        - name: backend
          image: siani-backend:prosody-v1
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: siani-backend
spec:
  selector:
    app: siani-backend
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
```

### 2. WebSocket Configuration

#### Nginx (Reverse Proxy)

```nginx
# /etc/nginx/sites-available/siani

upstream backend {
  server localhost:3000;
}

server {
  listen 80;
  server_name api.your-app.com;

  # Redirect HTTP to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.your-app.com;

  ssl_certificate /etc/letsencrypt/live/api.your-app.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.your-app.com/privkey.pem;

  # API routes
  location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  # WebSocket prosody endpoint
  location /prosody {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket timeouts
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
  }
}
```

#### AWS Application Load Balancer

```json
{
  "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
  "Properties": {
    "Port": 3000,
    "Protocol": "HTTP",
    "TargetType": "instance",
    "HealthCheckPath": "/health",
    "HealthCheckProtocol": "HTTP",
    "HealthCheckIntervalSeconds": 30,
    "HealthCheckTimeoutSeconds": 5,
    "HealthyThresholdCount": 2,
    "UnhealthyThresholdCount": 3,
    "Matcher": {
      "HttpCode": "200"
    }
  }
}
```

### 3. Mobile App Deployment

#### Expo EAS Build

```bash
cd packages/mobile

# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for staging
eas build --platform all --profile staging

# Submit to stores
eas submit --platform ios --profile staging
eas submit --platform android --profile staging
```

#### Update `.env.staging`

```bash
EXPO_PUBLIC_PROSODY_WS_URL=wss://staging-api.your-app.com/prosody
EXPO_PUBLIC_API_URL=https://staging-api.your-app.com
```

---

## 🧪 Post-Deployment Testing

### 1. Health Checks

```bash
# Backend health
curl https://api.your-app.com/health

# Expected: {"status":"ok","timestamp":"2025-11-10T..."}
```

### 2. WebSocket Connection Test

```bash
# Install wscat for testing
npm install -g wscat

# Connect to prosody WebSocket
wscat -c wss://api.your-app.com/prosody

# Expected: {"type":"connected","timestamp":...,"message":"Prosody stream ready"}
```

### 3. TTS Endpoint Test

```bash
curl -X POST https://api.your-app.com/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"Testing prosody integration","emotion":"neutral"}'

# Expected: {"audio":"<base64>","format":"LINEAR16","sampleRate":16000}
# Or: {"text":"...","fallback":true,"message":"Using client-side TTS"}
```

### 4. End-to-End Prosody Test

```bash
# Run integration test script
bash test-prosody-integration.sh

# Expected: All tests pass with green checkmarks
```

---

## 📊 Monitoring & Metrics

### Application Metrics

```typescript
// Add to backend/src/index.ts
import prometheus from "prom-client";

const register = new prometheus.Registry();

// WebSocket connections
const wsConnections = new prometheus.Gauge({
  name: "prosody_websocket_connections",
  help: "Number of active prosody WebSocket connections",
  registers: [register],
});

// Prosody frames processed
const prosodyFrames = new prometheus.Counter({
  name: "prosody_frames_processed_total",
  help: "Total number of prosody frames processed",
  registers: [register],
});

// Expose metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Siani Prosody Metrics",
    "panels": [
      {
        "title": "Active WebSocket Connections",
        "targets": [
          {
            "expr": "prosody_websocket_connections"
          }
        ]
      },
      {
        "title": "Prosody Frames Processed",
        "targets": [
          {
            "expr": "rate(prosody_frames_processed_total[5m])"
          }
        ]
      },
      {
        "title": "TTS Synthesis Rate",
        "targets": [
          {
            "expr": "rate(tts_synthesis_requests_total[5m])"
          }
        ]
      }
    ]
  }
}
```

---

## 🔒 Security Considerations

### 1. WebSocket Authentication

```typescript
// Add to prosody.routes.ts
import { verifyToken } from "../middleware/auth";

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");

  if (!token || !verifyToken(token)) {
    ws.close(1008, "Unauthorized");
    return;
  }

  // ... rest of connection logic
});
```

### 2. Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const ttsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many TTS requests, please try again later",
});

router.post("/synthesize", ttsLimiter, async (req, res) => {
  // ... TTS logic
});
```

### 3. Input Validation

```typescript
import { body, validationResult } from "express-validator";

router.post(
  "/synthesize",
  [
    body("text").isString().isLength({ min: 1, max: 5000 }),
    body("emotion").isIn(["low", "neutral", "high", "detached"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... TTS logic
  }
);
```

---

## 🚨 Rollback Plan

### If Deployment Fails

```bash
# 1. Revert to previous Docker image
docker stop siani-backend
docker run -d \
  --name siani-backend \
  -p 3000:3000 \
  siani-backend:previous-version

# 2. Or revert with PM2
pm2 stop siani-backend
git checkout main
npm run build
pm2 restart siani-backend

# 3. Update mobile app .env to use old WebSocket URL
# EXPO_PUBLIC_PROSODY_WS_URL=wss://old-api.your-app.com/prosody
```

---

## 📚 Production Checklist

- [ ] SSL/TLS certificates configured (Let's Encrypt or AWS Certificate Manager)
- [ ] WebSocket connection limits configured (prevent DoS)
- [ ] Rate limiting enabled on TTS endpoints
- [ ] Authentication implemented for WebSocket connections
- [ ] Monitoring dashboards configured (Grafana, CloudWatch, etc.)
- [ ] Error tracking enabled (Sentry, Rollbar, etc.)
- [ ] Backup strategy for audio data (if storing)
- [ ] CDN configured for static assets (if applicable)
- [ ] Database migrations completed (if applicable)
- [ ] Load testing with 100+ concurrent WebSocket connections
- [ ] Disaster recovery plan documented

---

## 🔍 Troubleshooting

### WebSocket Connection Fails

**Symptoms**: Mobile app can't connect to prosody WebSocket

**Solutions**:

1. Check nginx/ALB configuration for WebSocket upgrade headers
2. Verify firewall allows WebSocket connections (port 443/80)
3. Test with `wscat -c wss://api.your-app.com/prosody`
4. Check CORS origins in backend `.env`

### High Latency

**Symptoms**: Prosody data arrives 500ms+ delayed

**Solutions**:

1. Reduce `PROSODY_HOP_SIZE` (e.g., 256 instead of 512)
2. Use CDN/edge functions closer to users
3. Optimize prosody detection algorithm (consider FFT instead of autocorrelation)
4. Enable HTTP/2 or HTTP/3 for faster multiplexing

### Memory Leaks

**Symptoms**: Backend memory usage grows over time

**Solutions**:

1. Check for unclosed WebSocket connections
2. Implement connection timeout (e.g., 30 minutes)
3. Clear `analyzers` Map on disconnect
4. Use PM2 cluster mode for automatic process restarts

---

**Last Updated**: November 10, 2025  
**Next Review**: December 10, 2025  
**Owner**: Backend Team
