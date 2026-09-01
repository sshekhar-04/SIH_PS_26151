# 🧠 LangGraph Voice Agent State Machine & Interrupt Boundaries

## 1. Overview & Half-Duplex Push-to-Talk (PTT) Orchestration

In half-duplex voice systems (such as aviation radio, walkie-talkies, and turn-based dispatch), the AI controller must speak, pause the state machine, wait for the user to press and release Push-to-Talk (PTT), and resume execution upon speech receipt.

This is cleanly accomplished using **LangGraph JS** with **Interrupt Boundaries** (`interruptBefore: ['awaitReadback']`).

```
[Start] ➔ loadStep ➔ qdrantRetrieve ➔ composeLine ➔ ttsSpeak ➔ awaitReadback (INTERRUPT BOUNDARY)
                                                                         │
                                                                   validateReadback
                                                                   ┌───────┼───────┐
                                                                   ▼       ▼       ▼
                                                            [Passed] [Question] [Failed]
                                                               │       │       │
                                                     advanceStep  generalAnswer issueCorrection
                                                               │       │       │
                                                            debrief ───┴───────┘
```

---

## 2. LangGraph State Schema with Custom Reducers (`state.js`)

State properties use `@langchain/langgraph` `Annotation.Root`. Non-destructive reducers ensure array fields (such as `transcript` and `stepResults`) append new messages without overwriting history.

```javascript
import { Annotation } from '@langchain/langgraph';

const keep = (curr, next) => (next !== undefined ? next : curr);

export const AgentState = Annotation.Root({
    sessionId:        Annotation({ default: () => null, reducer: keep }),
    userId:           Annotation({ default: () => null, reducer: keep }),
    aircraftCallsign: Annotation({ default: () => 'N172SP', reducer: keep }),
    airport:          Annotation({ default: () => 'KBOS', reducer: keep }),

    // Scenario Progression
    steps:            Annotation({ default: () => [], reducer: keep }),
    stepIndex:        Annotation({ default: () => 0, reducer: keep }),
    currentStep:      Annotation({ default: () => null, reducer: keep }),
    resolvedSlots:    Annotation({ default: () => ({}), reducer: keep }),

    // Controller Speech Output
    currentLine:      Annotation({ default: () => '', reducer: keep }),
    audioBase64:      Annotation({ default: () => null, reducer: keep }),

    // Pilot Input & Extraction
    pilotTranscript:  Annotation({ default: () => '', reducer: keep }),
    extracted:        Annotation({ default: () => ({}), reducer: keep }),
    slotReport:       Annotation({ default: () => ({}), reducer: keep }),

    // Vector RAG Grounding
    grounding:        Annotation({ default: () => [], reducer: (c, v) => (v !== undefined ? v : c) }),

    // Flow Control
    retries:          Annotation({ default: () => 0, reducer: keep }),
    finished:         Annotation({ default: () => false, reducer: keep }),
    isGeneralQuery:   Annotation({ default: () => false, reducer: keep }),
    allPassed:        Annotation({ default: () => false, reducer: keep }),

    // Transcripts & Telemetry (Additive Reducers)
    transcript: Annotation({
        default: () => [],
        reducer: (curr, add) => (add ? curr.concat(Array.isArray(add) ? add : [add]) : curr),
    }),
    stepResults: Annotation({
        default: () => [],
        reducer: (curr, add) => (add ? curr.concat(Array.isArray(add) ? add : [add]) : curr),
    }),
});
```

---

## 3. Interrupt Boundary & Dual-Phase Execution

### Compilation with Checkpointer
```javascript
import { StateGraph, MemorySaver } from '@langchain/langgraph';

const checkpointer = new MemorySaver();

export const compiledGraph = graph.compile({
    checkpointer,
    interruptBefore: ['awaitReadback'], // Pauses graph right before user input
});
```

### Execution Lifecycle in Controller
1. **Phase 1 (Agent Turn):** Client triggers session start. Graph runs `loadStep -> qdrantRetrieve -> composeLine -> ttsSpeak` and halts at `awaitReadback`. Returns controller audio to client.
2. **Phase 2 (User Turn Resume):** User records audio via PTT. STT produces `pilotTranscript`. Controller calls `compiledGraph.invoke({ resume: pilotTranscript, pilotTranscript }, { configurable: { thread_id: sessionId } })`. Graph resumes from `validateReadback`, branches accordingly, and outputs the next turn.

---

## 4. Slot Validation: Hybrid Fuzzy Matcher + LLM Extraction

To evaluate domain-specific transmissions with high precision and low token usage:
1. **Targeted LLM Extraction:** Prompt Mistral with strict JSON schema to extract specific required slots (e.g. `callsign`, `runway`, `wind_dir`, `altimeter`).
2. **Deterministic Normalization & Fuzzy Matching:**
   - Normalize NATO phonetic alphabet (`November One Seven Two Sierra Papa` → `N172SP`).
   - Normalize numbers, headings, and runways (`runway two two left` → `22L`).
   - Compare extracted values against `resolvedSlots` with tolerance for minor pronunciation variations.
3. **Branching Logic:**
   - **General question detected:** (`"What is minimum VFR ceiling?"`) → routes to `generalAnswer` RAG node.
   - **All required slots valid:** → routes to `advanceStep` node.
   - **Slot mismatch & retries < max:** → routes to `issueCorrection` node (targeted prompt correction).
   - **Max retries exceeded:** → forces `advanceStep` with penalty logged.
