import { DateTime } from 'luxon';
import * as Astronomy from 'astronomy-engine';
import { LocationCoordinates } from '../types/location';

export interface PlanetaryPosition {
    name: string;
    rightAscension: number; // hours
    declination: number;    // degrees
    altitude: number;       // degrees above horizon
    azimuth: number;        // degrees from north
    distance: number;       // AU from Earth
    magnitude: number;      // apparent magnitude
    isVisible: boolean;     // above horizon
    constellation?: string;
}

export interface MoonPhase {
    phase: number;          // 0-1, where 0/1 = new moon, 0.5 = full moon
    phaseName: string;      // "New Moon", "Waxing Crescent", etc.
    illumination: number;   // 0-100 percent illuminated
    nextNewMoon: DateTime;
    nextFullMoon: DateTime;
    age: number;           // days since new moon
}

export interface SunMoonTimes {
    sunrise: DateTime | null;
    sunset: DateTime | null;
    solarNoon: DateTime | null;
    moonrise: DateTime | null;
    moonset: DateTime | null;
    civilTwilight: {
        dawn: DateTime | null;
        dusk: DateTime | null;
    };
    nauticalTwilight: {
        dawn: DateTime | null;
        dusk: DateTime | null;
    };
    astronomicalTwilight: {
        dawn: DateTime | null;
        dusk: DateTime | null;
    };
}

export interface CoordinateConversion {
    equatorial: {
        rightAscension: number; // hours
        declination: number;    // degrees
    };
    horizontal: {
        altitude: number;       // degrees
        azimuth: number;        // degrees
    };
    galactic: {
        longitude: number;      // degrees
        latitude: number;       // degrees
    };
}

export interface EclipseEvent {
    type: 'solar' | 'lunar';
    date: DateTime;
    magnitude: number;
    obscuration: number;    // percentage of sun/moon obscured
    isVisible: boolean;     // visible from current location
    maxEclipseTime: DateTime | null;
    duration: number | null; // minutes
}

const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'] as const;

const PLANET_BODIES: Record<string, Astronomy.Body> = {
    'Mercury': Astronomy.Body.Mercury,
    'Venus': Astronomy.Body.Venus,
    'Mars': Astronomy.Body.Mars,
    'Jupiter': Astronomy.Body.Jupiter,
    'Saturn': Astronomy.Body.Saturn,
    'Uranus': Astronomy.Body.Uranus,
    'Neptune': Astronomy.Body.Neptune,
};

const MOON_PHASE_NAMES = [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Last Quarter',
    'Waning Crescent'
];

class AstronomicalService {
    private static instance: AstronomicalService;

    public static getInstance(): AstronomicalService {
        if (!AstronomicalService.instance) {
            AstronomicalService.instance = new AstronomicalService();
        }
        return AstronomicalService.instance;
    }

    /**
     * Calculate current positions of all major planets
     */
    public getPlanetaryPositions(
        time: DateTime,
        location: LocationCoordinates
    ): PlanetaryPosition[] {
        const observer = Astronomy.MakeObserver(
            location.latitude,
            location.longitude,
            location.altitude || 0
        );

        const astronomyTime = this.dateTimeToAstronomyTime(time);
        const results: PlanetaryPosition[] = [];

        for (const planetName of PLANETS) {
            try {
                const body = PLANET_BODIES[planetName];

                // Get equatorial coordinates
                const equatorial = Astronomy.Equator(body, astronomyTime, observer, true, true);

                // Convert to horizontal coordinates
                const horizontal = Astronomy.Horizon(astronomyTime, observer, equatorial.ra, equatorial.dec, 'normal');

                // Get distance and other properties
                const geoVector = Astronomy.GeoVector(body, astronomyTime, true);
                const distance = Math.sqrt(geoVector.x * geoVector.x + geoVector.y * geoVector.y + geoVector.z * geoVector.z);

                // Calculate apparent magnitude (simplified)
                const magnitude = this.calculateApparentMagnitude(planetName, distance);

                results.push({
                    name: planetName,
                    rightAscension: equatorial.ra,
                    declination: equatorial.dec,
                    altitude: horizontal.altitude,
                    azimuth: horizontal.azimuth,
                    distance,
                    magnitude,
                    isVisible: horizontal.altitude > 0,
                    constellation: this.getConstellation(equatorial.ra, equatorial.dec)
                });
            } catch (error) {
                console.warn(`Error calculating position for ${planetName}:`, error);
            }
        }

        return results;
    }

