import { timeService } from '../TimeService';
import { DateTime } from 'luxon';

describe('TimeService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reset location to Greenwich for consistent tests
    timeService.setLocation(0, 0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should provide current time', () => {
    const currentTime = timeService.getCurrentTime();
    expect(currentTime).toBeInstanceOf(DateTime);
  });

  it('should convert to UTC time', () => {
    const utcTime = timeService.getUTCTime();
    expect(utcTime.zoneName).toBe('UTC');
  });

  it('should handle timezone changes', () => {
    const newTimezone = 'America/New_York';

    let called = false;
    const unsubscribe = timeService.subscribe(state => {
      if (state.timezone === newTimezone) {
        called = true;
      }
    });

    timeService.setTimezone(newTimezone);
    expect(called).toBe(true);
    unsubscribe();
  });

  it('should handle time offset', () => {
    const offsetMinutes = 30;
    const beforeOffset = timeService.getCurrentTime();

    timeService.setOffset(offsetMinutes);
    const afterOffset = timeService.getCurrentTime();

    const difference = afterOffset.diff(beforeOffset, 'minutes').minutes;
    expect(Math.round(difference)).toBe(offsetMinutes);
  });

  it('should notify subscribers of updates', () => {
    let callCount = 0;
    const unsubscribe = timeService.subscribe(() => {
      callCount++;
    });

    // We should get 1 call immediately when subscribing
    expect(callCount).toBe(1);

    // Test if setting offset triggers an update
    timeService.setOffset(10);
    expect(callCount).toBe(2);

    unsubscribe();
  });

  describe('Solar Time', () => {
    it('should calculate solar time at Greenwich (0° longitude)', () => {
      timeService.setLocation(0, 0);
      const solarTime = timeService.getSolarTime();
      expect(solarTime).toBeInstanceOf(DateTime);

      // At Greenwich, solar time should be close to UTC time
      // (within a few minutes due to equation of time)
      const utcTime = timeService.getUTCTime();
      const diffMinutes = Math.abs(solarTime.diff(utcTime, 'minutes').minutes);
      expect(diffMinutes).toBeLessThan(20); // Maximum equation of time is about ±14 minutes
    });

    it('should adjust solar time based on longitude', () => {
      // Test at 15° East longitude
      // Each 15° of longitude = 1 hour difference
      timeService.setLocation(0, 15);
      const solarTime = timeService.getSolarTime();
      const utcTime = timeService.getUTCTime();

      // Should be approximately 1 hour ahead of UTC
      const diffHours = solarTime.diff(utcTime, 'hours').hours;
      expect(Math.round(diffHours)).toBe(1);
    });

    it('should handle location changes', () => {
      const latitude = 51.5074; // London
      const longitude = -0.1278;

      let locationUpdated = false;
      let callCount = 0;
      const unsubscribe = timeService.subscribe(state => {
        callCount++;
        if (callCount > 1) { // Skip the initial call
          expect(state.latitude).toBe(latitude);
          expect(state.longitude).toBe(longitude);
          locationUpdated = true;
        }
      });

      timeService.setLocation(latitude, longitude);
      expect(locationUpdated).toBe(true);
      unsubscribe();
    });
  });

  describe('Sidereal Time', () => {
    it('should calculate sidereal time', () => {
      timeService.setLocation(0, 0); // Greenwich
      const siderealTime = timeService.getSiderealTime();
      expect(siderealTime).toBeInstanceOf(DateTime);
    });

    it('should adjust sidereal time based on longitude', () => {
      // Test at different longitudes
      timeService.setLocation(0, 0); // Greenwich
      const greenwichSidereal = timeService.getSiderealTime();

      timeService.setLocation(0, 15); // 15° East
      const eastSidereal = timeService.getSiderealTime();

      // East longitude should have later sidereal time
      const diffMinutes = eastSidereal.diff(greenwichSidereal, 'minutes').minutes;
      expect(Math.abs(diffMinutes)).toBeGreaterThan(0);
    });

    it('should return different values than solar time', () => {
      timeService.setLocation(0, 0);
      const solarTime = timeService.getSolarTime();
      const siderealTime = timeService.getSiderealTime();

      // Sidereal and solar time should be different
      const diffMinutes = Math.abs(solarTime.diff(siderealTime, 'minutes').minutes);
      expect(diffMinutes).toBeGreaterThan(1); // Should differ by more than a minute
    });
  });
}); 