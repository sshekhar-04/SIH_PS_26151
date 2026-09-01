# Threat-Trace — Hackathon Presentation Script
## Smart India Hackathon 2026 · PS 26151 · NTRO
### Theme: Blockchain & Cybersecurity

> **How to use this file:** Copy each SLIDE section into your preferred PPT tool (Gamma.app, Canva, Beautiful.ai, Google Slides, or PowerPoint Designer AI). Each slide has a Title, Body content, and Speaker Notes.

---

## SLIDE 1 — TITLE SLIDE

**Title:** THREAT-TRACE

**Subtitle:** Dark Web Threat Actor De-anonymization

**Line 1:** Smart India Hackathon 2026 · PS 26151

**Line 2:** Sponsoring Organization: National Technical Research Organisation (NTRO)

**Line 3:** Theme: Blockchain & Cybersecurity · Prize: Rs 1,00,000

**Visual:** Dark deep-navy background. Glowing network graph in the background. Red-orange accent color for "THREAT-TRACE". Team name bottom-left.

**Speaker Notes:**
Good morning/afternoon. We are presenting Threat-Trace — a dark web intelligence platform built to solve one of NTRO's most pressing cybersecurity challenges.

---

## SLIDE 2 — THE PROBLEM

**Title:** The Challenge NTRO Needs Solved

**Visual:** Three-column layout. Column icons: detective (hidden actor), chain-link (fragmented clues), question mark (no tools).

**Column 1 — The Threat:**
- Dark web threat actors hide behind anonymous handles
- They deliberately obscure identity across forums and marketplaces
- Traditional tools cannot cross-correlate fragmented clues

**Column 2 — The Gap:**
- Reused PGP keys, wallet addresses, writing patterns — all leak identity
- No single clue proves identity alone
- Investigators lack a tool to fuse these fragments into actionable leads

**Column 3 — The Ask:**
- NTRO Problem Statement 26151: "Dark web threat actor de-anonymization"
- Need: A system that correlates identity fragments into evidence-backed leads — not verdicts

**Speaker Notes:**
NTRO's problem is not about breaking Tor. It's about the human errors that threat actors make — reusing identifiers across handles. Our job is to find those connections and surface them to human investigators.

---

## SLIDE 3 — OUR SOLUTION

**Title:** Introducing Threat-Trace

**Subtitle:** A Defensive Intelligence Platform for Investigative Attribution

**Four-box layout:**

Box 1 — Collect
Crawl synthetic dark-web-style forum. Extract raw HTML, images, metadata. Zero legal exposure.

Box 2 — Extract
Pull identifiers: PGP keys, Bitcoin wallets, emails, EXIF data, infrastructure fingerprints, writing style.

Box 3 — Correlate
Fuse evidence across handles using weighted confidence scoring and graph analysis.

Box 4 — Investigate
Present attribution graph, evidence trail, timeline and exports to human investigators.

**Key Promise (large text):**
"Every link has a receipt. No automatic verdicts. Only investigative leads."

**Speaker Notes:**
Threat-Trace has four stages in its pipeline. What makes us different: every attribution decision is traceable back to raw source evidence. We produce leads, not accusations.

---

## SLIDE 4 — SYSTEM ARCHITECTURE

**Title:** 7-Layer System Architecture

**Visual:** Vertical pipeline diagram with 7 labeled layers, each with a different accent color. Use icons per layer.

**Layer table (top to bottom):**

| Layer | Name | Key Technology |
|---|---|---|
| 0 | Synthetic Forum | Node.js + Express + SQLite |
| 1 | Crawl Engine | Playwright + Cheerio + TypeScript |
| 2 | Multi-Signal Extractor | TypeScript (OnionScan-inspired) |
| 3a | Infrastructure Scanner | Shodan API + TLS + Favicon Hash |
| 3b | Stylometry Engine | Python + scikit-learn |
| 3c | Blockchain Tracer | GraphSense Python API |
| 4 | Evidence Fusion | Confidence Scoring + Neo4j Writer |
| 5 | Graph Database | Neo4j |
| 6 | API Gateway | Node.js + Express + JWT |
| 7 | Investigator Dashboard | React + Cytoscape.js |

**Speaker Notes:**
Our architecture separates concerns across 7 layers. Each layer is independently testable and deployable via Docker. The key insight: three parallel signal extractors feed into a single evidence fusion engine — this is what allows us to combine weak signals into strong attribution.

---

