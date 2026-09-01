// ============================================================================
// Example: Zero-Trust Stateless RS256 JWKS Key Caching Middleware
// ============================================================================
import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';

const AUTH_JWKS_URI = process.env.AUTH_JWKS_URI || 'http://auth-service:3000/api/auth/.well-known/jwks.json';

const JWT_VERIFY_OPTIONS = {
    algorithms: ['RS256'],
    issuer: process.env.JWT_ISSUER || 'auth.atcvoicesimulator.in',
    audience: process.env.JWT_AUDIENCE || 'atcvoicesimulator-services',
};

let cachedJwks = null;
let lastFetchedTime = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

/**
 * Fetches JWKS key set from Auth service with fallback and stale-cache resilience.
 */
async function fetchJwks(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedJwks && now - lastFetchedTime < CACHE_TTL_MS) {
        return cachedJwks;
    }

    const urisToTry = [
        AUTH_JWKS_URI,
        'http://localhost:3000/api/auth/.well-known/jwks.json',
        'http://auth-service:3000/api/auth/.well-known/jwks.json',
    ];

    let lastError = null;
    for (const uri of [...new Set(urisToTry)]) {
        try {
            const response = await fetch(uri);
            if (!response.ok) continue;

            const data = await response.json();
            if (!data.keys || data.keys.length === 0) continue;

            cachedJwks = data.keys;
            lastFetchedTime = now;
            return cachedJwks;
        } catch (err) {
            lastError = err;
        }
    }

    if (cachedJwks) return cachedJwks; // Stale cache fallback during transient outages
    throw new Error(`[JWKS Middleware] Failed to reach Auth Service: ${lastError?.message || 'Connection refused'}`);
}

/**
 * Resolves the RSA public key PEM matching the incoming token's `kid`.
 * Force-refreshes JWKS on key-id miss to support zero-downtime key rotation.
 */
async function resolvePublicKey(token) {
    const header = jwt.decode(token, { complete: true })?.header;
    if (!header?.kid) throw new Error('Token is missing the kid header claim');

    let keys = await fetchJwks();
    let jwk = keys.find((k) => k.kid === header.kid);

    // Key rotation handling: force refresh on cache miss
    if (!jwk) {
        keys = await fetchJwks(true);
        jwk = keys.find((k) => k.kid === header.kid);
    }

    if (!jwk) throw new Error(`No JWKS key found for kid="${header.kid}"`);

    return createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' });
}

/**
 * Express Middleware: identifyUser
 */
export const identifyUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized: Missing or malformed Authorization Bearer header',
        });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: Token is empty' });
    }

    try {
        const publicKeyPem = await resolvePublicKey(token);
        const decoded = jwt.verify(token, publicKeyPem, JWT_VERIFY_OPTIONS);

        const userId = decoded?.sub || decoded?.id;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized: Missing user identity claims' });
        }

        req.user = {
            id: userId,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role || 'student',
        };
        req.authToken = token;

        next();
    } catch (err) {
        const isExpired = err.name === 'TokenExpiredError';
        return res.status(401).json({
            status: 'error',
            message: isExpired ? 'Unauthorized: Access token expired. Please refresh.' : `Unauthorized: ${err.message}`,
            expired: isExpired,
        });
    }
};
