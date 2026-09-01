# Threat-Trace — Rebuilt System Architecture
## Dark Web Threat Actor De-anonymization | SIH 2026 · PS26151 · NTRO

> **Version 2.0** — Architecture rebuilt after deep analysis of:
> `threat-trace-project.md` · `onionscan/` source (Go) · `graphsense-python/` API library · Research PDFs on dark web crawling and de-anonymization

---

## 1. Problem Decomposition (NTRO's Intent)

The title *"Dark web threat actor de-anonymization"* encodes three distinct technical challenges that NTRO wants solved in tandem:

| Challenge | What it means | How we solve it |
|---|---|---|
| **Collection** | Reaching onion-space content safely and legally | Synthetic `.onion`-style forum + OnionScan-inspired crawl pipeline |
| **Extraction** | Pulling structured identifiers from unstructured pages | Multi-signal extractor: BTC addresses, PGP blobs, emails, SSH/TLS fingerprints, EXIF, writing style |
| **De-anonymization** | Deciding which extracted fragments belong to the same human | Weighted evidence graph (Neo4j) + Union-Find clustering + confidence scoring |

---

## 2. Key Research Anchors (from PDFs in repo)

| Source | Insight absorbed into our design |
|---|---|
| *Systematic Literature Review of Dark Web Crawlers* | Dark web crawlers must handle Tor SOCKS5 proxy, handle authentication pages, parse `href` links carefully, and respect `robots.txt` in a minimal-rights way |
| *Dark Web Phenomenon — Research Agenda* | De-anonymization happens at **four layers**: network (Tor traffic analysis), application (HTTP headers/cookies), content (writing style, wallet reuse), and social (cross-platform handle correlation) |
| *Ho Thanh Nghia 2017* | Bitcoin transaction-graph tracing using multi-hop address clustering can link wallets across pseudonymous users — the graphsense-python API automates exactly this |
| *JDIM Vol 17* | Identity resolution on dark web requires probabilistic evidence fusion, not binary matching — confirms our confidence-scoring approach |

---

## 3. Technology Reframing (What the Repo Tools Actually Are)

### 3a. OnionScan (Go source in `/onionscan/`)
OnionScan is NOT just a scanner — it is a **reference implementation** for our extraction pipeline. We adopt its architecture:

```
onionscan/deanonymization/
  ├── check_bitcoin_addresses.go   → BTC regex + Base58 checksum validation (verbatim adoptable)
  ├── pgp_content_scan.go          → PGP blob regex + openpgp key fingerprint extraction
  ├── email_scan.go                → Email address extraction from HTML
  ├── common_correlations.go       → SSH key, FTP/SMTP banners, HTTP headers correlation
  ├── check_exif.go                → EXIF GPS/device data from images
  └── get_onion_links.go           → Onion-to-onion link graph builder

onionscan/protocol/
  ├── bitcoin_scanner.go           → Multi-hop BTC address graph (P2PKH + P2SH)
  ├── tls_scanner.go               → TLS cert subject / SAN extraction
  ├── ssh_scanner.go               → SSH host key fingerprint
  └── xmpp_scanner.go              → XMPP JID scraping
```

**Design decision:** We do not re-invent these detectors. We port/adapt the Go logic to TypeScript (`tspc` or `esbuild`) or call them as a Go subprocess from Node.js.

### 3b. GraphSense Python (`/graphsense-python/`)
GraphSense provides a **forensic blockchain API** (hosted at `api.ikna.io`) with:
- `AddressesApi` — get address details, neighbor graph, all transactions
- `EntitiesApi` — cluster of addresses (GraphSense clustering), entity-level links
- `TagsApi` — known actor labels (exchange wallets, mixer services, dark market wallets)
- `BulkApi` — batch CSV/JSON queries for large-scale tracing

**Design decision:** Replace direct Blockstream/Etherscan calls with GraphSense API. It already does multi-hop clustering and returns actor attribution tags — this is far stronger evidence than a raw wallet lookup.

---

