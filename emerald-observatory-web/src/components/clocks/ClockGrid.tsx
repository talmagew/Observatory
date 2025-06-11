import React from 'react';
import { useTime } from '../../hooks/useTime';
import { ClockFace } from './ClockFace';

export function ClockGrid() {
  const { utcTime, solarTime, siderealTime, isRunning } = useTime();

  return (
    <div className="space-y-6">
      {/* Status Indicator */}
      <div className="flex items-center justify-center gap-2 text-white">
        <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-sm">
          {isRunning ? 'Time service running' : 'Time service stopped'}
        </span>
      </div>

      {/* Clock Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* UTC Clock */}
        <ClockFace
          title="UTC Time"
          time={utcTime}
          description="Coordinated Universal Time"
          className="hover:scale-105 transition-transform duration-200"
        />

        {/* Solar Clock */}
        <ClockFace
          title="Solar Time"
          time={solarTime}
          description="Local solar time based on sun position"
          className="hover:scale-105 transition-transform duration-200"
        />

        {/* Sidereal Clock */}
        <ClockFace
          title="Sidereal Time"
          time={siderealTime}
          description="Star time - used for astronomical observations"
          className="hover:scale-105 transition-transform duration-200"
        />
      </div>

      {/* Time Information */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h4 className="text-lg font-semibold text-white mb-3">About These Time Systems</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-blue-300 mb-2">UTC (Universal Time)</h5>
            <p className="text-gray-300">
              The primary time standard used worldwide. Not affected by daylight saving time or local time zones.
            </p>
          </div>
          <div>
            <h5 className="font-medium text-yellow-300 mb-2">Solar Time</h5>
            <p className="text-gray-300">
              Time based on the position of the sun. When the sun is directly overhead, solar time is approximately 12:00.
            </p>
          </div>
          <div>
            <h5 className="font-medium text-purple-300 mb-2">Sidereal Time</h5>
            <p className="text-gray-300">
              Based on Earth's rotation relative to distant stars. Used by astronomers to locate celestial objects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 