## SLIDE 5 — THE THREE SIGNAL ENGINES

**Title:** Three Independent Signal Engines

**Visual:** Three equal-width columns (red, blue, green). Arrows all pointing down to a central fusion node.

**Column 1 — Infrastructure Scanner (Shreyansh)**
- Favicon MurmurHash3 fingerprinting
- TLS certificate SAN extraction
- HTTP header fingerprinting
- SSH host key extraction
- Shodan API cross-reference
- "Same infra, same actor"

**Column 2 — Stylometry AI (Kushagra)**
- Character 3-gram TF-IDF features
- Function-word frequency analysis
- Cosine similarity between handle models
- Logistic regression authorship model
- "Same writing style, same person"

**Column 3 — Blockchain Tracer (Sakshi)**
- GraphSense Python API
- Multi-hop BTC wallet tracing (3 hops)
- Address entity clustering
- Actor attribution labels (exchanges, mixers)
- "Same wallets, same finances"

**Center — Evidence Fusion**
All signals → Weighted confidence score → Neo4j graph

**Speaker Notes:**
No single engine is enough on its own. A shared wallet might be coincidence. A matching writing style might be copied. But when all three agree — the case becomes compelling. Stacking weak signals into strong evidence is the core innovation of Threat-Trace.

---

## SLIDE 6 — THE EVIDENCE MODEL

**Title:** How We Score Attribution Confidence

**Visual:** Horizontal bar chart showing signal weights. Color: red for strong, yellow for medium, green for weak.

**Signal Weight Table:**

| Signal | Weight | Category |
|---|---|---|
| PGP Fingerprint Match | +0.50 | Very Strong |
| Email Match (from PGP UID) | +0.30 | Strong |
| XMPP JID Match | +0.30 | Strong |
| GraphSense Actor Label | +0.25 | Strong |
| Stylometry Similarity >= 0.85 | +0.30 | Supporting |
| Bitcoin Wallet Reuse | +0.20 | Medium |
| TLS Certificate Match | +0.20 | Medium |
| SSH Key Fingerprint | +0.15 | Medium |
| Favicon Hash Match | +0.15 | Medium |
| Handle String Similarity | +0.10 | Weak |
| EXIF Device Model Match | +0.10 | Weak |

**Confidence Bands:**
- >= 0.80 = HIGH — File lead immediately
- 0.60–0.79 = MEDIUM — Warrants investigation
- 0.40–0.59 = LOW — Human review required
- < 0.40 = INSUFFICIENT — No link created

**Speaker Notes:**
We borrowed the evidence-weighting philosophy from forensic intelligence tradecraft. A PGP key is cryptographically unique — it's worth 50 points. A similar handle name is easily coincidental — only 10 points. The system requires either one very strong signal or several stacked medium signals before creating any attribution link.

---

## SLIDE 7 — GRAPH DATABASE SCHEMA

**Title:** The Evidence Graph (Neo4j)

**Visual:** Mini knowledge graph. Circles for nodes, labeled arrows for relationships. Dark background with neon-colored nodes.

**Nodes:**
- Handle (shadowfox) — purple
- Handle (darkmerchant) — purple
- PGPKey (fingerprint: ABC123) — gold
- Wallet (1AbC...xyz) — green
- Email (shadow@proton.me) — blue
- Infra (favicon_hash: 0xDEAD) — red

**Relationships:**
```
shadowfox    -[USES_KEY]->           PGP_KEY_ABC
darkmerchant -[USES_KEY]->           PGP_KEY_ABC
shadowfox    -[SAME_AS, conf=0.80]-> darkmerchant
shadowfox    -[USES_WALLET]->        Wallet_1AbC
shadowfox    -[LINKED_TO]->          Infra_favicon
```

**SAME_AS relationship properties:**
```json
{
  "confidence": 0.80,
  "evidence": [
    {"signal": "pgp_match", "weight": 0.50},
    {"signal": "stylometry", "weight": 0.30}
  ],
  "created_at": "2026-09-01T12:00:00Z"
}
```

**Speaker Notes:**
Every relationship in our graph carries its evidence. You can always ask "why are these two handles linked?" and the system shows you the exact signals, with their weights, traced back to the source post and timestamp. No black box.

---

## SLIDE 8 — TECHNOLOGY STACK

**Title:** Technology Stack

**Visual:** Two-column grid, icons for each technology. Dark card style.

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- Cytoscape.js (graph visualization)
- Recharts (confidence charts)

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM (PostgreSQL)
- neo4j-driver
- Socket.io (WebSocket)