## 4. Rebuilt 7-Layer System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 0 — DATA SOURCE                                                  │
│  Synthetic Forum (Node.js + Express, self-hosted, .onion-style routes)  │
│  Pre-seeded with: handles, posts, PGP keys, BTC wallets, EXIF images    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTP/SOCKS5
┌────────────────────────────────▼────────────────────────────────────────┐
│  LAYER 1 — CRAWL ENGINE  [Aryan]                                        │
│  Node.js + TypeScript + Playwright (dynamic) + Cheerio (static)         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Spider: breadth-first, depth-limited (adapted from onionspider) │    │
│  │ Auth-aware: login → cookie session → authenticated crawl        │    │
│  │ Outputs: raw HTML snapshots + metadata to PostgreSQL (raw_pages)│    │
│  └─────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ Raw HTML + Metadata
┌────────────────────────────────▼────────────────────────────────────────┐
│  LAYER 2 — MULTI-SIGNAL EXTRACTOR  [Aryan + Shreyansh]                 │
│  Parallel extraction workers (adapted from OnionScan deanonymization/)  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ BTC Extractor│  │ PGP Extractor│  │Email/XMPP    │  │EXIF Parser │ │
│  │ Base58 valid │  │ Fingerprint  │  │Extractor     │  │GPS/Device  │ │
│  │ P2PKH + P2SH │  │ + UID email  │  │Regex + parse │  │Metadata    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                 │                  │                │        │
│  ┌──────▼─────────────────▼──────────────────▼────────────────▼──────┐ │
│  │  Handle Entity Resolver — Union-Find clustering                   │ │
│  │  Links handles sharing any identifier → candidate cluster         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ Structured Identifiers
          ┌──────────────────────┼─────────────────────────┐
          ▼                      ▼                         ▼
┌─────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  LAYER 3a       │  │  LAYER 3b            │  │  LAYER 3c            │
│  INFRA SCANNER  │  │  STYLOMETRY ENGINE   │  │  BLOCKCHAIN TRACER   │
│  [Shreyansh]    │  │  [Kushagra]          │  │  [Sakshi]            │
│                 │  │                      │  │                      │
│ Favicon hash    │  │ Python + scikit-learn│  │ graphsense-python    │
│ TLS cert / CT   │  │ TF-IDF char n-grams  │  │ AddressesApi (BTC)   │
│ HTTP headers    │  │ Cosine similarity    │  │ EntitiesApi cluster  │
│ SSH key FP      │  │ Logistic regression  │  │ TagsApi actor labels │
│ Shodan API      │  │ Per-handle model     │  │ Multi-hop graph walk │
│                 │  │                      │  │                      │
│ Output: Infra   │  │ Output: Similarity   │  │ Output: Wallet graph │
│ fingerprint     │  │ matrix [0,1]         │  │ + actor clusters     │
│ nodes           │  │                      │  │                      │
└────────┬────────┘  └──────────┬───────────┘  └──────────┬───────────┘
         │                      │                          │
         └──────────────────────┼──────────────────────────┘
                                │ Evidence Payloads
