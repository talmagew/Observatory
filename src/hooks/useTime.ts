import { useState, useEffect } from 'react';
import { timeService, TimeServiceState } from '../services/TimeService';
import { DateTime } from 'luxon';

interface UseTimeReturn extends TimeServiceState {
  setTimezone: (timezone: string) => void;
  setOffset: (minutes: number) => void;
  setLocation: (latitude: number, longitude: number) => void;
  utcTime: DateTime;
  solarTime: DateTime;
  siderealTime: DateTime;
}

export function useTime(): UseTimeReturn {
  const [state, setState] = useState<TimeServiceState>({
    currentTime: timeService.getCurrentTime(),
    timezone: DateTime.local().zoneName || 'UTC',
    offset: 0,
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    // Subscribe to time updates
    const unsubscribe = timeService.subscribe(setState);
    
    // Try to get user's location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          timeService.setLocation(
            position.coords.latitude,
            position.coords.longitude
          );
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return {
    ...state,
    setTimezone: timeService.setTimezone.bind(timeService),
    setOffset: timeService.setOffset.bind(timeService),
    setLocation: timeService.setLocation.bind(timeService),
    utcTime: timeService.getUTCTime(),
    solarTime: timeService.getSolarTime(),
    siderealTime: timeService.getSiderealTime(),
  };
} 