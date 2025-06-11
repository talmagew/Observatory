import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { timeService, TimeServiceState } from '../services/TimeService';

export interface UseTimeReturn {
    currentTime: DateTime;
    utcTime: DateTime;
    solarTime: DateTime;
    siderealTime: DateTime;
    timezone: string;
    latitude: number;
    longitude: number;
    setTimezone: (timezone: string) => void;
    setOffset: (minutes: number) => void;
    setLocation: (latitude: number, longitude: number) => void;
}

export const useTime = (): UseTimeReturn => {
    const [state, setState] = useState<TimeServiceState>({
        currentTime: DateTime.now(),
        timezone: 'UTC',
        offset: 0,
        longitude: 0,
        latitude: 0,
    });

    const [computedTimes, setComputedTimes] = useState({
        utcTime: DateTime.utc(),
        solarTime: DateTime.utc(),
        siderealTime: DateTime.utc(),
    });

    useEffect(() => {
        const unsubscribe = timeService.subscribe((newState) => {
            setState(newState);

            // Update computed times when state changes
            setComputedTimes({
                utcTime: timeService.getUTCTime(),
                solarTime: timeService.getSolarTime(),
                siderealTime: timeService.getSiderealTime(),
            });
        });

        return unsubscribe;
    }, []);

    return {
        currentTime: state.currentTime,
        utcTime: computedTimes.utcTime,
        solarTime: computedTimes.solarTime,
        siderealTime: computedTimes.siderealTime,
        timezone: state.timezone,
        latitude: state.latitude,
        longitude: state.longitude,
        setTimezone: timeService.setTimezone.bind(timeService),
        setOffset: timeService.setOffset.bind(timeService),
        setLocation: timeService.setLocation.bind(timeService),
    };
}; 