┌───────────────────────────────▼─────────────────────────────────────────┐
│  LAYER 4 — EVIDENCE FUSION ENGINE  [Sahil]                              │
│  Confidence Scoring + Neo4j Graph Writer                                │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Evidence Weighter                                                │   │
│  │  Signal              Weight   Tier                               │   │
│  │  PGP fingerprint     +0.50    Very Strong                        │   │
│  │  Email match         +0.30    Strong                             │   │
│  │  XMPP JID match      +0.30    Strong                             │   │
│  │  Stylometry sim.     +0.30    Supporting                         │   │
│  │  Wallet reuse        +0.20    Medium                             │   │
│  │  TLS cert match      +0.20    Medium                             │   │
│  │  SSH key match       +0.15    Medium                             │   │
│  │  Favicon hash match  +0.15    Medium                             │   │
│  │  Signature style     +0.10    Weak                               │   │
│  │  Handle similarity   +0.10    Weak                               │   │
│  │  EXIF device match   +0.10    Weak                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Rule: confidence = Σ(signal weights) capped at 1.0                    │
│  Threshold: ≥ 0.60 → SAME_AS link written; < 0.60 → CANDIDATE only     │
│                                                                         │
│  Every link carries full evidence provenance:                           │
│  { source_post, timestamp, identifier_type, method, confidence }        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ Cypher MERGE queries
┌───────────────────────────────▼─────────────────────────────────────────┐
│  LAYER 5 — GRAPH DATABASE  (Neo4j)                                      │
│                                                                         │
│  Node types:                                                            │
│    (:Handle)  (:Post)  (:Wallet)  (:PGPKey)  (:Email)                  │
│    (:Infra)   (:TLSCert)  (:SSHKey)  (:Image)                          │
│                                                                         │
│  Relationship types:                                                    │
│    (:Handle)-[:POSTED {timestamp}]→(:Post)                              │
│    (:Handle)-[:USES_WALLET]→(:Wallet)                                   │
│    (:Handle)-[:USES_KEY]→(:PGPKey)                                      │
│    (:Handle)-[:USES_EMAIL]→(:Email)                                     │
│    (:Handle)-[:LINKED_TO {method, confidence}]→(:Infra)                 │
│    (:Handle)-[:SAME_AS {confidence, evidence[]}]→(:Handle)              │
│    (:Handle)-[:CANDIDATE_OF {confidence}]→(:Handle)   // below 0.60    │
│    (:Wallet)-[:SENT_TO {tx_hash, amount, timestamp}]→(:Wallet)          │
│    (:Wallet)-[:CONTROLLED_BY {actor_label}]→(:Handle)  // GraphSense    │
│    (:Image)-[:TAKEN_BY {device_model, gps_coords}]→(:Handle)           │
│                                                                         │
│  Indexes: Handle.name, Wallet.address, PGPKey.fingerprint               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ Bolt / HTTP
┌───────────────────────────────▼─────────────────────────────────────────┐
│  LAYER 6 — API GATEWAY  [Sahil]                                         │
│  Node.js + TypeScript + Express + Prisma (PostgreSQL)                   │
│                                                                         │
│  REST Endpoints:                                                        │
│    GET  /api/handles              → paginated actor list                │
│    GET  /api/handles/:id          → full actor profile                  │
│    GET  /api/handles/:id/graph    → ego-graph (n hops)                  │
│    GET  /api/handles/:id/evidence → full evidence chain for any link    │
│    GET  /api/wallets/:addr/trace  → blockchain hop trace (GraphSense)   │
│    POST /api/search               → full-text + graph search            │
│    GET  /api/timeline             → chronological event stream          │
│    GET  /api/export/:format       → CSV | JSON | PDF report             │
│    WS   /ws/live                  → real-time scan progress feed        │
│                                                                         │
│  Auth: JWT (investigator role) · Rate-limited · CORS-locked             │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ JSON / WebSocket
┌───────────────────────────────▼─────────────────────────────────────────┐
│  LAYER 7 — INVESTIGATOR DASHBOARD  [Himanshu]                           │
│  React + TypeScript + Tailwind CSS + Cytoscape.js                       │
│                                                                         │
│  Views:                                                                 │
│    1. Actor Profile — handle + all linked identifiers + confidence bars │
│    2. Attribution Graph — Cytoscape force-directed, colored by conf.    │
│    3. Blockchain Flow — wallet-to-wallet transaction graph              │
│    4. Evidence Trail — "Why are these linked?" drill-down panel         │
│    5. Timeline — chronological post/event stream                        │
│    6. Search — cross-entity full-text search                            │
│    7. Export — CSV / JSON / PDF report for investigators                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow (Step-by-Step)

