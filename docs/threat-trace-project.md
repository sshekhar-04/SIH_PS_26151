# Threat-Trace
## Dark Web Threat Actor De-anonymization — SIH 2026, Problem Statement 151

---

## 1. Official Problem Statement (as released by SIH)

| Field | Value |
|---|---|
| PS ID | SIH26151 |
| Track | Software |
| Theme | Blockchain & Cybersecurity |
| Sponsoring Organization | National Technical Research Organisation (NTRO) |
| Title | Dark web threat actor de-anonymization |
| Prize | ₹1,00,000 |
| Submission deadline | 20 September 2026 |
| Portal | sih.gov.in |

> **Note:** The official portal releases this PS with only a title and category — no detailed brief is published beyond "Dark web threat actor de-anonymization." Everything below this point (problem interpretation, architecture, tech stack, and plan) is the team's own scoping of that title into a concrete, buildable system, not additional text from the sponsoring organization.

---

## 2. Our Interpretation of the Problem

**The gap NTRO is pointing at:** threat actors on dark-web forums and marketplaces deliberately obscure their identity, but they still leak fragments of identifying information — reused PGP keys, wallet addresses, writing style, hosting infrastructure. No single fragment proves who someone is; the challenge is *correlating fragments across sources into an evidence-backed identity picture* that an investigator can act on.

**What we are building:** a defensive intelligence platform that:
1. Collects footprints from a synthetic (safe, legally-compliant) dark-web-style forum
2. Extracts identifiers from those footprints
3. Correlates identifiers across handles using weighted, explainable evidence scoring
4. Presents the resulting attribution graph to an investigator, with full traceability back to source evidence

**What we are explicitly not building:** an automatic "identity prover." No single signal (a shared wallet, a stylistic similarity) is ever allowed to declare two identities the same person on its own — the system produces *investigative leads*, not verdicts.

**Demo constraint (self-imposed, for legal/ethical safety):** we do not scrape real dark-web marketplaces. All collection runs against a locally hosted synthetic forum seeded with deliberately planted relationships, so the demo is fully reproducible and free of any legal exposure.

---

## 3. System Architecture

```
                         Synthetic Forum
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Aryan          │
                    │ Scraper + Entity     │
                    │ Resolution           │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        ┌───────────┐    ┌────────────┐   ┌────────────┐
        │ Shreyansh │    │  Kushagra  │   │   Sakshi   │
        │  Infra    │    │ Stylometry │   │ Blockchain │
        │  Scanner  │    │     AI     │   │   Tracer   │
        └─────┬─────┘    └──────┬─────┘   └──────┬─────┘
              │                 │                │
              └─────────────────┼────────────────┘
                                ▼
                         ┌──────────────┐
                         │    Neo4j     │
                         │   Evidence   │
                         │    Graph     │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │    Sahil     │
                         │ API Gateway  │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   Himanshu   │
                         │  Dashboard   │
                         └──────────────┘
```

**Flow in plain terms:** the scraper collects raw footprints → three independent modules (infra fingerprinting, writing-style analysis, blockchain tracing) each extract their own evidence type → everything converges on a Neo4j graph where identities are connected by typed, confidence-scored relationships → the API gateway serves that graph → the dashboard turns it into actor profiles, a network view, a timeline, and exports.

---

## 4. Team & Module Ownership

| Member | Module | Responsibility |
|---|---|---|
| Sahil | Backend / API Gateway | API contracts, DB coordination, service integration |
| Aryan | Scraper + Entity Resolution | Scraping, identifier extraction, candidate matching, Union-Find clustering |
| **Shreyansh** | **Infrastructure Scanner** | Favicon hashing, TLS cert/CT correlation, HTTP header fingerprinting (via Shodan API) |
| Kushagra | Stylometry AI | Writing-style similarity scoring (TF-IDF + character n-grams + cosine similarity/logistic regression) |
| Sakshi | Blockchain Tracer | Wallet extraction, transaction-graph tracing via Blockstream (BTC) / Etherscan (ETH) |
| Himanshu | Dashboard | Actor profiles, knowledge-graph visualization, timeline, exports |

---

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend / API Gateway | Node.js + TypeScript + Express |
| Scraper | Node.js + TypeScript (Axios/Cheerio static, Playwright dynamic) |
| Entity Resolution | TypeScript + custom Union-Find |
| Stylometry | Python + scikit-learn |
| Blockchain | Node.js + Blockstream / Etherscan APIs |
| Infra correlation | Node.js + Shodan API |
| Graph Database | Neo4j |
| Relational Database | PostgreSQL + Prisma |
| Containerization | Docker + Docker Compose |
| Graph Visualization | Cytoscape.js |
| Export | CSV + JSON + PDF |

