# 🛡️ Zero-Trust RS256 JWKS Authentication & Token Rotation Architecture

## 1. Authentication Flow Overview

The platform uses an enterprise **Zero-Trust Security Architecture** combining asymmetric RS256 JWT access tokens, JWKS public key distribution, and opaque rotating refresh token families with replay detection.

```
Client (SPA)                 Auth Service                 Downstream Service (Backend/AI)
    |                             |                                     |
    |---- 1. OAuth / Google ----->|                                     |
    |<--- 2. Access JWT (15m) ----|                                     |
    |     & HttpOnly Cookie (30d)-|                                     |
    |                             |                                     |
    |---- 3. Request API (Bearer Access JWT) -------------------------->|
    |                             |                                     | 4. Verify signature locally
    |                             |<--- 5. GET /.well-known/jwks.json --|    using cached JWKS public key
    |                             |        (Only on cold boot / key miss)|
```

---

## 2. Key Architectural Tenets

### 1. RS256 Asymmetric Signing
- **Private Key:** Held securely ONLY by the `Auth` service (`Auth/keys/private.pem` or `RSA_PRIVATE_KEY` env).
- **Public Key:** Exposed by Auth at `/.well-known/jwks.json` and cached by downstream services.
- **Benefits:** Downstream microservices do **NOT** need access to the private signing key, preventing compromise propagation.

### 2. JWKS Endpoint & In-Memory Key Caching (`identifyUser.middleware.js`)
- Downstream services verify access tokens statelessly without calling Auth per request.
- The JWKS key array is cached in memory (or Redis L5) for 24 hours (`CACHE_TTL_MS`).
- **Zero-Downtime Key Rotation:** When a token with an unrecognized `kid` (Key ID) arrives, the middleware forces an immediate re-fetch from `AUTH_JWKS_URI` once before rejecting, enabling seamless key rollover.

### 3. Opaque Rotating Refresh Token Families
- **Storage:** Stored in an `HttpOnly`, `SameSite=Lax`, `Secure` (production) cookie scoped strictly to `path: '/api/auth/refresh'`.
- **Database Model:** Only the cryptographic **SHA-256 hash** of the refresh token is stored in MongoDB along with a unique `familyId`.
- **Single-Use Rotation:** Every time `/api/auth/refresh` is called, the old token is marked `used = true`, and a new refresh token is issued within the same `familyId`.
- **Replay Attack Detection:** If a token marked `used = true` is ever presented again (indicating token theft or replay), the Auth service deletes all tokens sharing that `familyId`, instantly revoking all sessions for that compromised chain.

### 4. Client-Side XSS Protection
- **No LocalStorage:** Access tokens are **never** stored in `localStorage`, `sessionStorage`, or plain cookies.
- **Closure Memory:** Access tokens reside exclusively in JavaScript module memory (`apiClient.js` variable).
- **Transparent 401 Interceptor:** When an access token expires (15m lifetime), Axios catches the 401, pauses and queues concurrent outgoing requests, calls `POST /api/auth/refresh` silently, stores the fresh access token in memory, and replays all queued requests with zero user disruption.

---

## 3. JWT Payload Standard

```json
{
  "sub": "64f1a2b3c4d5e6f7a8b9c0d1",
  "email": "pilot.cadet@flightprep.ai",
  "name": "Alex Mercer",
  "role": "student",
  "iss": "auth.atcvoicesimulator.in",
  "aud": "atcvoicesimulator-services",
  "iat": 1718000000,
  "exp": 1718000900
}
```
Header contains:
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "auth-rsa-v1"
}
```

---

## 4. Refresh Token Database Schema (`refreshToken.model.js`)

```javascript
import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    familyId: { type: String, required: true, index: true },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL auto-cleanup
}, { timestamps: true });

export default mongoose.model('RefreshToken', refreshTokenSchema);
```
