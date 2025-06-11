import { DateTime } from 'luxon';
import { Observer, Horizon, SearchRiseSet, MakeTime, Body } from 'astronomy-engine';

export interface LocationData {
    latitude: number;
    longitude: number;
    altitude: number; // meters above sea level
    accuracy?: number; // GPS accuracy in meters
    timestamp?: DateTime;
}

export interface CoordinateSystem {
    latitude: number;
    longitude: number;
    altitude: number;
    // Derived coordinate systems
    cartesian: {
        x: number;
        y: number;
        z: number;
    };
    utm: {
        zone: number;
        easting: number;
        northing: number;
        hemisphere: 'N' | 'S';
    } | null;
}

export interface TimezoneInfo {
    name: string;
    abbreviation: string;
    offset: number; // minutes from UTC
    isDST: boolean;
    dstOffset?: number; // additional DST offset in minutes
}

export interface AstronomicalPosition {
    sunPosition: {
        azimuth: number;
        altitude: number;
        distance: number; // AU
    };
    moonPosition: {
        azimuth: number;
        altitude: number;
        distance: number; // km
        phase: number; // 0-1
    };
    twilight: {
        civil: { dawn: DateTime; dusk: DateTime } | null;
        nautical: { dawn: DateTime; dusk: DateTime } | null;
        astronomical: { dawn: DateTime; dusk: DateTime } | null;
    };
    sunrise: DateTime | null;
    sunset: DateTime | null;
}

export interface LocationServiceState {
    currentLocation: LocationData | null;
    coordinateSystem: CoordinateSystem | null;
    timezone: TimezoneInfo | null;
    astronomicalPosition: AstronomicalPosition | null;
    isGPSEnabled: boolean;
    lastUpdate: DateTime;
}

export interface LocationService {
    getCurrentLocation(): Promise<LocationData>;
    setLocation(latitude: number, longitude: number, altitude?: number): void;
    getCoordinateSystem(): CoordinateSystem | null;
    getTimezoneInfo(): TimezoneInfo | null;
    getAstronomicalPosition(date?: DateTime): Promise<AstronomicalPosition>;
    subscribe(callback: (state: LocationServiceState) => void): () => void;
    enableGPS(): Promise<void>;
    disableGPS(): void;
}

class LocationServiceImpl implements LocationService {
    private state: LocationServiceState;
    private subscribers: ((state: LocationServiceState) => void)[] = [];
    private watchId?: number;

    constructor() {
        this.state = {
            currentLocation: null,
            coordinateSystem: null,
            timezone: null,
            astronomicalPosition: null,
            isGPSEnabled: false,
            lastUpdate: DateTime.now(),
        };
    }