    /**
     * Calculate current moon phase and related information
     */
    public getMoonPhase(time: DateTime): MoonPhase {
        const astronomyTime = this.dateTimeToAstronomyTime(time);

        // Get moon phase (0 = new moon, 0.5 = full moon)
        const phase = Astronomy.MoonPhase(astronomyTime);

        // Calculate illumination percentage
        const illumination = (1 - Math.cos(phase * 2 * Math.PI)) * 50;

        // Determine phase name
        const phaseIndex = Math.round(phase * 8) % 8;
        const phaseName = MOON_PHASE_NAMES[phaseIndex];

        // Find next new and full moons
        const nextNewMoon = this.findNextMoonPhase(time, 0);
        const nextFullMoon = this.findNextMoonPhase(time, 0.5);

        // Calculate moon age (days since last new moon)
        const lastNewMoon = this.findPreviousMoonPhase(time, 0);
        const age = time.diff(lastNewMoon, 'days').days;

        return {
            phase,
            phaseName,
            illumination,
            nextNewMoon,
            nextFullMoon,
            age
        };
    }

    /**
     * Calculate sun and moon rise/set times and twilight periods
     */
    public getSunMoonTimes(
        date: DateTime,
        location: LocationCoordinates
    ): SunMoonTimes {
        const observer = Astronomy.MakeObserver(
            location.latitude,
            location.longitude,
            location.altitude || 0
        );

        const startTime = this.dateTimeToAstronomyTime(date.startOf('day'));

        try {
            // Sun events
            const sunrise = this.findRiseSet(startTime, observer, Astronomy.Body.Sun, 'rise');
            const sunset = this.findRiseSet(startTime, observer, Astronomy.Body.Sun, 'set');
            const solarNoon = this.findCulmination(startTime, observer, Astronomy.Body.Sun);

            // Moon events
            const moonrise = this.findRiseSet(startTime, observer, Astronomy.Body.Moon, 'rise');
            const moonset = this.findRiseSet(startTime, observer, Astronomy.Body.Moon, 'set');

            // Twilight periods
            const civilDawn = this.findTwilight(startTime, observer, -6, 'dawn');
            const civilDusk = this.findTwilight(startTime, observer, -6, 'dusk');
            const nauticalDawn = this.findTwilight(startTime, observer, -12, 'dawn');
            const nauticalDusk = this.findTwilight(startTime, observer, -12, 'dusk');
            const astronomicalDawn = this.findTwilight(startTime, observer, -18, 'dawn');
            const astronomicalDusk = this.findTwilight(startTime, observer, -18, 'dusk');

            return {
                sunrise,
                sunset,
                solarNoon,
                moonrise,
                moonset,
                civilTwilight: {
                    dawn: civilDawn,
                    dusk: civilDusk
                },
                nauticalTwilight: {
                    dawn: nauticalDawn,
                    dusk: nauticalDusk
                },
                astronomicalTwilight: {
                    dawn: astronomicalDawn,
                    dusk: astronomicalDusk
                }
            };
        } catch (error) {
            console.warn('Error calculating sun/moon times:', error);
            return this.getEmptySunMoonTimes();
        }
    }

    /**
     * Convert coordinates between different systems
     */
    public convertCoordinates(
        ra: number,
        dec: number,
        time: DateTime,
        location: LocationCoordinates
    ): CoordinateConversion {
        const observer = Astronomy.MakeObserver(
            location.latitude,
            location.longitude,
            location.altitude || 0
        );

        const astronomyTime = this.dateTimeToAstronomyTime(time);

        // Convert equatorial to horizontal
        const horizontal = Astronomy.Horizon(astronomyTime, observer, ra, dec, 'normal');

        // Convert equatorial to galactic (simplified calculation)
        const galactic = this.equatorialToGalactic(ra, dec);

        return {
            equatorial: {
                rightAscension: ra,
                declination: dec
            },
            horizontal: {
                altitude: horizontal.altitude,
                azimuth: horizontal.azimuth
            },
            galactic
        };
    }

