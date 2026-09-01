# 🎨 Frontend 4-Layer Feature Architecture & Real-Time Voice UX

## 1. Feature Domain Isolation

Every functional area in the frontend lives completely self-contained in `src/features/<feature_name>/` using a strict **4-Layer Architecture**:

```
Frontend/src/features/[feature_name]/
├── components/          # Layer 1: Pure JSX rendering & co-located SCSS
│   ├── [Component].jsx
│   └── [Component].scss
├── Hooks/               # Layer 2: Business logic, IndexedDB cache, async orchestration
│   └── [feature].hooks.js
├── service/             # Layer 3: Pure Axios HTTP API calls (zero React/Redux deps)
│   └── [feature].api.js
└── slice/               # Layer 4: Redux Toolkit synchronous mutators (NO async thunks)
    └── [feature].slice.js
```

---

## 2. The 4 Execution Layers Explained

```
┌─────────────────────────────────────────────────────────┐
│                   1. Components Layer                   │
│      (Pure JSX Rendering, Event Triggers, UI State)     │
└───────────────────────────┬─────────────────────────────┘
                            │ Calls custom hooks
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    2. Custom Hooks Layer                │
│ (Business Logic, IndexedDB Cache, Async Flow Control)   │
└─────────────┬─────────────────────────────┬─────────────┘
              │ Calls API Service           │ Dispatches Redux actions
              ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────┐
│     3. Service Layer      │   │   4. Redux Slice Layer  │
│  (Axios / HTTP API Calls) │   │  (Sync Redux Mutators)  │
└───────────────────────────┘   └─────────────────────────┘
```

### Layer 1: Component Layer
- Pure presentation. Consumes data and actions exclusively from custom hooks.
- **Rule:** Never call `axios`, `fetch`, or create complex async handlers directly in JSX components.

### Layer 2: Custom Hook Layer
- Contains all application logic, side effects (`useEffect`), IndexedDB reads/writes, error parsing, and Redux dispatches.
- Exposes clean semantic interfaces to components (e.g. `{ session, isRecording, startTurn, loading }`).

### Layer 3: API Service Layer
- Contains raw HTTP calls using the shared `apiClient` instance.
- Pure async functions returning raw response payloads.
- **Rule:** Zero React hooks, zero Redux dependencies.

### Layer 4: Redux Slice Layer
- Stores synchronous UI state.
- **Rule:** No `createAsyncThunk`. Async operations belong strictly in the Custom Hook layer.

---

## 3. Silent 401 Token Refresh & Request Queue Pattern

`src/services/apiClient.js` prevents session disruption by seamlessly renewing expired JWTs in memory:

```javascript
let _accessToken = null;
let isRefreshing = false;
let failedQueue = [];

export const setAccessToken = (token) => { _accessToken = token; };
export const getAccessToken = () => _accessToken;

// 401 Response Interceptor with Queuing
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (error?.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        setAccessToken(data.accessToken);
        failedQueue.forEach(prom => prom.resolve(data.accessToken));
        failedQueue = [];
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        failedQueue.forEach(prom => prom.reject(err));
        failedQueue = [];
        _accessToken = null;
        store.dispatch(clearAuth());
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 4. Web Audio API Voice Interaction Pipeline

1. **Push-to-Talk (PTT) Keyboard Capture:** Spacebar listener (`keydown` / `keyup`) bound to audio recorder.
2. **MediaStream & AudioBuffer Processing:** Captures raw microphone input via `navigator.mediaDevices.getUserMedia({ audio: true })` and encodes it into standard WAV/PCM blobs.
3. **Real-Time Visualizer Telemetry:** AnalyserNode calculates frequency bins to drive real-time audio visualizers (e.g. 3D MetallicOrb or equalizer bars) via WebSockets (`/ws/simulator`).
4. **Playback Synthesizer:** Instantiates Web Audio Buffer source for zero-gap playback of incoming base64 controller responses.
