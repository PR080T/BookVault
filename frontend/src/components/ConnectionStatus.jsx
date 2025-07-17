import { useState, useEffect, useCallback } from 'react';
import { checkConnection } from '../services/api';
import { Alert, Button } from 'flowbite-react';
import { HiInformationCircle, HiExclamation } from 'react-icons/hi';
import { RiWifiOffLine, RiRefreshLine } from 'react-icons/ri';

const ConnectionStatus = () => {
    const [connectionStatus, setConnectionStatus] = useState({
        isConnected: true,
        isChecking: false,
        message: ''
    });
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const checkServerConnection = useCallback(async () => {
        setConnectionStatus(prev => ({ ...prev, isChecking: true }));
        
        try {
            const status = await checkConnection();
            setConnectionStatus({
                isConnected: status.isConnected,
                isChecking: false,
                message: status.message
            });
        } catch {
            setConnectionStatus({
                isConnected: false,
                isChecking: false,
                message: 'Connection check failed'
            });
        }
    }, []);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            checkServerConnection();
        };

        const handleOffline = () => {
            setIsOnline(false);
            setConnectionStatus({
                isConnected: false,
                isChecking: false,
                message: 'No internet connection'
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check connection on mount
        checkServerConnection();

        // Set up periodic connection checks (only when online)
        const interval = setInterval(() => {
            if (navigator.onLine && !connectionStatus.isConnected) {
                checkServerConnection();
            }
        }, 60000); // Check every 60 seconds, and only when disconnected

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [connectionStatus.isConnected, checkServerConnection]);

    // Show connection status when checking or when there's an error
    if (!connectionStatus.isChecking && connectionStatus.isConnected && isOnline) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
            {connectionStatus.isChecking ? (
                <Alert color="info" icon={HiInformationCircle}>
                    <span className="font-medium">Checking connection...</span>
                </Alert>
            ) : (
                <Alert color="failure" icon={!isOnline ? RiWifiOffLine : HiExclamation}>
                    <div className="flex flex-col space-y-2">
                        <span className="font-medium">
                            {!isOnline ? "No Internet Connection" : "Server Connection Error"}
                        </span>
                        <span className="text-sm">
                            {!isOnline 
                                ? "Please check your internet connection" 
                                : connectionStatus.message || "Unable to connect to server"
                            }
                        </span>
                        {import.meta.env.DEV && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                Start the backend server with: cd backend && python -m flask run
                            </span>
                        )}
                        {isOnline && (
                            <Button
                                size="xs"
                                color="purple"
                                onClick={checkServerConnection}
                                disabled={connectionStatus.isChecking}
                            >
                                <RiRefreshLine className="mr-1 h-3 w-3" />
                                Retry Connection
                            </Button>
                        )}
                    </div>
                </Alert>
            )}
        </div>
    );
};

export default ConnectionStatus;