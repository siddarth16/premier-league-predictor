// Global state management using Zustand
import { create } from 'zustand';
import { Team, Fixture, Standing, Prediction } from '@/types';

interface AppState {
  // Data state
  teams: Team[];
  fixtures: Fixture[];
  standings: Standing[];
  predictions: Prediction[];
  
  // UI state
  loading: boolean;
  error: string | null;
  selectedTeam: Team | null;
  selectedFixture: Fixture | null;
  
  // Filters
  filterDays: number;
  showOnlyUpcoming: boolean;
  confidenceFilter: 'all' | 'high' | 'medium' | 'low';
  
  // Actions
  setTeams: (teams: Team[]) => void;
  setFixtures: (fixtures: Fixture[]) => void;
  setStandings: (standings: Standing[]) => void;
  setPredictions: (predictions: Prediction[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedTeam: (team: Team | null) => void;
  setSelectedFixture: (fixture: Fixture | null) => void;
  setFilterDays: (days: number) => void;
  setShowOnlyUpcoming: (show: boolean) => void;
  setConfidenceFilter: (filter: 'all' | 'high' | 'medium' | 'low') => void;
  
  // API actions
  fetchTeams: () => Promise<void>;
  fetchFixtures: (upcoming?: boolean, days?: number) => Promise<void>;
  fetchStandings: () => Promise<void>;
  fetchPredictions: (upcoming?: boolean, days?: number) => Promise<void>;
  generatePrediction: (fixtureId: number) => Promise<Prediction | null>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  teams: [],
  fixtures: [],
  standings: [],
  predictions: [],
  loading: false,
  error: null,
  selectedTeam: null,
  selectedFixture: null,
  filterDays: 7,
  showOnlyUpcoming: true,
  confidenceFilter: 'all',

  // Basic setters
  setTeams: (teams) => set({ teams }),
  setFixtures: (fixtures) => set({ fixtures }),
  setStandings: (standings) => set({ standings }),
  setPredictions: (predictions) => set({ predictions }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedTeam: (selectedTeam) => set({ selectedTeam }),
  setSelectedFixture: (selectedFixture) => set({ selectedFixture }),
  setFilterDays: (filterDays) => set({ filterDays }),
  setShowOnlyUpcoming: (showOnlyUpcoming) => set({ showOnlyUpcoming }),
  setConfidenceFilter: (confidenceFilter) => set({ confidenceFilter }),

  // API actions
  fetchTeams: async () => {
    try {
      set({ loading: true, error: null });
      const response = await fetch('/api/teams');
      const data = await response.json();
      
      if (data.success) {
        set({ teams: data.data, loading: false });
      } else {
        set({ error: data.error || 'Failed to fetch teams', loading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        loading: false 
      });
    }
  },

  fetchFixtures: async (upcoming = true, days = 7) => {
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams();
      if (upcoming) params.append('upcoming', 'true');
      if (days) params.append('days', days.toString());
      
      const response = await fetch(`/api/fixtures?${params}`);
      const data = await response.json();
      
      if (data.success) {
        set({ fixtures: data.data, loading: false });
      } else {
        set({ error: data.error || 'Failed to fetch fixtures', loading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        loading: false 
      });
    }
  },

  fetchStandings: async () => {
    try {
      set({ loading: true, error: null });
      const response = await fetch('/api/standings');
      const data = await response.json();
      
      if (data.success) {
        set({ standings: data.data, loading: false });
      } else {
        set({ error: data.error || 'Failed to fetch standings', loading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        loading: false 
      });
    }
  },

  fetchPredictions: async (upcoming = true, days = 7) => {
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams();
      if (upcoming) params.append('upcoming', 'true');
      if (days) params.append('days', days.toString());
      
      const response = await fetch(`/api/predictions?${params}`);
      const data = await response.json();
      
      if (data.success) {
        // Extract predictions from the response structure
        const predictions = data.data.map((item: Record<string, unknown>) => item.prediction || item);
        set({ predictions, loading: false });
      } else {
        set({ error: data.error || 'Failed to fetch predictions', loading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        loading: false 
      });
    }
  },

  generatePrediction: async (fixtureId: number) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`/api/predictions?fixture_id=${fixtureId}&generate=true`);
      const data = await response.json();
      
      if (data.success) {
        const prediction = data.data;
        // Update predictions array with new prediction
        const currentPredictions = get().predictions;
        const updatedPredictions = currentPredictions.filter(p => p.fixture_id !== fixtureId);
        updatedPredictions.push(prediction);
        
        set({ predictions: updatedPredictions, loading: false });
        return prediction;
      } else {
        set({ error: data.error || 'Failed to generate prediction', loading: false });
        return null;
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        loading: false 
      });
      return null;
    }
  }
}));

// Selector hooks for better performance
export const useTeams = () => useAppStore(state => state.teams);
export const useFixtures = () => useAppStore(state => state.fixtures);
export const useStandings = () => useAppStore(state => state.standings);
export const usePredictions = () => useAppStore(state => state.predictions);
export const useLoading = () => useAppStore(state => state.loading);
export const useError = () => useAppStore(state => state.error);

// Computed selectors
export const useFilteredFixtures = () => useAppStore(state => {
  let filtered = state.fixtures;
  
  if (state.showOnlyUpcoming) {
    const now = new Date();
    filtered = filtered.filter(fixture => new Date(fixture.date) >= now);
  }
  
  return filtered.slice(0, 20); // Limit to 20 for performance
});

export const useFilteredPredictions = () => useAppStore(state => {
  let filtered = state.predictions;
  
  if (state.confidenceFilter !== 'all') {
    const thresholds = {
      high: 75,
      medium: 50,
      low: 30
    };
    
    const minThreshold = thresholds[state.confidenceFilter];
    const maxThreshold = state.confidenceFilter === 'high' ? 100 :
                        state.confidenceFilter === 'medium' ? 74 : 49;
    
    filtered = filtered.filter(pred => 
      pred.confidence >= minThreshold && pred.confidence <= maxThreshold
    );
  }
  
  return filtered;
});