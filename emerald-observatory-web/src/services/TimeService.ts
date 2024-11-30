import { DateTime } from 'luxon';
import { SunPosition, Equator } from 'astronomy-engine';

export interface TimeServiceState {
  currentTime: DateTime;
  timezone: string;
  offset: number;
  longitude: number;
  latitude: number;
}

export interface TimeService {
  getCurrentTime(): DateTime;
  getUTCTime(): DateTime;
  getSolarTime(): DateTime;
  getSiderealTime(): DateTime;
  setTimezone(timezone: string): void;
  setOffset(minutes: number): void;
  setLocation(latitude: number, longitude: number): void;
  subscribe(callback: (state: TimeServiceState) => void): () => void;
}

class TimeServiceImpl implements TimeService {
  private state: TimeServiceState;
  private subscribers: ((state: TimeServiceState) => void)[] = [];
  private intervalId?: number;

  constructor() {
    this.state = {
      currentTime: DateTime.now(),
      timezone: DateTime.local().zoneName || 'UTC',
      offset: 0,
      longitude: 0,
      latitude: 0,
    };

    // Start the time update interval
    this.startTimeUpdate();
  }

  private startTimeUpdate() {
    // Update every second
    this.intervalId = window.setInterval(() => {
      this.state = {
        ...this.state,
        currentTime: DateTime.now()
      };
      this.notifySubscribers();
    }, 1000);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  getCurrentTime(): DateTime {
    return this.state.currentTime.plus({ minutes: this.state.offset });
  }

  getUTCTime(): DateTime {
    return this.getCurrentTime().toUTC();
  }

  getSolarTime(): DateTime {
    const currentTime = this.getCurrentTime();
    const jd = this.dateTimeToJulianDate(currentTime);
    
    // Get the Sun's position
    const sunPos = SunPosition(jd);
    const eqPos = Equator(sunPos.ra, sunPos.dec, jd, true);
    
    // Calculate the equation of time (in hours)
    // This is the difference between apparent solar time and mean solar time
    const eot = eqPos.ra * 24/360 - (jd % 1) * 24;
    
    // Calculate the longitude correction (in hours)
    // 15 degrees = 1 hour
    const longCorrection = this.state.longitude / 15;
    
    // Total correction in minutes
    const totalCorrection = (eot + longCorrection) * 60;
    
    // Apply the correction to get local solar time
    return currentTime.plus({ minutes: totalCorrection });
  }

  getSiderealTime(): DateTime {
    // TODO: Implement sidereal time calculation using astronomy-engine
    return this.getCurrentTime();
  }

  private dateTimeToJulianDate(dt: DateTime): number {
    // Convert DateTime to Julian Date
    const year = dt.year;
    const month = dt.month;
    const day = dt.day + (dt.hour + dt.minute/60 + dt.second/3600)/24;

    let a = Math.floor((14 - month)/12);
    let y = year + 4800 - a;
    let m = month + 12*a - 3;

    let jd = day + Math.floor((153*m + 2)/5) + 365*y + Math.floor(y/4) - 
             Math.floor(y/100) + Math.floor(y/400) - 32045;

    return jd;
  }

  setTimezone(timezone: string): void {
    this.state = {
      ...this.state,
      timezone
    };
    this.notifySubscribers();
  }

  setOffset(minutes: number): void {
    this.state = {
      ...this.state,
      offset: minutes
    };
    this.notifySubscribers();
  }

  setLocation(latitude: number, longitude: number): void {
    this.state = {
      ...this.state,
      latitude,
      longitude
    };
    this.notifySubscribers();
  }

  subscribe(callback: (state: TimeServiceState) => void): () => void {
    this.subscribers.push(callback);
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Cleanup method
  destroy() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
    this.subscribers = [];
  }
}

// Singleton instance
export const timeService = new TimeServiceImpl(); 