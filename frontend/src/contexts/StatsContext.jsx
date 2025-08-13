import { createContext, useContext, useState, useEffect, useCallback } from 'react';  // React library import
import BooksService from '../services/books.service';  // Service layer import for API communication
import AuthService from '../services/auth.service.jsx';

const StatsContext = createContext();

const useStats = () => {
    const context = useContext(StatsContext);  // React context hook for global state
    if (!context) {
        throw new Error('useStats must be used within a StatsProvider');
    }
    return context;
};

const StatsProvider = ({ children }) => {
    const [stats, setStats] = useState({  // React state hook for component state management
        read: 0,
        currentlyReading: 0,
        toRead: 0,
        total: 0
    });
    const [loading, setLoading] = useState(true);  // React state hook for component state management
    const [lastFetch, setLastFetch] = useState(null);  // React state hook for component state management

    const fetchStats = useCallback(async (force = false) => {
  // Only fetch if we haven't fetched in the last 30 seconds or if forced
        const now = Date.now();
        if (!force && lastFetch && (now - lastFetch) < 30000) {
            return;
        }

        try {
  // Only show loading for initial fetch or forced refresh
            if (!lastFetch || force) {
                setLoading(true);  // State update
            }

            // Guard: only fetch stats when authenticated with a valid token
            const user = AuthService.getCurrentUser ? AuthService.getCurrentUser() : null;
            if (!user || !user.access_token) {
                setLoading(false);
                return;
            }
            
            const response = await BooksService.getStats();
            const data = response.data;
            
            const newStats = {
                read: data.read || 0,
                currentlyReading: data.currently_reading || 0,
                toRead: data.to_be_read || 0,
                total: data.total_books || 0
            };
            
            setStats(newStats);  // State update
            setLastFetch(now);  // State update
        } catch (error) {
            console.error('Error fetching reading stats:', error);
        } finally {
            setLoading(false);  // State update
        }
    }, [lastFetch]);

    const refreshStats = () => {
        fetchStats(true);
    };

    useEffect(() => {  // React effect hook for side effects
        fetchStats();
    }, [fetchStats]);

    const value = {
        stats,
        loading,
        refreshStats,
        fetchStats
    };

    return (  // JSX return statement
        <StatsContext.Provider value={value}>
            {children}
        </StatsContext.Provider>
    );
};

export { useStats, StatsProvider };  // Export for use in other modules
export default StatsContext;  // Export for use in other modules
