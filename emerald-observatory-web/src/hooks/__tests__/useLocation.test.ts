import { renderHook, act, waitFor } from '@testing-library/react';
import { DateTime } from 'luxon';
import { useLocation } from '../useLocation';
import { locationService } from '../../services/LocationService';

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

// Mock locationService
jest.mock('../../services/LocationService', () => ({
    locationService: {
        setLocation: jest.fn(),
        getCurrentLocation: jest.fn(),
        enableGPS: jest.fn(),
        disableGPS: jest.fn(),
        getAstronomicalPosition: jest.fn(),
        subscribe: jest.fn(),
        destroy: jest.fn(),
    },
}));

const mockLocationService = locationService as jest.Mocked<typeof locationService>;

describe('useLocation', () => {
    let mockSubscribe: jest.Mock;
    let unsubscribeMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        unsubscribeMock = jest.fn();
        mockSubscribe = jest.fn().mockReturnValue(unsubscribeMock);
        mockLocationService.subscribe = mockSubscribe;
    });

    describe('initialization', () => {
        it('should initialize with default state', () => {
            const { result } = renderHook(() => useLocation());

            expect(result.current.location).toBeNull();
            expect(result.current.coordinateSystem).toBeNull();
            expect(result.current.timezone).toBeNull();
            expect(result.current.astronomicalPosition).toBeNull();
            expect(result.current.isGPSEnabled).toBe(false);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.isLocationSet).toBe(false);
            expect(result.current.coordinates).toBe('Not set');
            expect(result.current.timezoneOffset).toBe('Unknown');
        });

        it('should subscribe to location service on mount', () => {
            renderHook(() => useLocation());

            expect(mockLocationService.subscribe).toHaveBeenCalledWith(expect.any(Function));
        });

        it('should unsubscribe on unmount', () => {
            const { unmount } = renderHook(() => useLocation());

            unmount();

            expect(unsubscribeMock).toHaveBeenCalled();
        });
    });

    describe('location service integration', () => {
        it('should update state when location service state changes', () => {
            const { result } = renderHook(() => useLocation());

            // Get the callback passed to subscribe
            const subscribeCallback = mockSubscribe.mock.calls[0][0];

            // Simulate location service state update
            const newState = {
                currentLocation: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                    altitude: 10,
                    timestamp: DateTime.now(),
                },
                coordinateSystem: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                    altitude: 10,
                    cartesian: { x: 1000, y: 2000, z: 3000 },
                    utm: { zone: 18, easting: 500000, northing: 4500000, hemisphere: 'N' as const },
                },
                timezone: {
                    name: 'America/New_York',
                    abbreviation: 'EST',
                    offset: -300,
                    isDST: false,
                },
                astronomicalPosition: null,
                isGPSEnabled: false,
                lastUpdate: DateTime.now(),
            };

            act(() => {
                subscribeCallback(newState);
            });

            expect(result.current.location).toEqual(newState.currentLocation);
            expect(result.current.coordinateSystem).toEqual(newState.coordinateSystem);
            expect(result.current.timezone).toEqual(newState.timezone);
            expect(result.current.isLocationSet).toBe(true);
            expect(result.current.coordinates).toBe('40.712800°, -74.006000°');
            expect(result.current.timezoneOffset).toBe('UTC-5:00');
        });
    });

    describe('setLocation action', () => {
        it('should call locationService.setLocation', () => {
            const { result } = renderHook(() => useLocation());

            act(() => {
                result.current.setLocation(40.7128, -74.0060, 10);
            });

            expect(mockLocationService.setLocation).toHaveBeenCalledWith(40.7128, -74.0060, 10);
            expect(result.current.error).toBeNull();
        });

        it('should handle setLocation errors', () => {
            const { result } = renderHook(() => useLocation());

            mockLocationService.setLocation.mockImplementation(() => {
                throw new Error('Invalid coordinates');
            });

            act(() => {
                result.current.setLocation(91, 0); // Invalid latitude
            });

            expect(result.current.error).toBe('Invalid coordinates');
        });
    });

    describe('getCurrentLocation action', () => {
        it('should call locationService.getCurrentLocation and handle success', async () => {
            const mockLocation = {
                latitude: 40.7128,
                longitude: -74.0060,
                altitude: 10,
                accuracy: 5,
                timestamp: DateTime.now(),
            };

            mockLocationService.getCurrentLocation.mockResolvedValue(mockLocation);

            const { result } = renderHook(() => useLocation());

            let returnedLocation: any;
            await act(async () => {
                returnedLocation = await result.current.getCurrentLocation();
            });

            expect(mockLocationService.getCurrentLocation).toHaveBeenCalled();
            expect(returnedLocation).toEqual(mockLocation);
            expect(result.current.error).toBeNull();
            expect(result.current.isLoading).toBe(false);
        });

        it('should handle getCurrentLocation errors', async () => {
            const errorMessage = 'GPS not available';
            mockLocationService.getCurrentLocation.mockRejectedValue(new Error(errorMessage));

            const { result } = renderHook(() => useLocation());

            await act(async () => {
                try {
                    await result.current.getCurrentLocation();
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toBe('GPS not available');
            expect(result.current.isLoading).toBe(false);
        });

        it('should set loading state during getCurrentLocation', async () => {
            let resolvePromise: (value: any) => void;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });

            mockLocationService.getCurrentLocation.mockReturnValue(promise as Promise<any>);

            const { result } = renderHook(() => useLocation());

            act(() => {
                result.current.getCurrentLocation();
            });

            expect(result.current.isLoading).toBe(true);

            await act(async () => {
                resolvePromise!({
                    latitude: 40.7128,
                    longitude: -74.0060,
                    altitude: 0,
                    timestamp: DateTime.now(),
                });
                await promise;
            });

            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('GPS management', () => {
        it('should call locationService.enableGPS', async () => {
            mockLocationService.enableGPS.mockResolvedValue(undefined);

            const { result } = renderHook(() => useLocation());

            await act(async () => {
                await result.current.enableGPS();
            });

            expect(mockLocationService.enableGPS).toHaveBeenCalled();
            expect(result.current.error).toBeNull();
        });

        it('should handle enableGPS errors', async () => {
            const errorMessage = 'GPS permission denied';
            mockLocationService.enableGPS.mockRejectedValue(new Error(errorMessage));

            const { result } = renderHook(() => useLocation());

            await act(async () => {
                try {
                    await result.current.enableGPS();
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toBe('GPS permission denied');
        });

        it('should call locationService.disableGPS', () => {
            const { result } = renderHook(() => useLocation());

            act(() => {
                result.current.disableGPS();
            });

            expect(mockLocationService.disableGPS).toHaveBeenCalled();
            expect(result.current.error).toBeNull();
        });

        it('should auto-enable GPS when enableGPS option is true', async () => {
            mockLocationService.enableGPS.mockResolvedValue(undefined);

            const { result } = renderHook(() => useLocation({ enableGPS: true }));

            // Simulate GPS not enabled initially
            const subscribeCallback = mockSubscribe.mock.calls[0][0];
            act(() => {
                subscribeCallback({
                    currentLocation: null,
                    coordinateSystem: null,
                    timezone: null,
                    astronomicalPosition: null,
                    isGPSEnabled: false,
                    lastUpdate: DateTime.now(),
                });
            });

            await waitFor(() => {
                expect(mockLocationService.enableGPS).toHaveBeenCalled();
            });
        });
    });

    describe('astronomical position', () => {
        it('should call locationService.getAstronomicalPosition', async () => {
            const mockAstronomicalPosition = {
                sunPosition: { azimuth: 180, altitude: 45, distance: 1.0 },
                moonPosition: { azimuth: 90, altitude: 30, distance: 384400, phase: 0.5 },
                twilight: { civil: null, nautical: null, astronomical: null },
                sunrise: DateTime.now(),
                sunset: DateTime.now(),
            };

            mockLocationService.getAstronomicalPosition.mockResolvedValue(mockAstronomicalPosition);

            const { result } = renderHook(() => useLocation());

            // Set location first
            const subscribeCallback = mockSubscribe.mock.calls[0][0];
            act(() => {
                subscribeCallback({
                    currentLocation: {
                        latitude: 40.7128,
                        longitude: -74.0060,
                        altitude: 0,
                        timestamp: DateTime.now(),
                    },
                    coordinateSystem: null,
                    timezone: null,
                    astronomicalPosition: null,
                    isGPSEnabled: false,
                    lastUpdate: DateTime.now(),
                });
            });

            await act(async () => {
                await result.current.refreshAstronomicalPosition();
            });

            expect(mockLocationService.getAstronomicalPosition).toHaveBeenCalled();
            expect(result.current.error).toBeNull();
        });

        it('should handle refreshAstronomicalPosition without location', async () => {
            const { result } = renderHook(() => useLocation());

            await act(async () => {
                await result.current.refreshAstronomicalPosition();
            });

            expect(result.current.error).toBe('Location not set');
        });

        it('should handle refreshAstronomicalPosition errors', async () => {
            const errorMessage = 'Astronomical calculation failed';
            mockLocationService.getAstronomicalPosition.mockRejectedValue(new Error(errorMessage));

            const { result } = renderHook(() => useLocation());

            // Set location first
            const subscribeCallback = mockSubscribe.mock.calls[0][0];
            act(() => {
                subscribeCallback({
                    currentLocation: {
                        latitude: 40.7128,
                        longitude: -74.0060,
                        altitude: 0,
                        timestamp: DateTime.now(),
                    },
                    coordinateSystem: null,
                    timezone: null,
                    astronomicalPosition: null,
                    isGPSEnabled: false,
                    lastUpdate: DateTime.now(),
                });
            });

            await act(async () => {
                await result.current.refreshAstronomicalPosition();
            });

            expect(result.current.error).toBe('Astronomical calculation failed');
        });
    });

    describe('periodic updates', () => {
        it('should set up periodic updates when updateInterval is provided', () => {
            jest.useFakeTimers();
            mockLocationService.getAstronomicalPosition.mockResolvedValue({
                sunPosition: { azimuth: 180, altitude: 45, distance: 1.0 },
                moonPosition: { azimuth: 90, altitude: 30, distance: 384400, phase: 0.5 },
                twilight: { civil: null, nautical: null, astronomical: null },
                sunrise: null,
                sunset: null,
            });

            const { result } = renderHook(() => useLocation({ updateInterval: 1000 }));

            // Set location to enable periodic updates
            const subscribeCallback = mockSubscribe.mock.calls[0][0];
            act(() => {
                subscribeCallback({
                    currentLocation: {
                        latitude: 40.7128,
                        longitude: -74.0060,
                        altitude: 0,
                        timestamp: DateTime.now(),
                    },
                    coordinateSystem: null,
                    timezone: null,
                    astronomicalPosition: null,
                    isGPSEnabled: false,
                    lastUpdate: DateTime.now(),
                });
            });

            // Fast-forward time
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            expect(mockLocationService.getAstronomicalPosition).toHaveBeenCalled();

            jest.useRealTimers();
        });
    });

    describe('computed properties', () => {
        it('should format coordinates correctly', () => {
            const { result } = renderHook(() => useLocation());

            const subscribeCallback = mockSubscribe.mock.calls[0][0];
            act(() => {
                subscribeCallback({
                    currentLocation: {
                        latitude: 40.712800,
                        longitude: -74.006000,
                        altitude: 0,
                        timestamp: DateTime.now(),
                    },
                    coordinateSystem: null,
                    timezone: null,
                    astronomicalPosition: null,
                    isGPSEnabled: false,
                    lastUpdate: DateTime.now(),
                });
            });

            expect(result.current.coordinates).toBe('40.712800°, -74.006000°');
            expect(result.current.isLocationSet).toBe(true);
        });

        it('should format timezone offset correctly', () => {
            const { result } = renderHook(() => useLocation());

            const subscribeCallback = mockSubscribe.mock.calls[0][0];
            act(() => {
                subscribeCallback({
                    currentLocation: null,
                    coordinateSystem: null,
                    timezone: {
                        name: 'America/New_York',
                        abbreviation: 'EST',
                        offset: -300, // -5 hours
                        isDST: false,
                    },
                    astronomicalPosition: null,
                    isGPSEnabled: false,
                    lastUpdate: DateTime.now(),
                });
            });

            expect(result.current.timezoneOffset).toBe('UTC-5:00');
        });

        it('should handle positive timezone offset', () => {
            const { result } = renderHook(() => useLocation());

            const subscribeCallback = mockSubscribe.mock.calls[0][0];
            act(() => {
                subscribeCallback({
                    currentLocation: null,
                    coordinateSystem: null,
                    timezone: {
                        name: 'Asia/Tokyo',
                        abbreviation: 'JST',
                        offset: 540, // +9 hours
                        isDST: false,
                    },
                    astronomicalPosition: null,
                    isGPSEnabled: false,
                    lastUpdate: DateTime.now(),
                });
            });

            expect(result.current.timezoneOffset).toBe('UTC+9:00');
        });
    });
}); 