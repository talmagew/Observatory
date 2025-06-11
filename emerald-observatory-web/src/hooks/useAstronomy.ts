import { useState, useEffect, useCallback, useMemo } from 'react';
import { DateTime } from 'luxon';
import AstronomicalService, {
    PlanetaryPosition,
    MoonPhase,
    SunMoonTimes,
    CoordinateConversion,
    EclipseEvent
} from '../services/AstronomicalService';
import { useTime } from './useTime';
import { useLocation } from './useLocation';

interface UseAstronomyOptions {
    updateInterval?: number; // milliseconds
    enablePlanets?: boolean;
    enableMoonPhase?: boolean;
    enableSunMoonTimes?: boolean;
    enableEclipses?: boolean;
}

interface UseAstronomyResult {
    // Planetary data
    planets: PlanetaryPosition[];
    visiblePlanets: PlanetaryPosition[];

    // Moon data
    moonPhase: MoonPhase | null;
    moonPosition: PlanetaryPosition | null;

    // Sun/Moon times
    sunMoonTimes: SunMoonTimes | null;

    // Eclipse data
    upcomingEclipses: EclipseEvent[];
    nextEclipse: EclipseEvent | null;

    // Coordinate conversion utilities
    convertCoordinates: (ra: number, dec: number) => CoordinateConversion | null;

    // Status and control
    isLoading: boolean;
    error: string | null;
    lastUpdated: DateTime | null;

    // Manual refresh
    refresh: () => void;
}