```
Step 1  Synthetic forum is started (Docker service)
        └── Pre-seeded SQLite with handles, posts, PGP blobs, wallet addresses

Step 2  Crawl Engine hits every route breadth-first
        └── Stores raw HTML + headers + cookies in PostgreSQL (raw_pages table)

Step 3  Extractor reads raw_pages queue
        ├── BTC Extractor: regex [13][a-km-z...]{25,34} → Base58 checksum
        ├── PGP Extractor: regex BEGIN PGP → openpgp fingerprint + UID email
        ├── Email Extractor: regex \b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b
        ├── EXIF Parser: image MIME types → ExifReader → GPS + device model
        └── Handle Resolver: Union-Find merges handles sharing any identifier

Step 4  Three parallel enrichment workers fire:
        ├── Infra Scanner: favicon mmh3 hash + TLS cert SAN + Shodan lookup
        ├── Stylometry Engine: per-handle TF-IDF model → cosine sim matrix
        └── Blockchain Tracer: GraphSense AddressesApi → entity cluster → TagsApi

Step 5  Evidence Fusion: Σ weights → confidence score per handle pair
        ├── If confidence ≥ 0.60  → MERGE SAME_AS relationship in Neo4j
        └── If 0.40 ≤ conf < 0.60 → MERGE CANDIDATE_OF (human review required)

Step 6  API Gateway exposes graph via REST + WebSocket
        └── Dashboard polls /api/handles and /ws/live for real-time updates

Step 7  Investigator drills into any actor profile
        └── Evidence Trail answers "why?" with raw source receipts
```

---

## 6. Full Evidence Model (Expanded)

### Signal Weights

| Signal | Source Module | Weight | Threshold Tier |
|---|---|---|---|
| PGP fingerprint match | Extractor | +0.50 | Very Strong |
| Email match (from PGP UID) | Extractor | +0.30 | Strong |
| XMPP JID match | Extractor | +0.30 | Strong |
| Stylometry cosine similarity ≥ 0.85 | Stylometry AI | +0.30 | Supporting |
| BTC wallet reuse | Blockchain Tracer | +0.20 | Medium |
| TLS cert SAN match | Infra Scanner | +0.20 | Medium |
| SSH host key fingerprint match | Infra Scanner | +0.15 | Medium |
| Favicon MurmurHash3 match | Infra Scanner | +0.15 | Medium |
| Writing signature style | Stylometry AI | +0.10 | Weak |
| Handle string similarity | Entity Resolver | +0.10 | Weak |
| EXIF device model match | Extractor | +0.10 | Weak |
| GraphSense actor label match | Blockchain Tracer | +0.25 | Strong (bonus) |

### Confidence Bands

```
≥ 0.80  → HIGH    — investigator can file a lead immediately
0.60–0.79 → MEDIUM  — solid circumstantial evidence, warrants deep investigation
0.40–0.59 → LOW     — CANDIDATE_OF link only, human review needed
< 0.40   → INSUFFICIENT — no link created, raw evidence stored for future
```

### Neo4j Schema (Full)

```cypher
// Core identity graph
(:Handle {name, first_seen, last_seen, post_count})
(:Post   {id, content_hash, timestamp, forum_section})
(:PGPKey {fingerprint, uid_email, key_blob_hash})
(:Email  {address})
(:Wallet {address, chain, first_tx_timestamp, graphsense_entity_id})
(:Infra  {type, value, first_observed}) // types: favicon_hash, tls_san, ssh_key
(:Image  {url, exif_device, exif_gps_lat, exif_gps_lon})

// Relationships
(:Handle)-[:POSTED {timestamp, forum_section}]→(:Post)
(:Handle)-[:USES_WALLET {first_seen_post_id}]→(:Wallet)
(:Handle)-[:USES_KEY {source_post_id}]→(:PGPKey)
(:Handle)-[:USES_EMAIL {source}]→(:Email)
(:Handle)-[:LINKED_TO {method, confidence, source_post_id}]→(:Infra)
(:Handle)-[:POSTED_IMAGE {post_id}]→(:Image)
(:Handle)-[:SAME_AS {
  confidence,
  evidence: [{signal, weight, source_id, timestamp}],
  created_at
}]→(:Handle)
(:Handle)-[:CANDIDATE_OF {confidence, requires_review: true}]→(:Handle)
(:Wallet)-[:SENT_TO {tx_hash, amount_sat, timestamp, hop_depth}]→(:Wallet)
(:Wallet)-[:CONTROLLED_BY {actor_label, source: "graphsense"}]→(:Handle)
```

---

## 7. Module Technical Specs

### Module A — Synthetic Forum (Docker)
- **Tech:** Node.js + Express + SQLite (lightweight, self-contained)
- **Routes:** `/`, `/forum/:section`, `/user/:handle`, `/post/:id`
- **Seeded data:** 3 handles (`shadowfox`, `darkmerchant`, `shadow_x`), 50+ posts, 2 PGP keys, 4 wallets, 3 forum images with EXIF data
- **Purpose:** Fully reproducible, legally safe demo environment

