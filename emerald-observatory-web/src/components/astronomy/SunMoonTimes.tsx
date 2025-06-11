import React from 'react';
import { SunMoonTimes as ISunMoonTimes } from '../../services/AstronomicalService';
import { useSunTimes } from '../../hooks/useAstronomy';

interface SunMoonTimesProps {
  sunMoonTimes?: ISunMoonTimes | null;
  className?: string;
}

export function SunMoonTimes({ sunMoonTimes: propSunMoonTimes, className = '' }: SunMoonTimesProps) {
  const { sunrise, sunset, solarNoon, dayLength, isLoading, error } = useSunTimes();

  // Use prop data if provided, otherwise use hook data
  const sunMoonTimes = propSunMoonTimes;

  const formatTime = (date: any): string => {
    if (!date || !date.toFormat) return '--:--';
    return date.toFormat('HH:mm');
  };

  const formatTimeWithDate = (date: any): string => {
    if (!date || !date.toFormat) return 'Not available';
    return date.toFormat('HH:mm (MMM dd)');
  };

  const getSunPosition = (): string => {
    if (!sunrise || !sunset || !solarNoon) return 'unknown';
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const sunriseMinutes = sunrise.hour * 60 + sunrise.minute;
    const sunsetMinutes = sunset.hour * 60 + sunset.minute;
    const noonMinutes = solarNoon.hour * 60 + solarNoon.minute;
    
    if (currentTime < sunriseMinutes) return 'pre-dawn';
    if (currentTime < noonMinutes) return 'morning';
    if (currentTime < sunsetMinutes) return 'afternoon';
    return 'evening';
  };

  const getTwilightStatus = (): string => {
    if (!sunMoonTimes) return 'unknown';
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const times = [
      { name: 'Astronomical Dawn', time: sunMoonTimes.astronomicalTwilight.dawn },
      { name: 'Nautical Dawn', time: sunMoonTimes.nauticalTwilight.dawn },
      { name: 'Civil Dawn', time: sunMoonTimes.civilTwilight.dawn },
      { name: 'Sunrise', time: sunMoonTimes.sunrise },
      { name: 'Sunset', time: sunMoonTimes.sunset },
      { name: 'Civil Dusk', time: sunMoonTimes.civilTwilight.dusk },
      { name: 'Nautical Dusk', time: sunMoonTimes.nauticalTwilight.dusk },
      { name: 'Astronomical Dusk', time: sunMoonTimes.astronomicalTwilight.dusk }
    ].filter(t => t.time);

    // Find current period
    for (let i = 0; i < times.length - 1; i++) {
      const currentMinutes = times[i].time!.hour * 60 + times[i].time!.minute;
      const nextMinutes = times[i + 1].time!.hour * 60 + times[i + 1].time!.minute;
      
      if (currentTime >= currentMinutes && currentTime < nextMinutes) {
        if (i < 4) return times[i].name.toLowerCase().replace(' ', '-');
        return times[i + 1].name.toLowerCase().replace(' ', '-');
      }
    }
    
    return 'night';
  };

  if (error) {
    return (
      <div className={`glass-panel p-6 ${className}`}>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>☀️</span>
          Sun & Moon Times
        </h3>
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-panel p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <span>☀️</span>
          Sun & Moon Times
        </h3>
        {isLoading && (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
      </div>

      <div className="space-y-6">
        {/* Current Status */}
        <div className="bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-lg p-4 text-center">
          <p className="text-lg font-medium text-white mb-1">
            Current Period: <span className="capitalize">{getSunPosition()}</span>
          </p>
          {dayLength && (
            <p className="text-sm text-gray-300">
              Day length: {dayLength}
            </p>
          )}
        </div>

        {/* Sun Times */}
        <div>
          <h4 className="text-lg font-medium text-yellow-300 mb-4 flex items-center gap-2">
            <span>☀️</span>
            Solar Events
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🌅</div>
              <h5 className="font-medium text-orange-300 mb-1">Sunrise</h5>
              <p className="text-white font-mono text-lg">{formatTime(sunrise)}</p>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">☀️</div>
              <h5 className="font-medium text-yellow-300 mb-1">Solar Noon</h5>
              <p className="text-white font-mono text-lg">{formatTime(solarNoon)}</p>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🌇</div>
              <h5 className="font-medium text-red-300 mb-1">Sunset</h5>
              <p className="text-white font-mono text-lg">{formatTime(sunset)}</p>
            </div>
          </div>
        </div>

        {/* Moon Times */}
        {sunMoonTimes && (
          <div>
            <h4 className="text-lg font-medium text-blue-300 mb-4 flex items-center gap-2">
              <span>🌙</span>
              Lunar Events
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🌔</div>
                <h5 className="font-medium text-blue-300 mb-1">Moonrise</h5>
                <p className="text-white font-mono">{formatTimeWithDate(sunMoonTimes.moonrise)}</p>
              </div>
              
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🌘</div>
                <h5 className="font-medium text-indigo-300 mb-1">Moonset</h5>
                <p className="text-white font-mono">{formatTimeWithDate(sunMoonTimes.moonset)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Twilight Periods */}
        {sunMoonTimes && (
          <div>
            <h4 className="text-lg font-medium text-purple-300 mb-4 flex items-center gap-2">
              <span>🌆</span>
              Twilight Periods
            </h4>
            <div className="space-y-3">
              {/* Civil Twilight */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium text-purple-300">Civil Twilight</h5>
                    <p className="text-xs text-gray-400">Sun 0° to -6° below horizon</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-white">
                      {formatTime(sunMoonTimes.civilTwilight.dawn)} - {formatTime(sunMoonTimes.civilTwilight.dusk)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nautical Twilight */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium text-blue-300">Nautical Twilight</h5>
                    <p className="text-xs text-gray-400">Sun -6° to -12° below horizon</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-white">
                      {formatTime(sunMoonTimes.nauticalTwilight.dawn)} - {formatTime(sunMoonTimes.nauticalTwilight.dusk)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Astronomical Twilight */}
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium text-indigo-300">Astronomical Twilight</h5>
                    <p className="text-xs text-gray-400">Sun -12° to -18° below horizon</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-white">
                      {formatTime(sunMoonTimes.astronomicalTwilight.dawn)} - {formatTime(sunMoonTimes.astronomicalTwilight.dusk)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
          <h5 className="font-medium text-gray-300 mb-2">About Twilight</h5>
          <p className="text-sm text-gray-400">
            <strong>Civil:</strong> Outdoor activities possible without artificial light. <br />
            <strong>Nautical:</strong> Horizon clearly defined, navigation possible. <br />
            <strong>Astronomical:</strong> Sky dark enough for astronomical observations.
          </p>
        </div>
      </div>
    </div>
  );
} 