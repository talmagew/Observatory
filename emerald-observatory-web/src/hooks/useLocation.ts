import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import {
    locationService,
    LocationServiceState,
    LocationData,
    CoordinateSystem,
    TimezoneInfo,
    AstronomicalPosition
} from '../services/LocationService';

export interface UseLocationOptions {
    enableGPS?: boolean;
    watchPosition?: boolean;
    updateInterval?: number; // milliseconds
}

export interface UseLocationReturn {
    // Current state
    location: LocationData | null;
    coordinateSystem: CoordinateSystem | null;
    timezone: TimezoneInfo | null;
    astronomicalPosition: AstronomicalPosition | null;
    isGPSEnabled: boolean;
    lastUpdate: DateTime;

    // Loading and error states
    isLoading: boolean;
    error: string | null;

    // Actions
    setLocation: (latitude: number, longitude: number, altitude?: number) => void;
    getCurrentLocation: () => Promise<LocationData>;
    enableGPS: () => Promise<void>;
    disableGPS: () => void;
    refreshAstronomicalPosition: (date?: DateTime) => Promise<void>;

    // Computed properties
    isLocationSet: boolean;
    coordinates: string; // Formatted coordinate string
    timezoneOffset: string; // Formatted timezone offset
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
    const {
        enableGPS = false,
        watchPosition = false,
        updateInterval = 0
    } = options;

    // State from LocationService
    const [state, setState] = useState<LocationServiceState>({
        currentLocation: null,
        coordinateSystem: null,
        timezone: null,
        astronomicalPosition: null,
        isGPSEnabled: false,
        lastUpdate: DateTime.now(),
    });

    // Local state for loading and errors
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Subscribe to LocationService updates
    useEffect(() => {
        const unsubscribe = locationService.subscribe((newState) => {
            setState(newState);
        });

        return unsubscribe;
    }, []);

    // Auto-enable GPS if requested
    useEffect(() => {
        if (enableGPS && !state.isGPSEnabled) {
            handleEnableGPS();
        }
    }, [enableGPS, state.isGPSEnabled]);

    // Periodic updates for astronomical position
    useEffect(() => {
        if (updateInterval > 0 && state.currentLocation) {
            const interval = setInterval(() => {
                handleRefreshAstronomicalPosition();
            }, updateInterval);

            return () => clearInterval(interval);
        }
    }, [updateInterval, state.currentLocation]);

    // Action handlers
    const handleSetLocation = (latitude: number, longitude: number, altitude?: number) => {
        try {
            setError(null);
            locationService.setLocation(latitude, longitude, altitude);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to set location');
        }
    };

    const handleGetCurrentLocation = async (): Promise<LocationData> => {
        try {
            setIsLoading(true);
            setError(null);
            const location = await locationService.getCurrentLocation();
            return location;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get current location';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnableGPS = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);
            await locationService.enableGPS();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to enable GPS';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisableGPS = () => {
        try {
            setError(null);
            locationService.disableGPS();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to disable GPS');
        }
    };

    const handleRefreshAstronomicalPosition = async (date?: DateTime): Promise<void> => {
        if (!state.currentLocation) {
            setError('Location not set');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            await locationService.getAstronomicalPosition(date);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh astronomical position';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Computed properties
    const isLocationSet = state.currentLocation !== null;

    const coordinates = state.currentLocation
        ? `${state.currentLocation.latitude.toFixed(6)}°, ${state.currentLocation.longitude.toFixed(6)}°`
        : 'Not set';

    const timezoneOffset = state.timezone
        ? `UTC${state.timezone.offset >= 0 ? '+' : ''}${Math.floor(state.timezone.offset / 60)}:${Math.abs(state.timezone.offset % 60).toString().padStart(2, '0')}`
        : 'Unknown';

    return {
        // Current state
        location: state.currentLocation,
        coordinateSystem: state.coordinateSystem,
        timezone: state.timezone,
        astronomicalPosition: state.astronomicalPosition,
        isGPSEnabled: state.isGPSEnabled,
        lastUpdate: state.lastUpdate,

        // Loading and error states
        isLoading,
        error,

        // Actions
        setLocation: handleSetLocation,
        getCurrentLocation: handleGetCurrentLocation,
        enableGPS: handleEnableGPS,
        disableGPS: handleDisableGPS,
        refreshAstronomicalPosition: handleRefreshAstronomicalPosition,

        // Computed properties
        isLocationSet,
        coordinates,
        timezoneOffset,
    };
} 