**AI / ML:**
- Python 3.11 + scikit-learn
- TF-IDF + Cosine Similarity
- Logistic Regression

**Blockchain:**
- graphsense-python library
- GraphSense REST API (api.ikna.io)
- Bitcoin (BTC) multi-hop tracing

**Infrastructure:**
- OnionScan (architecture reference)
- Shodan API
- Docker + Docker Compose

**Databases:**
- Neo4j Community 5.x
- PostgreSQL 16

**Speaker Notes:**
TypeScript throughout the backend and frontend for type safety. Python isolated for the ML workload where scikit-learn excels. GraphSense replaces a raw blockchain API with a forensics-grade clustering service — this is a major upgrade over direct Blockstream/Etherscan calls.

---

## SLIDE 9 — LIVE DEMO SCENARIO

**Title:** Live Demo: "Follow the PGP Key"

**Visual:** Three-panel storyboard layout showing a handle profile card connecting to evidence.

**Panel 1 — Setup:**

Three handles seeded in the synthetic forum:
```
shadowfox     -> PGP_KEY_A + Wallet_A + 25 posts (aggressive tone)
darkmerchant  -> PGP_KEY_A + Wallet_B + 18 posts (aggressive tone)
shadow_x      ->             Wallet_A +  7 posts (different style)
```

**Panel 2 — What the system finds:**

| Pair | Signals Found | Confidence | Link Created |
|---|---|---|---|
| shadowfox vs darkmerchant | PGP match + stylometry 0.87 | 0.80 | SAME_AS (HIGH) |
| shadowfox vs shadow_x | Wallet_A reuse only | 0.20 | No link (stored) |

**Panel 3 — What the investigator sees:**
- Actor card: shadowfox shows "Also known as: darkmerchant (HIGH confidence)"
- Evidence Trail: "Shared PGP_KEY_A (source: post 42, 2026-08-15) + stylometry score 0.87"
- Blockchain view: Wallet_A to Wallet_B via darkmerchant (3-hop trace)
- shadow_x: flagged as CANDIDATE, awaiting more evidence

**Speaker Notes:**
This demo deliberately shows the system saying "no" when evidence is insufficient. shadow_x shares a wallet with shadowfox but stylometry doesn't match and there's no PGP link — so we don't make the connection automatically. A human investigator can pursue it. That restraint is a feature, not a bug.

---

## SLIDE 10 — TEAM & MODULE OWNERSHIP

**Title:** Team & Ownership

**Visual:** Hexagonal team map. Each person's hex connected to their module hex.

| Member | Module | Key Responsibility |
|---|---|---|
| Sahil | API Gateway + Integration | REST API, Neo4j coordination, evidence fusion logic |
| Aryan | Crawl Engine + Extractor | Spider, BTC/PGP/Email extraction, Union-Find clustering |
| Shreyansh | Infrastructure Scanner | Favicon hash, TLS cert, SSH fingerprint, Shodan |
| Kushagra | Stylometry AI | TF-IDF, n-gram model, cosine similarity scoring |
| Sakshi | Blockchain Tracer | GraphSense API, multi-hop wallet tracing, actor labels |
| Himanshu | Investigator Dashboard | React UI, Cytoscape.js graph, Evidence Trail panel |

**Speaker Notes:**
Every module is independently developed and communicates via well-defined JSON contracts. This allowed us to build in parallel and integrate cleanly on Day 7.

---

## SLIDE 11 — ETHICAL & LEGAL FRAMING

**Title:** Built Responsibly — Ethical & Legal Design

**Visual:** Shield icon. Three-column layout with icons. Clean white/dark split background.

**Column 1 — No Real Dark Web**
All crawling runs against a self-hosted synthetic forum. Zero real-world dark web content accessed or stored.

**Column 2 — Human-in-the-Loop**
SAME_AS links require >= 0.60 confidence. Below threshold: CANDIDATE_OF, flagged for human review. System produces investigative leads, not verdicts.

**Column 3 — Full Provenance**
Every link carries a source post ID, timestamp, extraction method, and confidence contribution. No opaque scores.

**Footer callout:**
Real deployment would require explicit authorization under IT Act Section 69B, coordinated through I4C — this is a research prototype.

**Speaker Notes:**
We want to be transparent with the judges: this system is designed with the restraint of an investigative tool, not a surveillance weapon. Every decision it makes can be challenged and explained.

---

