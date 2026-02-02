import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const ConnectivityIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showIndicator, setShowIndicator] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowIndicator(true);
            // Hide the indicator after 3 seconds when back online
            setTimeout(() => setShowIndicator(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowIndicator(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Show indicator briefly on mount if offline
        if (!navigator.onLine) {
            setShowIndicator(true);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showIndicator) return null;

    return (
        <div className={`connectivity-indicator ${isOnline ? 'online' : 'offline'}`}>
            <span className="connectivity-dot" />
            {isOnline ? (
                <>
                    <Wifi size={14} />
                    <span>En ligne</span>
                </>
            ) : (
                <>
                    <WifiOff size={14} />
                    <span>Hors ligne</span>
                </>
            )}
        </div>
    );
};

export default ConnectivityIndicator;