    /**
     * Find upcoming solar and lunar eclipses
     */
    public getUpcomingEclipses(
        startTime: DateTime,
        location: LocationCoordinates,
        daysToSearch: number = 365
    ): EclipseEvent[] {
        const eclipses: EclipseEvent[] = [];
        const astronomyStartTime = this.dateTimeToAstronomyTime(startTime);

        try {
            // Search for solar eclipses
            let searchTime = astronomyStartTime;
            const endTime = this.dateTimeToAstronomyTime(startTime.plus({ days: daysToSearch }));

            while (searchTime.tt < endTime.tt) {
                try {
                    const solarEclipse = Astronomy.SearchGlobalSolarEclipse(searchTime);
                    if (solarEclipse && solarEclipse.peak.tt < endTime.tt) {
                        const eclipseEvent = this.processSolarEclipse(solarEclipse, location);
                        if (eclipseEvent) {
                            eclipses.push(eclipseEvent);
                        }
                        searchTime = Astronomy.AddDays(solarEclipse.peak, 1);
                    } else {
                        break;
                    }
                } catch (error) {
                    break;
                }
            }

            // Search for lunar eclipses
            searchTime = astronomyStartTime;
            while (searchTime.tt < endTime.tt) {
                try {
                    const lunarEclipse = Astronomy.SearchLunarEclipse(searchTime);
                    if (lunarEclipse && lunarEclipse.peak.tt < endTime.tt) {
                        const eclipseEvent = this.processLunarEclipse(lunarEclipse, location);
                        if (eclipseEvent) {
                            eclipses.push(eclipseEvent);
                        }
                        searchTime = Astronomy.AddDays(lunarEclipse.peak, 1);
                    } else {
                        break;
                    }
                } catch (error) {
                    break;
                }
            }
        } catch (error) {
            console.warn('Error searching for eclipses:', error);
        }

        return eclipses.sort((a, b) => a.date.toMillis() - b.date.toMillis());
    }

    // Private helper methods

    private dateTimeToAstronomyTime(dt: DateTime): Astronomy.AstroTime {
        return Astronomy.MakeTime(dt.toJSDate());
    }

    private astronomyTimeToDateTime(at: Astronomy.AstroTime): DateTime {
        return DateTime.fromJSDate(at.date);
    }

    private calculateApparentMagnitude(planetName: string, distance: number): number {
        // Simplified magnitude calculation based on distance
        // Real calculations would need phase angles, surface properties, etc.
        const baseMagnitudes: Record<string, number> = {
            'Mercury': -0.4,
            'Venus': -4.4,
            'Mars': -2.9,
            'Jupiter': -2.9,
            'Saturn': -0.5,
            'Uranus': 5.7,
            'Neptune': 8.0
        };

        const baseMag = baseMagnitudes[planetName] || 0;
        return baseMag + 5 * Math.log10(distance);
    }

    private getConstellation(ra: number, dec: number): string {
        // Simplified constellation determination
        // In a real implementation, this would use proper constellation boundaries
        const constellations = [
            'Andromeda', 'Aquarius', 'Aquila', 'Aries', 'Auriga', 'Boötes', 'Cancer',
            'Canis Major', 'Canis Minor', 'Capricornus', 'Cassiopeia', 'Centaurus',
            'Cygnus', 'Draco', 'Gemini', 'Hercules', 'Leo', 'Libra', 'Lyra',
            'Orion', 'Pegasus', 'Perseus', 'Pisces', 'Sagittarius', 'Scorpius',
            'Taurus', 'Ursa Major', 'Ursa Minor', 'Virgo'
        ];

        // Simple mapping based on RA (this is not astronomically accurate)
        const index = Math.floor((ra / 24) * constellations.length) % constellations.length;
        return constellations[index];
    }

    private findNextMoonPhase(startTime: DateTime, targetPhase: number): DateTime {
        try {
            const astronomyTime = this.dateTimeToAstronomyTime(startTime);
            const searchResult = Astronomy.SearchMoonPhase(targetPhase, astronomyTime, 40);
            return this.astronomyTimeToDateTime(searchResult);
        } catch (error) {
            return startTime.plus({ days: 15 }); // Fallback
        }
    }

    private findPreviousMoonPhase(startTime: DateTime, targetPhase: number): DateTime {
        try {
            const astronomyTime = this.dateTimeToAstronomyTime(startTime.minus({ days: 30 }));
            const searchResult = Astronomy.SearchMoonPhase(targetPhase, astronomyTime, 40);
            return this.astronomyTimeToDateTime(searchResult);
        } catch (error) {
            return startTime.minus({ days: 15 }); // Fallback
        }
    }