### Module B — Crawl Engine (Aryan)
- **Tech:** TypeScript + Playwright (dynamic JS rendering) + Cheerio (static HTML)
- **Pattern:** OnionScan `onionspider.go` breadth-first, depth-limited crawl
- **Storage:** `raw_pages` table in PostgreSQL via Prisma ORM
- **Rate limit:** 1 req/sec with jitter (respectful crawling)

### Module C — Extractor (Aryan)
- **Tech:** TypeScript, adapted from `onionscan/deanonymization/`
- **BTC:** Regex `[13][a-km-zA-HJ-NP-Z1-9]{25,34}` + Base58 double-SHA256 checksum
- **PGP:** Regex `BEGIN PGP PUBLIC KEY BLOCK` + `openpgp.js` key parsing → fingerprint + UID
- **Email:** RFC 5321-compliant regex, also extracted from PGP UIDs
- **EXIF:** `exifr` npm package for images found during crawl
- **Entity Resolution:** Union-Find (path compression + union by rank) in TypeScript

### Module D — Infra Scanner (Shreyansh)
- **Tech:** TypeScript + Shodan API + `node-fetch`
- **Favicon hash:** Download `/favicon.ico` → MurmurHash3 → cross-reference Shodan
- **TLS cert:** `tls.connect()` → extract `SubjectAltName` + `Subject.CN` → CT log lookup
- **HTTP headers:** `Server`, `X-Powered-By`, `Set-Cookie` patterns → fingerprint string

### Module E — Stylometry AI (Kushagra)
- **Tech:** Python 3.11 + scikit-learn
- **Features:** TF-IDF on character 3-grams, word unigrams, function-word frequency
- **Model:** Per-handle `LogisticRegression` trained on their post history; cosine similarity between post vectors for authorship comparison
- **Output:** JSON similarity matrix `{handle_a, handle_b, similarity: float, posts_compared: int}`

### Module F — Blockchain Tracer (Sakshi)
- **Tech:** Python 3.11 + `graphsense-python` library (from `/graphsense-python/`)
- **APIs used:**
  - `AddressesApi.get_address()` — balance, tx count, first/last tx
  - `AddressesApi.list_address_neighbors()` — direct wallet connections
  - `EntitiesApi.get_entity()` — GraphSense cluster (multiple addresses → one entity)
  - `TagsApi.get_actor()` — known actor labels (exchange, mixer, dark market)
- **Multi-hop:** BFS up to 3 hops, stops if known exchange/mixer found
- **Output:** JSON wallet graph `{nodes: [Wallet], edges: [SENT_TO], clusters: [Entity]}`

### Module G — API Gateway (Sahil)
- **Tech:** Node.js + TypeScript + Express + Prisma + `neo4j-driver`
- **Database:** Neo4j (graph) + PostgreSQL (raw pages, audit log)
- **Auth:** JWT Bearer token, role: `investigator`
- **WebSocket:** Socket.io for live scan progress events

### Module H — Dashboard (Himanshu)
- **Tech:** React 18 + TypeScript + Tailwind CSS + Cytoscape.js + Recharts
- **Key components:**
  - `ActorProfile` — confidence bars, linked identifiers, post history
  - `AttributionGraph` — Cytoscape.js, nodes colored by confidence tier
  - `BlockchainFlow` — wallet-to-wallet directed graph, hop depth shown
  - `EvidenceTrail` — "Why linked?" expandable panel with raw receipts
  - `TimelineView` — chronological event log across all handles

---

## 8. Infrastructure & Deployment (Docker Compose)

```yaml
services:
  synthetic-forum:      # Node.js + SQLite
  crawl-engine:         # Node.js + Playwright
  extractor:            # Node.js + TypeScript
  stylometry-worker:    # Python + scikit-learn
  blockchain-worker:    # Python + graphsense-python
  infra-scanner:        # Node.js + Shodan API
  neo4j:                # Neo4j Community 5.x
  postgres:             # PostgreSQL 16
  api-gateway:          # Node.js + Express
  dashboard:            # React (Vite dev server)
```

