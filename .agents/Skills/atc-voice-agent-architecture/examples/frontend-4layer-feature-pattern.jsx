// ============================================================================
// Example: Frontend 4-Layer Feature Architecture
// (1. Component, 2. Hook, 3. API Service, 4. Redux Slice)
// ============================================================================

// ----------------------------------------------------------------------------
// LAYER 3: Service (src/features/scenarios/service/scenarios.api.js)
// Pure HTTP calls, ZERO React or Redux dependencies.
// ----------------------------------------------------------------------------
import apiClient from '../../services/apiClient';

export const fetchScenariosAPI = async () => {
    const response = await apiClient.get('/api/backend/scenarios');
    return response.data;
};

export const startSessionAPI = async (scenarioId) => {
    const response = await apiClient.post('/api/backend/sessions', { scenarioId });
    return response.data;
};

// ----------------------------------------------------------------------------
// LAYER 4: Redux Slice (src/features/scenarios/slice/scenarios.slice.js)
// Pure synchronous reducers, NO async thunks.
// ----------------------------------------------------------------------------
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    list: [],
    selectedScenario: null,
    loading: false,
    error: null,
};

const scenariosSlice = createSlice({
    name: 'scenarios',
    initialState,
    reducers: {
        setScenariosList(state, action) {
            state.list = action.payload;
            state.loading = false;
        },
        setSelectedScenario(state, action) {
            state.selectedScenario = action.payload;
        },
        setLoading(state, action) {
            state.loading = action.payload;
        },
        setError(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { setScenariosList, setSelectedScenario, setLoading, setError } = scenariosSlice.actions;
export const scenariosReducer = scenariosSlice.reducer;

// ----------------------------------------------------------------------------
// LAYER 2: Custom Hook (src/features/scenarios/Hooks/scenarios.hooks.js)
// Orchestrates async flows, IndexedDB caching, and Redux dispatches.
// ----------------------------------------------------------------------------
import { useDispatch, useSelector } from 'react-redux';
import { fetchScenariosAPI } from '../service/scenarios.api';
import { setScenariosList, setLoading, setError } from '../slice/scenarios.slice';

export const useScenarios = () => {
    const dispatch = useDispatch();
    const { list, selectedScenario, loading, error } = useSelector((state) => state.scenarios);

    const loadScenarios = async () => {
        dispatch(setLoading(true));
        try {
            const data = await fetchScenariosAPI();
            dispatch(setScenariosList(data.scenarios || data.data));
        } catch (err) {
            dispatch(setError(err.message || 'Failed to load scenarios'));
        }
    };

    return {
        scenarios: list,
        selectedScenario,
        loading,
        error,
        loadScenarios,
    };
};

// ----------------------------------------------------------------------------
// LAYER 1: Component (src/features/scenarios/components/ScenarioCatalog.jsx)
// Pure UI presentation, consumes hook, NO direct API or dispatching logic.
// ----------------------------------------------------------------------------
import React, { useEffect } from 'react';
import { useScenarios } from '../Hooks/scenarios.hooks';

export const ScenarioCatalog = () => {
    const { scenarios, loading, error, loadScenarios } = useScenarios();

    useEffect(() => {
        loadScenarios();
    }, []);

    if (loading) return <div className="loading-spinner">Loading flight scenarios...</div>;
    if (error) return <div className="error-alert">Error: {error}</div>;

    return (
        <section className="scenario-catalog">
            <h2>Flight Preparation Scenarios</h2>
            <div className="scenario-grid">
                {scenarios.map((item) => (
                    <article key={item.id} className="scenario-card">
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        <span className="badge">{item.difficulty}</span>
                    </article>
                ))}
            </div>
        </section>
    );
};
