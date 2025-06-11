import React from 'react';
import { PlanetaryPosition } from '../../services/AstronomicalService';

interface PlanetViewerProps {
  planets: PlanetaryPosition[];
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

const PLANET_COLORS: Record<string, string> = {
  'Mercury': '#8C7853',
  'Venus': '#FFC649',
  'Mars': '#CD5C5C',
  'Jupiter': '#FAD5A5',
  'Saturn': '#B8860B',
  'Uranus': '#4FD0E3',
  'Neptune': '#4169E1'
};

const PLANET_EMOJIS: Record<string, string> = {
  'Mercury': '☿',
  'Venus': '♀',
  'Mars': '♂',
  'Jupiter': '♃',
  'Saturn': '♄',
  'Uranus': '♅',
  'Neptune': '♆'
};

export function PlanetViewer({ planets, isLoading = false, error = null, className = '' }: PlanetViewerProps) {
  const formatCoordinate = (value: number, type: 'ra' | 'dec' | 'alt' | 'az'): string => {
    switch (type) {
      case 'ra':
        const hours = Math.floor(value);
        const minutes = Math.floor((value - hours) * 60);
        const seconds = Math.floor(((value - hours) * 60 - minutes) * 60);
        return `${hours}h ${minutes}m ${seconds}s`;
      case 'dec':
        const sign = value >= 0 ? '+' : '-';
        const absValue = Math.abs(value);
        const degrees = Math.floor(absValue);
        const arcMinutes = Math.floor((absValue - degrees) * 60);
        const arcSeconds = Math.floor(((absValue - degrees) * 60 - arcMinutes) * 60);
        return `${sign}${degrees}° ${arcMinutes}' ${arcSeconds}"`;
      case 'alt':
      case 'az':
        return `${value.toFixed(1)}°`;
      default:
        return value.toFixed(2);
    }
  };

  const formatMagnitude = (magnitude: number): string => {
    return magnitude >= 0 ? `+${magnitude.toFixed(1)}` : magnitude.toFixed(1);
  };

  const visiblePlanets = planets.filter(planet => planet.isVisible);
  const hiddenPlanets = planets.filter(planet => !planet.isVisible);

  if (error) {
    return (
      <div className={`glass-panel p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-center gap-2">
            <span>🪐</span>
            Planetary Positions
          </h3>
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-panel p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <span>🪐</span>
          Planetary Positions
        </h3>
        {isLoading && (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
      </div>

      {planets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No planetary data available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Visible Planets */}
          {visiblePlanets.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-green-300 mb-4 flex items-center gap-2">
                <span>👁️</span>
                Currently Visible ({visiblePlanets.length})
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {visiblePlanets.map((planet) => (
                  <div
                    key={planet.name}
                    className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 hover:bg-green-500/20 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="text-2xl"
                          style={{ color: PLANET_COLORS[planet.name] }}
                        >
                          {PLANET_EMOJIS[planet.name] || '🪐'}
                        </span>
                        <div>
                          <h5 className="font-semibold text-white">{planet.name}</h5>
                          {planet.constellation && (
                            <p className="text-sm text-gray-400">in {planet.constellation}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-300">Magnitude: {formatMagnitude(planet.magnitude)}</p>
                        <p className="text-sm text-gray-400">{planet.distance.toFixed(2)} AU</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h6 className="font-medium text-gray-300 mb-1">Position (Alt/Az)</h6>
                        <p className="text-white font-mono">
                          {formatCoordinate(planet.altitude, 'alt')} / {formatCoordinate(planet.azimuth, 'az')}
                        </p>
                      </div>
                      <div>
                        <h6 className="font-medium text-gray-300 mb-1">Position (RA/Dec)</h6>
                        <p className="text-white font-mono">
                          {formatCoordinate(planet.rightAscension, 'ra')}
                        </p>
                        <p className="text-white font-mono">
                          {formatCoordinate(planet.declination, 'dec')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden Planets */}
          {hiddenPlanets.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-400 mb-4 flex items-center gap-2">
                <span>🌅</span>
                Below Horizon ({hiddenPlanets.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hiddenPlanets.map((planet) => (
                  <div
                    key={planet.name}
                    className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3 opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-lg opacity-60"
                        style={{ color: PLANET_COLORS[planet.name] }}
                      >
                        {PLANET_EMOJIS[planet.name] || '🪐'}
                      </span>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-300">{planet.name}</h5>
                        <p className="text-xs text-gray-500">
                          {formatCoordinate(planet.altitude, 'alt')} altitude
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Mag: {formatMagnitude(planet.magnitude)}</p>
                        <p className="text-xs text-gray-600">{planet.distance.toFixed(1)} AU</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-black/20 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400">
              <span className="text-green-300 font-medium">{visiblePlanets.length}</span> planets visible, {' '}
              <span className="text-gray-500 font-medium">{hiddenPlanets.length}</span> below horizon
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Positions updated in real-time based on your location
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 