All services communicate via Docker bridge network. Neo4j exposed on `bolt://neo4j:7687`. PostgreSQL on `postgres:5432`. All env vars in `.env`.

---

## 9. 10-Day Build Cadence (Revised)

| Day | Deliverable | Owner |
|---|---|---|
| 1 | Docker Compose skeleton + Neo4j schema + PostgreSQL schema + API contracts | Sahil |
| 2 | Synthetic forum (seeded data) + crawl engine proof-of-concept | Aryan |
| 3 | BTC + PGP + Email extractor (port from OnionScan Go → TypeScript) | Aryan |
| 4 | Union-Find entity resolver + confidence scorer skeleton | Aryan + Sahil |
| 5 | Infra scanner (favicon hash + TLS cert) | Shreyansh |
| 5 | Stylometry baseline model (TF-IDF + cosine) | Kushagra |
| 6 | Blockchain tracer using GraphSense API | Sakshi |
| 7 | Neo4j integration — all modules writing evidence to graph | All |
| 8 | Full pipeline integration — end-to-end from crawl to graph | Sahil (integration) |
| 9 | Dashboard: Actor Profile + Attribution Graph + Evidence Trail | Himanshu |
| 10 | End-to-end demo rehearsal + export + presentation polish | All |

**MVP (minimum for a working demo):** Synthetic Forum → Crawl → PGP + BTC + Email Extraction → Confidence Scorer → Neo4j → Actor Profile + Attribution Graph.

---

## 10. Demo Script

```
Actors seeded:

  shadowfox     → PGP_KEY_A  +  BTC_WALLET_A  +  25 posts (aggressive tone)
  darkmerchant  → PGP_KEY_A  +  BTC_WALLET_B  +  18 posts (aggressive tone)
  shadow_x      → BTC_WALLET_A               +  7 posts  (different style)

Expected graph output:

  shadowfox ↔ darkmerchant  [SAME_AS, conf=0.80]
    Evidence: PGP_KEY_A shared (+0.50) + stylometry sim 0.87 (+0.30)

  shadowfox ↔ shadow_x  [CANDIDATE_OF, conf=0.20]
    Evidence: BTC_WALLET_A shared (+0.20) — insufficient alone

  Live demo action: investigator adds manual stylometry annotation
  → shadow_x SAME_AS link rises to 0.50 → still CANDIDATE_OF
  → system correctly refuses to auto-link — human judgment required
```

---

## 11. Ethical & Legal Guardrails

| Constraint | Implementation |
|---|---|
| No real dark-web scraping | All collection against self-hosted synthetic forum |
| No illegal content stored | System stores identifiers and metadata only, never post content body |
| Human-in-the-loop | `SAME_AS` requires confidence ≥ 0.60; `CANDIDATE_OF` flags for human review |
| Evidence provenance | Every link carries source_post_id, timestamp, method — no opaque scores |
| Real deployment scope | Would require I4C authorization under IT Act Section 69B — outside this demo |

---

## 12. Glossary (Extended)

| Term | Meaning |
|---|---|
| OnionScan | Open-source Go tool for dark web service investigation; we use it as an architecture reference |
| GraphSense | Blockchain forensics platform with clustering + actor attribution; `graphsense-python` is our client |
| Union-Find | Path-compressed disjoint-set algorithm for clustering handles sharing any identifier |
| Favicon MurmurHash3 | mmh3 hash of a site's favicon.ico — used by Shodan for service fingerprinting |
| TLS SAN | Subject Alternative Name in a TLS cert — can reveal real hostname behind a Tor hidden service |
| Stylometry | Statistical analysis of writing patterns (n-grams, function words) for authorship attribution |
| Evidence provenance | Full audit trail: source document, timestamp, extraction method, confidence contribution |
| CANDIDATE_OF | Below-threshold attribution link — flags for human review, never actioned automatically |
| GraphSense Entity | Cluster of Bitcoin addresses controlled by the same actor (heuristic co-spend clustering) |
| Base58 checksum | Bitcoin address validation: double-SHA256 of first 21 bytes must match last 4 bytes |
