import { DateTime } from 'luxon';
import { locationService, LocationService, LocationData, CoordinateSystem, TimezoneInfo } from '../LocationService';

// Mock navigator.geolocation
const mockGeolocation = {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
});

describe('LocationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the service state by destroying and recreating internal state
        locationService.disableGPS();
        // Reset the internal state manually
        (locationService as any).state = {
            currentLocation: null,
            coordinateSystem: null,
            timezone: null,
            astronomicalPosition: null,
            isGPSEnabled: false,
            lastUpdate: DateTime.now(),
        };
    });

    describe('setLocation', () => {
        it('should set location and calculate coordinate system', () => {
            const latitude = 40.7128;
            const longitude = -74.0060;
            const altitude = 10;

            locationService.setLocation(latitude, longitude, altitude);

            const coordinateSystem = locationService.getCoordinateSystem();
            expect(coordinateSystem).not.toBeNull();
            expect(coordinateSystem!.latitude).toBe(latitude);
            expect(coordinateSystem!.longitude).toBe(longitude);
            expect(coordinateSystem!.altitude).toBe(altitude);
        });

        it('should validate latitude range', () => {
            expect(() => {
                locationService.setLocation(91, 0); // Invalid latitude
            }).toThrow('Latitude must be between -90 and 90 degrees');

            expect(() => {
                locationService.setLocation(-91, 0); // Invalid latitude
            }).toThrow('Latitude must be between -90 and 90 degrees');
        });

        it('should validate longitude range', () => {
            expect(() => {
                locationService.setLocation(0, 181); // Invalid longitude
            }).toThrow('Longitude must be between -180 and 180 degrees');

            expect(() => {
                locationService.setLocation(0, -181); // Invalid longitude
            }).toThrow('Longitude must be between -180 and 180 degrees');
        });

        it('should use default altitude of 0 if not provided', () => {
            locationService.setLocation(40.7128, -74.0060);
            const coordinateSystem = locationService.getCoordinateSystem();
            expect(coordinateSystem!.altitude).toBe(0);
        });
    });

    describe('coordinate system calculations', () => {
        it('should calculate cartesian coordinates correctly', () => {
            // Test with NYC coordinates
            locationService.setLocation(40.7128, -74.0060, 0);
            const coordinateSystem = locationService.getCoordinateSystem();

            expect(coordinateSystem).not.toBeNull();
            expect(coordinateSystem!.cartesian.x).toBeCloseTo(1334000, -3); // Approximate values with more tolerance
            expect(coordinateSystem!.cartesian.y).toBeCloseTo(-4654000, -3);
            expect(coordinateSystem!.cartesian.z).toBeCloseTo(4138000, -3);
        });

        it('should calculate UTM coordinates', () => {
            // Test with NYC coordinates
            locationService.setLocation(40.7128, -74.0060, 0);
            const coordinateSystem = locationService.getCoordinateSystem();

            expect(coordinateSystem).not.toBeNull();
            expect(coordinateSystem!.utm).not.toBeNull();
            expect(coordinateSystem!.utm!.zone).toBe(18); // NYC is in UTM Zone 18
            expect(coordinateSystem!.utm!.hemisphere).toBe('N');
            expect(coordinateSystem!.utm!.easting).toBeGreaterThan(0);
            expect(coordinateSystem!.utm!.northing).toBeGreaterThan(0);
        });

        it('should handle southern hemisphere correctly', () => {
            // Test with Sydney coordinates
            locationService.setLocation(-33.8688, 151.2093, 0);
            const coordinateSystem = locationService.getCoordinateSystem();

            expect(coordinateSystem).not.toBeNull();
            expect(coordinateSystem!.utm!.hemisphere).toBe('S');
        });
    });

    describe('timezone calculations', () => {
        it('should calculate timezone offset based on longitude', () => {
            // Test with NYC coordinates (UTC-5)
            locationService.setLocation(40.7128, -74.0060, 0);
            const timezone = locationService.getTimezoneInfo();

            expect(timezone).not.toBeNull();
            expect(timezone!.offset).toBe(-300); // -5 hours in minutes
        });

        it('should handle positive timezone offsets', () => {
            // Test with Tokyo coordinates (UTC+9)
            locationService.setLocation(35.6762, 139.6503, 0);
            const timezone = locationService.getTimezoneInfo();

            expect(timezone).not.toBeNull();
            expect(timezone!.offset).toBe(540); // +9 hours in minutes
        });

        it('should provide timezone name and abbreviation', () => {
            locationService.setLocation(40.7128, -74.0060, 0);
            const timezone = locationService.getTimezoneInfo();

            expect(timezone).not.toBeNull();
            expect(timezone!.name).toBeDefined();
            expect(timezone!.abbreviation).toBeDefined();
        });
    });

    describe('geolocation integration', () => {
        it('should get current location from GPS', async () => {
            const mockPosition = {
                coords: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                    altitude: 10,
                    accuracy: 5,
                },
            };

            mockGeolocation.getCurrentPosition.mockImplementation((success) => {
                success(mockPosition);
            });

            const location = await locationService.getCurrentLocation();

            expect(location.latitude).toBe(40.7128);
            expect(location.longitude).toBe(-74.0060);
            expect(location.altitude).toBe(10);
            expect(location.accuracy).toBe(5);
            expect(location.timestamp).toBeInstanceOf(DateTime);
        });

        it('should handle geolocation errors', async () => {
            const mockError = new Error('GPS not available');
            mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
                error(mockError);
            });

            await expect(locationService.getCurrentLocation()).rejects.toThrow('Geolocation error: GPS not available');
        });

        it('should throw error when geolocation is not supported', async () => {
            // Temporarily remove geolocation
            const originalGeolocation = global.navigator.geolocation;
            Object.defineProperty(global.navigator, 'geolocation', {
                value: undefined,
                writable: true,
            });

            await expect(locationService.getCurrentLocation()).rejects.toThrow('Geolocation is not supported by this browser');

            // Restore geolocation
            Object.defineProperty(global.navigator, 'geolocation', {
                value: originalGeolocation,
                writable: true,
            });
        });
    });

    describe('GPS tracking', () => {
        it('should enable GPS tracking', async () => {
            const mockPosition = {
                coords: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                    altitude: 10,
                    accuracy: 5,
                },
            };

            mockGeolocation.watchPosition.mockImplementation((success) => {
                success(mockPosition);
                return 123; // Mock watch ID
            });

            await locationService.enableGPS();

            expect(mockGeolocation.watchPosition).toHaveBeenCalled();
        });

        it('should disable GPS tracking', () => {
            locationService.disableGPS();

            expect(mockGeolocation.clearWatch).toHaveBeenCalled();
        });

        it('should handle GPS errors when enabling', async () => {
            const mockError = new Error('GPS permission denied');
            mockGeolocation.watchPosition.mockImplementation((success, error) => {
                error(mockError);
            });

            await expect(locationService.enableGPS()).rejects.toThrow('GPS error: GPS permission denied');
        });
    });

    describe('astronomical position calculations', () => {
        beforeEach(() => {
            // Make sure we start fresh for astronomical position tests
            (locationService as any).state = {
                currentLocation: null,
                coordinateSystem: null,
                timezone: null,
                astronomicalPosition: null,
                isGPSEnabled: false,
                lastUpdate: DateTime.now(),
            };
        });

        it('should calculate astronomical position when location is set', async () => {
            locationService.setLocation(40.7128, -74.0060, 0);

            const position = await locationService.getAstronomicalPosition();

            expect(position).toBeDefined();
            expect(position.sunPosition).toBeDefined();
            expect(position.sunPosition.azimuth).toBeGreaterThanOrEqual(0);
            expect(position.sunPosition.azimuth).toBeLessThan(360);
            expect(position.sunPosition.altitude).toBeGreaterThanOrEqual(-90);
            expect(position.sunPosition.altitude).toBeLessThanOrEqual(90);
        });

        it('should throw error when calculating astronomical position without location', async () => {
            // Ensure no location is set
            expect((locationService as any).state.currentLocation).toBeNull();

            await expect(locationService.getAstronomicalPosition()).rejects.toThrow('Location not set');
        });

        it('should calculate astronomical position for specific date', async () => {
            locationService.setLocation(40.7128, -74.0060, 0);
            const testDate = DateTime.fromISO('2024-06-21T12:00:00Z'); // Summer solstice

            const position = await locationService.getAstronomicalPosition(testDate);

            expect(position).toBeDefined();
            expect(position.sunPosition).toBeDefined();
        });
    });

    describe('subscription system', () => {
        beforeEach(() => {
            // Reset state for subscription tests
            (locationService as any).state = {
                currentLocation: null,
                coordinateSystem: null,
                timezone: null,
                astronomicalPosition: null,
                isGPSEnabled: false,
                lastUpdate: DateTime.now(),
            };
        });

        it('should notify subscribers when location changes', () => {
            const callback = jest.fn();
            const unsubscribe = locationService.subscribe(callback);

            // Should call immediately with current state
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                currentLocation: null,
                coordinateSystem: null,
                timezone: null,
                isGPSEnabled: false,
            }));

            // Should call when location changes
            callback.mockClear();
            locationService.setLocation(40.7128, -74.0060, 0);

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                currentLocation: expect.objectContaining({
                    latitude: 40.7128,
                    longitude: -74.0060,
                    altitude: 0,
                }),
                coordinateSystem: expect.any(Object),
                timezone: expect.any(Object),
            }));

            unsubscribe();
        });

        it('should remove subscribers when unsubscribed', () => {
            const callback = jest.fn();
            const unsubscribe = locationService.subscribe(callback);

            unsubscribe();
            callback.mockClear();

            locationService.setLocation(40.7128, -74.0060, 0);

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('service lifecycle', () => {
        it('should clean up properly when destroyed', () => {
            const callback = jest.fn();
            locationService.subscribe(callback);

            // Mock a watch ID to test clearWatch
            (locationService as any).watchId = 123;

            locationService.destroy();

            // Should disable GPS
            expect(mockGeolocation.clearWatch).toHaveBeenCalled();

            // Should not notify subscribers after destroy
            callback.mockClear();
            locationService.setLocation(40.7128, -74.0060, 0);
            expect(callback).not.toHaveBeenCalled();
        });
    });
}); 