# ⚡ 7-Layer Redis Caching Engine — Sub-300ms Voice Agent Latency

## 1. The Core Voice Latency Problem

In real-time conversational voice agents, conversational turns require strict sub-500ms latency to feel natural. Standard AI voice pipelines accumulate significant delay:

```
[STT Transcription] ~300ms ➔ [Vector RAG Retrieval] ~450ms ➔ [LLM Inference] ~900ms ➔ [TTS Synthesis] ~650ms
=============================================================================================================
TOTAL TRADITIONAL LATENCY = ~2,300ms (UNACCEPTABLE FOR VOICE SIMULATION)
```

Through a **7-Tier Redis Caching Engine**, the platform achieves **<280ms** end-to-end response time:

```
[STT Transcription] ~250ms ➔ [L1/L2 Redis RAG] ~5ms ➔ [Template Engine (0ms LLM)] ~0ms ➔ [L7 Redis TTS] ~5ms
=============================================================================================================
OPTIMIZED REDIS PLATFORM LATENCY = <280ms (REAL-TIME CONVERSATIONAL VOICE EMULATION)
```

---

## 2. The 7-Layer Matrix Specification

| Tier | Layer Name | Redis Key Pattern | Data Structure | TTL | Hit Latency | Purpose |
|---|---|---|---|---|---|---|
| **L1** | **Template Embedding Cache** | `emb:tmpl:{templateId}` | String (JSON Array) | 30 Days | `~2ms` | Caches pre-computed 1024-dim Mistral embedding vectors for prompt templates. Bypasses embedding API calls. |
| **L2** | **Qdrant Grounding Cache** | `gnd:tmpl:{templateId}` | String (JSON Array) | 7 Days | `~3ms` | Caches top-k retrieved regulatory/phraseology chunks per step template. Bypasses vector DB search overhead. |
| **L3** | **State Checkpoint Cache** | `sess:cp:{sessionId}` | String (JSON Map) | 24 Hours | `~4ms` | Serializes complete LangGraph `AgentState` on interrupt boundary. Re-hydrates state machine in <5ms upon PTT release. |
| **L4** | **Dynamic Session Slot Cache** | `sess:slots:{sessionId}` | Hash / String Map | 24 Hours | `~2ms` | Holds session-randomized variables (e.g. wind `270@14`, altimeter `29.92`, squawk `4521`). Guarantees turn consistency without DB lookups. |
| **L5** | **JWKS Public Key Cache** | `auth:jwks:cache` | String (JSON Array) | 24 Hours | `~1ms` | Caches Auth service RSA public keys. Enables zero-latency local token verification without inter-service HTTP calls. |
| **L6** | **Sliding Window Rate Limiter** | `rl:ip:{ipAddress}` | Int Counter | 15 Mins | `~1ms` | Sliding window rate-limiting counter protecting against LLM credit abuse and denial of service. |
| **L7** | **TTS Audio Output Cache** | `tts:{sha256(text)}` | String (Base64 MP3) | 7 Days | `~5ms` | Caches SHA-256 hashed audio output for static controller lines. Reduces TTS synthesis latency from ~650ms to ~5ms. |

---

## 3. Fast-Path Template Rendering (~0ms LLM)

When a turn follows a known template:
1. `loadStepNode` populates dynamic slots from Redis L4 into the step's template string (e.g., `"{callsign}, Boston Ground, taxi to runway {runway} via Alpha"`).
2. `composeLineNode` replaces placeholder tokens directly in memory in **~0ms**, bypassing LLM generation entirely.
3. Fallback to Mistral LLM occurs only when general questions or complex dynamic corrections are required.

```javascript
export function renderTemplate(templateStr, slots) {
    return templateStr.replace(/\{(\w+)\}/g, (match, key) => {
        return slots[key] !== undefined ? slots[key] : match;
    });
}
```

---

## 4. TTS Audio Caching Implementation Pattern (`L7`)

```javascript
import crypto from 'crypto';

export async function speakWithCache(text, redisClient, rimeTtsService) {
    if (!text || !text.trim()) return { audioBase64: null, cacheHit: false };

    // Compute deterministic 16-char SHA-256 hash
    const textHash = crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex').slice(0, 16);
    const cacheKey = `tts:${textHash}`;

    // 1. Try L7 Redis Hit
    const cachedAudio = await redisClient.get(cacheKey);
    if (cachedAudio) {
        return { audioBase64: cachedAudio, cacheHit: true }; // ~5ms Hit!
    }

    // 2. Synthesize via Rime TTS
    const { audioBase64 } = await rimeTtsService.synthesize(text);

    // 3. Populate L7 Cache (7 days)
    if (audioBase64) {
        await redisClient.setex(cacheKey, 7 * 86400, audioBase64);
    }

    return { audioBase64, cacheHit: false };
}
```
