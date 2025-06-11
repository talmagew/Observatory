import { DateTime } from 'luxon';
import { SunPosition, SiderealTime, MakeTime } from 'astronomy-engine';

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
  private intervalId?: NodeJS.Timeout;

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
    this.intervalId = setInterval(() => {
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

    // Simple solar time calculation based on longitude
    // More accurate implementation would use equation of time
    const utcTime = currentTime.toUTC();

    // Each degree of longitude = 4 minutes
    // East is ahead (+), West is behind (-)
    const longitudeCorrection = this.state.longitude * 4; // minutes

    return utcTime.plus({ minutes: longitudeCorrection });
  }

  getSiderealTime(): DateTime {
    const currentTime = this.getCurrentTime();

    // Convert to AstroTime format
    const astroTime = MakeTime(currentTime.toJSDate());

    // Get Greenwich Sidereal Time (GST) in hours
    const gst = SiderealTime(astroTime);

    // Convert to Local Sidereal Time (LST) by adding longitude correction
    // Longitude in degrees / 15 = hours
    const lst = gst + (this.state.longitude / 15);

    // Normalize to 0-24 hour range
    const normalizedLst = ((lst % 24) + 24) % 24;

    // Create a DateTime for today at midnight, then add the sidereal hours
    const today = currentTime.startOf('day');
    const siderealTime = today.plus({ hours: normalizedLst });

    return siderealTime;
  }

  private dateTimeToJulianDate(dt: DateTime): number {
    // Convert DateTime to Julian Date
    const year = dt.year;
    const month = dt.month;
    const day = dt.day + (dt.hour + dt.minute / 60 + dt.second / 3600) / 24;

    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;

    let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) -
      Math.floor(y / 100) + Math.floor(y / 400) - 32045;

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
    // Call immediately with current state
    callback(this.state);
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Cleanup method
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.subscribers = [];
  }
}

// Singleton instance
export const timeService = new TimeServiceImpl(); 