import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import BooksService from '../services/books.service';

const StatsContext = createContext();

const useStats = () => {
    const context = useContext(StatsContext);
    if (!context) {
        throw new Error('useStats must be used within a StatsProvider');
    }
    return context;
};

const StatsProvider = ({ children }) => {
    const [stats, setStats] = useState({
        read: 0,
        currentlyReading: 0,
        toRead: 0,
        total: 0
    });
    const [loading, setLoading] = useState(true);
    const [lastFetch, setLastFetch] = useState(null);

    const fetchStats = useCallback(async (force = false) => {
        // Only fetch if we haven't fetched in the last 30 seconds or if forced
        const now = Date.now();
        if (!force && lastFetch && (now - lastFetch) < 30000) {
            return;
        }

        try {
            // Only show loading for initial fetch or forced refresh
            if (!lastFetch || force) {
                setLoading(true);
            }
            
            const response = await BooksService.getStats();
            const data = response.data;
            
            const newStats = {
                read: data.read || 0,
                currentlyReading: data.currently_reading || 0,
                toRead: data.to_be_read || 0,
                total: data.total_books || 0
            };
            
            setStats(newStats);
            setLastFetch(now);
        } catch (error) {
            console.error('Error fetching reading stats:', error);
        } finally {
            setLoading(false);
        }
    }, [lastFetch]);

    const refreshStats = () => {
        fetchStats(true);
    };

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const value = {
        stats,
        loading,
        refreshStats,
        fetchStats
    };

    return (
        <StatsContext.Provider value={value}>
            {children}
        </StatsContext.Provider>
    );
};

export { useStats, StatsProvider };
export default StatsContext;