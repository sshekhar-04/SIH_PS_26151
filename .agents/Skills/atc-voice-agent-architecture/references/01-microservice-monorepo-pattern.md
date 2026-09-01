# 🏛️ Microservice Monorepo & Service Boundary Patterns

## 1. Overview & Monorepo Structure

The platform is architected as an enterprise-grade distributed microservices monorepo with strict domain bounded contexts and zero direct cross-database dependencies.

```
project-root/
├── Auth/              # Port 3000: Identity, OAuth2, RS256 token signing, JWKS, Refresh token families
├── Backend/           # Port 5000: Scenario catalog, session lifecycle, telemetry, analytics
├── Ai-service/        # Port 7000: LangGraph state machine, 7-layer Redis caching, WebSockets, STT/TTS, Qdrant RAG
├── Frontend/          # Port 5173: React 18 SPA (Vite), Redux Toolkit, Web Audio API, Dual-token SCSS
├── k8s/               # Flat Kubernetes manifests (Deployments, Services, Ingress, Secrets)
├── docs/              # In-depth architectural specifications & RFCs
├── skaffold.yml       # Skaffold live sync configuration for local K8s dev
└── package.json       # Monorepo root scripts & tooling
```

---

## 2. Bounded Context & Database Isolation Rules

1. **Strict DB Isolation:** Each microservice has its own isolated MongoDB database instance (`atc-auth`, `atc-backend`, `atc-ai-service`). Microservices **never** query another service's database directly.
2. **Synchronous Inter-Service Communication:** Services communicate with each other exclusively via HTTP REST API calls with Bearer access tokens or internal service DNS (`http://auth-service:3000`).
3. **Stateless Identity Verification:** Downstream microservices verify access tokens locally using public keys fetched from Auth's JWKS endpoint (`/.well-known/jwks.json`) and cached in memory or Redis.

---

## 3. The `server.js` vs `app/app.js` Separation Pattern

Every Node.js microservice strictly decouples process bootstrapping from Express application setup.

### `server.js` (Process Entry Point ONLY)
- Reads environment variables (`dotenv.config()`).
- Establishes database connection (`connectToDb()`).
- Invokes `app.listen(PORT)` and logs startup.
- **Rule:** Never define routes, middleware, or business logic in `server.js`.

```javascript
import dotenv from 'dotenv';
import app from './app/app.js';
import { connectToDb } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    await connectToDb();
    console.log(`[Backend Service] Listening on port ${PORT}`);
});
```

### `app/app.js` (Express Application Factory)
- Instantiates Express application.
- Mounts global middleware (`express.json()`, `cookieParser()`, `morgan()`, `cors()`).
- Registers route modules (`app.use('/api/...', router)`).
- Registers `/healthz` and `/readyz` probes for Kubernetes.
- Configures 404 handler and centralized global error handling middleware.
- **Rule:** Never call `app.listen()` inside `app/app.js`.

```javascript
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import sessionRouter from '../routes/session.routes.js';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/backend/sessions', sessionRouter);

// Kubernetes Probes
app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok', service: 'backend' }));
app.get('/readyz', (_req, res) => res.status(200).json({ status: 'ready', service: 'backend' }));

// 404 Handler
app.use((_req, res) => res.status(404).json({ status: 'error', message: 'Route not found' }));

// Global Error Handler
app.use((err, _req, res, _next) => {
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

export default app;
```

---

## 4. Kubernetes Probes & Cloud-Native Health

Each microservice deployment defines liveness and readiness probes in `k8s/<service>.deployment.yml`:

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 5000
  initialDelaySeconds: 15
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /readyz
    port: 5000
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## 5. Skaffold Live Synchronization

`skaffold.yml` synchronizes local code changes directly into running Kubernetes pods without rebuilding container images:

```yaml
apiVersion: skaffold/v4beta11
kind: Config
metadata:
  name: atc-voice-simulator
build:
  artifacts:
    - image: atc-backend
      context: Backend
      sync:
        manual:
          - src: 'app/**/*.js'
            dest: .
          - src: 'controllers/**/*.js'
            dest: .
          - src: 'routes/**/*.js'
            dest: .
          - src: 'services/**/*.js'
            dest: .
```
