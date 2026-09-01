# 📚 High-Fidelity Vector RAG Pipeline & Qdrant Grounding

## 1. Complete Regulatory Grounding

The platform indexes 100% of official regulatory manuals:
1. **ICAO Doc 4444 Amendment** (82 Pages) — Global radiotelephony standards.
2. **FAA Order JO 7110.65** (927 Pages) — Complete FAA Air Traffic Control handbook.

---

## 2. Ingestion & Chunking Strategy

To maintain complete procedural integrity without fragmenting radio phraseology tables:
- **Chunk Size:** ~250 words per chunk.
- **Overlap:** 40-word sliding window overlap.
- **Chunk Metadata:** Preserves source document, chapter, section title, page number, and phraseology categories (`ground`, `tower`, `approach`, `emergency`).
- **Total Chunks:** Exactly 1,912 indexed vectors.

```
PDF Manual (1,009 Pages)
   │
   ▼
[helpers/extract_pdf_text.py]  ➔ Regex cleaning, chapter tagging & chunk splitting
   │
   ▼
[extracted_atc_text.json]      ➔ 1,912 structured chunks
   │
   ▼
[Ai-service/scripts/ingestRagDocs.js]
   │  - Batch embedding via Mistral (1024 dimensions)
   │  - Exponential backoff retry on HTTP 429 rate limits
   │  - Upsert to Qdrant collection `atc_phraseology`
   ▼
Qdrant Vector Database
```

---

## 3. Qdrant Collection Configuration

```javascript
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
});

export async function initCollection() {
    const collections = await client.getCollections();
    const exists = collections.collections.some(c => c.name === 'atc_phraseology');

    if (!exists) {
        await client.createCollection('atc_phraseology', {
            vectors: {
                size: 1024,          // mistral-embed vector dimension
                distance: 'Cosine',
            },
            optimizers_config: {
                default_segment_number: 2,
            },
        });
    }
}
```

---

## 4. Context Grounding Injection into Agent Nodes

In `qdrantRetrieveNode`:
1. Check Redis L2 (`gnd:tmpl:{templateId}`) for cached phraseology rules (~3ms).
2. On cache miss:
   - Embed query using Mistral (`mistral-embed`).
   - Query Qdrant with cosine similarity (filter by `phase` or `procedureType` when applicable).
   - Top-3 excerpts are injected into `AgentState.grounding`.
   - Store in Redis L2 (7-day TTL).
3. The LLM prompt in `generalAnswerNode` uses grounded context to enforce exact regulatory phraseology:

```markdown
You are an authoritative Air Traffic Controller. Answer the pilot's inquiry strictly using the provided regulatory context.
If the context does not cover the question, cite standard FAA JO 7110.65 / ICAO Doc 4444 procedures.

[GROUNDING CONTEXT]
{{groundingExcerpts}}
```
