// ============================================================================
// Example: LangGraph Voice Turn Machine with Interrupt Boundaries
// ============================================================================
import { StateGraph, MemorySaver, Annotation } from '@langchain/langgraph';

// 1. State Definition with Additive Reducer for Transcripts
const keep = (curr, next) => (next !== undefined ? next : curr);

export const AgentState = Annotation.Root({
    sessionId:        Annotation({ default: () => null, reducer: keep }),
    currentStep:      Annotation({ default: () => null, reducer: keep }),
    resolvedSlots:    Annotation({ default: () => ({}), reducer: keep }),
    pilotTranscript:  Annotation({ default: () => '', reducer: keep }),
    currentLine:      Annotation({ default: () => '', reducer: keep }),
    audioBase64:      Annotation({ default: () => null, reducer: keep }),
    allPassed:        Annotation({ default: () => false, reducer: keep }),
    isGeneralQuery:   Annotation({ default: () => false, reducer: keep }),
    retries:          Annotation({ default: () => 0, reducer: keep }),
    finished:         Annotation({ default: () => false, reducer: keep }),
    transcript:       Annotation({
        default: () => [],
        reducer: (curr, add) => (add ? curr.concat(Array.isArray(add) ? add : [add]) : curr),
    }),
});

// 2. Dummy Node Implementations
async function loadStepNode(state) {
    return { currentStep: state.currentStep || { stepId: 'step_1' } };
}

async function composeLineNode(state) {
    const line = `Aircraft ${state.resolvedSlots?.callsign || 'N172SP'}, taxi to runway 22L via Alpha.`;
    return { currentLine: line };
}

async function ttsSpeakNode(state) {
    // In production, fetch from L7 Redis cache or call Rime TTS
    return { audioBase64: 'BASE64_AUDIO_PLACEHOLDER' };
}

async function awaitReadbackNode(state) {
    // This is the interrupt boundary node
    return {};
}

async function validateReadbackNode(state) {
    const isGeneral = state.pilotTranscript.includes('?');
    const passed = state.pilotTranscript.toLowerCase().includes('taxi');
    return {
        allPassed: passed,
        isGeneralQuery: isGeneral,
        retries: passed ? state.retries : state.retries + 1,
    };
}

async function generalAnswerNode(state) {
    return { currentLine: 'Center advises: VFR minimums are 3 miles visibility and 1000 ft ceiling.' };
}

async function issueCorrectionNode(state) {
    return { currentLine: 'Negative, readback runway 22L hold short.' };
}

async function advanceStepNode(state) {
    return { finished: true };
}

async function debriefNode(state) {
    return { currentLine: 'Session completed. Good day!' };
}

// 3. Graph Assembly
const graph = new StateGraph(AgentState)
    .addNode('loadStep', loadStepNode)
    .addNode('composeLine', composeLineNode)
    .addNode('ttsSpeak', ttsSpeakNode)
    .addNode('awaitReadback', awaitReadbackNode)
    .addNode('validateReadback', validateReadbackNode)
    .addNode('generalAnswer', generalAnswerNode)
    .addNode('issueCorrection', issueCorrectionNode)
    .addNode('advanceStep', advanceStepNode)
    .addNode('debrief', debriefNode)

    .addEdge('__start__', 'loadStep')
    .addEdge('loadStep', 'composeLine')
    .addEdge('composeLine', 'ttsSpeak')
    .addEdge('ttsSpeak', 'awaitReadback')
    .addEdge('awaitReadback', 'validateReadback')

    .addConditionalEdges('validateReadback', (state) => {
        if (state.isGeneralQuery) return 'generalAnswer';
        if (state.allPassed) return 'advanceStep';
        if (state.retries >= 3) return 'advanceStep';
        return 'issueCorrection';
    })

    .addEdge('generalAnswer', 'ttsSpeak')
    .addEdge('issueCorrection', 'ttsSpeak')
    .addConditionalEdges('advanceStep', (state) => (state.finished ? 'debrief' : 'loadStep'))
    .addEdge('debrief', 'ttsSpeak');

// 4. Compile with MemorySaver Checkpointer and Interrupt
const checkpointer = new MemorySaver();

export const compiledGraph = graph.compile({
    checkpointer,
    interruptBefore: ['awaitReadback'], // Pauses here until user audio arrives
});
