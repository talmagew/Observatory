import React, { useState } from 'react';
import { useLocation } from '../../hooks/useLocation';

export function LocationDisplay() {
  const {
    location,
    coordinateSystem,
    timezone,
    isGPSEnabled,
    isLoading,
    error,
    coordinates,
    timezoneOffset,
    setLocation,
    enableGPS,
    disableGPS,
    getCurrentLocation,
  } = useLocation();

  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualAlt, setManualAlt] = useState('0');

  const handleManualLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    const alt = parseFloat(manualAlt);

    if (isNaN(lat) || isNaN(lng)) {
      return;
    }

    setLocation(lat, lng, alt);
    setManualLat('');
    setManualLng('');
    setManualAlt('0');
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <span>📍</span>
        Location
      </h3>

      {/* Current Location Display */}
      <div className="space-y-4">
        {location ? (
          <div className="bg-black/20 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Coordinates</h4>
                <p className="text-white font-mono">{coordinates}</p>
                {location.altitude > 0 && (
                  <p className="text-sm text-gray-400">Altitude: {location.altitude.toFixed(1)}m</p>
                )}
                {location.accuracy && (
                  <p className="text-sm text-gray-400">Accuracy: ±{location.accuracy.toFixed(1)}m</p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Timezone</h4>
                <p className="text-white">{timezoneOffset}</p>
                {timezone && (
                  <p className="text-sm text-gray-400">
                    {timezone.name} ({timezone.abbreviation})
                    {timezone.isDST && <span className="ml-2 text-yellow-400">DST</span>}
                  </p>
                )}
              </div>
            </div>

            {coordinateSystem?.utm && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-gray-300 mb-2">UTM Coordinates</h4>
                <p className="text-sm text-gray-400 font-mono">
                  Zone {coordinateSystem.utm.zone}{coordinateSystem.utm.hemisphere}: {' '}
                  {coordinateSystem.utm.easting.toFixed(2)}E, {coordinateSystem.utm.northing.toFixed(2)}N
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No location set</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* GPS Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <span>📍</span>
                Get Current Location
              </>
            )}
          </button>

          {isGPSEnabled ? (
            <button
              onClick={disableGPS}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <span>🛑</span>
              Stop GPS Tracking
            </button>
          ) : (
            <button
              onClick={enableGPS}
              disabled={isLoading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              <span>🎯</span>
              Enable GPS Tracking
            </button>
          )}
        </div>

        {/* Manual Location Input */}
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Manual Location Entry</h4>
          <form onSubmit={handleManualLocationSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="40.7128"
                  className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="-74.0060"
                  className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Altitude (m)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={manualAlt}
                  onChange={(e) => setManualAlt(e.target.value)}
                  placeholder="0"
                  className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!manualLat || !manualLng}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              Set Location
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 