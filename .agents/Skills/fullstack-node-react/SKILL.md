---
name: fullstack-node-react
description: >-
  Provides best practices, patterns, and conventions for Full-Stack development using Node.js/Express and React.
  Covers modular Express routing, middleware, async error handling, React component design, hooks, state management,
  and client-server integration.
  Use when building or refactoring Node.js backend services and React frontend applications.
---

# Full-Stack Node.js & React Development Guide

This skill provides architectural standards, conventions, and guidelines for modern JavaScript/TypeScript full-stack applications.

---

## 1. Node.js / Express Backend Architecture

### Recommended Structure:
```text
server/
├── config/              # Database connection, env variables
├── controllers/         # Request handling & HTTP response logic
├── middleware/          # Auth (JWT), validation, error handling, logging
├── models/              # Mongoose schemas or DB entities
├── routes/              # Express Router definitions
├── services/            # Business logic and database operations
├── utils/               # Helper utilities & custom error classes
└── app.js (or index.js) # App entrypoint
```

### Key Principles:
1. **Async Error Handling**: Use `express-async-handler` or an async wrapper so unhandled promise rejections are passed to the global error middleware.
2. **Environment Variables**: Load and validate configuration using `dotenv` and avoid hardcoding secrets.
3. **CORS & Security**: Use `cors`, `helmet`, and sanitize user inputs.

```javascript
// Centralized error middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});
```

---

## 2. React Frontend Architecture

### Recommended Structure:
```text
client/src/
├── assets/              # Static files, icons, images
├── components/          # Reusable UI components (Buttons, Modals, Navbar)
├── context/ / store/    # Context API or state management (Redux/Zustand)
├── hooks/               # Custom React hooks (e.g., useAuth, useFetch)
├── pages/               # Route-level page components
├── services/            # Axios/Fetch API client functions
└── styles/              # Global CSS / design tokens
```

### Key Principles:
1. **Component Design**: Keep components small, focused, and single-purpose. Separate presentation from data fetching.
2. **Custom Hooks**: Encapsulate data fetching, form handling, and lifecycle logic inside reusable hooks.
3. **State Management**:
   - Use local `useState` for component-specific UI state.
   - Use Context / Zustand / Redux for global state (e.g., current user, theme, auth token).
   - Use React Query / SWR for server-state caching when appropriate.
4. **API Client Layer**: Group API calls in a dedicated `services/api.js` using configured Axios instances with request/response interceptors for automatic JWT attachment.

```javascript
// Example: Axios instance with auth interceptor
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```
