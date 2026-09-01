// ============================================================================
// Example: Refresh Token Rotation Family with Replay Attack Detection
// ============================================================================
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
// import RefreshToken from '../models/refreshToken.model.js';
// import User from '../models/user.model.js';

/**
 * Generates an opaque random hex string for the refresh token.
 */
export const generateOpaqueToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Hashes an opaque token via SHA-256 for secure database storage.
 */
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Issues RS256 Access Token + Opaque Refresh Token Pair
 */
export const issueTokenPair = async (user, existingFamilyId = null, privateKeyPem, RefreshTokenModel) => {
    const familyId = existingFamilyId || crypto.randomUUID();
    const rawRefreshToken = generateOpaqueToken();
    const tokenHash = hashToken(rawRefreshToken);

    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 Days

    // Save hashed refresh token to database
    await RefreshTokenModel.create({
        userId: user._id,
        tokenHash,
        familyId,
        used: false,
        expiresAt: refreshTokenExpiresAt,
    });

    // Sign 15-minute asymmetric RS256 JWT
    const accessToken = jwt.sign(
        {
            sub: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || 'student',
        },
        privateKeyPem,
        {
            algorithm: 'RS256',
            expiresIn: '15m',
            keyid: 'auth-rsa-v1',
            issuer: 'auth.atcvoicesimulator.in',
            audience: 'atcvoicesimulator-services',
        }
    );

    return { accessToken, refreshToken: rawRefreshToken };
};

/**
 * Sets secure HttpOnly cookie for the refresh token.
 */
export const setRefreshCookie = (res, rawRefreshToken) => {
    res.cookie('refreshToken', rawRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/api/auth/refresh', // Scoped strictly to refresh endpoint
    });
};

/**
 * Controller: POST /api/auth/refresh with Replay Detection
 */
export const refreshAccessTokenController = async (req, res, next, dependencies) => {
    const { RefreshToken, User, privateKeyPem } = dependencies;

    try {
        const rawRefreshToken = req.cookies?.refreshToken;
        if (!rawRefreshToken) {
            return res.status(401).json({ status: 'error', message: 'No refresh token provided' });
        }

        const tokenHash = hashToken(rawRefreshToken);
        const stored = await RefreshToken.findOne({ tokenHash });

        if (!stored || stored.expiresAt < new Date()) {
            res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
            return res.status(401).json({ status: 'error', message: 'Invalid or expired refresh token' });
        }

        // ── REPLAY ATTACK DETECTION ──────────────────────────────────────────
        // If a previously used (rotated) token is presented, revoke the ENTIRE family!
        if (stored.used) {
            console.warn(`[Security Alert] Replay detected for family ${stored.familyId}! Revoking all sessions.`);
            await RefreshToken.deleteMany({ familyId: stored.familyId });
            res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
            return res.status(401).json({
                status: 'error',
                message: 'Security violation: Refresh token reuse detected. All sessions revoked.',
            });
        }

        // Mark current token as used
        stored.used = true;
        await stored.save();

        const user = await User.findById(stored.userId);
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'User not found' });
        }

        // Issue new token pair within the SAME family
        const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(
            user,
            stored.familyId,
            privateKeyPem,
            RefreshToken
        );

        setRefreshCookie(res, newRefreshToken);

        return res.status(200).json({
            status: 'success',
            accessToken,
        });
    } catch (err) {
        next(err);
    }
};