export function useAstronomy(options: UseAstronomyOptions = {}): UseAstronomyResult {
    const {
        updateInterval = 60000, // 1 minute default
        enablePlanets = true,
        enableMoonPhase = true,
        enableSunMoonTimes = true,
        enableEclipses = true,
    } = options;

    const { utcTime } = useTime();
    const { location } = useLocation();

    // State
    const [planets, setPlanets] = useState<PlanetaryPosition[]>([]);
    const [moonPhase, setMoonPhase] = useState<MoonPhase | null>(null);
    const [moonPosition, setMoonPosition] = useState<PlanetaryPosition | null>(null);
    const [sunMoonTimes, setSunMoonTimes] = useState<SunMoonTimes | null>(null);
    const [upcomingEclipses, setUpcomingEclipses] = useState<EclipseEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<DateTime | null>(null);

    // Get service instance
    const astronomyService = useMemo(() => AstronomicalService.getInstance(), []);

    // Calculate all astronomical data
    const calculateAstronomicalData = useCallback(async () => {
        if (!location) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const currentTime = utcTime;

            // Calculate planetary positions
            if (enablePlanets) {
                const planetaryPositions = astronomyService.getPlanetaryPositions(currentTime, location);
                setPlanets(planetaryPositions);

                // Calculate moon position separately for more detailed info
                const moonPos = astronomyService.getPlanetaryPositions(currentTime, location)
                    .find(p => p.name === 'Moon');
                if (moonPos) {
                    setMoonPosition(moonPos);
                }
            }

            // Calculate moon phase
            if (enableMoonPhase) {
                const moonPhaseData = astronomyService.getMoonPhase(currentTime);
                setMoonPhase(moonPhaseData);
            }

            // Calculate sun and moon rise/set times
            if (enableSunMoonTimes) {
                const sunMoonData = astronomyService.getSunMoonTimes(currentTime, location);
                setSunMoonTimes(sunMoonData);
            }

            // Calculate eclipses (less frequent updates)
            if (enableEclipses && (!lastUpdated ||
                currentTime.diff(lastUpdated, 'hours').hours > 24)) {
                const eclipses = astronomyService.getUpcomingEclipses(currentTime, location, 730); // 2 years
                setUpcomingEclipses(eclipses);
            }

            setLastUpdated(currentTime);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to calculate astronomical data';
            setError(errorMessage);
            console.error('Astronomy calculation error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [
        location,
        utcTime,
        enablePlanets,
        enableMoonPhase,
        enableSunMoonTimes,
        enableEclipses,
        lastUpdated,
        astronomyService
    ]);

    // Coordinate conversion utility
    const convertCoordinates = useCallback((ra: number, dec: number): CoordinateConversion | null => {
        if (!location) {
            return null;
        }

        try {
            return astronomyService.convertCoordinates(ra, dec, utcTime, location);
        } catch (err) {
            console.error('Coordinate conversion error:', err);
            return null;
        }
    }, [location, utcTime, astronomyService]);

    // Manual refresh function
    const refresh = useCallback(() => {
        calculateAstronomicalData();
    }, [calculateAstronomicalData]);

    // Initial calculation and periodic updates
    useEffect(() => {
        calculateAstronomicalData();

        const interval = setInterval(calculateAstronomicalData, updateInterval);
        return () => clearInterval(interval);
    }, [calculateAstronomicalData, updateInterval]);

    // Computed values
    const visiblePlanets = useMemo(() => {
        return planets.filter(planet => planet.isVisible);
    }, [planets]);

    const nextEclipse = useMemo(() => {
        const now = utcTime;
        return upcomingEclipses.find(eclipse => eclipse.date > now) || null;
    }, [upcomingEclipses, utcTime]);

    return {
        // Planetary data
        planets,
        visiblePlanets,

        // Moon data
        moonPhase,
        moonPosition,

        // Sun/Moon times
        sunMoonTimes,

        // Eclipse data
        upcomingEclipses,
        nextEclipse,

        // Utilities
        convertCoordinates,

        // Status
        isLoading,
        error,
        lastUpdated,

        // Actions
        refresh
    };
}

// Additional hook for specific moon calculations
export function useMoonPhase(): {
    moonPhase: MoonPhase | null;
    moonEmoji: string;
    isLoading: boolean;
    error: string | null;
} {
    const [moonPhase, setMoonPhase] = useState<MoonPhase | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { utcTime } = useTime();
    const astronomyService = useMemo(() => AstronomicalService.getInstance(), []);

    useEffect(() => {
        const calculateMoonPhase = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const phase = astronomyService.getMoonPhase(utcTime);
                setMoonPhase(phase);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to calculate moon phase';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        calculateMoonPhase();
        const interval = setInterval(calculateMoonPhase, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [utcTime, astronomyService]);

    const moonEmoji = useMemo(() => {
        if (!moonPhase) return '🌑';

        const phase = moonPhase.phase;
        if (phase < 0.03 || phase > 0.97) return '🌑'; // New Moon
        if (phase < 0.22) return '🌒'; // Waxing Crescent
        if (phase < 0.28) return '🌓'; // First Quarter
        if (phase < 0.47) return '🌔'; // Waxing Gibbous
        if (phase < 0.53) return '🌕'; // Full Moon
        if (phase < 0.72) return '🌖'; // Waning Gibbous
        if (phase < 0.78) return '🌗'; // Last Quarter
        return '🌘'; // Waning Crescent
    }, [moonPhase]);

    return {
        moonPhase,
        moonEmoji,
        isLoading,
        error
    };
}

// Hook for sunrise/sunset times specifically
export function useSunTimes(): {
    sunrise: DateTime | null;
    sunset: DateTime | null;
    solarNoon: DateTime | null;
    dayLength: string | null;
    isLoading: boolean;
    error: string | null;
} {
    const [sunTimes, setSunTimes] = useState<SunMoonTimes | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { utcTime } = useTime();
    const { location } = useLocation();
    const astronomyService = useMemo(() => AstronomicalService.getInstance(), []);

    useEffect(() => {
        if (!location) return;

        const calculateSunTimes = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const times = astronomyService.getSunMoonTimes(utcTime, location);
                setSunTimes(times);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to calculate sun times';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        calculateSunTimes();
        // Update less frequently for sun times (every 5 minutes)
        const interval = setInterval(calculateSunTimes, 300000);

        return () => clearInterval(interval);
    }, [utcTime, location, astronomyService]);

    const dayLength = useMemo(() => {
        if (!sunTimes?.sunrise || !sunTimes?.sunset) return null;

        const duration = sunTimes.sunset.diff(sunTimes.sunrise);
        const hours = Math.floor(duration.as('hours'));
        const minutes = Math.floor(duration.as('minutes') % 60);

        return `${hours}h ${minutes}m`;
    }, [sunTimes]);

    return {
        sunrise: sunTimes?.sunrise || null,
        sunset: sunTimes?.sunset || null,
        solarNoon: sunTimes?.solarNoon || null,
        dayLength,
        isLoading,
        error
    };
} 