    private findRiseSet(
        startTime: Astronomy.AstroTime,
        observer: Astronomy.Observer,
        body: Astronomy.Body,
        direction: 'rise' | 'set'
    ): DateTime | null {
        try {
            const searchFunc = direction === 'rise' ? Astronomy.SearchRiseSet : Astronomy.SearchRiseSet;
            const result = searchFunc(body, observer, direction === 'rise' ? +1 : -1, startTime, 1);
            return result ? this.astronomyTimeToDateTime(result) : null;
        } catch (error) {
            return null;
        }
    }

    private findCulmination(
        startTime: Astronomy.AstroTime,
        observer: Astronomy.Observer,
        body: Astronomy.Body
    ): DateTime | null {
        try {
            const result = Astronomy.SearchHourAngle(body, observer, 0, startTime);
            return this.astronomyTimeToDateTime(result);
        } catch (error) {
            return null;
        }
    }

    private findTwilight(
        startTime: Astronomy.AstroTime,
        observer: Astronomy.Observer,
        altitude: number,
        direction: 'dawn' | 'dusk'
    ): DateTime | null {
        try {
            const searchDirection = direction === 'dawn' ? +1 : -1;
            const result = Astronomy.SearchAltitude(
                Astronomy.Body.Sun,
                observer,
                searchDirection,
                startTime,
                1,
                altitude
            );
            return result ? this.astronomyTimeToDateTime(result) : null;
        } catch (error) {
            return null;
        }
    }

    private equatorialToGalactic(ra: number, dec: number): { longitude: number; latitude: number } {
        // Simplified galactic coordinate conversion
        // Real conversion requires proper transformations with galactic pole coordinates
        const raRad = (ra * 15) * Math.PI / 180; // Convert hours to radians
        const decRad = dec * Math.PI / 180;

        // Simplified calculation (not astronomically accurate)
        const longitude = ((ra * 15 + 123) % 360 + 360) % 360; // Rough approximation
        const latitude = Math.sin(decRad) * 57.2958; // Convert to degrees

        return { longitude, latitude };
    }

    private processSolarEclipse(
        eclipse: Astronomy.GlobalSolarEclipseInfo,
        location: LocationCoordinates
    ): EclipseEvent | null {
        try {
            const observer = Astronomy.MakeObserver(
                location.latitude,
                location.longitude,
                location.altitude || 0
            );

            const localEclipse = Astronomy.SearchLocalSolarEclipse(eclipse.peak, observer);

            return {
                type: 'solar',
                date: this.astronomyTimeToDateTime(eclipse.peak),
                magnitude: eclipse.obscuration,
                obscuration: eclipse.obscuration * 100,
                isVisible: localEclipse !== null,
                maxEclipseTime: localEclipse ? this.astronomyTimeToDateTime(localEclipse.peak) : null,
                duration: localEclipse ?
                    (localEclipse.partial_end.tt - localEclipse.partial_begin.tt) * 24 * 60 : null
            };
        } catch (error) {
            return null;
        }
    }

    private processLunarEclipse(
        eclipse: Astronomy.LunarEclipseInfo,
        location: LocationCoordinates
    ): EclipseEvent | null {
        try {
            return {
                type: 'lunar',
                date: this.astronomyTimeToDateTime(eclipse.peak),
                magnitude: eclipse.obscuration,
                obscuration: eclipse.obscuration * 100,
                isVisible: true, // Lunar eclipses are visible from entire night side
                maxEclipseTime: this.astronomyTimeToDateTime(eclipse.peak),
                duration: (eclipse.partial_end.tt - eclipse.partial_begin.tt) * 24 * 60
            };
        } catch (error) {
            return null;
        }
    }

    private getEmptySunMoonTimes(): SunMoonTimes {
        return {
            sunrise: null,
            sunset: null,
            solarNoon: null,
            moonrise: null,
            moonset: null,
            civilTwilight: { dawn: null, dusk: null },
            nauticalTwilight: { dawn: null, dusk: null },
            astronomicalTwilight: { dawn: null, dusk: null }
        };
    }
}

export default AstronomicalService; 