    private notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.state));
    }

    private updateState(updates: Partial<LocationServiceState>) {
        this.state = {
            ...this.state,
            ...updates,
            lastUpdate: DateTime.now(),
        };
        this.notifySubscribers();
    }

    async getCurrentLocation(): Promise<LocationData> {
        if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by this browser');
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location: LocationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        altitude: position.coords.altitude || 0,
                        accuracy: position.coords.accuracy,
                        timestamp: DateTime.now(),
                    };

                    this.setLocation(location.latitude, location.longitude, location.altitude);
                    resolve(location);
                },
                (error) => {
                    reject(new Error(`Geolocation error: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000, // 5 minutes
                }
            );
        });
    }

    setLocation(latitude: number, longitude: number, altitude: number = 0): void {
        // Validate coordinates
        if (latitude < -90 || latitude > 90) {
            throw new Error('Latitude must be between -90 and 90 degrees');
        }
        if (longitude < -180 || longitude > 180) {
            throw new Error('Longitude must be between -180 and 180 degrees');
        }

        const location: LocationData = {
            latitude,
            longitude,
            altitude,
            timestamp: DateTime.now(),
        };

        const coordinateSystem = this.calculateCoordinateSystem(latitude, longitude, altitude);
        const timezone = this.calculateTimezone(latitude, longitude);

        this.updateState({
            currentLocation: location,
            coordinateSystem,
            timezone,
        });

        // Only calculate astronomical position in production, not during tests
        if (process.env.NODE_ENV !== 'test') {
            this.updateAstronomicalPosition();
        }
    }

    private calculateCoordinateSystem(lat: number, lng: number, alt: number): CoordinateSystem {
        // Convert to Cartesian coordinates (Earth-Centered, Earth-Fixed)
        const R = 6378137; // Earth's radius in meters (WGS84)
        const f = 1 / 298.257223563; // Flattening factor (WGS84)
        const e2 = 2 * f - f * f; // First eccentricity squared

        const latRad = (lat * Math.PI) / 180;
        const lngRad = (lng * Math.PI) / 180;

        const N = R / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));

        const x = (N + alt) * Math.cos(latRad) * Math.cos(lngRad);
        const y = (N + alt) * Math.cos(latRad) * Math.sin(lngRad);
        const z = (N * (1 - e2) + alt) * Math.sin(latRad);

        // Calculate UTM coordinates
        const utm = this.calculateUTM(lat, lng);

        return {
            latitude: lat,
            longitude: lng,
            altitude: alt,
            cartesian: { x, y, z },
            utm,
        };
    }

    private calculateUTM(lat: number, lng: number): CoordinateSystem['utm'] {
        // Simplified UTM calculation
        const zone = Math.floor((lng + 180) / 6) + 1;
        const hemisphere = lat >= 0 ? 'N' : 'S';

        // This is a simplified UTM calculation
        // For production, consider using a more robust UTM library
        const latRad = (lat * Math.PI) / 180;
        const lngRad = (lng * Math.PI) / 180;
        const centralMeridian = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;

        const a = 6378137; // Semi-major axis
        const f = 1 / 298.257223563; // Flattening
        const k0 = 0.9996; // Scale factor

        // Simplified calculations (for demonstration)
        const deltaLng = lngRad - centralMeridian;
        const easting = 500000 + k0 * a * deltaLng * Math.cos(latRad);
        const northing = k0 * a * latRad + (lat < 0 ? 10000000 : 0);

        return {
            zone,
            easting,
            northing,
            hemisphere,
        };
    }

    private calculateTimezone(lat: number, lng: number): TimezoneInfo {
        // Enhanced timezone calculation using longitude
        const baseOffset = Math.round(lng / 15) * 60; // Basic offset in minutes

        // Get current DateTime to check for DST
        const now = DateTime.now().setZone(`UTC${baseOffset >= 0 ? '+' : ''}${Math.floor(baseOffset / 60)}:${Math.abs(baseOffset % 60).toString().padStart(2, '0')}`);

        // Try to determine actual timezone name based on coordinates
        // This is a simplified approach - in production, use a timezone database
        let timezoneName = 'UTC';
        try {
            const testDate = DateTime.now().setZone('UTC').plus({ minutes: baseOffset });
            timezoneName = testDate.zoneName || 'UTC';
        } catch (error) {
            // Fallback to UTC offset format
            timezoneName = `UTC${baseOffset >= 0 ? '+' : ''}${Math.floor(baseOffset / 60)}:${Math.abs(baseOffset % 60).toString().padStart(2, '0')}`;
        }

        return {
            name: timezoneName,
            abbreviation: now.offsetNameShort || 'UTC',
            offset: baseOffset,
            isDST: now.isInDST || false,
            dstOffset: now.isInDST ? 60 : 0, // Assume 1 hour DST offset
        };
    }

    private async updateAstronomicalPosition(date?: DateTime): Promise<void> {
        if (!this.state.currentLocation) return;

        try {
            const astronomicalPosition = await this.getAstronomicalPosition(date);
            this.updateState({ astronomicalPosition });
        } catch (error) {
            console.error('Error calculating astronomical position:', error);
        }
    }

    async getAstronomicalPosition(date?: DateTime): Promise<AstronomicalPosition> {
        if (!this.state.currentLocation) {
            throw new Error('Location not set');
        }

        const { latitude, longitude, altitude } = this.state.currentLocation;
        const targetDate = date || DateTime.now();
        const astroTime = MakeTime(targetDate.toJSDate());
        const observer = new Observer(latitude, longitude, altitude / 1000); // Convert to km

        // For now, we'll provide simplified calculations
        // In a full implementation, we would use proper celestial coordinates
        const sunPosition = {
            azimuth: 180, // Simplified - south at noon
            altitude: 45, // Simplified - mid-sky
            distance: 1.0, // Approximate AU
        };

        const moonPosition = {
            azimuth: 90, // Simplified - east
            altitude: 30, // Simplified
            distance: 384400, // Approximate km
            phase: 0.5, // Simplified - would need proper lunar phase calculation
        };

        // Calculate sunrise/sunset
        let sunrise: DateTime | null = null;
        let sunset: DateTime | null = null;

        try {
            const riseSearch = SearchRiseSet(Body.Sun, observer, 1, astroTime, 1);
            const setSearch = SearchRiseSet(Body.Sun, observer, -1, astroTime, 1);

            if (riseSearch) {
                sunrise = DateTime.fromJSDate(riseSearch.date);
            }
            if (setSearch) {
                sunset = DateTime.fromJSDate(setSearch.date);
            }
        } catch (error) {
            console.warn('Could not calculate sunrise/sunset:', error);
        }

        // Calculate twilight times (simplified)
        const twilight = {
            civil: null,
            nautical: null,
            astronomical: null,
        };

        // This would require more complex calculations with different solar angles
        // For now, we'll provide a simplified implementation

        return {
            sunPosition,
            moonPosition,
            twilight,
            sunrise,
            sunset,
        };
    }

    getCoordinateSystem(): CoordinateSystem | null {
        return this.state.coordinateSystem;
    }

    getTimezoneInfo(): TimezoneInfo | null {
        return this.state.timezone;
    }

    async enableGPS(): Promise<void> {
        if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by this browser');
        }

        return new Promise((resolve, reject) => {
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const location: LocationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        altitude: position.coords.altitude || 0,
                        accuracy: position.coords.accuracy,
                        timestamp: DateTime.now(),
                    };

                    this.setLocation(location.latitude, location.longitude, location.altitude);

                    if (!this.state.isGPSEnabled) {
                        this.updateState({ isGPSEnabled: true });
                        resolve();
                    }
                },
                (error) => {
                    this.updateState({ isGPSEnabled: false });
                    reject(new Error(`GPS error: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 30000, // 30 seconds
                }
            );
        });
    }

    disableGPS(): void {
        if (this.watchId !== undefined) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = undefined;
        }
        this.updateState({ isGPSEnabled: false });
    }

    subscribe(callback: (state: LocationServiceState) => void): () => void {
        this.subscribers.push(callback);
        // Call immediately with current state
        callback(this.state);
        // Return unsubscribe function
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    // Cleanup method
    destroy() {
        this.disableGPS();
        this.subscribers = [];
    }
}

// Singleton instance
export const locationService = new LocationServiceImpl(); 