---

## 6. Evidence Model

### Evidence strength (used for confidence scoring)

| Signal | Strength | Starting Weight |
|---|---|---|
| PGP fingerprint match | Very strong | +0.50 |
| Email match | Strong | +0.30 |
| XMPP match | Strong | +0.30 |
| Stylometry similarity | Supporting | +0.30 |
| Repeated wallet match | Medium | +0.20 |
| Signature similarity | Supporting | +0.10 |
| Handle similarity | Weak | +0.10 |

```
0.80 – 1.00 → High confidence
0.60 – 0.79 → Medium confidence
0.40 – 0.59 → Low confidence
< 0.40      → Insufficient — no automatic link
```

**Golden rule:** confidence scores are evidence scores, not calibrated probabilities. A single weak signal (e.g. a shared wallet) never triggers an automatic `SAME_AS` relationship — only strong signals, or several stacked signals crossing threshold, do.

### Neo4j schema (core)

```cypher
(:Handle)-[:POSTED]->(:Post)
(:Handle)-[:USES_WALLET]->(:Wallet)
(:Handle)-[:USES_KEY]->(:PGPKey)
(:Handle)-[:USES_EMAIL]->(:Email)
(:Handle)-[:LINKED_TO {method, confidence}]->(:Infra)
(:Handle)-[:SAME_AS {confidence, evidence}]->(:Handle)
(:Wallet)-[:SENT_TO {tx_hash, amount, timestamp}]->(:Wallet)
```

Every relationship carries **evidence provenance** — source post, timestamp, identifier, and method — so the dashboard can always answer "why are these identities linked?" with the actual receipts, not just a score.

---

## 7. 10-Day Build Plan

| Day | Goal |
|---|---|
| 1 | Neo4j schema + API contracts + Docker setup |
| 2–3 | Individual module proof-of-concepts |
| 4–6 | Core implementation |
| 7 | Neo4j integration |
| 8 | Full pipeline integration |
| 9 | Dashboard + exports |
| 10 | Testing + demo rehearsal + presentation |

**MVP priority (if time runs short):** Synthetic Forum → Scraper → Entity Extraction → PGP/Wallet/Email Correlation → Confidence Scoring → Neo4j → Dashboard. Stylometry, infra scanning, blockchain tracing, and Tor routing are explicitly "add later" — optional depth, not blockers to a working demo.

---

## 8. Demo Scenario

Three seeded handles with deliberately planted relationships:

```
shadowfox     → PGP_A + Wallet_A
darkmerchant  → PGP_A + Wallet_B
shadow_x      → Wallet_A
```

**Expected system behavior:**
- `shadowfox` ↔ `darkmerchant` → high-confidence `SAME_AS` (shared PGP key)
- `shadowfox` ↔ `shadow_x` → **no automatic link** (shared wallet only — insufficient alone)
- Adding stylometry evidence on top of PGP evidence should visibly raise attribution confidence further

The dashboard should be able to answer, live, for any pair: **"why are these identities linked?"** — showing the actual evidence, not just a number.

---

## 9. Ethical & Legal Framing (for judges)

- All collection runs against a **self-hosted synthetic forum** — no real dark-web sites are scraped.
- A real deployment would require **explicit authorization** from an agency (e.g. coordination through I4C under the IT Act), not independent student collection.
- The system extracts only **identifiers and metadata**, never stores illegal content itself.
- Every `SAME_AS` link is a **lead for human review**, never an automated conclusion acted on.
- Infrastructure fingerprinting (favicon, TLS cert) works **without authentication**, since it's exchanged before any login page loads — this lets infra correlation run independently of, and in parallel with, the authenticated content-scraping pipeline.

---

## 10. Glossary

| Term | Meaning |
|---|---|
| Synthetic forum | Self-hosted fake test site standing in for a real dark-web forum |
| Entity resolution | Deciding which different-looking records refer to the same real identity |
| Union-Find | Algorithm for merging connected items into groups/clusters |
| Confidence score | Weighted 0–1 value representing evidence strength for a link |
| Graph database | Database where relationships are first-class, queryable objects (Neo4j) |
| Evidence provenance | Traceable origin of a piece of evidence — source, time, method |
| Stylometry | Statistical analysis of writing style to estimate authorship |
| PGP fingerprint | Unique identifier derived from a public encryption key |
| API gateway | Single entry point routing requests between backend services |

---

*Source for Section 1: Smart India Hackathon 2026 official problem statement release (sih.gov.in/sih2026PS), PS26151, sponsored by the National Technical Research Organisation (NTRO), under the Blockchain & Cybersecurity theme.*