## SLIDE 12 — BUILD TIMELINE

**Title:** 10-Day Build Plan

**Visual:** Horizontal Gantt-style timeline. Color blocks per team member.

| Day | Deliverable |
|---|---|
| Day 1 | Docker + Neo4j schema + API contracts (Sahil) |
| Day 2 | Synthetic forum + crawl engine (Aryan) |
| Day 3 | BTC + PGP + Email extractor (Aryan) |
| Day 4 | Union-Find entity resolver + confidence scorer (Aryan + Sahil) |
| Day 5 | Infra scanner + Stylometry baseline (Shreyansh + Kushagra) |
| Day 6 | Blockchain tracer via GraphSense API (Sakshi) |
| Day 7 | Neo4j integration — all modules writing to graph (All) |
| Day 8 | Full pipeline end-to-end integration (Sahil) |
| Day 9 | Dashboard — Actor Profile + Attribution Graph (Himanshu) |
| Day 10 | Demo rehearsal + Polish + Presentation (All) |

**MVP callout:**
If time runs short: Forum → Crawl → PGP + BTC + Email → Confidence Scorer → Neo4j → Dashboard. Stylometry, infra, and blockchain tracing are depth, not blockers.

**Speaker Notes:**
We have a clear MVP that delivers the core loop in the first 7 days, leaving 3 full days for integration polish, the dashboard, and rehearsal.

---

## SLIDE 13 — WHAT MAKES US DIFFERENT

**Title:** Why Threat-Trace Stands Out

**Visual:** VS comparison table. Left = typical approach, Right = our approach. Gradient background.

| Typical Approach | Threat-Trace |
|---|---|
| Single-signal lookups (wallet OR PGP) | Multi-signal fusion (wallet AND PGP AND style AND infra) |
| Black-box confidence scores | Full evidence provenance per link |
| Binary same/not-same | Tiered: SAME_AS / CANDIDATE_OF / Insufficient |
| No legal/ethical framing | Synthetic-only demo, human-in-the-loop by design |
| Separate siloed tools | Unified attribution graph in Neo4j |
| Manual investigation workflow | Dashboard with visual graph + drill-down |
| Raw blockchain API (Blockstream) | GraphSense forensics platform (actor clustering + labels) |

**Speaker Notes:**
Our differentiation is the combination: multi-signal fusion + explainability + ethical restraint. We're not the first to use stylometry or blockchain tracing — but we're the first to combine them in a single, explainable attribution graph with full provenance, backed by actual research tools like OnionScan and GraphSense.

---

## SLIDE 14 — CLOSING SLIDE

**Title:** Threat-Trace

**Large central quote:**
"Turning scattered dark web footprints into evidence-backed investigative leads — without opaque algorithms, without legal shortcuts."

**Three bottom boxes:**

Problem: NTRO needs a way to correlate dark web identity fragments into actionable intelligence.

Solution: A 7-layer pipeline — crawl, extract, correlate, visualize — with full evidence provenance at every step.

Impact: Investigators get actor profiles, attribution graphs, and evidence trails they can act on and defend before a magistrate.

**Team name + hackathon info**

**Speaker Notes:**
Thank you. Threat-Trace is our answer to NTRO's challenge — and we believe it demonstrates that responsible, explainable threat intelligence tooling is not only possible but necessary. We're happy to take questions.

---

## PPT Tool Quick Guide

### Gamma.app (Recommended — best Markdown import)
1. Go to gamma.app
2. Click "Create new" then "Import" then paste this markdown
3. Choose a dark cybersecurity theme
4. Let Gamma auto-generate layouts, then refine slide by slide

### Canva
1. Open canva.com, Presentations section
2. Choose a dark tech template
3. Create 14 slides manually, copy each SLIDE section content
4. Use Magic Write for layout suggestions

### Beautiful.ai
1. beautiful.ai, New presentation
2. Use "Smart Slide" templates
3. Paste content into each slide type (comparison, list, team, timeline)

### Google Slides
1. Use the "Momentum" or "Slate" dark theme
2. 14 slides, copy content from each section
3. Use the "Explore" AI tool for layout suggestions

### Microsoft PowerPoint
1. Use Designer (AI layout tool) — paste text, let Designer suggest layouts
2. Use "Ion Boardroom" or a dark custom theme
3. Recommended: use SmartArt for the pipeline diagram on Slide 4

---

*14 slides. Estimated presentation time: 8 to 12 minutes. Speaker notes are included for each slide.*
