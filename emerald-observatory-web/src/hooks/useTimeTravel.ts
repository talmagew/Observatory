import { useState, useEffect, useCallback } from 'react';
import { DateTime } from 'luxon';

export interface UseTimeTravelReturn {
    currentTime: DateTime;
    isLiveMode: boolean;
    setTime: (time: DateTime) => void;
    resetToNow: () => void;
    jumpToTime: (time: DateTime) => void;
}

export function useTimeTravel(): UseTimeTravelReturn {
    const [currentTime, setCurrentTime] = useState(DateTime.now());
    const [isLiveMode, setIsLiveMode] = useState(true);

    // Update time in live mode
    useEffect(() => {
        if (!isLiveMode) return;

        const interval = setInterval(() => {
            setCurrentTime(DateTime.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [isLiveMode]);

    const setTime = useCallback((time: DateTime) => {
        setCurrentTime(time);
        setIsLiveMode(false);
    }, []);

    const resetToNow = useCallback(() => {
        setCurrentTime(DateTime.now());
        setIsLiveMode(true);
    }, []);

    const jumpToTime = useCallback((time: DateTime) => {
        setCurrentTime(time);
        setIsLiveMode(false);
    }, []);

    return {
        currentTime,
        isLiveMode,
        setTime,
        resetToNow,
        jumpToTime
    };
} 