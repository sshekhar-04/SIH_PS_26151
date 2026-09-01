// ============================================================================
// Example: Standard Microservice Bootstrap (server.js vs app/app.js)
// ============================================================================

// ----------------------------------------------------------------------------
// File 1: server.js (Process Entry Point ONLY)
// ----------------------------------------------------------------------------
import dotenv from 'dotenv';
import app from './app/app.js';
import { connectToDb } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    try {
        await connectToDb();
        console.log(`[Service] Successfully connected to database and listening on port ${PORT}`);
    } catch (err) {
        console.error('[Service] Startup error:', err.message);
        process.exit(1);
    }
});

// ----------------------------------------------------------------------------
// File 2: app/app.js (Express Application Factory)
// ----------------------------------------------------------------------------
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
// import domainRouter from '../routes/domain.routes.js';

const expressApp = express();

// Global Middleware
expressApp.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
expressApp.use(express.json({ limit: '10mb' }));
expressApp.use(cookieParser());
expressApp.use(morgan('dev'));

// Domain Routes
// expressApp.use('/api/backend/resource', domainRouter);

// Kubernetes Probes
expressApp.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', message: 'Service is healthy' });
});

expressApp.get('/readyz', (_req, res) => {
    res.status(200).json({ status: 'ready', message: 'Service is ready' });
});

// 404 Route Catch-All
expressApp.use((_req, res) => {
    res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Global Error Handler
expressApp.use((err, _req, res, _next) => {
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

export default expressApp;
